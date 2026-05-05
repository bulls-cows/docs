
# 导航系统

导航系统提供网址收藏和分类管理功能，支持创建个人导航页。

## 核心功能

- **分类管理**：创建和管理网址分类
- **网站管理**：添加、编辑、删除网站链接
- **用户收藏**：用户收藏常用网站
- **排序功能**：自定义分类和网站排序

## 数据库设计

### 分类表（nav_category）

```sql
CREATE TABLE `nav_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `icon` varchar(255) DEFAULT NULL COMMENT '分类图标',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导航分类表';
```

### 网站表（nav_site）

```sql
CREATE TABLE `nav_site` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '网站名称',
  `url` varchar(500) NOT NULL COMMENT '网站URL',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导航网站表';
```

## API 设计

```typescript
// 获取导航列表
// GET /api/nav/categories
interface ReturnApiGetNavCategories {
  list: NavCategory[];
}

// 获取分类下的网站
// GET /api/nav/sites
interface ParamsApiGetNavSites {
  category_id?: number;
}
interface ReturnApiGetNavSites {
  list: NavSite[];
}
```

## 相关章节

- [预约系统](./01-booking.md) - 在线预约
- [相册系统](./03-album.md) - 图片管理
