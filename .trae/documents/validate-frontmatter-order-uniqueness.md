# 计划：为 validate-frontmatter.ts 添加同级目录 order 唯一性校验

## 目标

修改 `build/validate-frontmatter.ts` 脚本，添加验证逻辑：同一目录下同层级的多个 .md 文档，其 frontmatter 中的 `order` 值不可相同。

## 当前代码分析

现有脚本功能：
1. 递归遍历 `docs/` 目录下的所有 `.md` 文件
2. 提取并解析每个文件的 YAML frontmatter
3. 验证 frontmatter 是否存在
4. 验证 `order` 字段是否存在

## 实现步骤

### 步骤 1：修改 `validateDirectory` 函数

**修改内容：**
- 在遍历目录时，收集当前目录下所有 `.md` 文件的 `order` 值
- 使用 `Map<string, string>` 结构记录 `order` 值与对应文件的映射关系
- 遍历完成后，检查是否存在重复的 `order` 值

**实现逻辑：**
```typescript
function validateDirectory(dirPath: string): number {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let fileCount = 0;
  const orderMap = new Map<number, string[]>();  // order -> 文件路径列表

  for (const entry of entries) {
    // ... 现有的目录递归逻辑
  }

  // 新增：检查同级目录下 order 是否重复
  for (const [order, files] of orderMap) {
    if (files.length > 1) {
      // 输出错误信息，列出所有冲突文件
      throw new Error("Validation failed");
    }
  }

  return fileCount;
}
```

### 步骤 2：修改 `validateFile` 函数

**修改内容：**
- 将返回类型从 `void` 改为 `Frontmatter | null`
- 返回解析后的 frontmatter 对象，供 `validateDirectory` 收集 order 值

### 步骤 3：添加重复检测逻辑

**错误输出格式：**
```
✗ Duplicate 'order' value found in directory: path/to/dir
  Order value: 1
  Conflicting files:
    - file1.md
    - file2.md
```

## 修改后的代码结构

```typescript
function validateFile(filePath: string): Frontmatter | null {
  // 返回 frontmatter 对象
}

function validateDirectory(dirPath: string): number {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let fileCount = 0;
  const orderMap = new Map<number, string[]>();

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      fileCount += validateDirectory(absolutePath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    if (entry.name.startsWith(".")) {
      continue;
    }

    const frontmatter = validateFile(absolutePath);
    if (frontmatter && frontmatter.order !== undefined) {
      const files = orderMap.get(frontmatter.order) || [];
      files.push(entry.name);
      orderMap.set(frontmatter.order, files);
    }
    fileCount++;
  }

  // 检查同级目录 order 重复
  for (const [order, files] of orderMap) {
    if (files.length > 1) {
      const relativeDir = path.relative(DOCS_ROOT, dirPath);
      console.error(`✗ Duplicate 'order' value found in directory: ${relativeDir || '.'}`);
      console.error(`  Order value: ${order}`);
      console.error(`  Conflicting files:`);
      for (const file of files) {
        console.error(`    - ${file}`);
      }
      throw new Error("Validation failed");
    }
  }

  return fileCount;
}
```

## 验证方式

修改完成后执行：
```bash
npm run lint
npm run docs:build
```

确保类型检查通过，构建成功。
