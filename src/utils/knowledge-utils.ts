import { type CollectionEntry, getCollection } from "astro:content";
import { siteConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { removeFileExtension, url } from "@/utils/url-utils";

export type KnowledgeEntry = CollectionEntry<"knowledge">;
export type KnowledgeTaxonomy = "category" | "tag";

export async function getKnowledgeEntries(): Promise<KnowledgeEntry[]> {
	if (!siteConfig.pages.knowledge) return [];
	const entries = await getCollection("knowledge", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
	return entries.sort(
		(a, b) =>
			(b.data.updated ?? b.data.published).getTime() -
				(a.data.updated ?? a.data.published).getTime() ||
			a.data.title.localeCompare(b.data.title),
	);
}

export function getKnowledgeUrl(id: string): string {
	const path = removeFileExtension(id)
		.split("/")
		.map(encodeURIComponent)
		.join("/");
	return url(`/knowledge/${path}/`);
}

export function getKnowledgeCategory(entry: KnowledgeEntry): string {
	return entry.data.category || i18n(I18nKey.uncategorized);
}

export function getKnowledgeFilterUrl(
	kind: KnowledgeTaxonomy,
	name: string,
): string {
	return `${url("/knowledge/")}?${new URLSearchParams({ [kind]: name })}`;
}

export function getKnowledgeTaxonomy(
	entries: KnowledgeEntry[],
	kind: KnowledgeTaxonomy,
): { name: string; count: number; url: string }[] {
	const counts = new Map<string, number>();
	for (const entry of entries) {
		const names =
			kind === "category" ? [getKnowledgeCategory(entry)] : entry.data.tags;
		for (const name of new Set(names)) {
			counts.set(name, (counts.get(name) ?? 0) + 1);
		}
	}
	return [...counts]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, count]) => ({
			name,
			count,
			url: getKnowledgeFilterUrl(kind, name),
		}));
}
