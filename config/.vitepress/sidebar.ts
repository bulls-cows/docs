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

/**
 * 解析 frontmatter 字段值为具体类型
 * 支持字符串、数字、布尔值类型
 * @param rawValue - 原始字段值字符串
 * @returns 解析后的值
 */
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

/**
 * 从 Markdown 源码中提取 frontmatter
 * @param source - Markdown 文件内容
 * @returns 解析后的 frontmatter 键值对对象
 */
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

/**
 * 从 Markdown 源码中提取一级标题
 * @param source - Markdown 文件内容
 * @returns 一级标题文本，若无则返回 undefined
 */
function extractHeading(source: string): string | undefined {
  const lines = source.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
}

/**
 * 将文件名转换为可读标题
 * 将连字符和下划线替换为空格，并首字母大写
 * @param name - 原始文件名
 * @returns 格式化后的标题
 */
function prettifyName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * 将文件相对路径转换为 VitePress 链接
 * @param relativePath - 相对于 docs 目录的路径
 * @returns VitePress 格式的链接路径
 */
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

/**
 * 读取单个 Markdown 文档的元数据
 * @param filePath - 文件绝对路径
 * @returns 文档元数据对象
 */
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

/**
 * 按 order 字段排序，order 相同时按文本排序
 * @param items - 待排序的项数组
 * @returns 排序后的数组
 */
function sortByOrder<T extends { order: number; text?: string }>(items: T[]): T[] {
  return items.sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return (left.text || '').localeCompare((right.text || ''), "zh-CN");
  });
}

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
function buildSection(dirPath: string): DefaultTheme.SidebarItem | null {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const fileItems: DocMeta[] = [];
  const childSections: Array<DefaultTheme.SidebarItem & { order: number }> = [];
  let indexMeta: DocMeta | null = null;

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    // 递归处理子目录
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

    // 单独处理 index.md，作为区块标题
    if (entry.name === "index.md") {
      indexMeta = meta;
      continue;
    }

    fileItems.push(meta);
  }

  // 合并并排序：文件 -> 子目录
  const sortedFiles = sortByOrder(fileItems).map(({ text, link }) => ({ text, link }));
  const sortedSections = sortByOrder(childSections).map(({ order: _order, ...section }) => section);
  const items = [...sortedFiles, ...sortedSections];

  // 如果没有 index.md 且没有任何子项，返回 null
  if (!indexMeta && items.length === 0) {
    return null;
  }

  const sectionName = path.basename(dirPath);
  const sectionText = indexMeta?.text || prettifyName(sectionName);
  const sectionOrder = indexMeta?.order ?? Number.MAX_SAFE_INTEGER;

  // 构建章节配置：点击章节标题直接跳转到 index.md
  const result: DefaultTheme.SidebarItem & { order: number } = {
    text: sectionText,
    collapsed: true,
    order: sectionOrder,
  };

  // 如果有 index.md，添加 link 属性使章节标题可点击跳转
  if (indexMeta) {
    result.link = indexMeta.link;
  }

  // 如果有其他子项（文件或子目录），添加 items
  if (items.length > 0) {
    result.items = items;
  }

  return result;
}

type NavItemWithOrder = DefaultTheme.NavItem & { order: number };

/**
 * 构建顶部导航栏
 * 遍历 docs 目录下的所有子目录，提取 index.md 中的元数据
 * @returns 导航栏配置数组
 */
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

/**
 * 构建完整侧边栏配置
 * 为每个一级目录生成独立的侧边栏
 * @returns VitePress 侧边栏配置对象
 */
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
