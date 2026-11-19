import type { MusicPlayerConfig } from "../types/musicConfig";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 是否在侧边栏显示音乐播放器组件
	showInSidebar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否显启用歌词
	showLyrics: true,

	// Meting API 配置
	meting: {
		// Meting API 地址
		// 默认使用官方 API，也可以使用自定义 API
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "playlist",
		// 歌单/专辑/单曲 ID 或搜索关键词
		id: "10046455237",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/summer-time-record.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{
				name: "空気力学少女と少年の詩",
				artist: "はな",
				url: "/assets/music/kuuki-rikigaku-shoujo-to-shounen-no-uta.mp3",
				cover: "/assets/music/cover/kuuki-rikigaku.webp",
				lrc: "/assets/music/lrc/kuuki-rikigaku.lrc",
			},
			{
				name: "櫻ノ詩",
				artist: "はな",
				url: "/assets/music/sakura-no-uta.mp3",
				cover: "/assets/music/cover/sakura-no-uta.webp",
				lrc: "/assets/music/lrc/sakura-no-uta.lrc",
			},
			{
				name: "ナグルファルの船上にて",
				artist: "monet",
				url: "/assets/music/naglfar-no-senjou-nite.mp3",
				cover: "/assets/music/cover/naglfar.webp",
				lrc: "/assets/music/lrc/naglfar.lrc",
			},
			{
				name: "サマータイムレコード",
				artist: "Leo/need feat. 星乃一歌・天馬咲希・巡音ルカ",
				url: "/assets/music/summer-time-record.mp3",
				cover: "/assets/music/cover/summer-time-record.webp",
				lrc: "/assets/music/lrc/summer-time-record.lrc",
			},
		],
	},
};
