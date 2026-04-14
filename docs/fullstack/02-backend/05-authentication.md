---
order: 50
---

# 认证与授权

认证（Authentication）和授权（Authorization）是应用安全的基石。本文将介绍主流认证方案、权限控制模型和安全最佳实践。

## 认证方案对比

### Session 认证

传统的服务器端会话管理方式。

**工作流程：**

1. 用户登录，服务器创建 Session
2. 服务器返回 Session ID（通过 Cookie）
3. 后续请求携带 Cookie，服务器验证 Session

**优点：**

- 实现简单
- 服务器可主动注销
- 安全性较高（Session ID 可随时失效）

**缺点：**

- 服务器需要存储 Session
- 不易扩展（需要 Session 共享）
- CSRF 风险

```typescript
import express from 'express'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'

const app = express()

// Redis 存储 Session
const redisClient = createClient({ url: 'redis://localhost:6379' })
await redisClient.connect()

const redisStore = new RedisStore({ client: redisClient })

app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS
    httpOnly: true, // 防止 XSS
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
    sameSite: 'strict', // 防止 CSRF
  },
}))

// 登录
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await userService.findByEmail(email)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  req.session.userId = user.id
  req.session.userRole = user.role

  res.json({ message: 'Login successful', user: { id: user.id, name: user.name } })
})

// 登出
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' })
    res.clearCookie('connect.sid')
    res.json({ message: 'Logout successful' })
  })
})

// 认证中间件
export const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// 使用
app.get('/profile', requireAuth, async (req, res) => {
  const user = await userService.findById(req.session.userId)
  res.json(user)
})
```

### JWT 认证

无状态的令牌认证方式。

**工作流程：**

1. 用户登录，服务器生成 JWT
2. 客户端存储 JWT（localStorage/Cookie）
3. 后续请求携带 JWT，服务器验证签名

**优点：**

- 无状态，易扩展
- 跨域友好
- 可携带自定义信息

**缺点：**

- 无法主动注销（需要黑名单）
- Token 较大
- 续期处理复杂

```typescript
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

// 生成 Token
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  )

  return { accessToken, refreshToken }
}

// 验证 Token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch (error) {
    return null
  }
}

// 登录
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await userService.findByEmail(email)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const { accessToken, refreshToken } = generateTokens(user.id)

  // 存储 refresh token（可选，用于注销）
  await redisClient.set(`refresh:${user.id}`, refreshToken, { EX: 7 * 24 * 60 * 60 })

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name },
  })
})

// 刷新 Token
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body

  const payload = verifyToken(refreshToken)
  if (!payload || !('type' in payload)) {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }

  // 检查是否在黑名单
  const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`)
  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token revoked' })
  }

  const tokens = generateTokens(payload.userId)
  res.json(tokens)
})

// 登出
app.post('/logout', async (req, res) => {
  const { refreshToken } = req.body
  
  // 将 refresh token 加入黑名单
  await redisClient.set(`blacklist:${refreshToken}`, '1', { EX: 7 * 24 * 60 * 60 })
  
  res.json({ message: 'Logout successful' })
})

// JWT 认证中间件
export const authenticate = (req: any, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = payload
  next()
}
```

### OAuth 2.0

第三方授权协议，用于社交登录等场景。

**授权流程：**

1. 用户点击第三方登录
2. 重定向到授权服务器
3. 用户授权后回调，携带授权码
4. 服务器用授权码换取访问令牌

```typescript
import axios from 'axios'

// GitHub OAuth
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!
const GITHUB_REDIRECT_URI = 'http://localhost:3000/auth/github/callback'

// 发起授权
app.get('/auth/github', (req, res) => {
  const state = crypto.randomUUID()
  
  // 存储 state 用于验证
  redisClient.set(`oauth_state:${state}`, '1', { EX: 300 })

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', GITHUB_CLIENT_ID)
  url.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI)
  url.searchParams.set('scope', 'user:email')
  url.searchParams.set('state', state)

  res.redirect(url.toString())
})

// 回调处理
app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query

  // 验证 state
  const validState = await redisClient.get(`oauth_state:${state}`)
  if (!validState) {
    return res.status(400).json({ error: 'Invalid state' })
  }
  await redisClient.del(`oauth_state:${state}`)

  // 用授权码换取访问令牌
  const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: GITHUB_REDIRECT_URI,
  }, {
    headers: { Accept: 'application/json' },
  })

  const accessToken = tokenResponse.data.access_token

  // 获取用户信息
  const userResponse = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const githubUser = userResponse.data

  // 查找或创建用户
  let user = await userService.findByGithubId(githubUser.id)
  if (!user) {
    user = await userService.create({
      githubId: githubUser.id,
      name: githubUser.name || githubUser.login,
      email: githubUser.email,
      avatar: githubUser.avatar_url,
    })
  }

  // 生成本地 Token
  const tokens = generateTokens(user.id)

  // 重定向到前端
  res.redirect(`http://localhost:5173/auth/callback?token=${tokens.accessToken}`)
})
```

### 认证方案对比与选型

| 特性 | Session | JWT | OAuth |
|------|---------|-----|-------|
| 状态 | 有状态 | 无状态 | 无状态 |
| 扩展性 | 需共享存储 | 易扩展 | 易扩展 |
| 注销 | 简单 | 需黑名单 | 依赖提供方 |
| 跨域 | 复杂 | 简单 | 简单 |
| 安全性 | 高 | 中 | 高 |
| 适用场景 | 传统 Web | API/微服务 | 社交登录 |

**选型建议：**

- **传统 Web 应用**：Session 认证
- **前后端分离/API**：JWT 认证
- **需要第三方登录**：OAuth
- **高安全要求**：Session + JWT 双 Token

## 权限控制模型

### RBAC（基于角色的访问控制）

最常用的权限模型，用户通过角色获得权限。

```typescript
// 权限定义
enum Permission {
  // 用户管理
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  // 文章管理
  POST_READ = 'post:read',
  POST_WRITE = 'post:write',
  POST_DELETE = 'post:delete',
  // 系统管理
  ADMIN_ACCESS = 'admin:access',
}

// 角色定义
const rolePermissions: Record<string, Permission[]> = {
  guest: [Permission.POST_READ],
  user: [Permission.POST_READ, Permission.POST_WRITE],
  editor: [Permission.POST_READ, Permission.POST_WRITE, Permission.POST_DELETE],
  admin: Object.values(Permission),
}

// 用户角色
interface User {
  id: string
  name: string
  roles: string[]
}

// 获取用户所有权限
function getUserPermissions(user: User): Permission[] {
  const permissions = new Set<Permission>()
  
  for (const role of user.roles) {
    const rolePerms = rolePermissions[role] || []
    rolePerms.forEach(p => permissions.add(p))
  }
  
  return Array.from(permissions)
}

// 权限检查中间件
export function requirePermission(...permissions: Permission[]) {
  return (req: any, res: express.Response, next: express.NextFunction) => {
    const userPermissions = getUserPermissions(req.user)
    
    const hasPermission = permissions.every(p => userPermissions.includes(p))
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    next()
  }
}

// 使用示例
app.delete('/users/:id', 
  authenticate,
  requirePermission(Permission.USER_DELETE),
  userController.deleteUser
)

app.get('/admin', 
  authenticate,
  requirePermission(Permission.ADMIN_ACCESS),
  adminController.dashboard
)
```

### ABAC（基于属性的访问控制）

更灵活的权限模型，基于属性动态判断。

```typescript
// 属性定义
interface Resource {
  type: string
  ownerId?: string
  status?: string
  visibility?: 'public' | 'private' | 'team'
}

interface Policy {
  effect: 'allow' | 'deny'
  actions: string[]
  resources: string[]
  conditions: Condition[]
}

interface Condition {
  type: 'equals' | 'notEquals' | 'in' | 'notIn'
  attribute: string
  value: any
}

// 策略示例
const policies: Policy[] = [
  {
    effect: 'allow',
    actions: ['post:read'],
    resources: ['post:*'],
    conditions: [
      { type: 'equals', attribute: 'resource.visibility', value: 'public' },
    ],
  },
  {
    effect: 'allow',
    actions: ['post:read', 'post:update', 'post:delete'],
    resources: ['post:*'],
    conditions: [
      { type: 'equals', attribute: 'resource.ownerId', value: 'user.id' },
    ],
  },
  {
    effect: 'allow',
    actions: ['post:*'],
    resources: ['post:*'],
    conditions: [
      { type: 'in', attribute: 'user.role', value: ['admin', 'editor'] },
    ],
  },
]

// 策略引擎
class PolicyEngine {
  constructor(private policies: Policy[]) {}

  evaluate(
    user: any,
    action: string,
    resource: Resource
  ): boolean {
    for (const policy of this.policies) {
      // 检查动作
      if (!this.matchAction(action, policy.actions)) continue
      
      // 检查资源
      if (!this.matchResource(resource.type, policy.resources)) continue
      
      // 检查条件
      if (this.evaluateConditions(user, resource, policy.conditions)) {
        return policy.effect === 'allow'
      }
    }
    
    return false
  }

  private matchAction(action: string, patterns: string[]): boolean {
    return patterns.some(p => 
      p === action || p === '*' || p.endsWith(':*') && action.startsWith(p.slice(0, -1))
    )
  }

  private matchResource(type: string, patterns: string[]): boolean {
    return patterns.some(p => 
      p === type || p === '*' || p === `${type}:*`
    )
  }

  private evaluateConditions(
    user: any,
    resource: Resource,
    conditions: Condition[]
  ): boolean {
    return conditions.every(cond => {
      const attributeValue = this.getAttributeValue(cond.attribute, user, resource)
      
      switch (cond.type) {
        case 'equals':
          return attributeValue === cond.value
        case 'notEquals':
          return attributeValue !== cond.value
        case 'in':
          return Array.isArray(cond.value) && cond.value.includes(attributeValue)
        case 'notIn':
          return Array.isArray(cond.value) && !cond.value.includes(attributeValue)
        default:
          return false
      }
    })
  }

  private getAttributeValue(path: string, user: any, resource: Resource): any {
    const parts = path.split('.')
    const root = parts[0]
    const rest = parts.slice(1)
    
    let value = root === 'user' ? user : resource
    
    for (const key of rest) {
      value = value?.[key]
    }
    
    return value
  }
}

// 使用示例
const engine = new PolicyEngine(policies)

app.put('/posts/:id', authenticate, async (req, res) => {
  const post = await postService.findById(req.params.id)
  
  const allowed = engine.evaluate(
    req.user,
    'post:update',
    { type: 'post', ownerId: post.authorId }
  )
  
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  const updated = await postService.update(req.params.id, req.body)
  res.json(updated)
})
```

## 安全最佳实践

### 密码安全

```typescript
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const SALT_ROUNDS = 12

// 密码哈希
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// 密码验证
async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 密码强度验证
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return { valid: errors.length === 0, errors }
}
```

### 防止常见攻击

```typescript
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss'

// 安全头
app.use(helmet())

// 速率限制
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 次请求
  message: { error: 'Too many requests' },
}))

// 防止 NoSQL 注入
app.use(mongoSanitize())

// XSS 防护
function sanitizeInput(input: string): string {
  return xss(input)
}

// CSRF 防护（Session 方式）
import csrf from 'csurf'
app.use(csrf({ cookie: true }))

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// SQL 注入防护（使用参数化查询）
// 不安全
const unsafeQuery = `SELECT * FROM users WHERE id = ${userId}`

// 安全（Prisma 自动参数化）
const user = await prisma.user.findUnique({ where: { id: userId } })

// 安全（Knex 参数化）
const user = await knex('users').where('id', userId).first()
```

### 安全响应头

```typescript
// 自定义安全头
app.use((req, res, next) => {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY')
  
  // 防止 MIME 类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // XSS 保护
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // 内容安全策略
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  )
  
  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // 权限策略
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  
  next()
})
```

## 实战实现

### 完整认证系统

```typescript
// auth.service.ts
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { sendEmail } from './email'

export class AuthService {
  // 注册
  async register(data: { email: string; password: string; name: string }) {
    // 检查邮箱是否已存在
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    
    if (existing) {
      throw new Error('Email already registered')
    }
    
    // 哈希密码
    const hashedPassword = await bcrypt.hash(data.password, 12)
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'user',
      },
    })
    
    // 发送验证邮件
    const verifyToken = jwt.sign(
      { userId: user.id, type: 'verify' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      body: `Click here to verify: http://localhost:3000/verify?token=${verifyToken}`,
    })
    
    return { id: user.id, email: user.email, name: user.name }
  }

  // 登录
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user || !user.password) {
      throw new Error('Invalid credentials')
    }
    
    if (!user.emailVerified) {
      throw new Error('Please verify your email first')
    }
    
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw new Error('Invalid credentials')
    }
    
    // 生成 Token
    const accessToken = this.generateAccessToken(user.id)
    const refreshToken = this.generateRefreshToken(user.id)
    
    // 存储 refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }
  }

  // 刷新 Token
  async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })
    
    if (!stored || stored.expiresAt < new Date()) {
      throw new Error('Invalid refresh token')
    }
    
    // 删除旧的 refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } })
    
    // 生成新的 Token
    const accessToken = this.generateAccessToken(stored.userId)
    const newRefreshToken = this.generateRefreshToken(stored.userId)
    
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    
    return { accessToken, refreshToken: newRefreshToken }
  }

  // 登出
  async logout(refreshToken: string) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } })
  }

  // 邮箱验证
  async verifyEmail(token: string) {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: new Date() },
    })
  }

  // 忘记密码
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) return // 不透露用户是否存在
    
    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )
    
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      body: `Click here to reset: http://localhost:3000/reset-password?token=${resetToken}`,
    })
  }

  // 重置密码
  async resetPassword(token: string, newPassword: string) {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    })
    
    // 删除所有 refresh token
    await prisma.refreshToken.deleteMany({
      where: { userId: payload.userId },
    })
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
  }
}
```

## 小结

认证与授权是应用安全的核心：

1. **认证方案**：Session 适合传统 Web，JWT 适合 API，OAuth 适合第三方登录
2. **权限模型**：RBAC 简单易用，ABAC 灵活精细
3. **安全实践**：密码哈希、防注入、安全头、速率限制
4. **完整实现**：包含注册、登录、刷新、注销、邮箱验证、密码重置

安全是一个持续的过程，需要不断更新和加固。
