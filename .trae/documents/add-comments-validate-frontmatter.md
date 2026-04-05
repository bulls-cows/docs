# 计划：为 validate-frontmatter.ts 添加注释

## 目标

为 `build/validate-frontmatter.ts` 文件中的函数添加必要的注释：
1. 在函数定义上方添加 JSDoc 注释
2. 在函数体内部对重要逻辑进行注释

## 当前函数分析

文件包含以下函数：

| 函数名 | 功能 |
|--------|------|
| `extractFrontmatter` | 从 Markdown 源码中提取 YAML frontmatter |
| `validateFile` | 验证单个文件的 frontmatter 是否符合要求 |
| `validateDirectory` | 递归验证目录下所有 Markdown 文件 |
| `main` | 程序入口函数 |

## 实现步骤

### 步骤 1：为 `extractFrontmatter` 添加 JSDoc

```typescript
/**
 * 从 Markdown 源码中提取 YAML frontmatter
 * @param source - Markdown 文件内容
 * @returns 解析后的 frontmatter 对象，若无 frontmatter 或解析失败则返回 null
 */
```

### 步骤 2：为 `validateFile` 添加 JSDoc

```typescript
/**
 * 验证单个 Markdown 文件的 frontmatter
 * @param filePath - 文件绝对路径
 * @returns 解析后的 frontmatter 对象
 * @throws 若 frontmatter 不存在或缺少 order 字段则抛出错误
 */
```

### 步骤 3：为 `validateDirectory` 添加 JSDoc 和内部注释

```typescript
/**
 * 递归验证目录下所有 Markdown 文件的 frontmatter
 * 
 * 验证规则：
 * 1. 每个文件必须包含 frontmatter
 * 2. frontmatter 必须包含 order 字段
 * 3. 同一目录下的文件 order 值不能重复
 * 
 * @param dirPath - 目录绝对路径
 * @returns 已验证的文件数量
 * @throws 若验证失败则抛出错误
 */
```

内部重要逻辑注释：
- 收集 order 值用于检测重复
- 检查同级目录 order 是否重复

### 步骤 4：为 `main` 添加 JSDoc

```typescript
/**
 * 程序入口函数
 * 执行 frontmatter 验证并输出结果
 */
```

## 注意事项

- 注释使用中文编写
- JSDoc 注释需包含 `@param` 和 `@returns` 标签
