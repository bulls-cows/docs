---
order: 30
---

# 文章系统

本文介绍文章管理系统的设计与实现，包括文章表设计、CRUD操作和付费阅读功能。

## 前置知识

- [数据库设计](../../backend/database.md) - 数据库表设计规范
- [API设计规范](../../backend/api-design.md) - RESTful API 设计

## 文章表设计

### 文章表（article）

```sql
CREATE TABLE `article` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `title` varchar(200) NOT NULL COMMENT '文章标题',
  `name` varchar(200) NOT NULL COMMENT 'URL标识',
  `abstract` text COMMENT '文章摘要',
  `thumbnail` varchar(400) DEFAULT NULL COMMENT '缩略图URL',
  `views` int(11) NOT NULL DEFAULT '0' COMMENT '浏览量',
  `content` mediumtext COMMENT '完整内容',
  `free_content` mediumtext COMMENT '免费内容',
  `paid_content` mediumtext COMMENT '付费内容',
  `price` int(11) NOT NULL DEFAULT '0' COMMENT '价格（分）',
  `outline` text COMMENT '文章大纲',
  `status` enum('draft','published','deleted') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `top` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否置顶',
  `category_id` int(11) DEFAULT NULL COMMENT '分类ID',
  `source_url` varchar(500) DEFAULT NULL COMMENT '来源URL',
  `source_name` varchar(100) DEFAULT NULL COMMENT '来源名称',
  `publish_date` date DEFAULT NULL COMMENT '发布日期',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_title` (`title`),
  UNIQUE KEY `idx_name` (`name`),
  KEY `idx_status_publish_date` (`status`, `publish_date`),
  KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| title | varchar(200) | 文章标题，唯一 |
| name | varchar(200) | URL标识，用于友好URL |
| abstract | text | 文章摘要 |
| thumbnail | varchar(400) | 缩略图URL |
| views | int | 浏览量 |
| content | mediumtext | 完整内容（免费+付费） |
| free_content | mediumtext | 免费内容，所有用户可见 |
| paid_content | mediumtext | 付费内容，仅付费用户可见 |
| price | int | 价格，单位：分，0表示免费 |
| status | enum | 状态：draft/published/deleted |
| top | tinyint | 是否置顶：0/1 |
| category_id | int | 分类ID |
| publish_date | date | 发布日期 |

### 文章状态说明

| 状态 | 值 | 说明 |
|------|------|------|
| 草稿 | draft | 未发布，仅作者可见 |
| 已发布 | published | 公开可见 |
| 已删除 | deleted | 软删除，不可见 |

## TypeScript 类型定义

```typescript
// 文章类型
interface Article {
  id: number;
  title: string;
  name: string;
  abstract: string | null;
  thumbnail: string | null;
  views: number;
  content: string | null;
  free_content: string | null;
  paid_content: string | null;
  price: number;
  outline: string | null;
  status: 'draft' | 'published' | 'deleted';
  top: number;
  category_id: number | null;
  source_url: string | null;
  source_name: string | null;
  publish_date: string | null;
  created_at: Date;
  updated_at: Date;
}

// 文章列表项（带分类和标签）
interface ArticleListItem extends Article {
  category_name: string | null;
  tags: ArticleTag[];
}

// 文章状态类型
type ArticleStatus = 'draft' | 'published' | 'deleted';
```

## 核心 API 设计

### 获取文章列表

```typescript
// GET /api/articles/articles
interface ParamsApiGetArticleList {
  pageNo: number;
  pageSize: number;
  keyword?: string;
  status?: ArticleStatus;
  top?: number;
}

interface ReturnApiGetArticleList {
  list: ArticleListItem[];
  total: number;
}
```

### 获取文章详情

```typescript
// GET /api/articles/article-info
interface ParamsApiGetArticleInfo {
  id: number;
}

interface ReturnApiGetArticleInfo extends Article {
  category: ArticleCategory | null;
  tags: ArticleTag[];
}
```

### 添加文章

```typescript
// POST /api/articles/add-article
interface ParamsApiAddArticle {
  title: string;
  name: string;
  abstract?: string;
  thumbnail?: string;
  free_content?: string;
  paid_content?: string;
  price?: number;
  outline?: string;
  status: ArticleStatus;
  top?: number;
  category_id: number;
  tag_ids?: number[];
  source_url?: string;
  source_name?: string;
  publish_date: string;
}
```

## 付费阅读实现

### 内容存储策略

```typescript
// 保存文章时，合并免费内容和付费内容
const saveArticle = async (data: ParamsApiAddArticle) => {
  const content = `${data.free_content || ''}\n${data.paid_content || ''}`;
  
  await knex('article').insert({
    ...data,
    content,
  });
};
```

### 内容展示逻辑

```typescript
// 获取文章详情时的内容处理
const getArticleContent = (article: Article, user: User | null) => {
  // 免费文章：返回完整内容
  if (article.price === 0) {
    return {
      free_content: article.free_content,
      paid_content: article.paid_content,
      can_view_paid: true,
    };
  }
  
  // 付费文章：检查用户是否已付费
  if (user && hasPaid(user.id, article.id)) {
    return {
      free_content: article.free_content,
      paid_content: article.paid_content,
      can_view_paid: true,
    };
  }
  
  // 未付费：只返回免费内容
  return {
    free_content: article.free_content,
    paid_content: null,
    can_view_paid: false,
  };
};
```

### 前端展示

```vue
<template>
  <div class="article-content">
    <!-- 免费内容 -->
    <div class="free-content" v-html="article.free_content"></div>
    
    <!-- 付费内容 -->
    <div v-if="canViewPaid" class="paid-content" v-html="article.paid_content"></div>
    
    <!-- 付费提示 -->
    <div v-else class="pay-wall">
      <p>本文需要付费阅读，价格：{{ article.price / 100 }} 元</p>
      <el-button type="primary" @click="handlePay">立即购买</el-button>
    </div>
  </div>
</template>
```

## 业务流程

### 文章创建流程

```text
1. 用户填写文章信息
2. 选择文章分类（必选）
3. 添加文章标签（可选，支持创建新标签）
4. 编辑免费内容
5. 编辑付费内容（可选）
6. 设置文章价格（0表示免费）
7. 设置发布状态（草稿/已发布）
8. 提交保存
```

### 文章编辑流程

```text
1. 加载文章现有数据
2. 用户修改文章信息
3. 可使用AI功能优化内容
4. 提交更新
```

## 相关章节

- [分类与标签](./category-tag.md) - 分类和标签的设计
- [富文本编辑](./rich-text.md) - 富文本编辑器实现
