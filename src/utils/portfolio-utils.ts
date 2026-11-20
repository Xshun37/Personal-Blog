import { type CollectionEntry, getCollection } from "astro:content";
import { portfolioConfig, siteConfig } from "@/config";

export function getPortfolioStatusLabel(status: string): string {
	const labels = portfolioConfig.statusLabels;
	return Object.hasOwn(labels, status)
		? labels[status as keyof typeof labels]
		: status;
}

export async function getSortedPortfolio(): Promise<
	CollectionEntry<"portfolio">[]
> {
	if (!siteConfig.pages.portfolio) return [];
	const entries = await getCollection("portfolio", ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);
	return entries.sort((a, b) => {
		const aOrder = a.data.order;
		const bOrder = b.data.order;
		if (aOrder !== undefined && bOrder !== undefined && aOrder !== bOrder) {
			return bOrder - aOrder;
		}
		if (aOrder !== undefined && bOrder === undefined) return -1;
		if (aOrder === undefined && bOrder !== undefined) return 1;
		return (
			b.data.published.getTime() - a.data.published.getTime() ||
			a.data.title.localeCompare(b.data.title)
		);
	});
}
