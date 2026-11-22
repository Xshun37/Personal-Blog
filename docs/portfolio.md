# 作品集

入口：**我的 → 作品集**，位于“项目”下方。复用现有 MainGridLayout、页头、卡片网格和 Markdown 渲染，不增加独立顶部导航条。

列表直接复用 `ProjectCard`，详情直接复用 `ProjectDetail`。封面、标题、日期与标签、状态徽标、外链按钮和 Markdown 正文均沿用“项目”的结构与样式。

## 添加作品

完整字段说明与示例见 `src/content/portfolio/example-portfolio.md`，结构与“示例项目”一致。可复制它并修改文件名和内容：

```yaml
---
title: 你的作品名称
slug: your-work
published: 2026-11-20
draft: true
order: 100
description: 一句话介绍作品
image: "./cover.jpg"
status: planning
tags: [海报, 版式设计]
link:
  - label: GitHub
    icon: fa7-brands:github
    value: https://example.com/your-work
lang: ""
---
```

- `image` 可留空；支持 Markdown 同目录相对路径、`public` 下的根路径和远程图片 URL。
- `images` 可选，多图封面轮播：按顺序展示，鼠标悬停时显示左右切换按钮，图片下方显示指示点。填了多张时优先使用 `images`，只有一张或留空时仍用 `image`。
- `link` 与项目使用相同的 `{ label, icon, value }`：平台名称、图标、目标地址。支持多个按钮；没有链接时填 `[]`。`icon` 支持 astro-icon 名、图片 URL 或留空回退为名称首字母。
- Markdown 正文用于作品介绍、过程和更多图片；列表卡片可直接打开外部作品，也可进入介绍页。
- `status` 使用 `planning`（计划中）、`developing`（制作中）、`published`（已发布）；顶部按这三种状态筛选，名称、简介与标签参与搜索。
- `lang` 与项目一致，设置详情页语言；留空使用站点语言。
- `order` 数值越大越靠前，未设置的排在后面；其次按日期倒序、标题排序。
- `draft: true` 只在 `pnpm dev` 中显示。准备发布时改为 `false`；正式构建及搜索索引排除草稿。
- 默认文件名决定 `/portfolio/<文件名>/` 路径；也可用 `slug` 指定路径，支持子目录。

## 页面配置

- `src/config/portfolioConfig.ts`：标题、简介、空列表提示和三种状态的显示名称。
- `src/config/siteConfig.ts`：`pages.portfolio` 控制页面及导航入口。
- 也可通过环境变量 `PUBLIC_PAGES_PORTFOLIO=false` 关闭。

内置三份草稿模板。两份设计模板中的 GitHub 地址沿用“项目”的 Firefly 示例，仅用于展示配置，发布前替换为自己的作品链接；`link` 也可配置设计平台或在线预览地址。正式网站在添加已发布作品前显示“作品整理中”。所有内容仍通过 Markdown 构建为静态页面，无需数据库。
