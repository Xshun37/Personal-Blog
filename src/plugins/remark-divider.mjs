import { visit } from "unist-util-visit";

const DIVIDER_HTML = [
	'<div class="not-prose my-8 flex items-center gap-3 text-(--primary) opacity-60">',
	'  <span class="h-px flex-1 bg-gradient-to-r from-transparent via-current to-transparent"></span>',
	'  <span class="text-xs">✦</span>',
	'  <span class="h-px flex-1 bg-gradient-to-l from-transparent via-current to-transparent"></span>',
	"</div>",
].join("\n");

const DIVIDER = "-*-";

function paragraphFromLines(lines) {
	if (lines.length === 0) return null;
	const children = [];
	for (let i = 0; i < lines.length; i++) {
		if (i > 0) children.push({ type: "break" });
		children.push({ type: "text", value: lines[i] });
	}
	return { type: "paragraph", children };
}

/**
 * 把单独一行的 `-*-` 渲染成统一的渐变分隔线。
 *
 * 支持：
 * - 单独一段 `-*-`
 * - 紧贴上一段文字（Markdown 会合并成同一段落）的 `-*-`
 * - 在 callout / blockquote / 列表内使用
 */
export default function remarkDivider() {
	return (tree) => {
		visit(tree, "paragraph", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;

			// 只处理纯文本/换行组成的段落，避免破坏行内格式
			const isPlain = node.children.every(
				(child) => child.type === "text" || child.type === "break",
			);
			if (!isPlain) return;

			const raw = node.children
				.map((child) => (child.type === "text" ? child.value : "\n"))
				.join("");
			if (!raw.includes(DIVIDER)) return;

			const lines = raw.split("\n");
			if (!lines.some((line) => line.trim() === DIVIDER)) return;

			const next = [];
			let buffer = [];
			const flush = () => {
				const paragraph = paragraphFromLines(buffer);
				if (paragraph) next.push(paragraph);
				buffer = [];
			};

			for (const line of lines) {
				if (line.trim() === DIVIDER) {
					flush();
					next.push({ type: "html", value: DIVIDER_HTML });
				} else {
					buffer.push(line);
				}
			}
			flush();

			parent.children.splice(index, 1, ...next);
		});
	};
}
