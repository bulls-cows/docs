# AGENTS.md - 项目协作指南

## Scope

- 本仓库默认语言: TypeScript、Vue、Markdown
- 允许修改目录:
  - `docs/` - 文档源文件
  - `config/.vitepress/` - VitePress 配置和主题定制
  - `build/` - 构建部署脚本
  - `public/` - 静态资源文件
  - 根目录配置文件（如 `package.json`、`tsconfig.json`）- 项目脚本与工具链配置
- 禁止修改目录:
  - `node_modules/` - 依赖包
  - `dist/` - 构建输出（由构建命令自动生成）
  - `.git/` - Git 版本控制目录

## Quality Gate

改动后必须执行:

- `npm run lint` - 执行类型检查和 Markdown 格式检查，验证构建是否成功

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
│   └── system-refactor/       # 重构你的系统
├── config/.vitepress/         # VitePress 配置目录
│   ├── config.mts             # VitePress 主配置
│   ├── sidebar.ts             # 侧边栏和导航自动生成逻辑
│   └── theme/                 # 主题定制
├── build/                     # 构建部署脚本
├── public/                    # 静态资源文件
├── package.json               # 项目依赖配置
└── tsconfig.json              # TypeScript 配置
```

## 写作规范

### Frontmatter 约定

不同类型的文件有不同的 frontmatter 要求：

| 文件类型 | 必需字段 | 可选字段 | 说明 |
|---------|---------|---------|------|
| docs 根目录下的 .md 文件（非 index.md） | 无 | title | 不应有 `order` 字段 |
| 第一层子目录的 index.md | bookOrder, shortTitle | title | 不应有 `order` 字段，`bookOrder` 必须 > 0 |
| 第一层子目录的 toc.md | 无 | 无 | 不应有 `order` 字段，可不写 frontmatter |
| 其他目录的 index.md | 无 | title | 不需要 `order` 字段 |
| 其他 .md 文件 | order | title | `order` 用于排序 |

#### 字段说明

- `title`: 侧边栏显示标题。未填写时从文档一级标题或文件名自动提取
- `order`: 排序序号，数字越小越靠前。未填写时默认排在最后
- `shortTitle`: 导航栏短标题，用于顶部导航（仅第一层子目录 index.md 需要）
- `bookOrder`: 板块在导航栏的排序（仅第一层子目录 index.md 需要）
- `sidebar`: 设为 `false` 可隐藏侧边栏显示

#### 示例

**普通文档**：

```md
---
title: 文章标题
order: 1
---
```

**第一层子目录的 index.md**：

```md
---
title: AI辅助编程指南
shortTitle: Vibe Coding
bookOrder: 1
---
```

#### 注意事项

- 空 frontmatter（无任何字段）会被自动移除
- 同一目录下 `order` 值不能重复

### 内容风格

1. **语言**: 中文为主，技术术语保留英文
2. **语气**: 专业、友好、实用
3. **结构**: 使用清晰的标题层级（##、###）
4. **链接**: 外部资源必须提供完整 URL

### 图书内容质量要求

撰写图书内容时，AI 必须遵循以下质量标准：

#### 1. 内容准确性

- **事实核查**: 所有技术信息、代码示例、数据必须经过验证
- **时效性**: 注明内容的适用版本或时间范围，及时更新过时信息
- **引用来源**: 引用外部资料时提供可靠来源链接

#### 2. 内容深度

- **避免模板化**: 每个章节应有独特的见解和实践经验，而非泛泛而谈
- **深入分析**: 不仅介绍"是什么"，更要解释"为什么"和"怎么用"
- **案例丰富**: 包含实际使用场景、完整案例、可操作的步骤
- **避坑指南**: 指出常见错误和注意事项

#### 3. 内容广度

- **覆盖全面**: 覆盖主题的主要方面，不遗漏重要知识点
- **层次分明**: 从入门到进阶，适应不同水平的读者
- **工具更新**: 及时纳入新兴工具和热门产品（如 DeepSeek、Cursor 等）

#### 4. 可读性

- **语言流畅**: 避免病句、歧义，保持段落连贯
- **结构清晰**: 合理使用标题、列表、表格、代码块
- **图文配合**: 复杂内容应配合截图、流程图或 GIF 演示
- **排版规范**: 代码块必须指定语言标识（如 ```typescript、```bash）

#### 5. 实用性

- **可操作**: 读者能根据文档直接执行操作
- **可复用**: 提供可复用的模板、脚本、配置
- **效率导向**: 包含提升效率的技巧和最佳实践

#### 6. 禁止事项

- ❌ 大段复制粘贴官方文档而不加工
- ❌ 过时或已被淘汰的工具/方法作为主流推荐
- ❌ 未经测试的代码示例
- ❌ 侵犯版权的内容
- ❌ 主观臆测或未经验证的技术细节

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

- 提交信息: `<type>(<scope>): <subject>`中的 `<subject>` 需为中文（专业词汇、文件名等特殊场景除外）
- 文档更新: `docs(板块名): 描述`
- 配置修改: `config: 描述`
- 主题定制: `theme: 描述`
- 例如: `docs(vibe-coding): 完善 Trae CN 介绍`

## 注意事项

- 侧边栏由目录结构自动生成（通过 `config/.vitepress/sidebar.ts`）
- `docs/index.md` 作为首页，不进入侧边栏
- 修改配置后需执行 `npm run docs:build` 验证
- 新增板块需在目录下创建 `index.md` 文件才会出现在导航栏
