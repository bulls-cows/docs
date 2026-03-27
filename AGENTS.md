# 项目协作规范

本项目为 VitePress 文档站，文档源目录为 `docs/`，站点配置目录为 `config/.vitepress/`。

## 必读文件

- `config/.vitepress/config.mts`
- `config/.vitepress/sidebar.ts`

## 文档维护规则

- 顶部导航 `nav` 由人工手动维护，只放少量一级入口。
- 侧边栏 `sidebar` 由 `config/.vitepress/sidebar.ts` 按 `docs/` 目录自动生成，不在 `config.mts` 中手写文章列表。
- 文档新增、删除、移动时，应尽量通过目录结构表达信息架构，而不是在配置中重复维护。
- `docs/index.md` 作为首页，不进入侧边栏。
- 目录下的 `index.md` 作为分组首页；如需在侧边栏排序，优先使用 frontmatter 中的 `order`。
- 文档标题优先取 frontmatter 中的 `title`，未配置时回退到一级标题 `# Heading`，再回退到文件名。
- 如需隐藏页面，可在 frontmatter 中设置 `sidebar: false`。

## Frontmatter 约定

推荐为文档补充以下字段：

```md
---
title: 快速开始
order: 1
sidebar: true
---
```

字段说明：

- `title`: 侧边栏标题
- `order`: 数字越小越靠前
- `sidebar`: 是否出现在侧边栏，默认为 `true`

## 开发约束

- 修改导航或侧边栏逻辑后，至少执行一次 `npm run docs:build` 验证配置可用。
- 如实际项目结构或维护方式变化，应同步更新本文件。
