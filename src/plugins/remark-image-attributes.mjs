import { visit } from "unist-util-visit";

/**
 * 让 Markdown 图片支持 `{...}` 属性语法，例如：
 *
 * ```md
 * ![OBS](images/OBS.png){width=50%}
 * ![OBS](images/OBS.png){width="320px" height="240px"}
 * ![OBS](images/OBS.png){class="shadow" loading="lazy"}
 * ```
 *
 * 语法解析发生在 remark 阶段：属性块必须先紧跟在图片（或包着图片的链接）之后，
 * 解析成功后属性会写入对应图片节点的 `hProperties`，再交给 rehype 阶段输出，
 * 因此 `rehype-figure` 等插件仍然可以正常把图片包成 `figure`。
 *
 * `width` / `height` 会转换为行内 `style`（并给另一个方向补 `auto`），这样既支持
 * 百分比宽度，也不会被 Astro 图片组件输出的 `width` / `height` 属性拉伸变形。
 *
 * @returns {import('unified').Plugin}
 */

const ATTRIBUTE_BLOCK = /^\s*\{([^{}]*)\}/;

/**
 * 从属性块内容中拆出 `key=value`、`.class`、`#id` 三类 token。
 * 引号内的空格、以及 `=` 两侧的空格都不会切断 token。
 */
function tokenize(raw) {
	const tokens = [];
	const chars = [...raw];
	let current = "";
	let quote = null;

	for (let i = 0; i < chars.length; i++) {
		const ch = chars[i];

		if (quote) {
			current += ch;
			if (ch === quote) quote = null;
			continue;
		}

		if (ch === '"' || ch === "'") {
			quote = ch;
			current += ch;
			continue;
		}

		if (/\s/.test(ch)) {
			const trimmed = current.trim();
			let next = i + 1;
			while (next < chars.length && /\s/.test(chars[next])) next++;
			// `width = "50%"`：空格属于属性赋值，不切分 token
			if (trimmed.endsWith("=") || chars[next] === "=") {
				if (current) current += " ";
				continue;
			}
			if (trimmed) tokens.push(trimmed);
			current = "";
			continue;
		}

		current += ch;
	}

	if (current.trim()) tokens.push(current.trim());
	return tokens;
}

/** 去掉 value 两侧的引号。 */
function unquote(value) {
	if (
		value.length >= 2 &&
		((value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'")))
	) {
		return value.slice(1, -1);
	}
	return value;
}

/**
 * 解析属性块原文，返回 hast 属性对象。
 *
 * @param {string} raw 大括号内部的原始文本
 * @returns {Record<string, unknown>}
 */
function parseAttributes(raw) {
	const props = {};
	const classes = [];
	const styles = [];
	let widthValue;
	let heightValue;

	for (const token of tokenize(raw)) {
		if (token.startsWith(".")) {
			classes.push(token.slice(1));
			continue;
		}
		if (token.startsWith("#")) {
			props.id = token.slice(1);
			continue;
		}

		const eq = token.indexOf("=");
		// 没有 `=` 的裸 token 不当作属性，避免把 `{表格说明}` 这类正文误删
		if (eq === -1) continue;

		const key = token.slice(0, eq).trim();
		const value = unquote(token.slice(eq + 1).trim());
		if (!key) continue;

		if (key === "class") {
			classes.push(...value.split(/\s+/).filter(Boolean));
			continue;
		}
		if (key === "style") {
			styles.push(value.replace(/;$/, ""));
			continue;
		}
		if (key === "width") {
			widthValue = value;
			continue;
		}
		if (key === "height") {
			heightValue = value;
			continue;
		}

		props[key] = value;
	}

	// 只给一个方向时把另一个方向设为 auto，覆盖 Astro 图片组件输出的
	// width/height 属性（它们是表现性提示），避免图片被拉伸变形。
	if (widthValue && heightValue) {
		styles.push(`width: ${widthValue}`, `height: ${heightValue}`);
	} else if (widthValue) {
		styles.push(`width: ${widthValue}`, "height: auto");
	} else if (heightValue) {
		styles.push(`height: ${heightValue}`, "width: auto");
	}

	if (classes.length > 0) props.className = classes;
	if (styles.length > 0) props.style = `${styles.join("; ")};`;
	return props;
}

/** 取链接里的第一个图片节点（`[![alt](src)](href){width=50%}` 场景）。 */
function findImageInLink(node) {
	if (!Array.isArray(node.children)) return null;
	for (const child of node.children) {
		if (child.type === "image") return child;
	}
	return null;
}

/** 把解析出的属性合并到图片节点的 `hProperties` 上。 */
function applyAttributes(imageNode, props) {
	imageNode.data = imageNode.data || {};
	const existing = imageNode.data.hProperties || {};
	const next = { ...existing };

	for (const [key, value] of Object.entries(props)) {
		if (key === "className") {
			const merged = [
				...(Array.isArray(existing.className) ? existing.className : []),
				...(Array.isArray(value) ? value : [String(value)]),
			];
			next.className = merged;
			continue;
		}
		if (key === "style" && typeof existing.style === "string") {
			next.style = `${existing.style}; ${value}`;
			continue;
		}
		next[key] = value;
	}

	imageNode.data.hProperties = next;
}

export function remarkImageAttributes() {
	return (tree) => {
		visit(tree, "paragraph", (paragraph) => {
			const children = paragraph.children;
			if (!Array.isArray(children) || children.length === 0) return;

			for (let i = 0; i < children.length; i++) {
				const node = children[i];
				if (node.type !== "text") continue;

				// 属性块必须紧跟在一个可承载属性的节点之后
				const previous = children[i - 1];
				if (!previous) continue;

				let target = null;
				if (previous.type === "image") {
					target = previous;
				} else if (previous.type === "link") {
					target = findImageInLink(previous);
				}
				if (!target) continue;

				const match = node.value.match(ATTRIBUTE_BLOCK);
				if (!match) continue;

				const props = parseAttributes(match[1]);
				if (Object.keys(props).length === 0) continue;

				applyAttributes(target, props);
				node.value = node.value.slice(match[0].length);
				if (node.value.trim() === "") {
					children.splice(i, 1);
					i--;
				}
			}
		});
	};
}
