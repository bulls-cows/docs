
# 文件管理

文件管理系统负责处理用户上传的各类文件，包括图片、文档、视频等。本章介绍文件上传的设计与实现。

## 系统概述

### 核心功能

- **文件上传**：支持多种文件类型上传
- **类型验证**：验证文件类型和大小
- **分片上传**：大文件分片上传
- **权限控制**：文件访问权限管理

## 章节导航

- [文件上传](./02-upload.md) - 文件上传接口、存储策略
- [权限控制](./03-permission.md) - 文件访问权限、临时链接

## 前置知识

- [API设计规范](../../04-backend/04-api-design.md) - RESTful API 设计
- [认证与授权](../../04-backend/05-authentication.md) - 用户认证原理

## 文件存储策略

| 环境 | 存储方式 | 说明 |
|------|---------|------|
| 开发环境 | 本地存储 | 存储在服务器本地目录 |
| 生产环境 | 对象存储 | 如阿里云OSS、腾讯云COS |

## 文件类型限制

```typescript
// 允许的文件类型
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword'],
  video: ['video/mp4', 'video/webm'],
};

// 文件大小限制（字节）
const MAX_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024, // 100MB
};
```
