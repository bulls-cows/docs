# 更新 AGENTS.md 计划

## 任务背景
用户发现在文件编辑操作之后，AI 总是尝试执行 `npm run lint` 和 `npm run docs:build` 命令。
- `npm run lint` 是必要的，没问题
- `npm run docs:build` 是不必要的，需要移除

## 问题分析
需要检查 `c:\workspace\develop\docs\AGENTS.md` 文件中 Quality Gate 部分的要求，移除不必要的 `npm run docs:build` 命令。

## 实施步骤

### 步骤 1: 检查 AGENTS.md 文件内容
- 定位 Quality Gate 部分
- 查找所有提到 `npm run docs:build` 的地方

### 步骤 2: 更新 Quality Gate 部分
- 移除不必要的 `npm run docs:build` 命令
- 确保只保留真正需要执行的命令

### 步骤 3: 检查其他相关部分
- 检查 "修改配置后需验证构建流程" 等相关描述
- 确保前后一致

### 步骤 4: 验证修改
- 确认 lint 命令仍然保留
- 确认没有遗漏相关引用

## 预期结果
- AGENTS.md 文件中不再要求 AI 在每次修改后执行 `npm run docs:build`
- 只保留 `npm run lint` 作为 Quality Gate 的必要检查
