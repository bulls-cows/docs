# 小药文档

> 让AI赋能药学，让药学拥抱智能

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/bulls-cows/docs/blob/main/LICENSE)
[![VitePress](https://img.shields.io/badge/VitePress-2.0.0--alpha.17-brightgreen.svg)](https://vitepress.dev/)
[![Vue](https://img.shields.io/badge/Vue-3.5.31-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6.svg)](https://www.typescriptlang.org/)

**小药文档** 是一个技术知识库与产品文档平台，由小药团队创建和维护。我们拥有 15 年生物与信息技术交叉领域的从业经验，致力于将专业知识转化为易于理解的内容，帮助更多人提升技能、解决问题。

## ✨ 核心内容

我们提供五本原创技术书籍，涵盖 AI 应用、编程开发、认知提升、健康科普等主题：

### 🤖 [AI 辅助工作指南](https://github.com/bulls-cows/docs/tree/main/docs/vibe-working)

让 AI 成为你的智能助手，从文档处理到科研工作，全面提升日常工作效率。

- **创意工作** - 头脑风暴、方案对比、多角度分析
- **数据分析** - 理解数据含义、生成可视化图表
- **科研辅助** - 文献调研、学术写作、实验方案设计
- **翻译润色** - 多语言翻译、学术英文润色
- **写作辅助** - 邮件撰写、方案起草、报告生成

### 💻 [AI 辅助编程指南](https://github.com/bulls-cows/docs/tree/main/docs/vibe-coding)

用自然语言描述需求，让 AI 帮你写代码。从需求到实现，编程从未如此简单。

- **最佳实践** - AI 编程的正确姿势
- **提示工程** - 如何写出高质量的提示词
- **代码审查** - AI 生成代码的质量把控
- **调试技巧** - 高效定位和修复问题
- **安全实践** - 避免 AI 生成代码的安全漏洞

### 🚀 [全栈开发指南](https://github.com/bulls-cows/docs/tree/main/docs/fullstack)

汇集牛牛团队 TypeScript 全栈开发的最佳实践，涵盖前后端开发、架构设计等核心内容。

- **前端开发** - React/Vue、状态管理、样式方案
- **后端开发** - Node.js、API 设计、数据库
- **架构设计** - Monorepo、领域驱动、微服务
- **DevOps** - CI/CD、容器化、云原生
- **测试策略** - 单元测试、集成测试、E2E 测试

### 🧠 [重构你的系统](https://github.com/bulls-cows/docs/tree/main/docs/system-refactor)

重塑认知体系，提升搜索、科研、技能运用能力。帮助你在瓶颈期找到突破口，实现自我进化。

- **思维篇** - 决策框架、认知模型
- **习惯篇** - 时间管理、精力管理
- **技能篇** - 刻意练习、技能习得
- **搜索篇** - 信息检索、知识管理
- **科研篇** - 研究方法、学术写作

### 🏥 [健康科普手册](https://github.com/bulls-cows/docs/tree/main/docs/health-handbook)

综合性健康科普读物，涵盖呼吸、消化、心血管等8大系统常见病症的医学知识、发病原理及科学治愈方案。

- **呼吸系统** - 感冒、哮喘、肺炎等常见疾病
- **消化系统** - 胃炎、溃疡、肝病等消化问题
- **心血管系统** - 高血压、心脏病等循环疾病
- **内分泌系统** - 糖尿病、甲状腺等代谢疾病
- **其他系统** - 神经、泌尿、骨骼肌肉等系统疾病

## 🎯 特色亮点

- **原创内容** - 基于实战经验总结，非简单搬运
- **体系完整** - 从入门到进阶，循序渐进
- **中文友好** - 中文为主，技术术语保留英文
- **持续更新** - 紧跟技术发展，定期迭代内容
- **开源免费** - Apache-2.0 许可，自由阅读和分享

## 📦 技术栈

- **文档引擎** - [VitePress 2.0](https://vitepress.dev/) - Vue 驱动的静态站点生成器
- **前端框架** - [Vue 3.5](https://vuejs.org/) - 渐进式 JavaScript 框架
- **类型系统** - [TypeScript 6.0](https://www.typescriptlang.org/) - JavaScript 的超集
- **数学公式** - [MathJax 3](https://www.mathjax.org/) - 数学公式渲染
- **代码规范** - [markdownlint-cli](https://github.com/igorshubovych/markdownlint-cli) - Markdown 格式检查

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/bulls-cows/docs.git

# 进入项目目录
cd docs

# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev
```

开发服务器启动后，访问 `http://localhost:5173` 即可预览文档。

### 构建部署

```bash
# 构建静态文件
npm run docs:build

# 预览构建结果
npm run docs:preview

# 执行 lint 检查（类型检查 + Markdown 格式检查 + 构建）
npm run lint

# 检查并构建部署
npm run buildAndDeploy
```

## 📁 项目结构

```text
docs/                          # 项目根目录
├── docs/                      # 文档源目录
│   ├── index.md               # 首页（4 大板块入口）
│   ├── about.md               # 关于页面
│   ├── vibe-coding/           # AI 辅助编程指南
│   ├── vibe-working/          # AI 辅助工作指南
│   ├── fullstack/             # 全栈开发指南
│   ├── system-refactor/       # 重构你的系统
│   └── health-handbook/       # 健康科普手册
├── config/.vitepress/         # VitePress 配置目录
│   ├── config.mts             # VitePress 主配置
│   ├── sidebar.ts             # 侧边栏和导航自动生成逻辑
│   └── theme/                 # 主题定制
├── build/                     # 构建部署脚本
├── public/                    # 静态资源文件
├── package.json               # 项目依赖配置
└── tsconfig.json              # TypeScript 配置
```

## 📖 写作规范

### Frontmatter 约定

每篇文档必须包含以下 frontmatter：

```md
---
title: 文章标题
---
```

- `title` - 侧边栏显示标题
- `shortTitle` - （可选）导航栏短标题
- `sidebar` - 设为 `false` 可隐藏侧边栏显示

### 内容风格

- **语言** - 中文为主，技术术语保留英文
- **语气** - 专业、友好、实用
- **结构** - 使用清晰的标题层级（##、###）
- **链接** - 外部资源必须提供完整 URL

## 🤝 贡献指南

我们欢迎所有形式的贡献：

- **内容纠错** - 发现错误？欢迎提交 Issue 或 PR
- **内容建议** - 有好的想法？欢迎在 Issue 中讨论
- **文档改进** - 可以改进文档质量？请提交 PR

### 提交规范

提交信息格式：`<type>(<scope>): <subject>`

- `docs(板块名)` - 文档更新
- `config` - 配置修改
- `theme` - 主题定制

示例：`docs(vibe-coding): 完善 Trae CN 介绍`

## 📄 许可证

本项目采用 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) 许可证。

## 📮 联系我们

- **官网** - [www.verysites.com](https://www.verysites.com)
- **在线文档** - [docs.verysites.com](https://docs.verysites.com)
- **GitHub** - [github.com/bulls-cows/docs](https://github.com/bulls-cows/docs)
- **问题反馈** - [GitHub Issues](https://github.com/bulls-cows/docs/issues)
- **打赏支持** - [打赏页面](https://www.verysites.com/donation)

## 🙏 致谢

感谢所有为这个项目做出贡献的人，以及以下开源项目：

- [VitePress](https://vitepress.dev/) - 强大的文档生成工具
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

**天上的神明与星辰，人间的艺术和真纯，我们所敬畏和热爱的，莫过于此。**

如果这个项目对你有帮助，欢迎 ⭐ Star 支持我们！
