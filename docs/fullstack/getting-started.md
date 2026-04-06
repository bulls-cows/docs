---
order: 1
---

# 快速开始

本章节将帮助你从零开始搭建 TypeScript 全栈开发环境，并完成第一个全栈项目。

## 环境准备

### 安装 Node.js

TypeScript 全栈开发推荐使用 **Node.js 18.x 或更高版本**（LTS 长期支持版）。

#### Windows

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本安装包
3. 运行安装程序，按提示完成安装
4. 打开终端验证安装：

```bash
node --version  # 应显示 v18.x.x 或更高
npm --version   # 应显示 npm 版本
```

#### macOS

推荐使用 Homebrew 安装：

```bash
# 安装 Homebrew（如未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node@18

# 验证安装
node --version
npm --version
```

#### Linux (Ubuntu/Debian)

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 包管理器选择

推荐使用 **pnpm** 或 **yarn** 替代 npm，提升依赖管理效率。

#### pnpm（推荐）

```bash
# 全局安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version

# 常用命令
pnpm install          # 安装依赖
pnpm add <package>    # 添加依赖
pnpm add -D <package> # 添加开发依赖
pnpm run <script>     # 运行脚本
```

**优势**：

- 磁盘空间节省（硬链接机制）
- 安装速度快
- 严格的依赖管理，避免幽灵依赖

#### Yarn

```bash
# 全局安装 yarn
npm install -g yarn

# 验证安装
yarn --version

# 常用命令
yarn install          # 安装依赖
yarn add <package>    # 添加依赖
yarn add -D <package> # 添加开发依赖
yarn <script>         # 运行脚本
```

### IDE 配置

推荐使用 **VS Code** 作为主力开发工具。

#### 必装插件

| 插件名称 | 用途 |
|---------|------|
| **ESLint** | 代码质量检查 |
| **Prettier** | 代码格式化 |
| **TypeScript Vue Plugin (Volar)** | Vue 3 开发支持 |
| **ES7+ React/Redux/React-Native snippets** | React 代码片段 |
| **Prisma** | Prisma ORM 支持 |
| **Thunder Client** | API 测试工具 |
| **GitLens** | Git 增强 |
| **Error Lens** | 错误提示增强 |

#### 推荐配置

在项目根目录创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

创建 `.vscode/extensions.json` 推荐插件列表：

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "Vue.volar",
    "Prisma.prisma",
    "rangav.vscode-thunder-client"
  ]
}
```

### 全局工具安装

```bash
# TypeScript 编译器
pnpm add -g typescript

# 代码格式化工具
pnpm add -g prettier

# Monorepo 管理工具
pnpm add -g turbo

# 常用脚手架
pnpm add -g create-vite
pnpm add -g create-next-app
pnpm add -g prisma
```

## 项目初始化

### 方案一：快速原型项目

适合快速验证想法、学习练习。

#### 前端项目（Vite + React）

```bash
# 创建项目
pnpm create vite my-app --template react-ts

cd my-app
pnpm install
pnpm dev
```

#### 前端项目（Vite + Vue）

```bash
# 创建项目
pnpm create vite my-app --template vue-ts

cd my-app
pnpm install
pnpm dev
```

#### 后端项目（Express + TypeScript）

```bash
# 创建项目目录
mkdir my-server && cd my-server

# 初始化项目
pnpm init

# 安装依赖
pnpm add express cors dotenv zod
pnpm add -D typescript @types/node @types/express @types/cors tsx

# 初始化 TypeScript 配置
pnpm tsc --init

# 创建目录结构
mkdir -p src/routes src/controllers src/middleware src/utils
```

`tsconfig.json` 基础配置：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

`package.json` 添加脚本：

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 方案二：Monorepo 全栈项目

适合正式项目，前后端代码统一管理。

#### 使用 Turborepo 初始化

```bash
# 创建 Monorepo 项目
pnpm create turbo my-fullstack-app

cd my-fullstack-app
```

选择配置：

- 选择 "Basic" 模板
- 前端选择 React/Vue
- 后端选择 Node.js

#### 手动搭建 Monorepo 结构

```bash
# 创建项目根目录
mkdir my-fullstack-app && cd my-fullstack-app

# 初始化根目录
pnpm init

# 创建目录结构
mkdir -p apps/web apps/server packages/shared packages/ui

# 创建 pnpm-workspace.yaml
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 创建 turbo.json
cat > turbo.json << EOF
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
EOF
```

#### 初始化前端应用

```bash
cd apps
pnpm create vite web --template react-ts
cd web
pnpm install
```

#### 初始化后端服务

```bash
cd ../server
pnpm init
pnpm add express cors dotenv zod
pnpm add -D typescript @types/node @types/express @types/cors tsx
pnpm tsc --init
```

#### 创建共享类型包

```bash
cd ../../packages/shared
pnpm init

# 创建类型文件
cat > src/index.ts << EOF
// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// 认证相关
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}
EOF
```

`packages/shared/package.json`：

```json
{
  "name": "@my-app/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

#### 安装工作区依赖

```bash
# 在 apps/web 中使用共享包
cd apps/web
pnpm add @my-app/shared

# 在 apps/server 中使用共享包
cd ../server
pnpm add @my-app/shared
```

## 第一个全栈项目

让我们创建一个简单的用户管理 API + 前端界面。

### 后端实现

#### 1. 项目结构

```text
apps/server/
├── src/
│   ├── index.ts           # 入口文件
│   ├── routes/
│   │   └── users.ts       # 用户路由
│   ├── controllers/
│   │   └── userController.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   └── utils/
│       └── validation.ts
├── package.json
└── tsconfig.json
```

#### 2. 入口文件 `src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/users';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/users', userRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

#### 3. 用户路由 `src/routes/users.ts`

```typescript
import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';

export const userRouter = Router();

userRouter.get('/', getUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', createUser);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);
```

#### 4. 用户控制器 `src/controllers/userController.ts`

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import type { User, ApiResponse } from '@my-app/shared';

// 模拟数据库
let users: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    role: 'user',
    createdAt: new Date('2024-01-02'),
  },
];

// 验证 schema
const createUserSchema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 个字符'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).optional(),
});

// 获取所有用户
export const getUsers = (req: Request, res: Response) => {
  const response: ApiResponse<User[]> = {
    data: users,
    message: '获取用户列表成功',
    success: true,
  };
  res.json(response);
};

// 获取单个用户
export const getUserById = (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({
      data: null,
      message: '用户不存在',
      success: false,
    });
  }

  const response: ApiResponse<User> = {
    data: user,
    message: '获取用户成功',
    success: true,
  };
  res.json(response);
};

// 创建用户
export const createUser = (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const newUser: User = {
      id: String(users.length + 1),
      name: validatedData.name,
      email: validatedData.email,
      role: 'user',
      createdAt: new Date(),
    };

    users.push(newUser);

    const response: ApiResponse<User> = {
      data: newUser,
      message: '创建用户成功',
      success: true,
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({
      data: null,
      message: '数据验证失败',
      success: false,
      errors: error,
    });
  }
};

// 更新用户
export const updateUser = (req: Request, res: Response) => {
  const { id } = req.params;
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      data: null,
      message: '用户不存在',
      success: false,
    });
  }

  try {
    const validatedData = updateUserSchema.parse(req.body);
    users[userIndex] = { ...users[userIndex], ...validatedData };

    const response: ApiResponse<User> = {
      data: users[userIndex],
      message: '更新用户成功',
      success: true,
    };
    res.json(response);
  } catch (error) {
    res.status(400).json({
      data: null,
      message: '数据验证失败',
      success: false,
      errors: error,
    });
  }
};

// 删除用户
export const deleteUser = (req: Request, res: Response) => {
  const { id } = req.params;
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      data: null,
      message: '用户不存在',
      success: false,
    });
  }

  users.splice(userIndex, 1);

  const response: ApiResponse<null> = {
    data: null,
    message: '删除用户成功',
    success: true,
  };
  res.json(response);
};
```

#### 5. 错误处理中间件 `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  res.status(500).json({
    data: null,
    message: err.message || '服务器内部错误',
    success: false,
  });
};
```

### 前端实现

#### 1. 前端项目结构

```text
apps/web/
├── src/
│   ├── App.tsx
│   ├── api/
│   │   └── users.ts      # API 调用封装
│   ├── components/
│   │   └── UserList.tsx  # 用户列表组件
│   └── types/
│       └── index.ts      # 类型重导出
├── package.json
└── vite.config.ts
```

#### 2. API 封装 `src/api/users.ts`

```typescript
import type { User, ApiResponse } from '@my-app/shared';

const API_BASE = 'http://localhost:3000/api';

export const userApi = {
  // 获取所有用户
  async getAll(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/users`);
    const data: ApiResponse<User[]> = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // 获取单个用户
  async getById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE}/users/${id}`);
    const data: ApiResponse<User> = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // 创建用户
  async create(user: { name: string; email: string; password: string }): Promise<User> {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const data: ApiResponse<User> = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // 更新用户
  async update(id: string, user: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const data: ApiResponse<User> = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // 删除用户
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    const data: ApiResponse<null> = await response.json();
    if (!data.success) throw new Error(data.message);
  },
};
```

#### 3. 用户列表组件 `src/components/UserList.tsx`

```typescript
import { useState, useEffect } from 'react';
import { userApi } from '../api/users';
import type { User } from '@my-app/shared';

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该用户吗？')) return;

    try {
      await userApi.delete(id);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  if (loading) return <div className="p-4">加载中...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">用户列表</h2>
      <button
        onClick={loadUsers}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        刷新
      </button>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 border rounded flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <span className="text-sm text-gray-500">
                {user.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </div>
            <button
              onClick={() => handleDelete(user.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4. 主应用 `src/App.tsx`

```typescript
import { UserList } from './components/UserList';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserList />
    </div>
  );
}

export default App;
```

### 运行项目

```bash
# 在项目根目录，同时启动前后端
pnpm dev

# 或分别启动
cd apps/server && pnpm dev    # 后端服务
cd apps/web && pnpm dev       # 前端应用
```

访问 `http://localhost:5173` 查看前端界面，后端 API 运行在 `http://localhost:3000`。

## 常见问题解答

### 环境配置问题

#### Q: Node.js 版本如何管理？

推荐使用版本管理工具：

```bash
# 使用 nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装并切换版本
nvm install 18
nvm use 18
nvm alias default 18  # 设置默认版本
```

#### Q: pnpm 安装依赖报错？

可能原因及解决方案：

```bash
# 清理缓存
pnpm store prune

# 删除 node_modules 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 检查 .npmrc 配置
cat .npmrc
```

#### Q: TypeScript 类型检查报错？

常见解决方案：

```bash
# 确保 TypeScript 版本一致
pnpm add -D typescript@latest

# 检查 tsconfig.json 配置
pnpm tsc --noEmit

# 重启 TypeScript 服务（VS Code）
Cmd/Ctrl + Shift + P -> TypeScript: Restart TS Server
```

### 开发调试问题

#### Q: 前端请求后端 API 跨域？

后端配置 CORS：

```typescript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // 前端地址
  credentials: true,
}));
```

或前端配置代理（`vite.config.ts`）：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

#### Q: Monorepo 中共享包修改后前端不更新？

```bash
# 使用 Turborepo 的缓存失效
pnpm turbo build --force

# 或使用 pnpm 的 workspace 协议
# package.json 中使用 "workspace:*"
{
  "dependencies": {
    "@my-app/shared": "workspace:*"
  }
}
```

#### Q: 热更新不生效？

检查配置：

```typescript
// 后端使用 tsx watch
// package.json
{
  "scripts": {
    "dev": "tsx watch src/index.ts"
  }
}

// 前端 Vite 默认支持热更新
// 确保没有禁用 HMR
```

### 部署相关问题

#### Q: 构建后环境变量不生效？

```typescript
// 使用 dotenv 加载环境变量
import dotenv from 'dotenv';
dotenv.config();

// 或在构建时注入
// vite.config.ts
export default defineConfig({
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL),
  },
});
```

#### Q: 生产环境如何部署 Monorepo？

推荐方案：

```bash
# 1. 构建所有项目
pnpm turbo build

# 2. 只部署需要的产物
# 前端：apps/web/dist
# 后端：apps/server/dist

# 3. 使用 Docker
# Dockerfile 示例
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm turbo build
CMD ["node", "apps/server/dist/index.js"]
```

### 性能优化问题

#### Q: 开发时编译速度慢？

优化方案：

```json
// tsconfig.json - 使用增量编译
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}

// turbo.json - 启用缓存
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".tsbuildinfo"]
    }
  }
}
```

#### Q: 前端打包体积过大？

```typescript
// vite.config.ts - 代码分割
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          shared: ['@my-app/shared'],
        },
      },
    },
  },
});
```

## 下一步

完成环境搭建和第一个项目后，建议继续学习：

- **[全栈最佳实践](/fullstack/best-practices)** - 学习代码组织、类型共享、安全实践
- **[前端开发](/fullstack/frontend/)** - 深入 React/Vue 框架
- **[后端开发](/fullstack/backend/)** - 掌握 Node.js、数据库、API 设计
- **[架构设计](/fullstack/architecture/)** - 理解系统架构模式
