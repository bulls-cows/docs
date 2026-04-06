# 实现计划：修复书籍根目录展开后第一个菜单项标题显示问题

## 问题描述

当前侧边栏结构：
- 最外层根节点：正确显示为 index.md 的 title（如「全栈开发指南」）
- 展开后第一个菜单项：显示为 index.md 的 title（如「全栈开发指南」），但期望显示为「前言」

## 问题定位

**文件**: `config/.vitepress/sidebar.ts`
**位置**: 第 238-247 行

```typescript
// 书籍根目录：前言和目录固定在前两位
const items: DefaultTheme.SidebarItem[] = [];
if (isBookRoot) {
  if (indexMeta) {
    items.push({ text: indexMeta.text, link: indexMeta.link });  // ← 问题所在：使用了 indexMeta.text
  }
  if (tocMeta) {
    items.push({ text: tocMeta.text, link: tocMeta.link });
  }
}
```

## 解决方案

修改书籍根目录下 index.md 对应菜单项的标题，将其固定为「前言」，同时保持根节点标题使用 index.md 的 title。

## 实施步骤

### 步骤 1：修改 `buildSection` 函数中的菜单项构建逻辑

**目标**：在构建书籍根目录的菜单项时，将 index.md 对应的菜单项标题设置为「前言」。

**修改位置**：第 241 行

将：
```typescript
items.push({ text: indexMeta.text, link: indexMeta.link });
```

修改为：
```typescript
items.push({ text: "前言", link: indexMeta.link });
```

### 步骤 2：验证修改效果

**执行命令**：
```bash
npm run lint
npm run docs:build
```

**验证标准**：
- 最外层根节点标题显示为 index.md 的 title
- 展开后第一个菜单项显示为「前言」
- 构建过程无错误

## 影响范围

- 仅影响书籍根目录（存在 `toc.md` 的目录）的侧边栏显示
- 不影响子目录的处理逻辑
- 不影响其他功能

## 预期效果

修改后侧边栏结构：
- 最外层根节点：显示为 index.md 的 title（如「全栈开发指南」）
- 展开后：
  - 第一个菜单项：显示为「前言」（对应 index.md 文件）
  - 第二个菜单项：显示为「目录」（对应 toc.md 文件）
  - 其他菜单项：按原有逻辑显示
