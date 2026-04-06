---
order: 2
---

# 全栈最佳实践

本章节总结 TypeScript 全栈开发中的最佳实践，帮助你构建高质量、可维护的应用。

## 代码组织规范

### 目录结构设计

#### 单体应用结构

适合中小型项目：

```text
src/
├── modules/              # 按功能模块组织
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.types.ts
│   │   └── user.test.ts
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.middleware.ts
│   └── product/
│       └── ...
├── shared/               # 共享代码
│   ├── middleware/
│   ├── utils/
│   ├── types/
│   └── constants/
├── config/               # 配置文件
├── database/             # 数据库相关
│   ├── migrations/
│   └── seeds/
└── app.ts                # 应用入口
```

#### 分层架构

推荐采用清晰的分层架构：

```typescript
// Controller 层 - 处理 HTTP 请求
// src/modules/user/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from './user.service';

export class UserController {
  constructor(private userService: UserService) {}

  async getUser(req: Request, res: Response) {
    const { id } = req.params;
    const user = await this.userService.findById(id);
    res.json({ data: user, success: true });
  }
}

// Service 层 - 业务逻辑
// src/modules/user/user.service.ts
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError('用户不存在');
    return user;
  }

  async create(data: CreateUserDTO) {
    // 业务逻辑验证
    await this.validateEmail(data.email);
    return this.userRepository.create(data);
  }
}

// Repository 层 - 数据访问
// src/modules/user/user.repository.ts
export class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDTO) {
    return this.db.user.create({ data });
  }
}
```

#### 命名约定

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 文件名 | kebab-case | `user-service.ts` |
| 类名 | PascalCase | `UserService` |
| 函数名 | camelCase | `getUserById` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 接口/类型 | PascalCase | `UserResponse` |
| 私有属性 | _前缀 | `_privateField` |

### 模块化原则

#### 单一职责

每个模块只负责一个功能：

```typescript
// ❌ 不好的实践 - 一个文件做太多事
// user.ts
export class User {
  validate() { /* ... */ }
  save() { /* ... */ }
  sendEmail() { /* ... */ }
  generateReport() { /* ... */ }
}

// ✅ 好的实践 - 职责分离
// user.validator.ts
export class UserValidator {
  validateEmail(email: string): boolean { /* ... */ }
  validatePassword(password: string): boolean { /* ... */ }
}

// user.repository.ts
export class UserRepository {
  save(user: User): Promise<User> { /* ... */ }
  findById(id: string): Promise<User | null> { /* ... */ }
}

// email.service.ts
export class EmailService {
  sendWelcomeEmail(user: User): Promise<void> { /* ... */ }
}
```

#### 依赖注入

使用依赖注入提高可测试性：

```typescript
// 定义接口
export interface ILogger {
  log(message: string): void;
}

export interface ICache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

// 服务实现
export class UserService {
  constructor(
    private logger: ILogger,
    private cache: ICache,
    private repository: UserRepository
  ) {}

  async getUser(id: string) {
    // 尝试从缓存获取
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      this.logger.log(`Cache hit for user ${id}`);
      return JSON.parse(cached);
    }

    // 从数据库获取
    const user = await this.repository.findById(id);
    await this.cache.set(`user:${id}`, JSON.stringify(user));
    return user;
  }
}

// 容器配置
import { Container } from 'inversify';

const container = new Container();
container.bind<ILogger>('Logger').to(ConsoleLogger);
container.bind<ICache>('Cache').to(RedisCache);
container.bind<UserService>(UserService).toSelf();
```

## Monorepo 架构实践

### 项目结构

```text
my-fullstack-app/
├── apps/
│   ├── web/                    # 前端应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── admin/                  # 管理后台
│   │   ├── src/
│   │   └── package.json
│   └── server/                 # 后端服务
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/                 # 共享类型和工具
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                     # 共享组件库
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── eslint-config/          # 共享 ESLint 配置
│   │   ├── index.js
│   │   └── package.json
│   └── tsconfig/               # 共享 TypeScript 配置
│       ├── base.json
│       ├── react.json
│       └── package.json
├── turbo.json                  # Turborepo 配置
├── pnpm-workspace.yaml         # pnpm 工作区配置
└── package.json                # 根 package.json
```

### Turborepo 配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "outputs": []
    }
  }
}
```

### 共享配置

#### TypeScript 配置继承

```json
// packages/tsconfig/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  }
}

// packages/tsconfig/react.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}

// apps/web/tsconfig.json
{
  "extends": "@my-app/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

#### ESLint 配置共享

```javascript
// packages/eslint-config/index.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};

// apps/web/.eslintrc.js
module.exports = {
  extends: ['@my-app/eslint-config'],
  rules: {
    // 应用特定规则
  },
};
```

### 工作区依赖管理

```json
// apps/web/package.json
{
  "name": "@my-app/web",
  "dependencies": {
    "@my-app/shared": "workspace:*",
    "@my-app/ui": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}

// apps/server/package.json
{
  "name": "@my-app/server",
  "dependencies": {
    "@my-app/shared": "workspace:*",
    "express": "^4.18.2",
    "zod": "^3.22.0"
  }
}

// packages/shared/package.json
{
  "name": "@my-app/shared",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

## 类型共享策略

### 共享类型定义

#### 基础类型

```typescript
// packages/shared/src/types/common.ts

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp?: string;
}

// 分页类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 排序类型
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

// 时间戳类型
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}
```

#### 实体类型

```typescript
// packages/shared/src/types/entities.ts

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### DTO 类型

```typescript
// packages/shared/src/types/dto.ts
import { z } from 'zod';

// 使用 Zod 定义 schema，自动推导类型
export const CreateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(2, '姓名至少 2 个字符').max(50, '姓名最多 50 个字符'),
  password: z.string().min(8, '密码至少 8 个字符').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    '密码必须包含大小写字母和数字'
  ),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatar: z.string().url().optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;

// 查询参数
export const UserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type UserQueryDTO = z.infer<typeof UserQuerySchema>;
```

### 前后端类型复用

#### 后端使用

```typescript
// apps/server/src/controllers/user.controller.ts
import { CreateUserDTO, CreateUserSchema, ApiResponse, User } from '@my-app/shared';

export const createUser = async (req: Request, res: Response) => {
  // 使用 Zod 验证
  const validatedData: CreateUserDTO = CreateUserSchema.parse(req.body);

  // 业务逻辑
  const user = await userService.create(validatedData);

  // 返回类型安全的响应
  const response: ApiResponse<User> = {
    data: user,
    message: '创建用户成功',
    success: true,
  };

  res.status(201).json(response);
};
```

#### 前端使用

```typescript
// apps/web/src/api/users.ts
import { CreateUserDTO, ApiResponse, User } from '@my-app/shared';

export const userApi = {
  async create(data: CreateUserDTO): Promise<User> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<User> = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  },
};

// React 组件中使用
import { CreateUserDTO } from '@my-app/shared';

function CreateUserForm() {
  const handleSubmit = async (formData: CreateUserDTO) => {
    try {
      const user = await userApi.create(formData);
      console.log('创建成功:', user);
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  return <form onSubmit={handleSubmit}>{/* 表单内容 */}</form>;
}
```

### 类型守卫与工具函数

```typescript
// packages/shared/src/utils/type-guards.ts
import { User, UserRole, UserStatus } from '../types';

// 类型守卫
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj &&
    'role' in obj
  );
}

export function isAdmin(user: User): boolean {
  return user.role === UserRole.ADMIN;
}

export function isActiveUser(user: User): boolean {
  return user.status === UserStatus.ACTIVE;
}

// 类型转换工具
export function toUserRole(value: string): UserRole | undefined {
  return Object.values(UserRole).find((role) => role === value);
}

// 安全的类型断言
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

// 使用示例
function handleUserRole(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return '管理员';
    case UserRole.USER:
      return '普通用户';
    case UserRole.MODERATOR:
      return '版主';
    default:
      return assertNever(role); // 编译时检查完整性
  }
}
```

## 错误处理模式

### 统一错误类型

```typescript
// packages/shared/src/errors/index.ts

// 基础错误类
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 具体错误类型
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('请求过于频繁，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }

  retryAfter: number;
}
```

### 后端错误处理

#### 全局错误处理中间件

```typescript
// apps/server/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@my-app/shared';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 记录错误日志
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Zod 验证错误
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(err.message);
    });

    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error instanceof ValidationError && { errors: error.errors }),
    });
  }

  // 未知错误
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
    code: 'INTERNAL_ERROR',
  });
}
```

#### 异步错误包装器

```typescript
// apps/server/src/utils/async-handler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 使用示例
import { asyncHandler } from '../utils/async-handler';
import { NotFoundError } from '@my-app/shared';

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userService.findById(req.params.id);

    if (!user) {
      throw new NotFoundError('用户');
    }

    res.json({ data: user, success: true });
  })
);
```

### 前端错误处理

#### API 错误处理封装

```typescript
// apps/web/src/api/client.ts
import { AppError } from '@my-app/shared';

interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiClientError(
          data.message || '请求失败',
          response.status,
          data.code,
          data.errors
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      // 网络错误
      throw new ApiClientError(
        '网络连接失败，请检查网络设置',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// 使用示例
const apiClient = new ApiClient('/api');

export const userApi = {
  async getById(id: string) {
    return apiClient.get<ApiResponse<User>>(`/users/${id}`);
  },

  async create(data: CreateUserDTO) {
    return apiClient.post<ApiResponse<User>>('/users', data);
  },
};
```

#### React 错误边界

```typescript
// apps/web/src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 可以发送错误日志到服务器
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center">
            <h2 className="text-xl font-bold text-red-600">出错了</h2>
            <p className="text-gray-600 mt-2">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              重试
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## 安全最佳实践

### 输入验证

#### 使用 Zod 进行验证

```typescript
// packages/shared/src/validators/user.validator.ts
import { z } from 'zod';

export const UserValidators = {
  // 创建用户验证
  create: z.object({
    email: z.string().email('邮箱格式不正确').toLowerCase().trim(),
    name: z
      .string()
      .min(2, '姓名至少 2 个字符')
      .max(50, '姓名最多 50 个字符')
      .trim(),
    password: z
      .string()
      .min(8, '密码至少 8 个字符')
      .regex(/[A-Z]/, '密码必须包含大写字母')
      .regex(/[a-z]/, '密码必须包含小写字母')
      .regex(/[0-9]/, '密码必须包含数字')
      .regex(/[^A-Za-z0-9]/, '密码必须包含特殊字符'),
  }),

  // 更新用户验证
  update: z.object({
    name: z.string().min(2).max(50).trim().optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
  }),

  // 查询参数验证
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

// 后端使用
import { UserValidators } from '@my-app/shared';

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const validatedData = UserValidators.create.parse(req.body);
    const user = await userService.create(validatedData);
    res.json({ data: user, success: true });
  })
);
```

#### 自定义验证器

```typescript
// packages/shared/src/validators/custom.ts
import { z } from 'zod';

// 密码强度验证
export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 个字符')
  .refine(
    (password) => {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      return hasUpper && hasLower && hasNumber && hasSpecial;
    },
    { message: '密码必须包含大小写字母、数字和特殊字符' }
  );

// 手机号验证（中国）
export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确');

// 用户名验证
export const usernameSchema = z
  .string()
  .min(3, '用户名至少 3 个字符')
  .max(20, '用户名最多 20 个字符')
  .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符')
  .refine((name) => !name.startsWith('-'), '用户名不能以连字符开头')
  .refine((name) => !name.endsWith('-'), '用户名不能以连字符结尾');

// 日期范围验证
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: '开始日期必须早于结束日期',
    path: ['endDate'],
  });
```

### 认证与授权

#### JWT 认证实现

```typescript
// apps/server/src/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '@my-app/shared';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtService {
  // 生成访问令牌
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessTokenExpiry,
    });
  }

  // 生成刷新令牌
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });
  }

  // 验证访问令牌
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('无效的访问令牌');
    }
  }

  // 验证刷新令牌
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('无效的刷新令牌');
    }
  }
}
```

#### 认证中间件

```typescript
// apps/server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../auth/jwt';
import { UnauthorizedError, ForbiddenError } from '@my-app/shared';
import { UserRole } from '@my-app/shared';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// 认证中间件
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('请先登录');
  }

  const token = authHeader.substring(7);
  const payload = JwtService.verifyAccessToken(token);

  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role as UserRole,
  };

  next();
}

// 角色授权中间件
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('请先登录');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('权限不足');
    }

    next();
  };
}

// 使用示例
router.get(
  '/admin/users',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const users = await userService.findAll();
    res.json({ data: users, success: true });
  })
);
```

### 安全防护措施

#### CORS 配置

```typescript
// apps/server/src/middleware/security.ts
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// CORS 配置
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

    // 允许无 origin 的请求（如移动应用、Postman）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// 安全头配置
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
};

// 速率限制
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录接口严格限制
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 每个 IP 15 分钟内最多 5 次登录尝试
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

// 应用中间件
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(rateLimiter);
```

#### SQL 注入防护

```typescript
// 使用 ORM 参数化查询（Prisma 示例）
// ✅ 安全 - 参数化查询
const user = await prisma.user.findFirst({
  where: {
    email: userInput, // Prisma 自动转义
  },
});

// ✅ 安全 - 使用 Prisma 原始查询
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ❌ 危险 - 字符串拼接（不要这样做）
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

#### XSS 防护

```typescript
// 前端输入清理
import DOMPurify from 'dompurify';

// 清理 HTML 输入
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

// React 组件中使用
function SafeHtml({ html }: { html: string }) {
  const clean = sanitizeHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// 后端输出编码
import he from 'he';

export function escapeHtml(text: string): string {
  return he.encode(text);
}
```

### 敏感数据保护

#### 环境变量管理

```typescript
// apps/server/src/config/index.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// 环境变量 schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // 数据库
  DATABASE_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

  // 安全
  ALLOWED_ORIGINS: z.string(),

  // 第三方服务
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

// 验证并导出配置
export const config = envSchema.parse(process.env);

// 类型安全的配置访问
export type Config = z.infer<typeof envSchema>;
```

#### 数据加密

```typescript
// apps/server/src/utils/encryption.ts
import crypto from 'crypto';
import { config } from '../config';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(config.JWT_SECRET, 'salt', 32);

export class EncryptionService {
  // 加密
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // 解密
  static decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

#### 密码哈希

```typescript
// apps/server/src/utils/password.ts
import bcrypt from 'bcryptjs';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;

  // 哈希密码
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // 验证密码
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// 使用示例
const hashedPassword = await PasswordService.hash(userInput.password);
const isValid = await PasswordService.verify(userInput.password, user.passwordHash);
```

## 总结

全栈开发最佳实践的核心原则：

1. **代码组织** - 清晰的分层架构，单一职责原则
2. **类型安全** - 前后端共享类型，编译时错误检查
3. **错误处理** - 统一的错误类型，完善的错误处理机制
4. **安全防护** - 输入验证、认证授权、数据加密
5. **可维护性** - Monorepo 架构，共享配置，代码复用

遵循这些最佳实践，可以构建高质量、可维护、安全的全栈应用。

---

## 参考资料

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-t-s.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Zod Documentation](https://zod.dev/)
