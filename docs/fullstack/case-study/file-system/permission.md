---
order: 60
---

# 权限控制

本文介绍文件访问权限的设计与实现，包括访问权限验证和临时链接生成。

## 前置知识

- [认证与授权](../../backend/authentication.md) - 用户认证原理

## 权限模型

### 文件权限类型

| 权限 | 说明 |
|------|------|
| public | 公开文件，所有人可访问 |
| private | 私有文件，仅上传者可访问 |
| protected | 受保护文件，需特定权限访问 |

### 数据库设计

```sql
ALTER TABLE `file` ADD COLUMN `access_level` enum('public','private','protected')
  NOT NULL DEFAULT 'public' COMMENT '访问权限';
ALTER TABLE `file` ADD COLUMN `allowed_roles` varchar(255) DEFAULT NULL
  COMMENT '允许访问的角色（protected时有效）';
```

## 访问权限验证

### 文件访问中间件

```typescript
export const fileAccessMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const fileId = req.params.id;
    const user = req.user;

    try {
      // 查询文件信息
      const file = await knex('file').where({ id: fileId }).first();

      if (!file) {
        res.status(404).send('File not found');
        return;
      }

      // 检查访问权限
      if (file.access_level === 'public') {
        next();
        return;
      }

      if (file.access_level === 'private') {
        if (!user || user.id !== file.user_id) {
          res.status(403).send('Access denied');
          return;
        }
        next();
        return;
      }

      if (file.access_level === 'protected') {
        if (!user) {
          res.status(401).send('Unauthorized');
          return;
        }

        const allowedRoles = JSON.parse(file.allowed_roles || '[]');
        if (!allowedRoles.includes(user.role_id)) {
          res.status(403).send('Access denied');
          return;
        }
        next();
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
```

## 临时链接

### 生成临时链接

```typescript
import jwt from 'jsonwebtoken';

const FILE_TOKEN_SECRET = process.env.FILE_TOKEN_SECRET || 'your-secret-key';
const FILE_TOKEN_EXPIRES = 3600; // 1小时

export const generateFileToken = (fileId: number, userId: number): string => {
  return jwt.sign(
    { fileId, userId },
    FILE_TOKEN_SECRET,
    { expiresIn: FILE_TOKEN_EXPIRES }
  );
};

export const verifyFileToken = (token: string): { fileId: number; userId: number } | null => {
  try {
    return jwt.verify(token, FILE_TOKEN_SECRET) as { fileId: number; userId: number };
  } catch {
    return null;
  }
};

// API: 生成临时下载链接
export const cGenerateFileLink: ExpressRequestHandler = async (req, res, next) => {
  try {
    const { file_id } = req.body;
    const user = req.user;

    if (!user) {
      res.fail('请先登录', 401);
      return;
    }

    // 验证文件权限
    const file = await knex('file').where({ id: file_id }).first();
    if (!file) {
      res.fail('文件不存在');
      return;
    }

    if (file.access_level !== 'public' && file.user_id !== user.id) {
      res.fail('无权访问此文件', 403);
      return;
    }

    // 生成临时令牌
    const token = generateFileToken(file_id, user.id);

    res.success({
      url: `/api/files/download/${file_id}?token=${token}`,
      expires_in: FILE_TOKEN_EXPIRES,
    });
  } catch (err) {
    next(err);
  }
};
```

### 临时链接验证

```typescript
export const fileTokenMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token as string;

    if (!token) {
      res.status(401).send('Token required');
      return;
    }

    const decoded = verifyFileToken(token);
    if (!decoded) {
      res.status(401).send('Invalid or expired token');
      return;
    }

    // 验证文件ID匹配
    const fileId = parseInt(req.params.id);
    if (decoded.fileId !== fileId) {
      res.status(403).send('Token does not match file');
      return;
    }

    next();
  };
};
```

## 文件下载

```typescript
export const cDownloadFile: ExpressRequestHandler = async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id);
    const user = req.user;

    // 查询文件
    const file = await knex('file').where({ id: fileId }).first();

    if (!file) {
      res.status(404).send('File not found');
      return;
    }

    // 权限检查
    if (file.access_level === 'private') {
      if (!user || user.id !== file.user_id) {
        res.status(403).send('Access denied');
        return;
      }
    }

    // 发送文件
    res.download(file.path, file.original_name);
  } catch (err) {
    next(err);
  }
};
```

## 相关章节

- [文件上传](./upload.md) - 文件上传实现
