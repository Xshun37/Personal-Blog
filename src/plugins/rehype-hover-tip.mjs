import { fromHtml } from "hast-util-from-html";
import { h } from "hastscript";
import katex from "katex";
import { marked } from "marked";
import { visit } from "unist-util-visit";

/**
 * 把 `:tip[文字]{info="详情"}` 生成的 `<tip>` 元素转换为
 * 带 data-tip 的内联 span，并额外生成一个隐藏的富文本源，
 * 支持 info 中的行内公式（$...$）和简单 Markdown。
 */
export function rehypeHoverTip() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "tip") return;

			node.tagName = "span";

			if (!node.properties) node.properties = {};
			const properties = node.properties;
			const info = properties.info ? String(properties.info) : "";
			delete properties.info;

			if (info) {
				properties["data-tip"] = info;
			}

			const className = Array.isArray(properties.className)
				? properties.className
				: properties.className
					? [properties.className]
					: [];
			properties.className = [...className, "hover-tip"];

			// 让键盘和触屏也能触发 focus 样式
			properties.tabIndex = 0;

			if (!info) return;

			const children = renderInfo(info);
			if (children.length > 0) {
				node.children.push(
					h(
						"span",
						{ className: ["hover-tip-source"], hidden: true },
						children,
					),
				);
			}
		});
	};
}

function renderInfo(info) {
	const math = [];
	const placeholder = (index) => `@@HOVERTIP_MATH_${index}@@`;

	const source = info.replace(/\$([^$\n]+)\$/g, (_match, expression) => {
		const index = math.length;
		math.push(
			katex.renderToString(expression, {
				throwOnError: false,
				displayMode: false,
			}),
		);
		return placeholder(index);
	});

	let html = "";
	try {
		html = marked.parseInline(source);
	} catch {
		html = escapeHtml(source);
	}

	html = html.replace(/@@HOVERTIP_MATH_(\d+)@@/g, (_match, index) => {
		return math[Number(index)] ?? "";
	});

	if (!html) return [];
	return fromHtml(html, { fragment: true }).children;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}
