import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { fromHtml } from "hast-util-from-html";
import { h } from "hastscript";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { visit } from "unist-util-visit";

const KNOWLEDGE_DIR = fileURLToPath(
	new URL("../content/knowledge/", import.meta.url),
);
const MARKDOWN_EXTENSION = /\.(?:md|mdx|markdown)$/i;
const DIRECTIVE_NAMES = new Set(["knowledge", "klink"]);

const BLOCK_TAGS = new Set([
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"blockquote",
]);

/** 把 preview 的 Markdown 渲染成一组内联 line span，避免块级元素破坏行内结构 */
function buildPreviewLines(markdown, fallback) {
	const source = markdown || fallback;
	if (!source) return [];

	let html = "";
	try {
		html = sanitizeHtml(marked.parse(source, { async: false, breaks: true }), {
			allowedTags: [...sanitizeHtml.defaults.allowedTags, "del"],
			allowedAttributes: { a: ["href", "title"], ol: ["start"] },
		});
	} catch {
		return [];
	}
	if (!html) return [];

	const root = fromHtml(html, { fragment: true });
	const lines = [];

	const addLine = (children, bullet = "") => {
		const lineChildren = [];
		if (bullet) {
			lineChildren.push(
				h("span", { className: ["knowledge-preview-bullet"] }, bullet),
			);
		}
		if (Array.isArray(children)) lineChildren.push(...children);
		lines.push(
			h("span", { className: ["knowledge-preview-line"] }, lineChildren),
		);
	};

	const walk = (node, bullet = "") => {
		if (!node) return;
		if (node.type === "text") {
			if (node.value.trim()) addLine([node], bullet);
			return;
		}
		if (node.type !== "element") return;

		const tag = node.tagName;
		if (tag === "ul" || tag === "ol") {
			let index = 0;
			for (const child of node.children) {
				if (child.type !== "element" || child.tagName !== "li") continue;
				index += 1;
				walk(child, tag === "ol" ? `${index}. ` : "• ");
			}
			return;
		}
		if (tag === "li") {
			addLine(node.children, bullet || "• ");
			return;
		}
		if (tag === "blockquote") {
			for (const child of node.children) {
				if (child.type === "element" && BLOCK_TAGS.has(child.tagName)) {
					addLine(child.children, "› ");
				} else if (child.type === "text" && child.value.trim()) {
					addLine([child], "› ");
				}
			}
			return;
		}
		if (BLOCK_TAGS.has(tag)) {
			addLine(node.children, "");
			return;
		}
		for (const child of node.children ?? []) {
			walk(child, bullet);
		}
	};

	for (const child of root.children) walk(child);
	return lines;
}

const cache = new Map();

function collect(dir) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collect(fullPath);
			continue;
		}
		if (!MARKDOWN_EXTENSION.test(entry.name)) continue;

		const relative = path
			.relative(KNOWLEDGE_DIR, fullPath)
			.replaceAll("\\", "/")
			.replace(MARKDOWN_EXTENSION, "");

		let data;
		try {
			data = matter(readFileSync(fullPath, "utf8")).data ?? {};
		} catch {
			continue;
		}

		cache.set(relative, {
			id: relative,
			title: String(data.title ?? relative),
			description: String(data.description ?? ""),
			preview: String(data.preview ?? ""),
			category: String(data.category ?? ""),
			tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
			draft: data.draft === true,
		});
	}
}

collect(KNOWLEDGE_DIR);

function normalizeId(value) {
	return String(value)
		.trim()
		.replaceAll("\\", "/")
		.replace(/^knowledge\//, "")
		.replace(MARKDOWN_EXTENSION, "")
		.replace(/\/+$/, "");
}

function knowledgeUrl(id, base) {
	const encoded = id
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return `${base.replace(/\/+$/, "")}/knowledge/${encoded}/`;
}

export function rehypeKnowledgeLink(options = {}) {
	const base = options.base || "/";
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;
			if (!DIRECTIVE_NAMES.has(node.tagName)) return;

			const properties = node.properties ?? {};
			const rawId = properties.id ?? properties.slug;
			const id = rawId ? normalizeId(rawId) : "";
			const meta = cache.get(id);

			// 找不到知识卡片时保留文字，渲染为普通 span
			if (!meta) {
				node.tagName = "span";
				node.properties = { className: ["knowledge-ref", "is-missing"] };
				return;
			}

			const keyword = h(
				"span",
				{ className: ["knowledge-keyword"] },
				node.children,
			);

			const previewChildren = buildPreviewLines(meta.preview, meta.description);

			const popoverChildren = [
				h("span", { className: ["knowledge-popover-title"] }, meta.title),
			];
			if (previewChildren.length > 0) {
				popoverChildren.push(
					h(
						"span",
						{ className: ["knowledge-popover-preview"] },
						previewChildren,
					),
				);
			}
			popoverChildren.push(
				h(
					"a",
					{
						className: ["knowledge-popover-link"],
						href: knowledgeUrl(meta.id, base),
					},
					"查看知识卡片 →",
				),
			);

			const popover = h(
				"span",
				{ className: ["knowledge-popover"], role: "tooltip" },
				popoverChildren,
			);

			node.tagName = "span";
			node.properties = {
				className: ["knowledge-ref"],
				tabIndex: 0,
			};
			node.children = [keyword, popover];
		});
	};
}
