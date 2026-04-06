import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "../docs");

interface Frontmatter {
  order?: number;
  [key: string]: unknown;
}

/**
 * 从 Markdown 源码中提取 YAML frontmatter
 * @param source - Markdown 文件内容
 * @returns 解析后的 frontmatter 对象，若无 frontmatter 或解析失败则返回 null
 */
function extractFrontmatter(source: string): Frontmatter | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }

  try {
    const parsed = yaml.load(match[1]) as Frontmatter;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 验证单个 Markdown 文件的 frontmatter
 *
 * 验证规则：
 * - index.md 文件不需要 order 字段（固定为目录第一个）
 * - 书籍根目录下的 toc.md 不需要 order 字段（固定为第二个）
 * - 其他文件必须有 order 字段
 *
 * @param filePath - 文件绝对路径
 * @param isBookRoot - 是否为书籍根目录
 * @returns 解析后的 frontmatter 对象
 * @throws 若 frontmatter 不存在或缺少 order 字段则抛出错误
 */
function validateFile(filePath: string, isBookRoot: boolean): Frontmatter {
  const source = fs.readFileSync(filePath, "utf8");
  const frontmatter = extractFrontmatter(source);
  const filename = path.basename(filePath);
  const relativePath = path.relative(DOCS_ROOT, filePath);

  if (!frontmatter) {
    console.error(`✗ File missing frontmatter: ${relativePath}`);
    throw new Error("Validation failed");
  }

  // index.md 文件不需要 order 字段，固定为目录第一个
  if (filename === "index.md") {
    return frontmatter;
  }

  // 书籍根目录下的 toc.md 不需要 order 字段，固定为第二个
  if (filename === "toc.md" && isBookRoot) {
    return frontmatter;
  }

  if (frontmatter.order === undefined) {
    console.error(`✗ File missing required frontmatter field: ${relativePath}`);
    console.error(`  Missing field: 'order'`);
    throw new Error("Validation failed");
  }

  return frontmatter;
}

/**
 * 递归验证目录下所有 Markdown 文件的 frontmatter
 *
 * 验证规则：
 * 1. 每个文件必须包含 frontmatter
 * 2. index.md 文件不需要 order 字段
 * 3. 书籍根目录下的 toc.md 不需要 order 字段
 * 4. 其他文件必须有 order 字段
 * 5. 同一目录下的文件 order 值不能重复
 *
 * @param dirPath - 目录绝对路径
 * @returns 已验证的文件数量
 * @throws 若验证失败则抛出错误
 */
function validateDirectory(dirPath: string): number {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // 判断是否为书籍根目录：存在 toc.md 文件
  const isBookRoot = entries.some((entry) => entry.isFile() && entry.name === "toc.md");

  let fileCount = 0;
  // 收集同级目录下所有文件的 order 值，用于检测重复（index.md 和书籍根目录的 toc.md 不参与）
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

    const frontmatter = validateFile(absolutePath, isBookRoot);

    // index.md 和书籍根目录的 toc.md 不需要 order，也不参与重复检查
    const shouldCheckOrder = entry.name !== "index.md" && !(entry.name === "toc.md" && isBookRoot);
    if (shouldCheckOrder && frontmatter.order !== undefined) {
      const files = orderMap.get(frontmatter.order) || [];
      files.push(entry.name);
      orderMap.set(frontmatter.order, files);
    }
    fileCount++;
  }

  // 检查同级目录下 order 值是否重复
  for (const [order, files] of orderMap) {
    if (files.length > 1) {
      const relativeDir = path.relative(DOCS_ROOT, dirPath);
      console.error(`✗ Duplicate 'order' value found in directory: ${relativeDir || "."}`);
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

/**
 * 程序入口函数
 * 执行 frontmatter 验证并输出结果
 */
const main = () => {
  try {
    const fileCount = validateDirectory(DOCS_ROOT);
    console.log(`✓ Validated ${fileCount} markdown files`);
    console.log(`✓ All files have required frontmatter fields`);
    process.exit(0);
  } catch (error) {
    console.error(`✗ Validation failed`);
    process.exit(1);
  }
};

main();
