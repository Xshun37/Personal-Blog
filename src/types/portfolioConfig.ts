export type PortfolioConfig = {
	title: string;
	description: string;
	emptyText: string;
	statusLabels: Record<"planning" | "developing" | "published", string>;
};
