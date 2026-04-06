# 修改 buildSidebar 函数逻辑 - 书籍根目录侧边栏行为调整

## 需求分析

用户要求修改 `buildSection` 函数的逻辑：

1. **书籍根目录节点**（存在 `toc.md` 文件的目录）：
   - 左侧菜单只是一个目录，不应该直接对应 `index.md`（即点击目录标题不会跳转）
   - 目录默认展开（`collapsed: false`）

2. **非根目录**：维持原状不变
   - 继续使用现有逻辑：有 `index.md` 时可点击跳转，默认折叠

## 当前逻辑分析

在 [sidebar.ts:258-268](file:///c:/workspace/develop/docs/config/.vitepress/sidebar.ts#L258-L268) 中：

```typescript
// 构建章节配置：点击章节标题直接跳转到 index.md
const result: DefaultTheme.SidebarItem & { order: number } = {
  text: sectionText,
  collapsed: true,
  order: sectionOrder,
};

// 如果有 index.md，添加 link 属性使章节标题可点击跳转
if (indexMeta) {
  result.link = indexMeta.link;
}
```

当前问题：
- 所有目录都设置 `collapsed: true`（默认折叠）
- 所有有 `index.md` 的目录都会设置 `link` 属性（可点击跳转）

## 修改方案

修改 [sidebar.ts:258-273](file:///c:/workspace/develop/docs/config/.vitepress/sidebar.ts#L258-L273) 的逻辑：

```typescript
// 构建章节配置
const result: DefaultTheme.SidebarItem & { order: number } = {
  text: sectionText,
  // 书籍根目录默认展开，非根目录默认折叠
  collapsed: !isBookRoot,
  order: sectionOrder,
};

// 非根目录：如果有 index.md，添加 link 属性使章节标题可点击跳转
// 书籍根目录：不设置 link，保持为纯目录
if (indexMeta && !isBookRoot) {
  result.link = indexMeta.link;
}

// 如果有其他子项（文件或子目录），添加 items
if (items.length > 0) {
  result.items = items;
}
```

## 修改要点

| 场景 | collapsed | link |
|------|-----------|------|
| 书籍根目录（有 toc.md） | `false`（展开） | 不设置 |
| 非根目录（有 index.md） | `true`（折叠） | 设置 |
| 非根目录（无 index.md） | `true`（折叠） | 不设置 |

## 实施步骤

1. 修改 `buildSection` 函数中的 `result` 对象构建逻辑
   - 将 `collapsed: true` 改为 `collapsed: !isBookRoot`
   - 将 `if (indexMeta)` 条件改为 `if (indexMeta && !isBookRoot)`

2. 运行 lint 检查验证代码正确性
   - `npm run lint`

3. 运行构建验证功能正常
   - `npm run docs:build`
