# 知识卡片

- 内容：`src/content/knowledge/**/*.md`，每个文件是一张卡片。
- 配置：`src/config/knowledgeConfig.ts`，控制栏目标题和描述。
- 全站文章分类栏保持在公共顶部；知识栏目使用“知识卡片 / 分类 / 标签”导航，不额外增加快捷栏。
- 全站滚动保留：`src/config/siteConfig.ts` 中的 `preserveScroll` 默认开启，适用于首页、文章、知识及其他站内页面。普通切换保留高度；新页面内容太短时回退到内容起点。后退/前进恢复历史位置，锚点和回到顶部保持原行为。手动滚动、连续点击或窗口尺寸变化会取消旧的定位任务。
- 开关：`src/config/siteConfig.ts` 中的 `pages.knowledge`，也支持 `PUBLIC_PAGES_KNOWLEDGE=false`。
- 导航：`src/config/navBarConfig.ts`，知识与文章、社交同级。
- 样式：复用现有布局、卡片、分类、标签和 Markdown 样式。

## 新增内容

复制示例 `src/content/knowledge/knowledge-card.md`，修改文件名与内容：

```markdown
---
title: 名词
published: 2026-11-20
description: 一句话解释。
category: 分类名称
tags: [标签一, 标签二]
draft: false
---

## 定义

用自己的话解释这个名词。

## 例子

补充一个具体例子。
```

- `title`、`published` 必填；其他字段可省略。
- `updated: 2026-11-21` 可选；列表优先按更新时间倒序排列。
- 未填写分类时归入“未分类”，标签为数组。
- `draft: true` 仅在开发环境显示；生产构建不生成详情、不计入分类和标签，也不进入 Pagefind。
- 文件名决定链接，支持子目录和 frontmatter 的 `slug` 覆盖；发布后尽量保持不变。
- `categories`、`tags` 为保留的顶层路径，不能作为卡片的顶层文件名或 slug。
- 分类、标签只统计知识内容，不混入文章、文章统计或 RSS。

## 访问与发布

- `/knowledge/`：卡片列表。
- `/knowledge/categories/`：分类索引。
- `/knowledge/tags/`：标签索引。
- `/knowledge/<文件名或 slug>/`：详情页。
- 分类、标签点击后在列表中筛选，需要浏览器启用 JavaScript；筛选条件保留在 URL 中，可分享。
- 站内链接自动适配 Astro `base`，当前为 `/Personal-Blog/`。
- 提交到 `master` 后沿用现有 GitHub Actions 部署，无需数据库或外部服务。

## 验证

使用现有 `pnpm check`、`pnpm type-check` 和 `pnpm build`。Pagefind 在生产构建后生成，搜索请用 `pnpm preview` 验证。
