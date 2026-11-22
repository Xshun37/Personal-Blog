import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "友情链接",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: " ",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: false,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "东方幻想指南",
		imgurl: "/assets/images/friends/fantasyguide.webp",
		desc: "北京大学东方例会，迄今已举办18届",
		siteurl: "https://fantasyguide.cn/",
		tags: ["ACGN", "Organization"],
		weight: 9,
		enabled: true,
	},
	{
		title: "元火OriginalFire",
		imgurl: "/assets/images/friends/Originalfire.png",
		desc: "北京大学学生元火动漫社",
		siteurl: "https://space.bilibili.com/347720468",
		tags: ["ACGN", "Organization"],
		weight: 10,
		enabled: true,
	},
	{
		title: "水月Mizuki界隈",
		imgurl: "/assets/images/friends/mizuki.png",
		desc: "北京大学WOTA艺团体",
		siteurl: "https://space.bilibili.com/270785847",
		tags: ["ACGN", "Organization"],
		weight: 8,
		enabled: true,
	},
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
