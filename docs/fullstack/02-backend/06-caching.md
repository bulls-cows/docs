---
order: 60
---

# 缓存策略

缓存是提升应用性能的重要手段。本文将介绍缓存策略概览、Redis 实践、应用层缓存、CDN 缓存和缓存失效策略。

## 缓存策略概览

### 缓存层次

现代应用通常采用多层缓存架构：

```text
┌─────────────────────────────────────────┐
│           客户端缓存                      │
│  (Browser Cache, Service Worker)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           CDN 缓存                        │
│  (CloudFlare, AWS CloudFront)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           负载均衡缓存                    │
│  (Nginx, HAProxy)                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           应用层缓存                      │
│  (In-Memory Cache, Node Cache)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           分布式缓存                      │
│  (Redis, Memcached)                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           数据库缓存                      │
│  (Query Cache, Buffer Pool)             │
└─────────────────────────────────────────┘
```

### 缓存模式

**1. Cache-Aside（旁路缓存）**

最常用的缓存模式，应用程序负责维护缓存。

```typescript
// 读取流程
async function getUser(id: string) {
  // 1. 先查缓存
  const cached = await redis.get(`user:${id}`)
  if (cached) {
    return JSON.parse(cached)
  }

  // 2. 缓存未命中，查数据库
  const user = await db.user.findUnique({ where: { id } })
  
  // 3. 写入缓存
  if (user) {
    await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600)
  }
  
  return user
}

// 更新流程
async function updateUser(id: string, data: any) {
  // 1. 更新数据库
  const user = await db.user.update({ where: { id }, data })
  
  // 2. 删除缓存（下次读取时重新加载）
  await redis.del(`user:${id}`)
  
  return user
}
```

**2. Write-Through（直写缓存）**

写入时同时更新缓存和数据库。

```typescript
async function createUser(data: any) {
  // 同时写入数据库和缓存
  const user = await db.user.create({ data })
  await redis.set(`user:${user.id}`, JSON.stringify(user), 'EX', 3600)
  return user
}

async function updateUser(id: string, data: any) {
  // 同时更新数据库和缓存
  const user = await db.user.update({ where: { id }, data })
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600)
  return user
}
```

**3. Write-Behind（写回缓存）**

先写缓存，异步写入数据库。

```typescript
import { Queue } from 'bullmq'

const writeQueue = new Queue('write-behind')

async function updateUser(id: string, data: any) {
  // 1. 更新缓存
  const user = { id, ...data, updatedAt: new Date() }
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600)
  
  // 2. 异步写入数据库
  await writeQueue.add('update-user', { id, data })
  
  return user
}

// 后台任务处理
const worker = new Worker('write-behind', async (job) => {
  if (job.name === 'update-user') {
    await db.user.update({ 
      where: { id: job.data.id }, 
      data: job.data.data 
    })
  }
})
```

### 缓存策略对比

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Cache-Aside | 实现简单，灵活性高 | 可能出现脏读 | 读多写少 |
| Write-Through | 数据一致性好 | 写入延迟高 | 读写均衡 |
| Write-Behind | 写入性能高 | 可能丢数据 | 写多读少 |

## Redis 实践

### 基础配置

```typescript
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed')
        return new Error('Redis connection failed')
      }
      return Math.min(retries * 100, 3000)
    },
  },
})

redis.on('error', (err) => console.error('Redis error:', err))
await redis.connect()

export default redis
```

### 数据结构应用

```typescript
// 1. 字符串 - 简单键值
await redis.set('config:site_name', 'My App')
await redis.set('session:abc123', JSON.stringify({ userId: 1 }), 'EX', 3600)

// 2. 哈希 - 对象存储
await redis.hSet('user:1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: '30',
})
const user = await redis.hGetAll('user:1')

// 3. 列表 - 队列/栈
await redis.lPush('notifications:1', 'New message')
await redis.lPush('notifications:1', 'New like')
const latest = await redis.lRange('notifications:1', 0, 9)

// 4. 集合 - 唯一值
await redis.sAdd('tags:post:1', ['javascript', 'typescript', 'nodejs'])
const tags = await redis.sMembers('tags:post:1')

// 5. 有序集合 - 排行榜
await redis.zAdd('leaderboard', [
  { score: 100, value: 'user:1' },
  { score: 200, value: 'user:2' },
  { score: 150, value: 'user:3' },
])
const top10 = await redis.zRangeWithScores('leaderboard', 0, 9, { REV: true })

// 6. 位图 - 用户签到
await redis.setBit('signin:2024:01', 1, 1) // 用户 1 签到
await redis.setBit('signin:2024:01', 2, 1) // 用户 2 签到
const signedCount = await redis.bitCount('signin:2024:01')

// 7. HyperLogLog - 基数统计
await redis.pfAdd('uv:page:home', 'user1', 'user2', 'user3')
const uv = await redis.pfCount('uv:page:home')
```

### 缓存封装

```typescript
// cache.service.ts
import redis from './redis'

export class CacheService {
  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  // 设置缓存
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    await redis.del(key)
  }

  // 批量删除
  async delPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    return redis.del(keys)
  }

  // 获取或设置（缓存穿透保护）
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await this.set(key, data, ttl)
    return data
  }

  // 带锁的缓存更新
  async getOrSetWithLock<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600,
    lockTimeout: number = 10
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const lockKey = `lock:${key}`
    const lock = await redis.set(lockKey, '1', 'NX', 'EX', lockTimeout)
    
    if (lock) {
      try {
        const data = await fetcher()
        await this.set(key, data, ttl)
        return data
      } finally {
        await redis.del(lockKey)
      }
    } else {
      // 等待并重试
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.getOrSetWithLock(key, fetcher, ttl, lockTimeout)
    }
  }
}

export const cache = new CacheService()
```

### 分布式锁

```typescript
// lock.service.ts
import redis from './redis'

export class LockService {
  // 获取锁
  async acquire(key: string, ttl: number = 10): Promise<boolean> {
    const result = await redis.set(`lock:${key}`, '1', 'NX', 'EX', ttl)
    return result === 'OK'
  }

  // 释放锁
  async release(key: string): Promise<void> {
    await redis.del(`lock:${key}`)
  }

  // 使用锁执行任务
  async withLock<T>(
    key: string,
    task: () => Promise<T>,
    ttl: number = 10
  ): Promise<T | null> {
    const acquired = await this.acquire(key, ttl)
    if (!acquired) {
      return null
    }

    try {
      return await task()
    } finally {
      await this.release(key)
    }
  }
}

export const lock = new LockService()

// 使用示例
async function processOrder(orderId: string) {
  const result = await lock.withLock(`order:${orderId}`, async () => {
    // 执行订单处理逻辑
    const order = await db.order.findUnique({ where: { id: orderId } })
    // ... 处理逻辑
    return order
  })

  if (!result) {
    throw new Error('Order is being processed by another instance')
  }
}
```

## 应用层缓存

### 内存缓存

```typescript
// memory-cache.ts
interface CacheItem<T> {
  value: T
  expiresAt: number
}

export class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (item.expiresAt < now) {
          this.cache.delete(key)
        }
      }
    }, 60000) // 每分钟清理一次
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  set(key: string, value: any, ttl: number = 3600): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    })
  }

  del(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

export const memoryCache = new MemoryCache()
```

### LRU 缓存

```typescript
// lru-cache.ts
interface LRUNode<K, V> {
  key: K
  value: V
  prev: LRUNode<K, V> | null
  next: LRUNode<K, V> | null
}

export class LRUCache<K, V> {
  private capacity: number
  private cache = new Map<K, LRUNode<K, V>>()
  private head: LRUNode<K, V> | null = null
  private tail: LRUNode<K, V> | null = null

  constructor(capacity: number) {
    this.capacity = capacity
  }

  get(key: K): V | null {
    const node = this.cache.get(key)
    if (!node) return null

    // 移动到头部
    this.moveToHead(node)
    return node.value
  }

  set(key: K, value: V): void {
    let node = this.cache.get(key)

    if (node) {
      node.value = value
      this.moveToHead(node)
    } else {
      node = { key, value, prev: null, next: null }
      this.cache.set(key, node)
      this.addToHead(node)

      if (this.cache.size > this.capacity) {
        this.removeTail()
      }
    }
  }

  delete(key: K): void {
    const node = this.cache.get(key)
    if (!node) return

    this.removeNode(node)
    this.cache.delete(key)
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }
    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  private removeTail(): void {
    if (!this.tail) return

    this.cache.delete(this.tail.key)
    this.removeNode(this.tail)
  }
}
```

### 装饰器缓存

```typescript
// cache-decorator.ts
import redis from './redis'

export function Cacheable(key: string, ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`
      
      // 尝试从缓存获取
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)
      
      // 写入缓存
      await redis.set(cacheKey, JSON.stringify(result), 'EX', ttl)
      
      return result
    }

    return descriptor
  }
}

// 使用示例
class UserService {
  @Cacheable('user', 3600)
  async findById(id: string) {
    return db.user.findUnique({ where: { id } })
  }

  @Cacheable('user:list', 300)
  async findAll(page: number, limit: number) {
    return db.user.findMany({ skip: (page - 1) * limit, take: limit })
  }
}
```

## CDN 缓存

### 静态资源缓存

```typescript
// Express 静态文件配置
import express from 'express'

const app = express()

// 静态资源缓存
app.use(express.static('public', {
  maxAge: '1y', // 1 年缓存
  immutable: true, // 资源不可变
  etag: true, // 启用 ETag
  lastModified: true, // 启用 Last-Modified
}))

// API 响应缓存控制
app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300') // 5 分钟
  res.json({ data: '...' })
})

// 禁用缓存
app.get('/api/realtime', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ data: '...' })
})
```

### CDN 配置建议

```nginx
# Nginx 配置
server {
    # 静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }

    # HTML 文件（短缓存）
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # API 代理
    location /api/ {
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        add_header X-Cache-Status $upstream_cache_status;
        proxy_pass http://backend;
    }
}
```

## 缓存失效策略

### TTL 策略

```typescript
// 不同数据类型的 TTL
const TTL_CONFIG = {
  // 会话数据
  session: 3600, // 1 小时
  refreshToken: 7 * 24 * 3600, // 7 天

  // 用户数据
  userProfile: 3600, // 1 小时
  userPermissions: 1800, // 30 分钟

  // 内容数据
  article: 3600, // 1 小时
  articleList: 300, // 5 分钟
  comment: 600, // 10 分钟

  // 统计数据
  viewCount: 60, // 1 分钟
  leaderboard: 300, // 5 分钟

  // 配置数据
  siteConfig: 86400, // 1 天
}
```

### 主动失效

```typescript
// 缓存失效服务
export class CacheInvalidator {
  // 用户更新时失效相关缓存
  async invalidateUser(userId: string) {
    const keys = [
      `user:${userId}`,
      `user:profile:${userId}`,
      `user:permissions:${userId}`,
    ]
    await Promise.all(keys.map(key => redis.del(key)))
  }

  // 文章更新时失效相关缓存
  async invalidateArticle(articleId: string) {
    const keys = [
      `article:${articleId}`,
      'article:list',
      'article:featured',
    ]
    await Promise.all(keys.map(key => redis.del(key)))
  }

  // 批量失效
  async invalidatePattern(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }
}

export const cacheInvalidator = new CacheInvalidator()

// 使用示例
async function updateArticle(articleId: string, data: any) {
  const article = await db.article.update({ where: { id: articleId }, data })
  await cacheInvalidator.invalidateArticle(articleId)
  return article
}
```

### 缓存预热

```typescript
// 预热服务
export class CacheWarmer {
  // 预热热门文章
  async warmArticles() {
    const hotArticles = await db.article.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: 100,
    })

    await Promise.all(
      hotArticles.map(article =>
        redis.set(
          `article:${article.id}`,
          JSON.stringify(article),
          'EX',
          3600
        )
      )
    )
  }

  // 预热用户权限
  async warmUserPermissions(userId: string) {
    const permissions = await this.fetchUserPermissions(userId)
    await redis.set(
      `user:permissions:${userId}`,
      JSON.stringify(permissions),
      'EX',
      1800
    )
  }

  // 定时预热
  startScheduledWarm() {
    // 每小时预热热门内容
    setInterval(() => this.warmArticles(), 3600000)
  }
}
```

### 缓存穿透防护

```typescript
// 布隆过滤器防护
import { BloomFilter } from 'bloom-filters'

export class CacheProtection {
  private bloomFilter: BloomFilter

  constructor() {
    // 初始化布隆过滤器
    this.bloomFilter = new BloomFilter(1000000, 0.01) // 100万数据，1%误判率
  }

  // 初始化布隆过滤器
  async init() {
    const ids = await db.user.findMany({ select: { id: true } })
    ids.forEach(({ id }) => this.bloomFilter.add(id))
  }

  // 检查数据是否存在
  async getWithProtection<T>(
    key: string,
    id: string,
    fetcher: () => Promise<T | null>
  ): Promise<T | null> {
    // 布隆过滤器检查
    if (!this.bloomFilter.has(id)) {
      return null
    }

    // 查询缓存
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }

    // 查询数据库
    const data = await fetcher()
    
    // 缓存空值（防止缓存穿透）
    if (data) {
      await redis.set(key, JSON.stringify(data), 'EX', 3600)
    } else {
      await redis.set(key, 'null', 'EX', 60) // 短时间缓存空值
    }

    return data
  }
}
```

### 缓存雪崩防护

```typescript
// 随机 TTL 防止雪崩
export class AvalancheProtection {
  // 添加随机偏移
  async setWithRandomTTL(key: string, value: any, baseTTL: number) {
    const randomOffset = Math.floor(Math.random() * baseTTL * 0.1) // 10% 随机偏移
    const ttl = baseTTL + randomOffset
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  }

  // 批量设置时使用不同 TTL
  async setManyWithStaggeredTTL(items: Array<{ key: string; value: any; baseTTL: number }>) {
    await Promise.all(
      items.map((item, index) => {
        const staggeredTTL = item.baseTTL + (index * 10) // 错开过期时间
        return redis.set(item.key, JSON.stringify(item.value), 'EX', staggeredTTL)
      })
    )
  }
}
```

## 小结

缓存策略需要根据业务场景合理设计：

1. **缓存层次**：多层缓存架构，从客户端到数据库逐层优化
2. **缓存模式**：Cache-Aside 最常用，Write-Through 保证一致性
3. **Redis 实践**：合理使用数据结构，封装缓存服务
4. **应用层缓存**：内存缓存、LRU 缓存、装饰器缓存
5. **失效策略**：TTL、主动失效、预热、穿透防护、雪崩防护

缓存是一把双刃剑，需要权衡性能和数据一致性，在实践中不断优化。
