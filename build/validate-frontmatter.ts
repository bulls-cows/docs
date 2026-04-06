import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "../docs");

interface Frontmatter {
  order?: number;
  bookOrder?: number;
  shortTitle?: string;
  [key: string]: unknown;
}

interface FrontmatterExtractResult {
  frontmatter: Frontmatter | null;
  match: RegExpMatchArray | null;
}

/**
 * 从 Markdown 源码中提取 YAML frontmatter
 * @param source - Markdown 文件内容
 * @returns 解析结果，包含 frontmatter 对象和原始匹配信息
 */
function extractFrontmatter(source: string): FrontmatterExtractResult {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return { frontmatter: null, match: null };
  }

  try {
    const parsed = yaml.load(match[1]) as Frontmatter;
    return { frontmatter: parsed, match };
  } catch {
    return { frontmatter: null, match };
  }
}

/**
 * 检查 frontmatter 是否为空
 * @param frontmatter - frontmatter 对象
 * @returns 是否为空 frontmatter
 */
function isEmptyFrontmatter(frontmatter: Frontmatter | null): boolean {
  if (!frontmatter) {
    return true;
  }
  return Object.keys(frontmatter).length === 0;
}

/**
 * 移除文件中的空 frontmatter
 * @param filePath - 文件绝对路径
 * @param match - 正则匹配结果
 */
function removeEmptyFrontmatter(filePath: string, match: RegExpMatchArray): void {
  const source = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(DOCS_ROOT, filePath);

  // 移除 frontmatter 块，保留后面的内容
  const newContent = source.slice(match[0]!.length).replace(/^\r?\n/, "");

  fs.writeFileSync(filePath, newContent, "utf8");
  console.log(`✓ Removed empty frontmatter from: ${relativePath}`);
}

/**
 * 验证单个 Markdown 文件的 frontmatter
 *
 * 验证规则：
 * - docs 根目录下的直接 .md 文件（非 index.md）：不应该有 order 字段
 * - 第一层子目录内的 toc.md：不应该有 order 字段（可以没有 frontmatter）
 * - 第一层子目录内的 index.md：不应该有 order 字段，必须有 bookOrder > 0 和 shortTitle
 * - 其他 index.md 文件：不需要 order 字段
 * - 其他文件：必须有 order 字段
 * - 空 frontmatter（无任何字段）会被自动移除
 *
 * @param filePath - 文件绝对路径
 * @param parentDirPath - 父目录绝对路径
 * @param isFirstLevelSubdir - 是否在 docs 根目录的直接子目录层级
 * @returns 解析后的 frontmatter 对象
 * @throws 若 frontmatter 验证失败则抛出错误
 */
function validateFile(
  filePath: string,
  parentDirPath: string,
  isFirstLevelSubdir: boolean
): Frontmatter {
  const source = fs.readFileSync(filePath, "utf8");
  const { frontmatter, match } = extractFrontmatter(source);
  const filename = path.basename(filePath);
  const relativePath = path.relative(DOCS_ROOT, filePath);
  const isRootLevel = parentDirPath === DOCS_ROOT;

  // 检测并移除空 frontmatter
  if (match && isEmptyFrontmatter(frontmatter)) {
    removeEmptyFrontmatter(filePath, match);
    // 移除后返回空对象
    return {};
  }

  // 规则 A：docs 根目录下的直接 .md 文件（非 index.md）不应该有 order 字段
  if (isRootLevel && filename !== "index.md") {
    if (frontmatter && frontmatter.order !== undefined) {
      console.error(`✗ File should not have 'order' field in root level: ${relativePath}`);
      throw new Error("Validation failed");
    }
    return frontmatter || {};
  }

  // 规则 B：第一层子目录内的 toc.md 不应该有 order 字段（可以没有 frontmatter）
  if (isFirstLevelSubdir && filename === "toc.md") {
    if (frontmatter && frontmatter.order !== undefined) {
      console.error(`✗ toc.md should not have 'order' field: ${relativePath}`);
      throw new Error("Validation failed");
    }
    return frontmatter || {};
  }

  // 规则 C：第一层子目录内的 index.md 不应该有 order 字段，必须有 bookOrder > 0 和 shortTitle
  if (isFirstLevelSubdir && filename === "index.md") {
    if (!frontmatter) {
      console.error(`✗ File missing frontmatter: ${relativePath}`);
      throw new Error("Validation failed");
    }

    if (frontmatter.order !== undefined) {
      console.error(`✗ index.md should not have 'order' field: ${relativePath}`);
      throw new Error("Validation failed");
    }

    if (frontmatter.bookOrder === undefined || frontmatter.bookOrder <= 0) {
      console.error(`✗ index.md missing required field 'bookOrder' (must be > 0): ${relativePath}`);
      throw new Error("Validation failed");
    }

    if (frontmatter.shortTitle === undefined) {
      console.error(`✗ index.md missing required field 'shortTitle': ${relativePath}`);
      throw new Error("Validation failed");
    }

    return frontmatter;
  }

  // 规则 D：其他文件（保持原有逻辑）
  // index.md 文件：可以没有 frontmatter，或者有 frontmatter 但不需要 order 字段
  if (filename === "index.md") {
    return frontmatter || {};
  }

  // 其他文件：必须有 frontmatter 和 order 字段
  if (!frontmatter) {
    console.error(`✗ File missing frontmatter: ${relativePath}`);
    throw new Error("Validation failed");
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
 * 1. docs 根目录下的直接 .md 文件（非 index.md）：不应该有 order 字段
 * 2. 第一层子目录内的 toc.md：不应该有 order 字段（可以没有 frontmatter）
 * 3. 第一层子目录内的 index.md：不应该有 order 字段，必须有 bookOrder > 0 和 shortTitle
 * 4. 其他 index.md 文件：不需要 order 字段
 * 5. 其他文件：必须有 order 字段
 * 6. 同一目录下的文件 order 值不能重复
 *
 * @param dirPath - 目录绝对路径
 * @param isFirstLevelSubdir - 是否在 docs 根目录的直接子目录层级
 * @returns 已验证的文件数量
 * @throws 若验证失败则抛出错误
 */
function validateDirectory(
  dirPath: string,
  isFirstLevelSubdir: boolean = false
): number {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  let fileCount = 0;
  // 收集同级目录下所有文件的 order 值，用于检测重复
  const orderMap = new Map<number, string[]>();

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // 判断子目录是否是 docs 根目录的直接子目录
      const parentDir = path.dirname(absolutePath);
      const isSubdirFirstLevel = parentDir === DOCS_ROOT;
      fileCount += validateDirectory(absolutePath, isSubdirFirstLevel);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    if (entry.name.startsWith(".")) {
      continue;
    }

    const frontmatter = validateFile(absolutePath, dirPath, isFirstLevelSubdir);

    // 检查 order 值重复（只检查有 order 字段的文件）
    if (frontmatter.order !== undefined) {
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
