# 修复《全栈开发指南》侧边栏顺序问题

## 问题描述

`docs/fullstack/toc.md` 中定义的目录顺序与实际生成的侧边栏顺序不一致：
- **预期顺序**：企业级实战 → 附录
- **实际顺序**：附录 → 企业级实战

## 根本原因

`config/.vitepress/sidebar.ts` 中的 `buildSection()` 函数通过读取各目录 `index.md` 的 `order` 字段来排序：

1. `case-study/index.md`（企业级实战）没有 `order` 字段
2. `appendix/index.md`（附录）没有 `order` 字段
3. 当没有 `order` 时，默认使用 `Number.MAX_SAFE_INTEGER`
4. 相同 order 值时，按文件名字母序排序
5. `appendix` 在字母序上排在 `case-study` 后面，导致附录排在了前面

## 修复步骤

### 步骤 1：给企业级实战添加 order 字段

**文件**：`docs/fullstack/case-study/index.md`

在文件开头添加 frontmatter：
```yaml
---
order: 6
---
```

### 步骤 2：给附录添加 order 字段

**文件**：`docs/fullstack/appendix/index.md`

在文件开头添加 frontmatter：
```yaml
---
order: 7
---
```

### 步骤 3：验证修复

运行以下命令验证构建是否成功：
```bash
npm run docs:build
```

### 步骤 4：运行质量检查

执行 lint 检查确保代码质量：
```bash
npm run lint
```

## 预期结果

修复后，侧边栏顺序将按照 toc.md 定义的顺序显示：
1. 快速开始
2. 全栈最佳实践
3. 第一篇 前端开发
4. 第二篇 后端开发
5. 第三篇 DevOps
6. 第四篇 架构设计
7. 第五篇 测试
8. **第六篇 企业级实战**（order: 6）
9. **附录**（order: 7）
