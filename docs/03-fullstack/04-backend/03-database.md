
# 数据库设计

数据库是应用系统的核心组件，良好的数据库设计直接影响系统的性能、可维护性和扩展性。本文将介绍数据库设计原则、ORM 使用和查询优化策略。

## 关系型数据库设计原则

### 范式设计

范式是关系型数据库设计的基本规范，用于减少数据冗余和异常。

**三大范式：**

1. **第一范式（1NF）**：字段不可再分
2. **第二范式（2NF）**：非主键字段完全依赖主键
3. **第三范式（3NF）**：非主键字段不传递依赖主键

```sql
-- 违反第三范式（存在传递依赖）
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(100),
  user_email VARCHAR(100),  -- 传递依赖：user_email 依赖 user_name
  total DECIMAL(10, 2)
);

-- 符合第三范式
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total DECIMAL(10, 2)
);
```

### 反范式设计

在某些场景下，适当的反范式可以提高查询性能。

```sql
-- 订单表包含用户名称（冗余字段）
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  user_name VARCHAR(100),  -- 冗余字段，避免 JOIN
  total DECIMAL(10, 2),
  created_at TIMESTAMP
);

-- 适用场景：
-- 1. 读多写少
-- 2. 对查询性能要求高
-- 3. 数据变更频率低
```

### 索引设计

索引是提升查询性能的关键。

```sql
-- 主键索引
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 单列索引
CREATE INDEX idx_users_email ON users(email);

-- 复合索引（最左前缀原则）
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);

-- 部分索引
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- 全文索引
CREATE INDEX idx_posts_content ON posts USING gin(to_tsvector('english', content));
```

**索引设计原则：**

1. 为 WHERE、JOIN、ORDER BY 字段创建索引
2. 复合索引遵循最左前缀原则
3. 避免过多索引，影响写入性能
4. 定期分析索引使用情况

```sql
-- 查看索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 外键与约束

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 外键约束
  CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  
  -- 检查约束
  CONSTRAINT chk_total CHECK (total >= 0),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'paid', 'shipped', 'completed'))
);

-- 唯一约束
ALTER TABLE users ADD CONSTRAINT uk_email UNIQUE (email);
```

## NoSQL 选型

### MongoDB

文档型数据库，适合非结构化数据和快速迭代。

**适用场景：**

- 内容管理系统
- 日志分析
- 实时数据
- 地理位置应用

```typescript
// MongoDB Schema 设计
import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profile: {
    avatar: String,
    bio: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
  },
  roles: [{ type: String, enum: ['user', 'admin', 'moderator'] }],
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
})

// 地理位置索引
userSchema.index({ 'profile.location': '2dsphere' })

export const User = model('User', userSchema)

// 查询示例
const nearbyUsers = await User.find({
  'profile.location': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [116.4074, 39.9042], // 北京
      },
      $maxDistance: 5000, // 5km
    },
  },
})
```

### Redis

键值存储，适合缓存、会话、排行榜等场景。

**适用场景：**

- 缓存
- 会话存储
- 排行榜
- 消息队列
- 实时计数

```typescript
import { createClient } from 'redis'

const client = createClient({ url: 'redis://localhost:6379' })
await client.connect()

// 字符串操作
await client.set('user:1:name', 'John Doe', { EX: 3600 }) // 1小时过期
const name = await client.get('user:1:name')

// 哈希操作
await client.hSet('user:1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: '30',
})
const user = await client.hGetAll('user:1')

// 列表操作（消息队列）
await client.lPush('queue:emails', JSON.stringify({ to: 'user@example.com', subject: 'Hello' }))
const email = await client.rPop('queue:emails')

// 有序集合（排行榜）
await client.zAdd('leaderboard', { score: 100, value: 'user:1' })
await client.zAdd('leaderboard', { score: 200, value: 'user:2' })
const top10 = await client.zRangeWithScores('leaderboard', 0, 9, { REV: true })

// 发布订阅
const subscriber = client.duplicate()
await subscriber.connect()
await subscriber.subscribe('channel:notifications', (message) => {
  console.log('Received:', message)
})
await client.publish('channel:notifications', 'Hello World')
```

### PostgreSQL vs MongoDB 选型

| 特性 | PostgreSQL | MongoDB |
|------|------------|---------|
| 数据模型 | 关系型 | 文档型 |
| 事务支持 | ACID | 支持（4.0+） |
| 查询能力 | 强（SQL） | 灵活 |
| 扩展性 | 垂直扩展 | 水平扩展 |
| 适用场景 | 复杂关联、事务 | 灵活结构、快速迭代 |

**选型建议：**

- **选择 PostgreSQL**：复杂业务逻辑、强一致性要求、复杂查询
- **选择 MongoDB**：数据结构不固定、快速迭代、水平扩展需求

## ORM 使用

### Prisma

现代化的 TypeScript ORM，提供类型安全的数据库访问。

**安装配置：**

```bash
npm install prisma @prisma/client
npx prisma init
```

**Schema 定义：**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Post {
  id          Int       @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean   @default(false)
  author      User      @relation(fields: [authorId], references: [id])
  authorId    Int
  categories  Category[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@map("posts")
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique

  @@map("profiles")
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]

  @@map("categories")
}
```

**使用示例：**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 创建用户
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    profile: {
      create: { bio: 'Software Developer' },
    },
    posts: {
      create: [
        { title: 'First Post', content: 'Hello World' },
        { title: 'Second Post', content: 'TypeScript is awesome' },
      ],
    },
  },
  include: {
    profile: true,
    posts: true,
  },
})

// 查询用户
const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' },
    posts: {
      some: { published: true },
    },
  },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
    profile: true,
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
})

// 更新用户
const updated = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'John Smith',
    posts: {
      update: {
        where: { id: 1 },
        data: { published: true },
      },
    },
  },
})

// 删除用户（级联删除）
await prisma.user.delete({
  where: { id: 1 },
})

// 事务操作
await prisma.$transaction([
  prisma.post.create({
    data: { title: 'New Post', authorId: 1 },
  }),
  prisma.profile.update({
    where: { userId: 1 },
    data: { bio: 'Updated bio' },
  }),
])

// 原生 SQL
const result = await prisma.$queryRaw`
  SELECT u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p."authorId"
  GROUP BY u.id
  ORDER BY post_count DESC
`
```

### Drizzle ORM

轻量级 TypeScript ORM，更接近 SQL。

**安装配置：**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

**Schema 定义：**

```typescript
// src/db/schema.ts
import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
```

**使用示例：**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, posts } from './schema'
import { eq, and, or, desc, sql } from 'drizzle-orm'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// 查询所有用户
const allUsers = await db.select().from(users)

// 条件查询
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'john@example.com'))

// 关联查询
const userWithPosts = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .where(eq(users.id, 1))

// 插入数据
const newUser = await db.insert(users)
  .values({
    email: 'jane@example.com',
    name: 'Jane Doe',
  })
  .returning()

// 更新数据
await db.update(users)
  .set({ name: 'Jane Smith' })
  .where(eq(users.id, 2))

// 删除数据
await db.delete(users).where(eq(users.id, 2))

// 复杂查询
const result = await db.select({
  userId: users.id,
  userName: users.name,
  postCount: sql<number>`count(${posts.id})`,
})
.from(users)
.leftJoin(posts, eq(users.id, posts.authorId))
.groupBy(users.id)
.having(sql`count(${posts.id}) > 0`)
.orderBy(desc(sql`count(${posts.id})`))

// 事务
await db.transaction(async (tx) => {
  await tx.insert(users).values({ email: 'test@example.com', name: 'Test' })
  await tx.insert(posts).values({ title: 'First Post', authorId: 1 })
})
```

### Prisma vs Drizzle 对比

| 特性 | Prisma | Drizzle |
|------|--------|---------|
| 学习曲线 | 低 | 中 |
| 类型安全 | 高 | 高 |
| 查询语法 | 自定义 DSL | SQL-like |
| 性能 | 中 | 高 |
| Bundle 大小 | 大 | 小 |
| 迁移工具 | 内置 | drizzle-kit |

**选型建议：**

- **选择 Prisma**：快速开发、团队协作、需要完善的工具链
- **选择 Drizzle**：追求性能、熟悉 SQL、轻量级需求

## 数据库迁移管理

### Prisma Migrate

```bash
# 创建迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset

# 查看迁移状态
npx prisma migrate status
```

**迁移文件示例：**

```sql
-- prisma/migrations/20240101000000_init/migration.sql
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

### Drizzle Kit

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

```bash
# 生成迁移
npx drizzle-kit generate:pg

# 推送 schema（开发环境）
npx drizzle-kit push:pg

# 查看差异
npx drizzle-kit introspect:pg
```

## 查询优化

### 查询分析

```sql
-- 使用 EXPLAIN 分析查询计划
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
ORDER BY post_count DESC
LIMIT 10;

-- 查看慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 优化策略

**1. 避免 SELECT ***

```typescript
// 不推荐
const users = await prisma.user.findMany()

// 推荐
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
})
```

**2. 使用索引覆盖**

```sql
-- 创建覆盖索引
CREATE INDEX idx_users_email_name ON users(email, name);

-- 查询只需访问索引
SELECT email, name FROM users WHERE email = 'john@example.com';
```

**3. 分页优化**

```typescript
// 传统分页（OFFSET）
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
})

// 游标分页（更高效）
const users = await prisma.user.findMany({
  take: limit,
  cursor: lastId ? { id: lastId } : undefined,
  orderBy: { id: 'asc' },
})
```

**4. 批量操作**

```typescript
// 批量插入
await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
  ],
})

// 批量更新
await prisma.user.updateMany({
  where: { status: 'inactive' },
  data: { status: 'active' },
})
```

**5. 连接池配置**

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'password',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 使用连接
const client = await pool.connect()
try {
  const result = await client.query('SELECT * FROM users')
  return result.rows
} finally {
  client.release()
}
```

### N+1 问题

```typescript
// N+1 问题（不推荐）
const users = await prisma.user.findMany()
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  })
  user.posts = posts
}

// 解决方案：使用 include
const users = await prisma.user.findMany({
  include: { posts: true },
})

// 或使用 Data Loader
import DataLoader from 'dataloader'

const postLoader = new DataLoader(async (userIds) => {
  const posts = await prisma.post.findMany({
    where: { authorId: { in: userIds as number[] } },
  })
  const postsByUser = posts.reduce((acc, post) => {
    acc[post.authorId] = acc[post.authorId] || []
    acc[post.authorId].push(post)
    return acc
  }, {} as Record<number, typeof posts>)
  return userIds.map(id => postsByUser[id] || [])
})
```

## 小结

数据库设计需要综合考虑业务需求、性能要求和扩展性：

1. **设计原则**：遵循范式，适度反范式，合理设计索引
2. **NoSQL 选型**：根据数据特点和访问模式选择合适的数据库
3. **ORM 使用**：Prisma 开发效率高，Drizzle 性能更好
4. **查询优化**：分析慢查询，避免 N+1，使用批量操作

良好的数据库设计是系统高性能、可维护的基础，需要在实践中不断优化。
