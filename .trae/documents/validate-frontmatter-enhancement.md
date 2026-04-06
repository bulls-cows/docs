# validate-frontmatter.ts 增强校验逻辑实施计划

## 任务概述

为 `build/validate-frontmatter.ts` 增加更精细的 frontmatter 校验逻辑，针对不同层级的文件应用不同的验证规则。

## 当前代码分析

### 现有验证规则
- `validateFile` 函数：
  - 所有文件必须有 frontmatter
  - `index.md` 文件不需要 `order` 字段
  - `toc.md` 文件不需要 `order` 字段
  - 其他文件必须有 `order` 字段
- `validateDirectory` 函数：
  - 递归验证所有 Markdown 文件
  - 检查查同级目录下 `order` 值是否重复

### 需要新增的规则
1. **docs 根目录下的直接 .md 文件**（如 `about.md`）：
   - 不应该设置 `order` 字段

2. **docs 根目录下的直接子目录**（如 `fullstack/`、`vibe-coding/`）：
   - 子目录内的 `toc.md` 文件：不应该设置 `order` 字段（可以没有 frontmatter）
   - 子目录内的 `index.md` 文件：不应该设置 `order` 字段
   - 子目录内的 `index.md` 文件：必须设置 `bookOrder` 字段（值必须 > 0）
   - 子目录内的 `index.md` 文件：必须设置 `shortTitle` 字段

## 目录结构说明

```
docs/                          # DOCS_ROOT
├── index.md                   # 根目录的 index.md（不需要 order）
├── about.md                   # 根目录的直接 .md 文件（不应有 order）
├── fullstack/                 # 根目录的直接子目录（第一层）
│   ├── index.md              # 需要验证：不应有 order，必须有 bookOrder > 0 和 shortTitle
│   ├── toc.md                # 需要验证：不应有 order（可以没有 frontmatter）
│   ├── getting-started.md   # 需要验证：必须有 order
│   ├── backend/              # 第二层子目录
│   │   ├── index.md          # 不需要 bookOrder 和 shortTitle，不需要 order
│   │   └── api-design.md     # 需要验证：必须有 order
│   └── ...
└── vibe-coding/              # 根目录的直接子目录（第一层）
    ├── index.md              # 需要验证：不应有 order，必须有 bookOrder > 0 和 shortTitle
    ├── toc
.md                # 需要验证：不应有 order（可以没有 frontmatter）
    └── ...
```

## 实施步骤

### 步骤 1：扩展 Frontmatter 接口
- 在 `Frontmatter` 接口中添加 `bookOrder` 和 `shortTitle` 的类型定义
- 保持向后兼容，使用可选属性

### 步骤 2：修改 validateFile 函数签名
- 添加 `parentDirPath` 参数，用于判断文件所在的父目录
- 添加 `isFirstLevelSubdir` 参数，用于标识是否在 docs 根目录的直接子目录层级

### 步骤 3：实现新的验证逻辑
在 `validateFile` 函数中添加以下判断：

#### 3.1 判断文件层级
- 检查 `parentDirPath` 是否等于 `DOCS_ROOT`（docs 根目录）
- 检查 `parentDirPath` 是否是 docs 根目录的直接子目录（第一层）

#### 3.2 应用验证规则
**规则 A：docs 根目录下的直接 .md 文件（非 index.md）**
- 条件：`parentDirPath === DOCS_ROOT` 且文件名不是 `index.md`
- 验证：不应该有 `order` 字段
- 错误提示：`File should not have 'order' field in root level: ${relativePath}`

**规则 B：第一层子目录内的 toc.md**
- 条件：文件名是 `toc.md` 且 `isFirstLevelSubdir === true`
- 验证：不应该有 `order` 字段（可以没有 frontmatter）
- 错误提示：`toc.md should not have 'order' field: ${relativePath}`

**规则 C：第一层子目录内的 index.md**
- 条件：文件名是 `index.md` 且 `isFirstLevelSubdir === true`
- 验证：
  - 不应该有 `order` 字段
  - 必须有 `bookOrder` 字段且值 > 0
  - 必须有 `shortTitle` 字段
- 错误提示：
  - `index.md should not have 'order' field: ${relativePath}`
  - `index.md missing required field 'bookOrder' (must be > 0): ${relativePath}`
  - `index.md missing required field 'shortTitle': ${relativePath}`

**规则 D：其他文件（保持原有逻辑）**
- `index.md` 文件不需要 `order` 字段
- 其他文件必须有 `order` 字段

### 步骤 4：修改 validateDirectory 函数
- 添加 `isFirstLevelSubdir` 参数，用于标识当前目录是否是 docs 根目录的直接子目录
- 在递归调用 `validateDirectory` 时传递 `false`（子目录不再是第一层）
- 在调用 `validateFile` 时传递父目录路径和层级标识

### 步骤 5：更新错误消息
- 确保所有错误消息清晰明确，包含文件相对路径
- 使用统一的错误消息格式

### 步骤 6：测试验证
- 运行 `npm run lint` 确保代码通过类型检查
- 运行 `node build/validate-frontmatter.ts` 验证所有文档文件
- 检查错误输出是否符合预期

## 代码修改点

### 文件：`build/validate-frontmatter.ts`

#### 修改点 1：Frontmatter 接口
```typescript
interface Frontmatter {
  order?: number;
  bookOrder?: number;
  shortTitle?: string;
  [key: string]: unknown;
}
```

#### 修改点 2：validateFile 函数签名
```typescript
function validateFile(
  filePath: string,
  parentDirPath: string,
  isFirstLevelSubdir: boolean
): Frontmatter
```

#### 修改点 3：validateDirectory 函数签名
```typescript
function validateDirectory(
  dirPath: string,
  isFirstLevelSubdir: boolean = false
): number
```

#### 修改点 4：validateDirectory 函数调用
```typescript
// 递归调用子目录（子目录不再是第一层）
fileCount += validateDirectory(absolutePath, false);

// 验证文件
const frontmatter = validateFile(absolutePath, dirPath, isFirstLevelSubdir);
```

## 验证场景

### 场景 1：docs 根目录下的 about.md
- 路径：`docs/about.md`
- 预期：不应该有 `order` 字段
- 错误示例：`about.md` 包含 `order: 1` 应该报错

### 场景 2：fullstack 目录下的 toc.md
- 路径：`docs/fullstack/toc.md`
- 预期：不应该有 `order` 字段（可以没有 frontmatter）
- 错误示例：`toc.md` 包含 `order: 2` 应该报错
- 正常情况：`toc.md` 可以完全没有 frontmatter

### 场景 3：fullstack 目录下的 index.md
- 路径：`docs/fullstack/index.md`
- 预期：
  - 不应该有 `order` 字段
  - 必须有 `bookOrder` 字段且 > 0
  - 必须有 `shortTitle` 字段
- 错误示例：
  - 缺少 `bookOrder` 应该报错
  - `bookOrder` 值 ≤ 0 应该报错
  - 缺少 `shortTitle` 应该报错

### 场景 4：fullstack/backend 目录下的 index.md
- 路径：`docs/fullstack/backend/index.md`
- 预期：不需要 `order` 字段，不需要 `bookOrder` 和 `shortTitle`
- 正常情况：可以没有 `order` 字段，可以没有 `bookOrder` 和 `shortTitle`

### 场景 5：fullstack/backend 目录下的 api-design.md
- 路径：`docs/fullstack/backend/api-design.md`
- 预期：必须有 `order` 字段
- 错误示例：缺少 `order` 字段应该报错

### 场景 6：docs 根目录下的 index.md
- 路径：`docs/index.md`
- 预期：不需要 `order` 字段
- 正常情况：可以没有 `order` 字段

## 注意事项

1. **toc.md 可以没有 frontmatter**：验证逻辑需要处理 frontmatter 为 null 的情况
2. **层级判断准确**：只有 docs 根目录的直接子目录（第一层）才需要验证 bookOrder 和 shortTitle
3. **保持向后兼容**：确保不破坏现有的验证逻辑
4. **错误消息清晰**：所有错误消息应包含文件相对路径和具体问题
5. **类型安全**：确保 TypeScript 类型检查通过
6. **测试覆盖**：验证所有场景，包括边界情况
7. **代码可读性**：添加必要的注释说明验证规则

## 预期结果

修改后的验证脚本将：
- ✅ 正确验证 docs 根目录下的直接 .md 文件（不应有 order）
- ✅ 正确验证第一层子目录内的 toc.md 文件（不应有 order，可以没有 frontmatter）
- ✅ 正确验证第一层子目录内的 index.md 文件（不应有 order，必须有 bookOrder > 0 和 shortTitle）
- ✅ 正确验证第二层及更深子目录内的 index.md 文件（不需要 bookOrder 和 shortTitle）
- ✅ 保持对其他文件的现有验证逻辑
- ✅ 提供清晰的错误消息
- ✅ 通过 TypeScript 类型检查
