# AGENTS.md - 项目协作指南

## 项目概述

- **项目名称**: 牛气腾腾的文档 (docs)
- **技术栈**: VitePress 2.0 + Vue 3 + TypeScript
- **文档源目录**: `docs/`
- **站点配置目录**: `config/.vitepress/`

## 文档结构

```
docs/
├── index.md              # 首页（4大板块入口）
├── about.md              # 关于页面
├── vibe-coding/          # AI辅助编程指南
│   ├── index.md          # Vibe Coding介绍
│   └── tool.md           # 编程工具介绍
├── vibe-working/         # AI辅助工作指南
├── fullstack/            # 全栈开发指南
└── system-refactor/      # 重构你的系统
```

## 写作规范

### Frontmatter 约定

每篇文档必须包含以下 frontmatter:

```md
---
title: 文章标题
order: 1
---
```

- `title`: 侧边栏显示标题
- `order`: 排序序号，数字越小越靠前

### 内容风格

1. **语言**: 中文为主，技术术语保留英文
2. **语气**: 专业、友好、实用
3. **结构**: 使用清晰的标题层级（##、###）
4. **链接**: 外部资源必须提供完整 URL

## 可用命令

```bash
# 本地开发预览
npm run docs:dev

# 构建静态文件
npm run docs:build

# 检查并构建部署
npm run buildAndDeploy
```

## 提交规范

- 文档更新: `docs(板块名): 描述`
- 例如: `docs(vibe-coding): 完善 Trae CN 介绍`

## 注意事项

- 侧边栏由目录结构自动生成
- `docs/index.md` 作为首页，不进入侧边栏
- 修改配置后需执行 `npm run docs:build` 验证
