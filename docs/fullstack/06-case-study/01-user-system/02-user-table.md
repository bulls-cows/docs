---
order: 20
---

# 用户表设计

本文介绍用户管理系统的数据库表设计，包括用户表、角色表及其关联关系。

## 前置知识

- [数据库设计](../../02-backend/03-database.md) - 数据库设计规范

## 用户表（user）

用户表存储用户的基本信息，是系统的核心表之一。

### 表结构

```sql
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码（加密存储）',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `role_id` int(11) NOT NULL DEFAULT '5' COMMENT '角色ID',
  `status` enum('active','inactive','locked') NOT NULL DEFAULT 'active' COMMENT '用户状态',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0' COMMENT '邮箱是否验证',
  `phone_verified` tinyint(1) NOT NULL DEFAULT '0' COMMENT '手机是否验证',
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  UNIQUE KEY `idx_phone` (`phone`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | int | 是 | 自增 | 用户唯一标识 |
| username | varchar(50) | 是 | - | 用户名，唯一 |
| password | varchar(255) | 是 | - | 密码，加密存储 |
| email | varchar(100) | 否 | NULL | 邮箱，唯一 |
| phone | varchar(20) | 否 | NULL | 手机号，唯一 |
| avatar | varchar(255) | 否 | NULL | 头像URL |
| nickname | varchar(50) | 否 | NULL | 昵称 |
| role_id | int | 是 | 5 | 角色ID，默认普通用户 |
| status | enum | 是 | 'active' | 用户状态 |
| email_verified | tinyint | 是 | 0 | 邮箱验证状态 |
| phone_verified | tinyint | 是 | 0 | 手机验证状态 |
| last_login_ip | varchar(45) | 否 | NULL | 最后登录IP |
| last_login_time | datetime | 否 | NULL | 最后登录时间 |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP | 更新时间 |

### 用户状态说明

| 状态 | 值 | 说明 |
|------|------|------|
| 激活 | active | 正常使用 |
| 禁用 | inactive | 禁止登录 |
| 锁定 | locked | 密码错误次数过多 |

## 角色表（role）

角色表定义系统的角色体系。

### 表结构

```sql
CREATE TABLE `role` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `key` varchar(50) NOT NULL COMMENT '角色标识',
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';
```

### 初始数据

```sql
INSERT INTO `role` (`id`, `key`, `name`, `status`, `description`) VALUES
(1, 'super_admin', '超级管理员', 1, '系统最高权限'),
(2, 'admin', '管理员', 1, '后台管理权限'),
(3, 'svip', 'VIP会员', 1, '高级会员权限'),
(4, 'vip', '会员', 1, '普通会员权限'),
(5, 'normal', '普通用户', 1, '基础用户权限'),
(6, 'guest', '游客', 1, '未登录用户');
```

## TypeScript 类型定义

```typescript
// 用户类型
interface User {
  id: number;
  username: string;
  password: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  nickname: string | null;
  role_id: number;
  status: 'active' | 'inactive' | 'locked';
  email_verified: number;
  phone_verified: number;
  last_login_ip: string | null;
  last_login_time: Date | null;
  created_at: Date;
  updated_at: Date;
}

// 角色类型
interface Role {
  id: number;
  key: string;
  name: string;
  status: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

// 用户信息（前端展示）
interface UserInfo {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  nickname: string | null;
  role: string;
  role_name: string;
  status: 'active' | 'inactive' | 'locked';
  email_verified: boolean;
  phone_verified: boolean;
  last_login_ip: string | null;
  last_login_time: string | null;
  created_at: string;
}
```

## 索引设计说明

### 用户表索引

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| PRIMARY | id | 主键 | 用户唯一标识 |
| idx_username | username | 唯一索引 | 用户名唯一性约束 |
| idx_email | email | 唯一索引 | 邮箱唯一性约束 |
| idx_phone | phone | 唯一索引 | 手机号唯一性约束 |
| idx_role_id | role_id | 普通索引 | 角色查询优化 |
| idx_status | status | 普通索引 | 状态筛选优化 |

### 设计要点

1. **唯一性约束**：用户名、邮箱、手机号都需要唯一性约束
2. **查询优化**：角色和状态是常用查询条件，添加索引优化
3. **软删除**：不使用物理删除，通过 status 字段管理状态
4. **安全存储**：密码必须加密存储，使用 bcrypt 等算法

## 相关章节

- [角色与权限](./03-role-permission.md) - 角色权限控制实现
- [认证与授权](./04-authentication.md) - 登录认证流程
