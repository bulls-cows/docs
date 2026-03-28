# AGENTS.md - 项目协作指南

## Scope

- 本仓库默认语言: TypeScript、Vue、Markdown
- 允许修改目录:
  - `docs/` - 文档源文件
  - `config/.vitepress/` - VitePress 配置和主题定制
  - `build/` - 构建部署脚本
  - `public/` - 静态资源文件
- 禁止修改目录:
  - `node_modules/` - 依赖包
  - `dist/` - 构建输出（由构建命令自动生成）
  - `.git/` - Git 版本控制目录

## Quality Gate

改动后必须执行:

- `npm run lint` - 执行类型检查和 Markdown 格式检查
- `npm run docs:build` - 验证构建是否成功

代码质量检查工具:

- TypeScript - 配置文件类型检查 (`tsc --noEmit`)
- markdownlint-cli - Markdown 格式检查和自动修复

## Delivery Format

- 文档修改需包含清晰的修改说明
- 新增文档必须包含 `order` 字段用于排序（`title` 可选，未填写时自动从文档标题或文件名提取）
- 修改配置文件后需验证构建流程
- 文件引用格式: `文件路径`（如 `config/.vitepress/config.mts`）

## Project Structure

```text
docs/                          # 项目根目录
├── docs/                      # 文档源目录
│   ├── index.md               # 首页（4大板块入口）
│   ├── about.md               # 关于页面
│   ├── vibe-coding/           # AI辅助编程指南
│   ├── vibe-working/          # AI辅助工作指南
│   ├── fullstack/             # 全栈开发指南
│   │   ├── frontend/          # 前端开发（Vue、React、TypeScript）
│   │   ├── backend/           # 后端开发（Node.js、数据库、API）
│   │   ├── architecture/      # 架构设计
│   │   ├── devops/            # DevOps 实践
│   │   └── testing/           # 测试策略
│   └── system-refactor/       # 重构你的系统
│       ├── tools/             # 工具篇
│       ├── mindset/           # 思维篇
│       ├── skills/            # 技能篇
│       ├── habits/            # 习惯篇
│       ├── search/            # 搜索篇
│       └── research/          # 科研篇
├── config/.vitepress/         # VitePress 配置目录
│   ├── config.mts             # VitePress 主配置
│   ├── sidebar.ts             # 侧边栏和导航自动生成逻辑
│   └── theme/                 # 主题定制
│       ├── index.ts           # 主题入口
│       ├── MyLayout.vue       # 自定义布局
│       └── components/        # 自定义 Vue 组件
├── build/                     # 构建部署脚本
│   └── deploy.ts              # 部署脚本
├── public/                    # 静态资源文件
├── package.json               # 项目依赖配置
└── tsconfig.json              # TypeScript 配置
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
- `shortTitle`: （可选）导航栏短标题
- `bookOrder`: （可选）板块在导航栏的排序
- `sidebar`: 设为 `false` 可隐藏侧边栏显示

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

# 预览构建结果
npm run docs:preview

# 执行 lint 检查（类型检查 + Markdown 检查）
npm run lint

# Markdown 格式检查并自动修复
npm run lint:markdown

# TypeScript 类型检查
npm run check:type

# 检查并构建部署
npm run buildAndDeploy
```

## 提交规范

- 文档更新: `docs(板块名): 描述`
- 配置修改: `config: 描述`
- 主题定制: `theme: 描述`
- 例如: `docs(vibe-coding): 完善 Trae CN 介绍`

## 注意事项

- 侧边栏由目录结构自动生成（通过 `config/.vitepress/sidebar.ts`）
- `docs/index.md` 作为首页，不进入侧边栏
- 修改配置后需执行 `npm run docs:build` 验证
- 新增板块需在目录下创建 `index.md` 文件才会出现在导航栏
