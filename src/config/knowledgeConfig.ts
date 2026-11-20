import type { KnowledgeConfig } from "@/types/knowledgeConfig";

// 页面开关位于 siteConfig.pages.knowledge，内容位于 src/content/knowledge。
export const knowledgeConfig: KnowledgeConfig = {
	title: "知识",
	description: "一词一卡，记录概念、解释与例子。",
	// 顶部分类快捷栏，显示知识分类和卡片数量。
	showCategoryBar: true,
};
