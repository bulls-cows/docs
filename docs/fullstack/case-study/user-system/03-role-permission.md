---
order: 30
---

# 角色与权限

本文介绍角色体系设计和权限控制的实现方式。

## 前置知识

- [认证与授权](../../backend/authentication.md) - 认证授权原理
- [API设计规范](../../backend/api-design.md) - 接口设计规范

## 角色体系设计

### 角色层级

```text
超级管理员 (super_admin)
    └── 管理员 (admin)
            └── VIP会员 (svip)
                    └── 会员 (vip)
                            └── 普通用户 (normal)
                                    └── 游客 (guest)
```

### 角色权限矩阵

| 功能 | 超级管理员 | 管理员 | VIP会员 | 会员 | 普通用户 | 游客 |
|------|:----------:|:------:|:-------:|:----:|:--------:|:----:|
| 后台访问 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 用户管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 内容管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 付费内容 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 个人中心 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 角色常量定义

```typescript
// src/scripts/ConstantUtils.mts

// 角色ID常量
export const ROLE_SUPER_ADMIN = 1;
export const ROLE_ADMIN = 2;
export const ROLE_SVIP = 3;
export const ROLE_VIP = 4;
export const ROLE_NORMAL = 5;
export const ROLE_GUEST = 6;

// 角色标识常量
export const ROLE_KEY = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SVIP: 'svip',
  VIP: 'vip',
  NORMAL: 'normal',
  GUEST: 'guest',
} as const;

// 角色名称映射
export const ROLE_NAME: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  svip: 'VIP会员',
  vip: '会员',
  normal: '普通用户',
  guest: '游客',
};
```

## 权限控制实现

### 权限中间件

```typescript
// src/middlewares/authMiddleware.mts

import { Request, Response, NextFunction } from 'express';
import { ROLE_SUPER_ADMIN } from '#scripts/ConstantUtils';

/**
 * 权限验证中间件
 * @param allowedRoles 允许访问的角色ID数组
 * - 不传参数：要求用户登录，允许所有角色
 * - 传空数组 []：允许未登录用户访问
 * - 传角色数组：只允许指定角色访问
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

### 路由权限配置

```typescript
// src/routes/users.mts

import { authMiddleware } from '#middlewares/authMiddleware';
import {
  ROLE_SUPER_ADMIN,
  ROLE_ADMIN,
} from '#scripts/ConstantUtils';

// 用户管理 - 仅超级管理员可访问
router.get(
  '/users',
  userMiddleware(),
  authMiddleware([ROLE_SUPER_ADMIN]),
  cGetUserList
);

// 用户角色修改 - 仅超级管理员可操作
router.post(
  '/users/update-role',
  userMiddleware(),
  authMiddleware([ROLE_SUPER_ADMIN]),
  bodyValidateMiddleware({ body: sUpdateUserRole }),
  cUpdateUserRole
);

// 用户状态修改 - 仅超级管理员可操作
router.post(
  '/users/update-status',
  userMiddleware(),
  authMiddleware([ROLE_SUPER_ADMIN]),
  bodyValidateMiddleware({ body: sUpdateUserStatus }),
  cUpdateUserStatus
);
```

### 前端路由权限

```typescript
// src/router/index.ts

import { ROLE_SUPER_ADMIN, ROLE_ADMIN } from '@/scripts/constant';

const routes = [
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requireAuth: [ROLE_SUPER_ADMIN, ROLE_ADMIN] },
    children: [
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UsersView/UsersView.vue'),
        meta: { requireAuth: [ROLE_SUPER_ADMIN] },
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/ArticlesView/ArticlesView.vue'),
        meta: { requireAuth: [ROLE_SUPER_ADMIN, ROLE_ADMIN] },
      },
    ],
  },
];
```

## 权限控制规则

### 超级管理员保护

超级管理员拥有系统最高权限，但有一些特殊保护规则：

1. **不可修改**：其他管理员不能修改超级管理员的角色和状态
2. **不可删除**：超级管理员账号不能被删除
3. **唯一性**：系统中至少保留一个超级管理员

```typescript
// 更新用户角色时的保护逻辑
export const cUpdateUserRole: ExpressRequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const currentUser = req.user;

    // 不能将用户设置为超级管理员
    if (role === 'super_admin') {
      res.fail('不能将用户设置为超级管理员');
      return;
    }

    // 查询目标用户
    const targetUser = await getUserById(userId);

    // 不能修改超级管理员的角色
    if (targetUser.role_id === ROLE_SUPER_ADMIN) {
      res.fail('不能修改超级管理员的角色');
      return;
    }

    // 执行更新...
    res.success(null, '角色更新成功');
  } catch (err) {
    next(err);
  }
};
```

### 权限检查顺序

```text
1. 检查用户是否登录
   └── 未登录 → 返回 401

2. 检查是否为超级管理员
   └── 是 → 直接通过

3. 检查用户角色是否在允许列表中
   └── 不在列表 → 返回 403

4. 通过权限检查，执行业务逻辑
```

## 相关章节

- [用户表设计](./user-table.md) - 用户表结构设计
- [认证与授权](./authentication.md) - 登录认证实现
