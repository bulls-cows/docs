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
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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
 * 从文件名或文件夹名提取两位数前缀作为排序号
 * 支持格式: "01-filename.md", "02-foldername"
 * @param name - 不含路径的文件名（不含扩展名）或文件夹名
 * @returns 排序号，默认为 Number.MAX_SAFE_INTEGER
 */
function extractOrderFromFilename(name: string): number {
  const match = name.match(/^(\d{2})-/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return Number.MAX_SAFE_INTEGER;
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
  const titleFromFrontmatter =
    typeof frontmatter.title === "string" ? frontmatter.title : undefined;
  const heading = extractHeading(source);

  return {
    text: titleFromFrontmatter || heading || prettifyName(filename),
    link: toLink(relativePath),
    order: extractOrderFromFilename(filename),
    hidden: frontmatter.sidebar === false,
  };
}

/**
 * 按文件名两位数前缀排序，order 相同时按文本排序
 * @param items - 待排序的项数组
 * @returns 排序后的数组
 */
function sortByOrder<T extends { order: number; text?: string }>(items: T[]): T[] {
  return items.sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return (left.text || "").localeCompare(right.text || "", "zh-CN");
  });
}

/**
 * 递归构建侧边栏区块
 *
 * 处理逻辑：
 * 1. 判断是否为书籍根目录（存在 toc.md 文件）
 * 2. 书籍根目录：index.md 显示为"前言"，toc.md 显示为"目录"，固定排在前两位
 * 3. 子目录：index.md 作为区块标题，toc.md 被过滤
 * 4. 递归处理子目录
 * 5. 按 order 排序后返回侧边栏配置
 *
 * @param dirPath - 目录绝对路径
 * @returns 侧边栏区块配置，若目录为空则返回 null
 */
function buildSection(dirPath: string): DefaultTheme.SidebarItem | null {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // 判断是否为书籍根目录：存在 toc.md 文件
  const isBookRoot = entries.some((entry) => entry.isFile() && entry.name === "toc.md");

  const fileItems: DocMeta[] = [];
  const childSections: Array<DefaultTheme.SidebarItem & { order: number }> = [];
  let indexMeta: DocMeta | null = null;
  let tocMeta: DocMeta | null = null;

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    // 递归处理子目录
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) {
        continue;
      }
      const section = buildSection(absolutePath);
      if (section) {
        childSections.push({
          ...section,
          order: extractOrderFromFilename(entry.name),
        });
      }
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    if (entry.name.startsWith("_")) {
      continue;
    }

    const meta = readDocMeta(absolutePath);
    if (meta.hidden) {
      continue;
    }

    // 书籍根目录特殊处理
    if (isBookRoot) {
      if (entry.name === "index.md") {
        indexMeta = meta;
        continue;
      }
      // toc.md 显示为"目录"
      if (entry.name === "toc.md") {
        tocMeta = { ...meta, text: "目录" };
        continue;
      }
    } else {
      // 子目录：index.md 作为区块标题，toc.md 被过滤
      if (entry.name === "index.md") {
        indexMeta = meta;
        continue;
      }
      if (entry.name === "toc.md") {
        continue;
      }
    }

    fileItems.push(meta);
  }

  // 书籍根目录：前言和目录固定在前两位
  const items: DefaultTheme.SidebarItem[] = [];
  if (isBookRoot) {
    if (indexMeta) {
      items.push({ text: "前言", link: indexMeta.link });
    }
    if (tocMeta) {
      items.push({ text: tocMeta.text, link: tocMeta.link });
    }
    // 书籍根目录：将其他独立文件和子目录合并，统一按 order 排序，不区分类型
    const allItems = [...fileItems, ...childSections];
    const sortedAllItems = sortByOrder(allItems).map((item) => {
      if ("order" in item) {
        const { order: _order, ...rest } = item;
        return rest;
      }
      return item;
    });
    items.push(...sortedAllItems);
  } else {
    // 非根目录：文件和子目录合并，统一按 order 排序
    const allItems = [...fileItems, ...childSections];
    const sortedAllItems = sortByOrder(allItems).map((item) => {
      if ("order" in item) {
        const { order: _order, ...rest } = item;
        return rest;
      }
      return item;
    });
    items.push(...sortedAllItems);
  }

  // 如果没有 index.md 且没有任何子项，返回 null
  if (!indexMeta && items.length === 0) {
    return null;
  }

  const sectionName = path.basename(dirPath);
  const sectionText = indexMeta?.text || prettifyName(sectionName);
  const sectionOrder = indexMeta?.order ?? Number.MAX_SAFE_INTEGER;

  // 构建章节配置
  const result: DefaultTheme.SidebarItem & { order: number } = {
    text: sectionText,
    // 书籍根目录默认展开，非根目录默认折叠
    collapsed: !isBookRoot,
    order: sectionOrder,
  };

  // 非根目录：如果有 index.md，添加 link 属性使章节标题可点击跳转
  // 书籍根目录：不设置 link，保持为纯目录
  if (indexMeta && !isBookRoot) {
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
  const navItems: NavItemWithOrder[] = [
    { text: "官网", link: "https://www.verysites.com/", order: 0 },
  ];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith("_")) {
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
      order: extractOrderFromFilename(entry.name),
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

    if (entry.name.startsWith("_")) {
      continue;
    }

    const dirPath = path.join(DOCS_ROOT, entry.name);
    const section = buildSection(dirPath);

    if (section) {
      const { order: _order, ...sidebarSection } = section as DefaultTheme.SidebarItem & {
        order?: number;
      };
      sidebar[`/${entry.name}/`] = [sidebarSection];
    }
  }

  return sidebar;
}
