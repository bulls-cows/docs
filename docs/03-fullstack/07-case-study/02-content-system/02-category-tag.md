
# 分类与标签

本文介绍文章分类和标签的设计与实现，包括表结构设计和关联关系。

## 前置知识

- [数据库设计](../../03-backend/02-database.md) - 数据库表设计规范

## 分类表设计

### 分类表（article_category）

分类支持多级嵌套，最多3级。

```sql
CREATE TABLE `article_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `slug` varchar(100) NOT NULL COMMENT '分类标识',
  `description` varchar(500) DEFAULT NULL COMMENT '分类描述',
  `sort_order` int(11) NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `parent_id` int(11) DEFAULT NULL COMMENT '父分类ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_active_sort` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章分类表';
```

### 分类嵌套规则

1. **最多3级**：分类层级最多为3级
2. **叶子节点关联**：文章只能关联叶子节点分类（没有子分类的分类）
3. **互斥约束**：
   - 如果分类下有子分类，不能关联文章
   - 如果分类下已关联文章，不能创建子分类

### TypeScript 类型定义

```typescript
// 分类类型
interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
  children?: ArticleCategory[]; // 子分类
}

// 树形分类
interface CategoryTree extends ArticleCategory {
  children: CategoryTree[];
}
```

### 分类树形结构构建

```typescript
// 构建分类树
const buildCategoryTree = (categories: ArticleCategory[]): CategoryTree[] => {
  const map = new Map<number, CategoryTree>();
  const roots: CategoryTree[] = [];

  // 创建映射
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // 构建树
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
};

// 获取叶子节点分类
const getLeafCategories = (categories: ArticleCategory[]): number[] => {
  const parentIds = new Set(
    categories.filter((c) => c.parent_id).map((c) => c.parent_id)
  );
  return categories
    .filter((c) => !parentIds.has(c.id))
    .map((c) => c.id);
};
```

## 标签表设计

### 标签表（article_tag）

```sql
CREATE TABLE `article_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` varchar(100) NOT NULL COMMENT '标签名称',
  `slug` varchar(100) NOT NULL COMMENT '标签标识',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  UNIQUE KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章标签表';
```

### 标签关联表（article_tag_relation）

文章和标签的多对多关联中间表。

```sql
CREATE TABLE `article_tag_relation` (
  `article_id` int(11) NOT NULL COMMENT '文章ID',
  `tag_id` int(11) NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`article_id`, `tag_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章标签关联表';
```

### TypeScript 类型定义

```typescript
// 标签类型
interface ArticleTag {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

// 标签关联
interface ArticleTagRelation {
  article_id: number;
  tag_id: number;
}
```

## 核心功能实现

### 添加文章标签关联

```typescript
// 添加文章时，同时添加标签关联
const addArticleWithTags = async (
  article: ParamsApiAddArticle,
  tagIds: number[]
) => {
  const trx = await knex.transaction();

  try {
    // 1. 插入文章
    const [articleId] = await trx('article').insert(article);

    // 2. 插入标签关联
    if (tagIds.length > 0) {
      const relations = tagIds.map((tagId) => ({
        article_id: articleId,
        tag_id: tagId,
      }));
      await trx('article_tag_relation').insert(relations);
    }

    await trx.commit();
    return articleId;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
};
```

### 查询文章标签

```typescript
// 批量查询文章标签（避免N+1查询）
const getArticleTags = async (articleIds: number[]) => {
  const rows = await knex('article_tag_relation as atr')
    .join('article_tag as at', 'atr.tag_id', 'at.id')
    .whereIn('atr.article_id', articleIds)
    .select('atr.article_id', 'at.id', 'at.name', 'at.slug');

  // 按文章ID分组
  const tagMap = new Map<number, ArticleTag[]>();
  rows.forEach((row) => {
    if (!tagMap.has(row.article_id)) {
      tagMap.set(row.article_id, []);
    }
    tagMap.get(row.article_id)!.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
    });
  });

  return tagMap;
};
```

### 标签自动创建

```typescript
// 输入标签时，自动创建不存在的标签
const getOrCreateTags = async (tagNames: string[]): Promise<number[]> => {
  const tagIds: number[] = [];

  for (const name of tagNames) {
    // 查找已存在的标签
    const existing = await knex('article_tag')
      .where('name', name)
      .first();

    if (existing) {
      tagIds.push(existing.id);
    } else {
      // 创建新标签
      const [id] = await knex('article_tag').insert({
        name,
        slug: generateSlug(name),
      });
      tagIds.push(id);
    }
  }

  return tagIds;
};

// 生成 slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');
};
```

## API 设计

### 获取分类列表

```typescript
// GET /api/articles/categories
interface ParamsApiGetCategories {
  is_active?: boolean;
}

interface ReturnApiGetCategories {
  list: CategoryTree[]; // 树形结构
  flat: ArticleCategory[]; // 扁平结构
}
```

### 添加分类

```typescript
// POST /api/articles/add-category
interface ParamsApiAddCategory {
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  parent_id?: number | null;
}
```

### 获取标签列表

```typescript
// GET /api/articles/tags
interface ParamsApiGetTags {
  keyword?: string;
}

interface ReturnApiGetTags {
  list: ArticleTag[];
}
```

## 相关章节

- [文章系统](./01-article.md) - 文章表设计和CRUD操作
- [富文本编辑](./03-rich-text.md) - 富文本编辑器实现
