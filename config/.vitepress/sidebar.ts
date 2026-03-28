import fs from "node:fs";
import path from "node:path";
import type { DefaultTheme } from "vitepress";

type DocMeta = {
  text: string;
  link: string;
  order: number;
  hidden: boolean;
};

const DOCS_ROOT = path.resolve(__dirname, "../../docs");

function parseFrontmatterValue(rawValue: string): string | number | boolean {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return value;
}

function extractFrontmatter(source: string): Record<string, string | number | boolean> {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }

  const result: Record<string, string | number | boolean> = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    result[key] = parseFrontmatterValue(value);
  }

  return result;
}

function extractHeading(source: string): string | undefined {
  const lines = source.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
}

function prettifyName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toLink(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");

  if (normalized === "index.md") {
    return "/";
  }

  if (normalized.endsWith("/index.md")) {
    return `/${normalized.slice(0, -"index.md".length)}`;
  }

  return `/${normalized.slice(0, -".md".length)}`;
}

function readDocMeta(filePath: string): DocMeta {
  const source = fs.readFileSync(filePath, "utf8");
  const frontmatter = extractFrontmatter(source);
  const relativePath = path.relative(DOCS_ROOT, filePath);
  const filename = path.basename(relativePath, ".md");
  const titleFromFrontmatter = typeof frontmatter.title === "string" ? frontmatter.title : undefined;
  const heading = extractHeading(source);

  return {
    text: titleFromFrontmatter || heading || prettifyName(filename),
    link: toLink(relativePath),
    order: typeof frontmatter.order === "number" ? frontmatter.order : Number.MAX_SAFE_INTEGER,
    hidden: frontmatter.sidebar === false,
  };
}

function sortByOrder<T extends { order: number; text?: string }>(items: T[]): T[] {
  return items.sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return (left.text || '').localeCompare((right.text || ''), "zh-CN");
  });
}

function buildSection(dirPath: string): DefaultTheme.SidebarItem | null {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const fileItems: DocMeta[] = [];
  const childSections: Array<DefaultTheme.SidebarItem & { order: number }> = [];
  let indexMeta: DocMeta | null = null;

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const section = buildSection(absolutePath);
      if (section) {
        childSections.push({
          ...section,
          order: (section as DefaultTheme.SidebarItem & { order?: number }).order ?? Number.MAX_SAFE_INTEGER,
        });
      }
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const meta = readDocMeta(absolutePath);
    if (meta.hidden) {
      continue;
    }

    if (entry.name === "index.md") {
      indexMeta = meta;
      continue;
    }

    fileItems.push(meta);
  }

  const sortedFiles = sortByOrder(fileItems).map(({ text, link }) => ({ text, link }));
  const sortedSections = sortByOrder(childSections).map(({ order: _order, ...section }) => section);
  const items = [
    ...(indexMeta ? [{ text: "前言", link: indexMeta.link }] : []),
    ...sortedFiles,
    ...sortedSections,
  ];

  if (items.length === 0) {
    return null;
  }

  const sectionName = path.basename(dirPath);
  const sectionText = indexMeta?.text || prettifyName(sectionName);
  const sectionOrder = indexMeta?.order ?? Number.MAX_SAFE_INTEGER;

  return {
    text: sectionText,
    collapsed: false,
    items,
    order: sectionOrder,
  } as DefaultTheme.SidebarItem & { order: number };
}

type NavItemWithOrder = DefaultTheme.NavItem & { order: number };

export function buildNav(): DefaultTheme.NavItem[] {
  const entries = fs.readdirSync(DOCS_ROOT, { withFileTypes: true });
  const navItems: NavItemWithOrder[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const indexPath = path.join(DOCS_ROOT, entry.name, "index.md");
    if (!fs.existsSync(indexPath)) {
      continue;
    }

    const source = fs.readFileSync(indexPath, "utf8");
    const frontmatter = extractFrontmatter(source);
    const heading = extractHeading(source);

    const text =
      typeof frontmatter.shortTitle === "string" && frontmatter.shortTitle
        ? frontmatter.shortTitle
        : heading || prettifyName(entry.name);

    navItems.push({
      text,
      link: `/${entry.name}/`,
      order: typeof frontmatter.bookOrder === "number" ? frontmatter.bookOrder : 0,
    });
  }

  return sortByOrder(navItems).map(({ order: _order, ...item }) => item);
}

export function buildSidebar(): DefaultTheme.Sidebar {
  const entries = fs.readdirSync(DOCS_ROOT, { withFileTypes: true });
  const sidebar: DefaultTheme.Sidebar = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dirPath = path.join(DOCS_ROOT, entry.name);
    const section = buildSection(dirPath);

    if (section) {
      const { order: _order, ...sidebarSection } = section as DefaultTheme.SidebarItem & { order?: number };
      sidebar[`/${entry.name}/`] = [sidebarSection];
    }
  }

  return sidebar;
}
