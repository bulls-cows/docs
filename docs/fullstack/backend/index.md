---
order: 20
---

# 后端技术栈

后端开发是构建可靠、高效、可扩展应用的核心。本文将介绍现代后端技术栈的选型策略，帮助你做出合理的技术决策。

## Node.js 生态概览

Node.js 自 2009 年发布以来，已成为后端开发的主流选择之一。其事件驱动、非阻塞 I/O 模型使其在处理高并发场景时表现出色。

### 核心优势

- **统一技术栈**：前后端使用同一语言，降低学习成本，促进全栈开发
- **丰富的生态**：npm 拥有超过 200 万个包，覆盖各种场景
- **高性能**：V8 引擎提供优秀的执行性能
- **活跃的社区**：持续迭代更新，问题解决方案丰富

### 典型应用场景

```typescript
// 1. RESTful API 服务
import express from 'express'

const app = express()

app.get('/api/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id)
  res.json(user)
})

// 2. 实时通信应用
import { Server } from 'socket.io'

const io = new Server(3000)
io.on('connection', (socket) => {
  socket.on('message', (data) => {
    io.emit('message', data)
  })
})

// 3. 微服务架构
import { createService } from '@nestjs/core'

@Module({
  controllers: [UserController],
  providers: [UserService],
})
class UserModule {}
```

## 框架选型

选择合适的框架是项目成功的关键。以下是主流 Node.js 框架的对比分析。

### Express

最流行的 Node.js Web 框架，以简洁灵活著称。

**优点：**

- 极简设计，中间件生态丰富
- 文档完善，社区活跃
- 学习曲线平缓，上手快

**缺点：**

- 缺少内置功能（验证、ORM 等）
- 异步错误处理需要额外注意
- 大型项目需要自行组织架构

**适用场景：** 中小型项目、快速原型开发、API 服务

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

// 中间件配置
app.use(helmet()) // 安全头
app.use(cors()) // 跨域
app.use(express.json()) // JSON 解析

// 路由定义
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(3000)
```

### Fastify

高性能的 Node.js 框架，专注于速度和开发者体验。

**优点：**

- 性能优异，比 Express 快 2 倍以上
- 内置 JSON Schema 验证
- 友好的 TypeScript 支持
- 插件系统设计优雅

**缺点：**

- 社区相对较小
- 中间件生态不如 Express 丰富

**适用场景：** 高性能 API 服务、微服务架构

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify({
  logger: true,
})

await fastify.register(cors)

// Schema 验证
fastify.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { id } = request.params
  return { id, name: 'John Doe' }
})

await fastify.listen({ port: 3000 })
```

### NestJS

企业级 Node.js 框架，采用 TypeScript 和模块化架构。

**优点：**

- 完整的企业级解决方案
- 内置依赖注入、模块化系统
- 优秀的 TypeScript 支持
- 支持 GraphQL、WebSocket、微服务

**缺点：**

- 学习曲线较陡峭
- 代码量较大，配置繁琐
- 小型项目可能过度设计

**适用场景：** 大型企业应用、微服务架构、团队协作项目

```typescript
import { Controller, Get, Param, Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

// Controller
@Controller('users')
class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findById(Number(id))
  }
}

// Service
@Injectable()
class UserService {
  private users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Doe' },
  ]

  findById(id: number) {
    return this.users.find(u => u.id === id)
  }
}

// Module
@Module({
  controllers: [UserController],
  providers: [UserService],
})
class AppModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
}
bootstrap()
```

### 框架选型建议

| 框架 | 学习成本 | 开发效率 | 性能 | 适用规模 | 推荐指数 |
|------|----------|----------|------|----------|----------|
| Express | 低 | 高 | 中 | 小中型 | ⭐⭐⭐⭐ |
| Fastify | 中 | 高 | 高 | 中大型 | ⭐⭐⭐⭐⭐ |
| NestJS | 高 | 中 | 中 | 大型 | ⭐⭐⭐⭐ |

**选型建议：**

- **快速原型 / 小项目**：选择 Express
- **高性能 API / 微服务**：选择 Fastify
- **大型企业应用**：选择 NestJS
- **团队协作 / 长期维护**：优先考虑 NestJS 或 Fastify

## 运行时对比

除了 Node.js，现代 JavaScript 运行时还有 Bun 和 Deno，它们各有特点。

### Node.js

**特点：**

- 成熟稳定，生态最完善
- LTS 版本提供长期支持
- 企业级应用首选

**版本策略：**

- **LTS（长期支持）**：生产环境推荐
- **Current（当前版本）**：体验最新特性

```bash
# 使用 nvm 管理 Node.js 版本
nvm install --lts
nvm use --lts
nvm alias default lts/*
```

### Bun

**特点：**

- 性能极佳，启动速度快
- 内置打包器、测试框架、包管理器
- 原生支持 TypeScript、JSX
- 兼容 Node.js API

**优势场景：**

- 需要极致性能的项目
- 快速开发原型
- 替代 Node.js 工具链

```typescript
// Bun 内置 HTTP 服务器
export default {
  port: 3000,
  fetch(request) {
    return new Response('Hello from Bun!')
  },
}

// 使用 Bun 运行
// bun run server.ts
```

```bash
# Bun 包管理器（比 npm 快 20 倍）
bun install
bun add express
bun run dev
```

### Deno

**特点：**

- 安全性优先，默认禁止文件/网络访问
- 内置 TypeScript 支持
- 分布式模块系统（URL 导入）
- 内置工具链（格式化、测试、打包）

**优势场景：**

- 安全敏感型应用
- 边缘计算、Serverless
- 教育学习

```typescript
// Deno HTTP 服务器
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(() => new Response('Hello from Deno!'), { port: 3000 })

// 运行需要权限声明
// deno run --allow-net server.ts
```

### 运行时对比表

| 特性 | Node.js | Bun | Deno |
|------|---------|-----|------|
| 性能 | 中 | 高 | 高 |
| 生态成熟度 | 高 | 中 | 中 |
| TypeScript 支持 | 需配置 | 原生 | 原生 |
| 安全性 | 低 | 低 | 高 |
| 包管理 | npm/yarn/pnpm | 内置 | 无需/兼容 npm |
| 学习成本 | 低 | 低 | 中 |
| 生产就绪 | ✅ | ⚠️ | ✅ |

**选型建议：**

- **生产环境**：优先选择 Node.js LTS
- **追求性能**：尝试 Bun（注意兼容性）
- **安全优先**：考虑 Deno
- **边缘计算**：Deno 或 Bun

## 后端工程化

工程化是保证项目质量和开发效率的基础。

### 项目结构

推荐的项目目录结构：

```text
src/
├── config/           # 配置文件
│   ├── index.ts
│   └── database.ts
├── controllers/      # 控制器
├── services/         # 业务逻辑
├── models/           # 数据模型
├── repositories/     # 数据访问层
├── middlewares/      # 中间件
├── routes/           # 路由定义
├── utils/            # 工具函数
├── types/            # 类型定义
├── constants/        # 常量
├── validators/       # 验证器
└── app.ts            # 应用入口
```

### 代码规范

使用 ESLint + Prettier 保证代码质量：

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": "warn"
  }
}
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 环境变量管理

使用 dotenv 和 zod 进行类型安全的环境变量管理：

```typescript
// config/env.ts
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

### 日志管理

使用 pino 进行高性能日志记录：

```typescript
import pino from 'pino'

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
})

// 使用示例
logger.info({ userId: 123 }, 'User logged in')
logger.error({ err: error }, 'Database connection failed')
```

### 错误处理

统一的错误处理机制：

```typescript
// utils/errors.ts
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

// 错误处理中间件
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    })
  }

  console.error(err)
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    },
  })
}
```

### 测试策略

使用 Jest 或 Vitest 进行测试：

```typescript
// tests/user.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'

describe('User API', () => {
  it('should get user by id', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200)

    expect(response.body).toHaveProperty('id', 1)
  })

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John Doe', email: 'john@example.com' })
      .expect(201)

    expect(response.body.name).toBe('John Doe')
  })
})
```

## 小结

选择合适的后端技术栈需要综合考虑项目规模、团队能力、性能需求等因素：

1. **框架选择**：Express 适合快速开发，Fastify 适合高性能场景，NestJS 适合大型项目
2. **运行时选择**：生产环境优先 Node.js，追求性能可尝试 Bun
3. **工程化实践**：建立完善的代码规范、错误处理、日志和测试体系

技术选型没有绝对的对错，关键是根据实际需求做出合理选择，并在实践中持续优化。
