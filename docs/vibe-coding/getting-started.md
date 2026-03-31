---
order: 0.5
---

# 快速开始

> 15 分钟，从零到用 AI 写出第一个完整项目。

本章将带你完成 AI 辅助编程的第一次实战：不纠结原理，不动手写代码，全程用自然语言驱动 AI 完成一个真实项目。

## 准备工作

### 1. 选择一个 AI 编程工具

选一个你顺手的，三个都行，关键是**先用起来**：

| 工具 | 安装方式 | 适合人群 | 亮点 |
|------|---------|---------|------|
| **CodeBuddy** | [下载](https://www.codebuddy.cn) | VS Code 用户 | 内置规则系统、AGENTS.md 支持、国产模型适配好 |
| **Trae CN** | [下载](https://www.trae.com.cn) | 想要全自动开发 | SOLO 模式，AI 主导全流程 |
| **Cursor** | [下载](https://cursor.com) | 国际用户 | Composer 多文件编辑、代码库理解能力强 |

::: tip 新手推荐
如果你是第一次使用 AI 编程工具，推荐 **CodeBuddy** —— 基于国内开发者习惯设计，开箱即用，不需要额外配置。
:::

### 2. 安装 Node.js

本项目基于 Node.js，先确保环境就绪：

```bash
# 检查是否已安装
node -v

# 需要 Node.js 18+，如果未安装或版本过低，去官网下载
# https://nodejs.org/
```

### 3. 准备一个空项目目录

```bash
mkdir my-first-ai-project
cd my-first-ai-project
npm init -y
```

用你的 AI 编程工具打开这个目录，准备工作就完成了。

## 第一个项目：个人待办应用

我们要用 AI 构建一个 **Todo 应用**，功能包括：

- ✅ 添加任务
- ✅ 标记完成
- ✅ 删除任务
- ✅ 本地数据持久化

技术栈：**Vue 3 + TypeScript + Vite**

全程你只需要**描述需求**，让 AI 来写代码。

---

## Step 1：初始化项目（2 分钟）

在 AI 对话框中输入：

```
初始化一个 Vue 3 + TypeScript + Vite 项目。使用 npm 作为包管理器，不使用 JSX。
```

AI 会自动执行 `npm create vite@latest` 并安装依赖。

::: details 如果 AI 没有自动执行
部分工具需要你确认操作，点击"允许"或"执行"即可。如果工具不支持自动执行终端命令，你可以手动运行：

```bash
npm create vite@latest . -- --template vue-ts
npm install
```
:::

等依赖安装完成，项目结构应该是这样的：

```
my-first-ai-project/
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── style.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Step 2：创建 Todo 组件（3 分钟）

告诉 AI：

```
在 src/components/ 目录下创建 TodoApp.vue 组件，实现一个待办事项应用：

功能要求：
1. 输入框输入任务文字，按回车或点击按钮添加
2. 每个任务左侧有复选框，点击标记完成（文字加删除线）
3. 每个任务右侧有删除按钮
4. 底部显示任务统计：已完成 X / 共 Y 项
5. 支持筛选：全部 / 未完成 / 已完成

样式要求：
- 使用简洁现代的设计风格
- 输入框圆角，带占位符文字"添加新任务..."
- 任务列表有淡入动画
- 宽度限制 600px，居中显示
- 完全用纯 CSS 实现，不要引入第三方 UI 库
```

AI 会生成一个完整的 Vue 3 组件。仔细看看生成的代码——**这正是你接下来要学会审查的内容**。

::: tip 审查要点
快速扫一眼 AI 生成的代码，检查：
- 是否使用了 `Composition API` + `<script setup>`
- 是否有 TypeScript 类型定义
- 输入验证是否完善（空任务不允许添加）
- 样式是否用了 `scoped`
:::

## Step 3：接入组件（1 分钟）

告诉 AI：

```
把 TodoApp 组件挂载到 App.vue 中，替换掉默认内容。清空 style.css 中的默认样式。
```

AI 会修改 `App.vue` 和 `style.css`。

## Step 4：运行项目（30 秒）

```bash
npm run dev
```

在浏览器打开显示的地址（通常是 `http://localhost:5173`），你应该能看到一个可用的 Todo 应用了。

::: tip 如果页面报错
把浏览器控制台或终端的错误信息直接粘贴给 AI，让它帮你修复：

```
运行 npm run dev 后页面报错：[粘贴错误信息]
```
:::

**到这里，你已经完成了第一个 AI 辅助编程项目。全程没有手写一行代码。**

---

## Step 5：增加数据持久化（3 分钟）

现在任务刷新就没了，我们来加上本地存储。告诉 AI：

```
给 TodoApp 组件添加 localStorage 持久化：
- 每次任务列表变化时自动保存到 localStorage
- 页面加载时从 localStorage 恢复数据
- 使用 Vue 3 的 watch API 监听数据变化
```

AI 会加上 `watch` 和 `onMounted` 的逻辑。刷新页面试试，数据应该还在。

## Step 6：优化体验（3 分钟）

让应用变得更好用。逐个告诉 AI：

```
给 TodoApp 添加以下优化：
1. 空状态提示：当没有任务时显示"暂无待办事项，添加一个吧"
2. 批量操作：添加"清除已完成"按钮
3. 双击编辑：双击任务文字可以内联编辑
4. 拖拽排序：支持拖拽改变任务顺序
```

::: warning 关于拖拽排序
拖拽排序可以引入 `sortablejs` 库。如果 AI 没有自动安装依赖，手动执行：

```bash
npm install sortablejs
npm install -D @types/sortablejs
```
:::

## Step 7：代码审查（2 分钟）

项目完成了，但在提交之前，做一个快速审查。告诉 AI：

```
审查 TodoApp.vue 组件，检查以下问题：
1. 是否有内存泄漏（如未清理的事件监听）
2. localStorage 存储是否有异常处理（如隐私模式）
3. 是否有 XSS 风险（用户输入是否安全渲染）
4. TypeScript 类型是否完整
5. 列出发现的问题并直接修复
```

AI 会指出问题并给出修复方案。

## Step 8：构建部署（1 分钟）

最后一步，把项目构建成可以部署的静态文件：

```bash
npm run build
```

构建产物在 `dist/` 目录下，可以直接部署到任何静态文件托管服务。

告诉 AI：

```
生成一个简单的 vercel.json 配置文件，支持 SPA 路由。
```

或者告诉 AI：

```
生成 GitHub Actions 工作流配置，实现推送代码后自动构建并部署到 GitHub Pages。
```

---

## 恭喜！你完成了第一个 AI 辅助项目 🎉

回顾一下你刚才做的事：

| 步骤 | 你的操作 | AI 的工作 |
|------|---------|----------|
| 初始化项目 | 一句话描述 | 创建项目、安装依赖 |
| 创建组件 | 描述功能和样式 | 编写完整的 Vue 组件 |
| 挂载组件 | 一句话指令 | 修改入口文件 |
| 数据持久化 | 描述需求 | 添加 localStorage 逻辑 |
| 优化体验 | 列出优化点 | 逐个实现功能 |
| 代码审查 | 提出审查要求 | 发现并修复问题 |
| 构建部署 | 一句话指令 | 生成部署配置 |

**你的核心角色是"产品经理"——描述要做什么，AI 是"工程师"——负责实现。**

## 常见问题

### AI 生成的代码有 Bug 怎么办？

把错误信息粘贴给 AI，让它修复。具体方法见 [调试技巧](./debugging.md)。

### AI 不理解我的需求怎么办？

换个说法，或者拆分成更小的步骤。提示词优化技巧见 [提示词工程](./prompt-engineering.md)。

### AI 生成的代码质量可靠吗？

AI 生成的代码需要审查，尤其是安全性和错误处理方面。详见 [最佳实践](./best-practices.md) 和 [安全注意事项](./security.md)。

### 想要更系统地学习？

- [编程思维转变](./mindset.md) —— 理解 AI 编程的思维方式
- [典型工作流程](./workflow.md) —— 建立规范的开发流程
- [实战案例](./cases.md) —— 更多完整项目案例

---

## 参考资料

- [CodeBuddy 文档](https://www.codebuddy.cn/docs/ide/Introduction)
- [Trae CN 官网](https://www.trae.com.cn/)
- [Cursor 文档](https://docs.cursor.com/)
- [Vue 3 入门教程](https://cn.vuejs.org/tutorial/)
- [TypeScript 入门](https://www.typescriptlang.org/zh/docs/handbook/typescript-in-5-minutes.html)
