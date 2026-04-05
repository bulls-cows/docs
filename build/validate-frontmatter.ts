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

function validateFile(filePath: string): Frontmatter {
  const source = fs.readFileSync(filePath, "utf8");
  const frontmatter = extractFrontmatter(source);

  if (!frontmatter) {
    const relativePath = path.relative(DOCS_ROOT, filePath);
    console.error(`✗ File missing frontmatter: ${relativePath}`);
    throw new Error("Validation failed");
  }

  if (frontmatter.order === undefined) {
    const relativePath = path.relative(DOCS_ROOT, filePath);
    console.error(`✗ File missing required frontmatter field: ${relativePath}`);
    console.error(`  Missing field: 'order'`);
    throw new Error("Validation failed");
  }

  return frontmatter;
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
    if (frontmatter.order !== undefined) {
      const files = orderMap.get(frontmatter.order) || [];
      files.push(entry.name);
      orderMap.set(frontmatter.order, files);
    }
    fileCount++;
  }

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
