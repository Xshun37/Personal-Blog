import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题，留空则走i18n默认标题
	title: "近期更新",

	// 公告内容
	content: "在我的-作品集中追加了自己的设计作品，欢迎大家查看。",

	// 是否允许用户关闭公告
	closable: false,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "了解更多",
		// 链接 URL
		url: "/portfolio/",
		// 内部链接
		external: false,
	},
};
