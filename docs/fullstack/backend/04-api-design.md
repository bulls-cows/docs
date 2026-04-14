---
order: 40
---

# API 设计规范

良好的 API 设计是前后端协作的基础。本文将介绍 RESTful API 设计原则、tRPC 端到端类型安全方案、GraphQL 入门以及 API 文档生成。

## RESTful API 设计原则

### 资源命名

RESTful API 以资源为中心，URL 表示资源路径。

**命名规范：**

- 使用名词复数形式
- 使用小写字母和连字符
- 避免动词，通过 HTTP 方法表达操作
- 表达层级关系

```text
# 推荐
GET    /users                 # 获取用户列表
GET    /users/123             # 获取指定用户
POST   /users                 # 创建用户
PUT    /users/123             # 更新用户（完整）
PATCH  /users/123             # 更新用户（部分）
DELETE /users/123             # 删除用户

GET    /users/123/posts       # 获取用户的文章列表
GET    /posts/456/comments    # 获取文章的评论列表

# 不推荐
GET    /getUsers
POST   /createUser
DELETE /deleteUser/123
GET    /user-posts/123
```

### HTTP 方法语义

| 方法 | 语义 | 幂等性 | 安全性 |
|------|------|--------|--------|
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 | 否 | 否 |
| PUT | 完整更新资源 | 是 | 否 |
| PATCH | 部分更新资源 | 否 | 否 |
| DELETE | 删除资源 | 是 | 否 |

```typescript
// Express 路由示例
import { Router } from 'express'

const router = Router()

// 获取用户列表
router.get('/users', async (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt' } = req.query
  const users = await userService.findAll({ page, limit, sort })
  res.json(users)
})

// 获取单个用户
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

// 创建用户
router.post('/users', async (req, res) => {
  const user = await userService.create(req.body)
  res.status(201).json(user)
})

// 完整更新用户
router.put('/users/:id', async (req, res) => {
  const user = await userService.update(req.params.id, req.body)
  res.json(user)
})

// 部分更新用户
router.patch('/users/:id', async (req, res) => {
  const user = await userService.patch(req.params.id, req.body)
  res.json(user)
})

// 删除用户
router.delete('/users/:id', async (req, res) => {
  await userService.delete(req.params.id)
  res.status(204).send()
})
```

### 状态码规范

正确使用 HTTP 状态码传达请求结果。

**常用状态码：**

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功响应 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 成功但无返回内容（删除） |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 验证失败 |
| 500 | Internal Server Error | 服务器错误 |

```typescript
// 统一响应格式
interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page: number
    limit: number
    total: number
  }
}

// 成功响应
res.status(200).json({
  data: { id: 1, name: 'John Doe' },
})

// 创建成功
res.status(201).json({
  data: { id: 1, name: 'John Doe' },
})

// 错误响应
res.status(400).json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: [
      { field: 'email', message: 'Invalid email format' },
    ],
  },
})

// 分页响应
res.status(200).json({
  data: users,
  meta: {
    page: 1,
    limit: 10,
    total: 100,
  },
})
```

### 查询参数

```typescript
// 分页
GET /users?page=1&limit=10

// 排序
GET /users?sort=createdAt:desc,name:asc

// 过滤
GET /users?status=active&role=admin

// 字段选择
GET /users?fields=id,name,email

// 搜索
GET /users?search=john

// 实现示例
router.get('/users', async (req, res) => {
  const { 
    page = 1, 
    limit = 10,
    sort = 'createdAt:desc',
    search,
    status,
    fields,
  } = req.query

  const query: any = {}
  
  // 过滤条件
  if (status) query.status = status
  
  // 搜索
  if (search) {
    query.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }

  // 排序
  const [sortField, sortOrder] = sort.split(':')
  const orderBy = { [sortField]: sortOrder }

  // 字段选择
  const select = fields 
    ? fields.split(',').reduce((acc, f) => ({ ...acc, [f]: true }), {})
    : undefined

  const result = await prisma.user.findMany({
    where: query,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy,
    select,
  })

  res.json({
    data: result,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: await prisma.user.count({ where: query }),
    },
  })
})
```

## tRPC 端到端类型安全

tRPC 提供端到端类型安全，无需定义 Schema 即可获得完整的类型推导。

### 基本配置

```typescript
// server/trpc.ts
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

// server/routers/user.ts
import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

export const userRouter = router({
  // 获取用户列表
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      })
      return users
    }),

  // 获取单个用户
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      })
      return user
    }),

  // 创建用户
  create: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.create({
        data: input,
      })
      return user
    }),

  // 更新用户
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const user = await prisma.user.update({
        where: { id },
        data,
      })
      return user
    }),
})

// server/index.ts
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { userRouter } from './routers/user'

const appRouter = router({
  user: userRouter,
})

export type AppRouter = typeof appRouter

createHTTPServer({
  router: appRouter,
}).listen(3000)
```

### 前端集成

```typescript
// client/trpc.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
})

// 使用示例
async function main() {
  // 自动类型推导
  const users = await trpc.user.list.query({ page: 1, limit: 10 })
  
  const user = await trpc.user.byId.query({ id: '1' })
  
  const newUser = await trpc.user.create.mutate({
    name: 'John Doe',
    email: 'john@example.com',
  })
}
```

### React 集成

```typescript
// client/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../server'

export const trpc = createTRPCReact<AppRouter>()

// client/App.tsx
import { trpc } from './trpc'

function App() {
  const utils = trpc.useUtils()
  
  // 查询
  const { data: users, isLoading } = trpc.user.list.useQuery({
    page: 1,
    limit: 10,
  })

  // 变更
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      // 刷新列表
      utils.user.list.invalidate()
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      name: 'John Doe',
      email: 'john@example.com',
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button onClick={handleCreate}>Create User</button>
    </div>
  )
}
```

### 中间件与认证

```typescript
// server/trpc.ts
import { initTRPC } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

// 认证中间件
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)

// server/routers/post.ts
export const postRouter = router({
  // 公开接口
  list: publicProcedure.query(async () => {
    return prisma.post.findMany({ where: { published: true } })
  }),

  // 需要认证的接口
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      })
    }),

  // 仅管理员可访问
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(async ({ ctx, next }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return next()
    })
    .mutation(async ({ input }) => {
      await prisma.post.delete({ where: { id: input.id } })
    }),
})
```

## GraphQL 入门

GraphQL 提供灵活的查询语言，客户端可以精确指定所需数据。

### Schema 定义

```typescript
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLID } from 'graphql'

// 定义类型
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    posts: {
      type: new GraphQLList(PostType),
      resolve: (user) => prisma.post.findMany({ where: { authorId: user.id } }),
    },
  }),
})

const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    author: {
      type: UserType,
      resolve: (post) => prisma.user.findUnique({ where: { id: post.authorId } }),
    },
  }),
})

// 查询
const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: () => prisma.user.findMany(),
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve: (_, { id }) => prisma.user.findUnique({ where: { id } }),
    },
  },
})

// 变更
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserType,
      args: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
      },
      resolve: (_, { name, email }) => prisma.user.create({ data: { name, email } }),
    },
  },
})

export const schema = new GraphQLSchema({ query: Query, mutation: Mutation })
```

### Apollo Server

```typescript
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

// Schema 定义（SDL）
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String
    author: User!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String, authorId: ID!): Post!
  }
`

// Resolvers
const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_, { id }) => prisma.user.findUnique({ where: { id } }),
    posts: () => prisma.post.findMany(),
  },
  Mutation: {
    createUser: (_, { name, email }) => 
      prisma.user.create({ data: { name, email } }),
    createPost: (_, { title, content, authorId }) =>
      prisma.post.create({ data: { title, content, authorId } }),
  },
  User: {
    posts: (user) => prisma.post.findMany({ where: { authorId: user.id } }),
  },
  Post: {
    author: (post) => prisma.user.findUnique({ where: { id: post.authorId } }),
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

await startStandaloneServer(server, { listen: { port: 4000 } })
```

### 查询示例

```graphql
# 获取用户列表及其文章
query GetUsersWithPosts {
  users {
    id
    name
    email
    posts {
      id
      title
    }
  }
}

# 获取单个用户
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      id
      title
      content
    }
  }
}

# 创建用户
mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
    name
    email
  }
}
```

## API 版本管理

### URL 版本控制

```typescript
// 推荐：路径版本
/api/v1/users
/api/v2/users

// Express 实现
app.use('/api/v1', v1Routes)
app.use('/api/v2', v2Routes)
```

### Header 版本控制

```typescript
app.use((req, res, next) => {
  const version = req.headers['accept-version'] || 'v1'
  req.apiVersion = version
  next()
})

// 路由处理
router.get('/users', async (req, res) => {
  if (req.apiVersion === 'v2') {
    return res.json(await userService.findAllV2())
  }
  res.json(await userService.findAll())
})
```

### 版本废弃策略

```typescript
// 添加废弃警告头
router.get('/api/v1/users', async (req, res) => {
  res.setHeader('X-API-Warn', 'This endpoint is deprecated. Use /api/v2/users instead.')
  res.setHeader('Deprecation', 'true')
  res.setHeader('Sunset', 'Sat, 31 Dec 2024 23:59:59 GMT')
  
  const users = await userService.findAll()
  res.json(users)
})
```

## 文档生成

### OpenAPI/Swagger

```typescript
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
  },
  apis: ['./src/routes/*.ts'],
}

const specs = swaggerJsdoc(options)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// 路由注释
/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/users', userController.getUsers)

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post('/users', userController.createUser)
```

### tRPC 自动文档

tRPC 自动生成类型定义，配合工具可获得完整的类型文档：

```typescript
// 使用 @trpc/openapi 生成 OpenAPI 文档
import { generateOpenApiDocument } from '@trpc/openapi'

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'My API',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000',
})
```

## 小结

API 设计需要遵循一致的原则和规范：

1. **RESTful 设计**：资源命名、HTTP 方法语义、状态码规范
2. **tRPC**：端到端类型安全，适合 TypeScript 全栈项目
3. **GraphQL**：灵活查询，适合复杂数据需求
4. **版本管理**：合理规划 API 演进策略
5. **文档生成**：自动生成 API 文档，提升协作效率

选择合适的 API 设计方案，能够显著提升开发效率和前后端协作质量。
