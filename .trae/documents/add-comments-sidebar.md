# 计划：为 sidebar.ts 添加注释

## 目标

为 `config/.vitepress/sidebar.ts` 文件中的函数添加必要的注释：
1. 在函数定义上方添加 JSDoc 注释
2. 在函数体内部对重要逻辑进行注释

## 当前函数分析

文件包含以下函数：

| 函数名 | 功能 |
|--------|------|
| `parseFrontmatterValue` | 解析 frontmatter 字段值为具体类型 |
| `extractFrontmatter` | 从 Markdown 源码中提取 frontmatter |
| `extractHeading` | 从 Markdown 源码中提取一级标题 |
| `prettifyName` | 将文件名转换为可读标题 |
| `toLink` | 将文件路径转换为 VitePress 链接 |
| `readDocMeta` | 读取单个文档的元数据 |
| `sortByOrder` | 按 order 字段排序 |
| `buildSection` | 递归构建侧边栏区块 |
| `buildNav` | 构建顶部导航栏 |
| `buildSidebar` | 构建完整侧边栏配置 |

## 实现步骤

### 步骤 1：为工具函数添加 JSDoc

**`parseFrontmatterValue`**
```typescript
/**
 * 解析 frontmatter 字段值为具体类型
 * 支持字符串、数字、布尔值类型
 * @param rawValue - 原始字段值字符串
 * @returns 解析后的值
 */
```

**`extractFrontmatter`**
```typescript
/**
 * 从 Markdown 源码中提取 frontmatter
 * @param source - Markdown 文件内容
 * @returns 解析后的 frontmatter 键值对对象
 */
```

**`extractHeading`**
```typescript
/**
 * 从 Markdown 源码中提取一级标题
 * @param source - Markdown 文件内容
 * @returns 一级标题文本，若无则返回 undefined
 */
```

**`prettifyName`**
```typescript
/**
 * 将文件名转换为可读标题
 * 将连字符和下划线替换为空格，并首字母大写
 * @param name - 原始文件名
 * @returns 格式化后的标题
 */
```

**`toLink`**
```typescript
/**
 * 将文件相对路径转换为 VitePress 链接
 * @param relativePath - 相对于 docs 目录的路径
 * @returns VitePress 格式的链接路径
 */
```

### 步骤 2：为核心函数添加 JSDoc 和内部注释

**`readDocMeta`**
```typescript
/**
 * 读取单个 Markdown 文档的元数据
 * @param filePath - 文件绝对路径
 * @returns 文档元数据对象
 */
```

**`sortByOrder`**
```typescript
/**
 * 按 order 字段排序，order 相同时按文本排序
 * @param items - 待排序的项数组
 * @returns 排序后的数组
 */
```

**`buildSection`**
```typescript
/**
 * 递归构建侧边栏区块
 * 
 * 处理逻辑：
 * 1. 遍历目录下的文件和子目录
 * 2. 读取每个文件的元数据
 * 3. 递归处理子目录
 * 4. 按 order 排序后返回侧边栏配置
 * 
 * @param dirPath - 目录绝对路径
 * @returns 侧边栏区块配置，若目录为空则返回 null
 */
```

内部重要逻辑注释：
- 处理子目录
- 处理 index.md 文件
- 合并并排序结果

**`buildNav`**
```typescript
/**
 * 构建顶部导航栏
 * 遍历 docs 目录下的所有子目录，提取 index.md 中的元数据
 * @returns 导航栏配置数组
 */
```

**`buildSidebar`**
```typescript
/**
 * 构建完整侧边栏配置
 * 为每个一级目录生成独立的侧边栏
 * @returns VitePress 侧边栏配置对象
 */
```

## 注意事项

- 注释使用中文编写
- JSDoc 注释需包含 `@param` 和 `@returns` 标签
- 仅对重要逻辑添加内部注释
