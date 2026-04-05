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

function validateFile(filePath: string): void {
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
}

function validateDirectory(dirPath: string): number {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let fileCount = 0;

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

    validateFile(absolutePath);
    fileCount++;
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
