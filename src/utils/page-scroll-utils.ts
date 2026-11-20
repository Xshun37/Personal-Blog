import type Swup from "@swup/astro/client/Swup";
import { siteConfig } from "@/config";
import { url } from "@/utils/url-utils";

type Visit = Swup["visit"];
type ScrollState = {
	visitId: number;
	top: number;
	history: boolean;
	column: HTMLElement;
	minHeight: string;
	overflowAnchor: string;
	events: AbortController;
	frame?: number;
	timeout?: number;
	observer?: ResizeObserver;
};

function isSiteUrl(value: string): boolean {
	const target = new URL(value, window.location.href);
	const root = url("/");
	return (
		target.origin === window.location.origin &&
		(target.pathname === root.slice(0, -1) || target.pathname.startsWith(root))
	);
}

// 不计入 Swup 入场动画的 translateY，避免把过渡位移误算成正文位置。
function getLayoutTop(element: HTMLElement): number {
	let top = 0;
	for (
		let node: HTMLElement | null = element;
		node;
		node = node.offsetParent as HTMLElement | null
	) {
		top += node.offsetTop;
	}
	return top;
}

/** 全站普通切页保留高度并补充历史位置恢复，锚点仍由 Swup 接管。 */
export function setupPageScroll(swup: Swup): void {
	let pending: ScrollState | undefined;
	let activeVisit: number | undefined;
	let saveFrame: number | undefined;
	let currentIndex = window.history.state?.index as number | undefined;
	let currentHref = window.location.href;
	// 按历史记录编号区分同一 URL 的多次访问，避免短页返回时被浏览器夹紧位置。
	const positions = new Map<number, { href: string; top: number }>();
	const remember = () => {
		if (
			siteConfig.preserveScroll === false ||
			currentIndex === undefined ||
			currentHref !== window.location.href ||
			!isSiteUrl(currentHref)
		)
			return;
		positions.set(currentIndex, { href: currentHref, top: window.scrollY });
		if (positions.size > 100) {
			const oldest = positions.keys().next().value;
			if (oldest !== undefined) positions.delete(oldest);
		}
	};
	window.addEventListener(
		"scroll",
		() => {
			if (activeVisit !== undefined) return;
			if (saveFrame !== undefined) cancelAnimationFrame(saveFrame);
			saveFrame = requestAnimationFrame(() => {
				if (activeVisit === undefined) remember();
			});
		},
		{ passive: true },
	);
	remember();

	const cancel = () => {
		const state = pending;
		if (!state) return;
		pending = undefined;
		if (state.frame !== undefined) cancelAnimationFrame(state.frame);
		window.clearTimeout(state.timeout);
		state.observer?.disconnect();
		state.events.abort();
		document.body.style.minHeight = state.minHeight;
		document.documentElement.style.overflowAnchor = state.overflowAnchor;
	};

	const cancelVisit = (visit: Visit) => {
		if (pending?.visitId === visit.id) cancel();
		if (activeVisit === visit.id) activeVisit = undefined;
	};

	swup.hooks.before("link:self", (visit) => {
		if (
			siteConfig.preserveScroll !== false &&
			isSiteUrl(visit.to.url) &&
			!visit.to.hash
		) {
			visit.scroll.reset = false;
		}
	});
	// 同页锚点和同页链接会更新历史 URL，但不会触发 page:view。
	const rememberCurrentEntry = () => {
		currentIndex = window.history.state?.index;
		currentHref = window.location.href;
		remember();
	};
	swup.hooks.on("link:anchor", rememberCurrentEntry);
	swup.hooks.on("link:self", rememberCurrentEntry);

	swup.hooks.before("visit:start", (visit) => {
		if (!visit.history.popstate) remember();
		activeVisit = visit.id;
		if (saveFrame !== undefined) cancelAnimationFrame(saveFrame);
		cancel();
		if (siteConfig.preserveScroll === false || !isSiteUrl(visit.to.url)) return;
		let top = window.scrollY;
		if (visit.history.popstate) {
			const saved = positions.get(window.history.state?.index);
			const target = new URL(visit.to.url, window.location.href);
			if (visit.to.hash) target.hash = visit.to.hash;
			if (!saved || saved.href !== target.href) return;
			top = saved.top;
		} else if (
			visit.to.hash ||
			visit.scroll.target ||
			!isSiteUrl(visit.from.url)
		)
			return;

		const column = document.getElementById("content-column");
		if (!column) return;
		visit.scroll.reset = false;
		const state: ScrollState = {
			visitId: visit.id,
			top,
			history: visit.history.popstate,
			column,
			minHeight: document.body.style.minHeight,
			overflowAnchor: document.documentElement.style.overflowAnchor,
			events: new AbortController(),
		};
		pending = state;
		// 固定文档高度，防止短页换入或首页横幅高度变化时浏览器提前夹紧位置。
		document.body.style.minHeight = `${document.documentElement.scrollHeight}px`;
		document.documentElement.style.overflowAnchor = "none";
		const options = { passive: true, signal: state.events.signal };
		for (const event of ["wheel", "touchstart", "pointerdown", "resize"]) {
			window.addEventListener(event, cancel, options);
		}
		window.addEventListener(
			"keydown",
			(event) => {
				if (
					[
						"ArrowUp",
						"ArrowDown",
						"PageUp",
						"PageDown",
						"Home",
						"End",
						" ",
					].includes(event.key)
				)
					cancel();
			},
			options,
		);
		// 加载失败或网络长时间无响应时也要释放临时样式。
		state.timeout = window.setTimeout(cancel, 10_000);
	});

	swup.hooks.on("page:view", (visit) => {
		currentIndex = window.history.state?.index;
		currentHref = window.location.href;
		const state = pending;
		if (!state || state.visitId !== visit.id) return;
		const content =
			document.querySelector<HTMLElement>(
				"#swup-container [data-scroll-content], #swup-container #post-container",
			) ?? document.getElementById("content-wrapper");
		if (!content || !isSiteUrl(window.location.href)) {
			cancel();
			window.scrollTo({ top: 0, behavior: "instant" });
			return;
		}
		document.body.style.minHeight = state.minHeight;

		const restore = () => {
			if (pending !== state) return;
			const contentTop = getLayoutTop(content);
			const visibleHeight = Math.min(
				128,
				content.offsetHeight,
				window.innerHeight / 3,
			);
			const navbarHeight =
				document.getElementById("navbar-wrapper")?.offsetHeight ?? 72;
			const target =
				!state.history &&
				state.top >= contentTop + content.offsetHeight - visibleHeight
					? contentTop - navbarHeight - 16
					: state.top;
			const maxTop = Math.max(
				0,
				document.documentElement.scrollHeight - window.innerHeight,
			);
			window.scrollTo({
				top: Math.min(maxTop, Math.max(0, target)),
				behavior: "instant",
			});
		};
		restore();
		remember();

		// 图片、字体或延迟的侧栏更新造成尺寸变化时，最多再校正一次。
		const layout = () =>
			`${getLayoutTop(content)}:${content.offsetHeight}:${state.column.offsetHeight}`;
		const initialLayout = layout();
		state.observer = new ResizeObserver(() => {
			if (
				pending !== state ||
				state.frame !== undefined ||
				layout() === initialLayout
			)
				return;
			state.frame = requestAnimationFrame(() => {
				restore();
				cancel();
			});
		});
		state.observer.observe(content);
		state.observer.observe(state.column);
		window.clearTimeout(state.timeout);
		state.timeout = window.setTimeout(cancel, 1_000);
	});
	swup.hooks.on("visit:abort", cancelVisit);
	swup.hooks.on("visit:end", (visit) => {
		if (activeVisit !== visit.id) return;
		remember();
		activeVisit = undefined;
	});
	swup.hooks.on("fetch:error", cancelVisit);
	swup.hooks.on("fetch:timeout", cancelVisit);
}
