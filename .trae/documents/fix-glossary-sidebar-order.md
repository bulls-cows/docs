# 修复附录在侧边栏显示位置的计划

## 问题分析

从截图可以看到，"附录：常用医学术语解释"（99-glossary.md）显示在侧边栏的靠前位置（在"序言"之后、"第一篇 内科系统"之前），而不是显示在所有章节之后。

## 根本原因

在 `config/.vitepress/sidebar.ts` 的 `buildSection` 函数中，第 259 行的代码：

```typescript
items.push(...sortedFiles, ...sortedSections);
```

这行代码将所有独立文件和子目录分开排序，独立文件始终排在子目录之前，导致附录（99- 前缀的文件）虽然序号大但仍然排在所有子目录（各篇章节）前面。

## 修复方案

修改侧边栏构建逻辑，对于书籍根目录（有 `toc.md` 的目录）：

1. 前言（固定第一位）
2. 目录（固定第二位）
3. 将其他独立文件和子目录**合并成一个列表**，统一按 `order` 排序，不区分是文件还是子目录

这样附录（99- 前缀，order=99）就会自然排在所有章节（01-、02-... 前缀，order=1~6）之后。

## 实施步骤

1. 修改 `config/.vitepress/sidebar.ts` 中的 `buildSection` 函数
2. 在书籍根目录（`isBookRoot` 为 true）时：
   - 将 `fileItems` 和 `childSections` 合并成一个数组
   - 统一按 `order` 排序
   - 然后添加到 `items` 中
3. 非根目录保持原有逻辑不变
4. 执行 `npm run lint` 验证代码正确性
5. 执行 `npm run docs:dev` 预览效果

## 修改文件

- `config/.vitepress/sidebar.ts` - 调整书籍根目录的侧边栏项排序逻辑，合并文件和子目录后统一排序
