
# 认证与授权

本文介绍用户登录认证、Token管理和权限验证的实现方式。

## 前置知识

- [认证与授权](../../04-backend/05-authentication.md) - 认证授权原理
- [API设计规范](../../04-backend/04-api-design.md) - 接口设计规范

## 登录流程

### 登录流程图

```text
用户输入账密
    ↓
验证账密格式
    ↓
查询用户信息
    ↓
验证密码正确性
    ↓
检查用户状态
    ↓
生成 Token
    ↓
更新登录信息
    ↓
返回用户信息和 Token
```

### 登录接口实现

```typescript
// src/controllers/auth.mts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByUsername } from '#services/user';
import { JWT_SECRET } from '#scripts/ConfigUtils';

export const cLogin: ExpressRequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1. 查询用户信息
    const user = await getUserByUsername(username);
    if (!user) {
      res.fail('用户名或密码错误');
      return;
    }

    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.fail('用户名或密码错误');
      return;
    }

    // 3. 检查用户状态
    if (user.status !== 'active') {
      res.fail('账号已被禁用或锁定');
      return;
    }

    // 4. 生成 Token
    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. 更新登录信息
    await updateUserLoginInfo(user.id, {
      last_login_ip: req.ip,
      last_login_time: new Date(),
    });

    // 6. 返回结果
    const userInfo: ReturnApiLogin = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      nickname: user.nickname,
      role: user.role_key,
      token,
    };

    res.success(userInfo, '登录成功');
  } catch (err) {
    next(err);
  }
};
```

### 登录参数验证

```typescript
// src/controllers/auth.mts

import { z } from 'zod';

export const sLogin = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50),
  password: z.string().min(6, '密码至少6个字符').max(100),
});
```

## Token 管理

### Token 结构

```typescript
// Token 载荷结构
interface TokenPayload {
  userId: number;
  roleId: number;
  iat: number; // 签发时间
  exp: number; // 过期时间
}

// Token 响应
interface TokenResponse {
  token: string;
  expiresIn: number; // 过期时间（秒）
}
```

### Token 中间件

```typescript
// src/middlewares/userMiddleware.mts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '#scripts/ConfigUtils';
import { getUserById } from '#services/user';

/**
 * 用户信息中间件
 * 解析 Token 并将用户信息挂载到 req.user
 */
export const userMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 从请求头获取 Token
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.user = undefined;
      next();
      return;
    }

    try {
      // 验证 Token
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // 查询用户信息
      const user = await getUserById(payload.userId);

      if (user && user.status === 'active') {
        req.user = user;
      } else {
        req.user = undefined;
      }
    } catch (err) {
      req.user = undefined;
    }

    next();
  };
};
```

### Token 刷新

```typescript
// src/controllers/auth.mts

export const cRefreshToken: ExpressRequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      res.fail('请先登录', 401);
      return;
    }

    // 生成新 Token
    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.success({ token }, 'Token 刷新成功');
  } catch (err) {
    next(err);
  }
};
```

## 权限验证中间件

### 中间件使用方式

```typescript
// 方式一：要求登录，允许所有角色
router.get('/profile', userMiddleware(), authMiddleware(), cGetProfile);

// 方式二：允许未登录用户访问
router.get('/public', userMiddleware(), authMiddleware([]), cGetPublicData);

// 方式三：仅允许指定角色访问
router.delete(
  '/users/:id',
  userMiddleware(),
  authMiddleware([ROLE_SUPER_ADMIN, ROLE_ADMIN]),
  cDeleteUser
);
```

### 中间件实现

```typescript
// src/middlewares/authMiddleware.mts

import { Request, Response, NextFunction } from 'express';
import { ROLE_SUPER_ADMIN } from '#scripts/ConstantUtils';

/**
 * 权限验证中间件
 */
export const authMiddleware = (allowedRoles?: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // 允许未登录用户访问
    if (allowedRoles && allowedRoles.length === 0) {
      next();
      return;
    }

    // 要求用户登录
    if (!user) {
      res.fail('请先登录', 401);
      return;
    }

    // 超级管理员拥有所有权限
    if (user.role_id === ROLE_SUPER_ADMIN) {
      next();
      return;
    }

    // 检查角色权限
    if (allowedRoles && !allowedRoles.includes(user.role_id)) {
      res.fail('权限不足', 403);
      return;
    }

    next();
  };
};
```

## 密码安全

### 密码加密

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// 密码加密
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// 密码验证
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
```

### 密码强度验证

```typescript
// 密码强度验证规则
export const sPassword = z
  .string()
  .min(8, '密码至少8个字符')
  .max(100, '密码最多100个字符')
  .regex(/[a-z]/, '密码必须包含小写字母')
  .regex(/[A-Z]/, '密码必须包含大写字母')
  .regex(/[0-9]/, '密码必须包含数字');
```

## 安全最佳实践

### Token 安全

1. **HTTPS 传输**：Token 必须通过 HTTPS 传输
2. **短期有效**：设置合理的过期时间（如 7 天）
3. **安全存储**：前端将 Token 存储在 localStorage 或 sessionStorage
4. **定期刷新**：提供 Token 刷新接口

### 登录安全

1. **登录限流**：限制登录尝试次数，防止暴力破解
2. **状态检查**：登录前检查用户状态
3. **日志记录**：记录登录日志，包括 IP、时间等
4. **异常告警**：异常登录行为告警

### 权限控制

1. **最小权限原则**：只授予必要的权限
2. **角色分层**：按角色分层管理权限
3. **接口鉴权**：所有敏感接口都需要权限验证
4. **前后端一致**：前端路由权限与后端接口权限保持一致

## 相关章节

- [用户表设计](./02-user-table.md) - 用户表结构设计
- [角色与权限](./03-role-permission.md) - 角色权限控制
