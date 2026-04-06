# 修改计划：修复书籍根节点标题显示问题

## 问题描述

在 `config/.vitepress/sidebar.ts` 中，书籍根节点在左侧目录中的名字被强制设置为"前言"，而不是使用 index.md 文件的一级标题内容。

## 问题定位

**文件**: `config/.vitepress/sidebar.ts`
**位置**: 第 208-213 行

```typescript
// 书籍根目录特殊处理
if (isBookRoot) {
  // index.md 显示为"前言"
  if (entry.name === "index.md") {
    indexMeta = { ...meta, text: "前言" };  // ← 问题所在：强制覆盖标题
    continue;
  }
```

## 解决方案

移除强制覆盖 `text` 的逻辑，保留 `readDocMeta` 函数已经正确提取的标题。

`readDocMeta` 函数（第 128-142 行）已经按以下优先级正确提取标题：
1. frontmatter 中的 `title` 字段
2. 文档的一级标题（`# 标题`）
3. 文件名格式化后的名称

## 修改步骤

### 步骤 1：修改 `buildSection` 函数

将第 211 行：
```typescript
indexMeta = { ...meta, text: "前言" };
```

修改为：
```typescript
indexMeta = meta;
```

这样书籍根目录的 index.md 将使用其自身的标题，而非固定的"前言"。

## 影响范围

- 仅影响书籍根目录（存在 `toc.md` 的目录）的侧边栏显示
- 不影响子目录的处理逻辑
- 不影响其他功能

## 验证方法

修改后执行：
```bash
npm run lint
npm run docs:build
```

确认构建成功且侧边栏显示正确。
