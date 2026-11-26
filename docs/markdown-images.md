# Markdown 图片

文章、页面和 dynamic 正文都走同一套 Astro Markdown 处理流程（`astro.config.mjs` 的 `markdown.processor`），因此下面的写法通用。

## 单张图片

```markdown
![替代文本](images/OBS.png)
```

带替代文本的图片会被 `rehype-figure` 包成居中的 `figure` + `figcaption`。

## 调整大小与属性

在图片后紧跟 `{...}` 即可追加属性（由 `src/plugins/remark-image-attributes.mjs` 解析）：

```markdown
![OBS](images/OBS.png){width=50%}
![OBS](images/OBS.png){width="320px" height="240px"}
![OBS](images/OBS.png){class="shadow" loading="lazy"}
![OBS](images/OBS.png){.rounded-xl #obs}
```

- 支持 `key=value`（值可加引号，也可不加）、`.class` 和 `#id`。
- `width` / `height` 会写成行内 `style`，并自动给另一个方向补 `auto`，所以百分比、`px`、`rem` 都可以用，也不会因为 Astro 图片组件输出的宽高属性而变形。
- 其余属性（如 `loading`、`title`、`id`、`class`）原样输出到 `<img>`。
- 属性块必须紧跟在图片之后；`{...}` 里只有键值对、class 或 id 时才生效，普通正文中的花括号不受影响。
- 链接包住图片时同样生效：`[![OBS](images/OBS.png)](https://example.com){width=50%}`。

## 图片网格

```markdown
[grid]
![图一](images/a.png)
![图二](images/b.png)
[/grid]
```

`[grid]` / `[/grid]` 由 `remark-image-grid` 处理，按图片数量自动排 1–4 列，网格内单张图片的 `{width=...}` 会被网格样式覆盖。

## 验证

改了 Markdown 插件后运行 `pnpm check`、`pnpm type-check` 和 `pnpm build`；本地效果用 `pnpm dev` 或 `pnpm preview` 查看。
