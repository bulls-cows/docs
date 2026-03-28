---
order: 20
---

# Node.js 实战

Node.js 是构建高性能后端服务的核心技术。本文将深入探讨 Node.js 的核心概念、框架实践、中间件设计和错误处理策略。

## Node.js 核心概念

### 事件循环机制

Node.js 采用单线程、非阻塞 I/O 模型，核心是事件循环（Event Loop）。

```typescript
// 事件循环阶段
// 1. timers - 执行 setTimeout/setInterval 回调
// 2. pending callbacks - 执行系统操作回调
// 3. idle, prepare - 内部使用
// 4. poll - 检索新 I/O 事件
// 5. check - 执行 setImmediate 回调
// 6. close callbacks - 执行 close 事件回调

console.log('1. 脚本开始')

setTimeout(() => {
  console.log('2. setTimeout')
}, 0)

setImmediate(() => {
  console.log('3. setImmediate')
})

Promise.resolve().then(() => {
  console.log('4. Promise')
})

process.nextTick(() => {
  console.log('5. nextTick')
})

console.log('6. 脚本结束')

// 输出顺序: 1 -> 6 -> 5 -> 4 -> 2 -> 3 (或 3 -> 2)
```

### 异步编程模式

```typescript
// 1. Callback 模式（传统方式）
function readFileCallback(path: string, callback: (err: Error | null, data?: string) => void) {
  fs.readFile(path, 'utf-8', (err, data) => {
    if (err) return callback(err)
    callback(null, data)
  })
}

// 2. Promise 模式
function readFilePromise(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

// 3. async/await 模式（推荐）
async function readFileAsync(path: string): Promise<string> {
  const data = await fs.promises.readFile(path, 'utf-8')
  return data
}

// 并行执行
async function readMultipleFiles(paths: string[]): Promise<string[]> {
  const promises = paths.map(path => fs.promises.readFile(path, 'utf-8'))
  return Promise.all(promises)
}

// 错误处理
async function safeReadFile(path: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(path, 'utf-8')
  } catch (error) {
    console.error(`Failed to read file: ${path}`, error)
    return null
  }
}
```

### 流（Stream）处理

流是处理大文件和高吞吐量数据的关键。

```typescript
import { createReadStream, createWriteStream, Transform } from 'stream'
import { pipeline } from 'stream/promises'

// 读取大文件
async function processLargeFile(inputPath: string, outputPath: string) {
  // 自定义转换流
  const upperCase = new Transform({
    transform(chunk, encoding, callback) {
      const data = chunk.toString().toUpperCase()
      callback(null, data)
    },
  })

  // 使用 pipeline 自动管理流
  await pipeline(
    createReadStream(inputPath),
    upperCase,
    createWriteStream(outputPath)
  )
}

// 流式处理 HTTP 请求
import express from 'express'
import { pipeline } from 'stream/promises'

const app = express()

app.post('/upload', async (req, res) => {
  const writeStream = createWriteStream('./uploads/file.txt')
  
  await pipeline(req, writeStream)
  
  res.json({ message: 'File uploaded successfully' })
})
```

### Buffer 处理

```typescript
// 创建 Buffer
const buf1 = Buffer.alloc(10) // 分配 10 字节
const buf2 = Buffer.from('Hello World') // 从字符串创建
const buf3 = Buffer.from([1, 2, 3, 4, 5]) // 从数组创建

// Buffer 操作
buf1.write('Hi')
console.log(buf1.toString()) // 'Hi'

// Buffer 拼接
const combined = Buffer.concat([buf2, buf3])

// Buffer 与 JSON 转换
const json = buf2.toJSON()
const fromJson = Buffer.from(json.data)
```

## Express 实践

### 项目结构

```text
src/
├── app.ts                 # 应用入口
├── config/
│   └── index.ts           # 配置管理
├── controllers/
│   └── user.controller.ts # 控制器
├── middlewares/
│   ├── error.middleware.ts
│   └── auth.middleware.ts
├── models/
│   └── user.model.ts      # 数据模型
├── routes/
│   ├── index.ts           # 路由汇总
│   └── user.routes.ts     # 用户路由
├── services/
│   └── user.service.ts    # 业务逻辑
├── validators/
│   └── user.validator.ts  # 请求验证
└── utils/
    ├── response.ts        # 响应工具
    └── errors.ts          # 错误类
```

### 应用初始化

```typescript
// app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middlewares/error.middleware'
import routes from './routes'

const app = express()

// 安全中间件
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}))

// 性能优化
app.use(compression())

// 请求限制
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 次请求
  message: { error: 'Too many requests' },
}))

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api', routes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// 错误处理
app.use(errorHandler)

export default app
```

### 控制器设计

```typescript
// controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/user.service'
import { asyncHandler } from '../middlewares/async.middleware'

export class UserController {
  constructor(private userService: UserService) {}

  // 获取用户列表
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query
    
    const result = await this.userService.findAll({
      page: Number(page),
      limit: Number(limit),
    })
    
    res.json({
      data: result.users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
      },
    })
  })

  // 获取单个用户
  getUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findById(req.params.id)
    
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    
    res.json({ data: user })
  })

  // 创建用户
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.body)
    res.status(201).json({ data: user })
  })

  // 更新用户
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.update(req.params.id, req.body)
    res.json({ data: user })
  })

  // 删除用户
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.delete(req.params.id)
    res.status(204).send()
  })
}
```

### 路由定义

```typescript
// routes/user.routes.ts
import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { UserService } from '../services/user.service'
import { validateRequest } from '../middlewares/validate.middleware'
import { authenticate } from '../middlewares/auth.middleware'
import { createUserSchema, updateUserSchema } from '../validators/user.validator'

const router = Router()

const userController = new UserController(new UserService())

// 公开路由
router.get('/', userController.getUsers)
router.get('/:id', userController.getUser)

// 需要认证的路由
router.post('/', 
  authenticate, 
  validateRequest(createUserSchema), 
  userController.createUser
)

router.put('/:id', 
  authenticate, 
  validateRequest(updateUserSchema), 
  userController.updateUser
)

router.delete('/:id', authenticate, userController.deleteUser)

export default router
```

## Fastify 实践

### Fastify 应用初始化

```typescript
// app.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' 
      ? { target: 'pino-pretty' } 
      : undefined,
  },
})

// 注册插件
await fastify.register(helmet)
await fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
  credentials: true,
})
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
})
await fastify.register(sensible)

// 健康检查
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}))

// 注册路由
await fastify.register(import('./routes/user.routes'), { prefix: '/api' })

// 全局错误处理
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    reply.status(400).send({ error: 'Validation Error', details: error.validation })
    return
  }
  
  fastify.log.error(error)
  reply.status(500).send({ error: 'Internal Server Error' })
})

export default fastify
```

### 路由与 Schema

```typescript
// routes/user.routes.ts
import { FastifyInstance } from 'fastify'
import { UserController } from '../controllers/user.controller'

const userController = new UserController()

export default async function userRoutes(fastify: FastifyInstance) {
  // 获取用户列表
  fastify.get('/users', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            pagination: { type: 'object' },
          },
        },
      },
    },
  }, userController.getUsers)

  // 获取单个用户
  fastify.get('/users/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, userController.getUser)

  // 创建用户
  fastify.post('/users', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
        required: ['name', 'email', 'password'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  }, userController.createUser)
}
```

## 中间件设计

### 中间件基础

```typescript
import { Request, Response, NextFunction } from 'express'

// 基本中间件
export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  
  next()
}

// 异步中间件包装器
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 使用示例
app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll()
  res.json(users)
}))
```

### 认证中间件

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/errors'

export interface AuthUser {
  id: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header')
  }
  
  const token = authHeader.substring(7)
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    req.user = payload
    next()
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

// 角色检查中间件
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions')
    }
    next()
  }
}

// 使用示例
app.delete('/users/:id', 
  authenticate, 
  requireRole('admin'), 
  userController.deleteUser
)
```

### 请求验证中间件

```typescript
import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { ValidationError } from '../utils/errors'

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        throw new ValidationError(messages.join(', '))
      }
      next(error)
    }
  }
}

// Schema 定义
import { z } from 'zod'

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    age: z.number().int().min(0).max(150).optional(),
  }),
})

// 使用
app.post('/users', validate(createUserSchema), userController.create)
```

### 请求日志中间件

```typescript
import { Request, Response, NextFunction } from 'express'
import pino from 'pino'

const logger = pino({
  level: 'info',
  transport: { target: 'pino-pretty' },
})

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  // 设置请求 ID
  req.headers['x-request-id'] = requestId
  res.setHeader('x-request-id', requestId)
  
  // 记录请求
  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  }, 'Request started')
  
  // 记录响应
  res.on('finish', () => {
    const duration = Date.now() - startTime
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    }, 'Request completed')
  })
  
  next()
}
```

## 错误处理

### 错误类设计

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}
```

### 全局错误处理

```typescript
// middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError } from '../utils/errors'
import { ZodError } from 'zod'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod 验证错误
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.code,
    }

    if (error instanceof ValidationError && error.details) {
      response.details = error.details
    }

    return res.status(error.statusCode).json(response)
  }

  // JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    })
  }

  // 数据库错误
  if (error.name === 'QueryFailedError') {
    console.error('Database error:', error)
    return res.status(500).json({
      error: 'Database error',
      code: 'DATABASE_ERROR',
    })
  }

  // 未知错误
  console.error('Unhandled error:', error)
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  })
}

// 404 处理
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path,
  })
}
```

### 异步错误边界

```typescript
// utils/async.ts
import { NextFunction, Request, Response } from 'express'

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>

// 包装异步路由处理器
export function catchAsync(fn: AsyncFunction) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// 使用示例
app.get('/users/:id', catchAsync(async (req, res) => {
  const user = await userService.findById(req.params.id)
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  res.json(user)
}))
```

## 实战案例

### 文件上传服务

```typescript
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'

const app = express()

// 配置存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads'
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// 单文件上传
app.post('/upload/single', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  
  res.json({
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    },
  })
})

// 多文件上传
app.post('/upload/multiple', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }
  
  const files = (req.files as Express.Multer.File[]).map(file => ({
    filename: file.filename,
    path: file.path,
    size: file.size,
  }))
  
  res.json({
    message: `${files.length} files uploaded successfully`,
    files,
  })
})
```

### 定时任务

```typescript
import cron from 'node-cron'
import { UserService } from './services/user.service'

// 每天凌晨 2 点清理过期用户
cron.schedule('0 2 * * *', async () => {
  console.log('Running cleanup task...')
  
  const userService = new UserService()
  const deleted = await userService.deleteInactiveUsers()
  
  console.log(`Deleted ${deleted} inactive users`)
})

// 每小时生成报告
cron.schedule('0 * * * *', async () => {
  console.log('Generating hourly report...')
  // 生成报告逻辑
})

// 使用 Agenda 进行持久化任务调度
import { Agenda } from 'agenda'

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI! },
})

// 定义任务
agenda.define('send email', async (job) => {
  const { to, subject, body } = job.attrs.data
  // 发送邮件逻辑
  console.log(`Sending email to ${to}`)
})

// 调度任务
await agenda.start()
await agenda.schedule('in 1 hour', 'send email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Hello!',
})
```

### WebSocket 实时通信

```typescript
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    socket.data.user = payload
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
})

// 连接处理
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.user.id}`)
  
  // 加入房间
  socket.on('join room', (roomId: string) => {
    socket.join(roomId)
    console.log(`User ${socket.data.user.id} joined room ${roomId}`)
  })
  
  // 发送消息
  socket.on('message', (data: { roomId: string; message: string }) => {
    io.to(data.roomId).emit('message', {
      userId: socket.data.user.id,
      message: data.message,
      timestamp: new Date(),
    })
  })
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.user.id}`)
  })
})

httpServer.listen(3000)
```

## 小结

Node.js 实战开发需要掌握以下核心要点：

1. **核心概念**：理解事件循环、异步编程、流处理等基础
2. **框架实践**：Express 灵活简洁，Fastify 高性能类型安全
3. **中间件设计**：合理分层，关注单一职责
4. **错误处理**：统一错误类型，完善错误边界

通过合理的架构设计和工程化实践，可以构建出高性能、可维护的 Node.js 后端服务。
