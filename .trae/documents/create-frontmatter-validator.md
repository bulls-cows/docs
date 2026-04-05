# 创建 Frontmatter 验证脚本

## 目标

在 `build` 目录下创建一个 TypeScript 脚本（ES Module），用于验证 `docs` 目录下所有 .md 文件的 frontmatter 是否包含必填的 `order` 字段。

## 功能需求

1. **递归遍历**：遍历 `docs` 目录及其所有子目录
2. **文件过滤**：只处理 `.md` 文件
3. **Frontmatter 检测**：检测文件头部是否包含 YAML frontmatter（`---` 包裹）
4. **必填字段验证**：检查 frontmatter 中是否包含 `order` 字段
5. **快速失败**：检测到第一个缺少 `order` 字段的文件就立即退出，不再继续检测
6. **退出码**：如果有错误，返回非零退出码

## 实现步骤

### 步骤 1：创建脚本文件

**文件路径**：`build/validate-frontmatter.ts`

### 步骤 2：实现核心功能

脚本需要包含以下功能模块：

1. **导入依赖**
   - `fs` - 文件系统操作
   - `path` - 路径处理
   - `js-yaml` - YAML 解析（需要安装）

2. **配置常量**
   - `DOCS_ROOT` - docs 目录的绝对路径

3. **Frontmatter 解析函数**
   - 检测文件是否包含 `---` 包裹的 frontmatter
   - 提取 frontmatter 内容
   - 使用 `js-yaml` 库解析 YAML

4. **递归遍历函数**
   - 遍历目录树
   - 识别 `.md` 文件
   - 对每个文件执行验证

5. **验证函数**
   - 检查 frontmatter 是否存在
   - 检查 `order` 字段是否存在
   - 发现错误立即抛出异常并退出

6. **主执行流程**
   - 遍历所有文件
   - 输出验证结果
   - 根据错误情况设置退出码

### 步骤 3：安装依赖

安装 `js-yaml` 依赖包：
```bash
npm install js-yaml
npm install -D @types/js-yaml
```

### 步骤 4：添加到 package.json

在 `package.json` 中添加脚本命令：
```json
"scripts": {
  "validate:frontmatter": "tsx build/validate-frontmatter.ts"
}
```

### 步骤 5：测试验证

运行脚本验证功能：
```bash
npm run validate:frontmatter
```

## 预期输出格式

### 成功输出
```
✓ Validated 100 markdown files
✓ All files have required frontmatter fields
```

### 失败输出
```
✗ File missing required frontmatter field: docs/fullstack/case-study/index.md
  Missing field: 'order'

✗ Validation failed
```

## 技术细节

### Frontmatter 格式示例

```yaml
---
title: 文章标题
order: 1
---
```

### 解析逻辑

1. 检查文件开头是否为 `---`
2. 查找第二个 `---` 作为结束标记
3. 提取中间内容作为 frontmatter
4. 使用 `js-yaml` 库解析 YAML 内容
5. 检查 `order` 字段是否存在

### 文件遍历策略

- 使用 `fs.readdirSync` 递归遍历
- 使用 `withFileTypes: true` 优化性能
- 跳过非 `.md` 文件
- 跳过隐藏文件（以 `.` 开头）

## 代码风格

遵循现有 build 目录下的代码风格：
- 使用 ES Module 语法（`import`/`export`）
- 使用 `node:` 前缀导入 Node.js 内置模块
- 使用 TypeScript 类型注解
- 清晰的错误处理和日志输出
