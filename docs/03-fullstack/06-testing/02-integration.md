
# 集成测试

集成测试验证多个模块或组件之间的协作是否正确。它填补了单元测试和端到端测试之间的空白，专注于模块间的接口、数据流和协作行为。本文将介绍集成测试的核心概念、实践方法和最佳实践。

## 集成测试概念

### 什么是集成测试

集成测试是在单元测试之后进行的测试阶段，主要验证：

```typescript
interface IntegrationTestScope {
  moduleInteraction: boolean    // 模块间的交互
  apiContracts: boolean         // API 契约验证
  databaseOperations: boolean   // 数据库操作
  externalServices: boolean     // 外部服务集成
  dataFlow: boolean             // 数据流转
}
```

### 集成测试 vs 单元测试

```typescript
// 单元测试：隔离测试单个函数
describe('UserService (Unit)', () => {
  it('should validate user data', () => {
    const mockRepo = { save: vi.fn() }
    const service = new UserService(mockRepo)

    const result = service.validate({ name: 'John', email: 'john@example.com' })

    expect(result.valid).toBe(true)
    // 不涉及真实数据库
  })
})

// 集成测试：测试模块协作
describe('UserService (Integration)', () => {
  it('should save user to database', async () => {
    const db = await createTestDatabase()
    const service = new UserService(db)

    const user = await service.create({ name: 'John', email: 'john@example.com' })

    // 验证数据真正保存到数据库
    const saved = await db.findById(user.id)
    expect(saved.name).toBe('John')
  })
})
```

### 集成测试策略

```text
┌─────────────────────────────────────────────────────────────┐
│                    集成测试策略                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Big Bang        增量式集成                                  │
│  ┌─────┐        ┌─────┐                                     │
│  │ A B │        │  A  │ → ┌─────┐ → ┌─────┐                 │
│  │ C D │        └─────┘   │ A+B │   │A+B+C│                 │
│  └─────┘                  └─────┘   └─────┘                 │
│  一次性集成      自顶向下          自底向上                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API 测试实践

### Supertest 基础

```typescript
import request from 'supertest'
import express from 'express'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const app = express()
app.use(express.json())

// 用户路由
app.get('/api/users', async (req, res) => {
  const users = await UserService.findAll()
  res.json(users)
})

app.post('/api/users', async (req, res) => {
  const user = await UserService.create(req.body)
  res.status(201).json(user)
})

app.get('/api/users/:id', async (req, res) => {
  const user = await UserService.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

// 测试
describe('User API', () => {
  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201)

      expect(response.body.name).toBe(userData.name)
      expect(response.body.email).toBe(userData.email)
      expect(response.body.id).toBeDefined()
    })

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'invalid' })
        .expect(400)

      expect(response.body.error).toContain('email')
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // 先创建用户
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Jane', email: 'jane@example.com' })

      const userId = createResponse.body.id

      // 获取用户
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200)

      expect(response.body.id).toBe(userId)
    })

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .expect(404)
    })
  })
})
```

### 认证 API 测试

```typescript
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          name: 'New User'
        })
        .expect(201)

      expect(response.body.user.email).toBe('newuser@example.com')
      expect(response.body.token).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      // 第一次注册
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!'
        })

      // 第二次注册相同邮箱
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!'
        })
        .expect(409)

      expect(response.body.error).toContain('already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // 先注册
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })

      // 登录
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200)

      expect(response.body.token).toBeDefined()
    })

    it('should reject invalid password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401)
    })
  })

  describe('Protected Routes', () => {
    let authToken: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
      authToken = response.body.token
    })

    it('should access protected route with token', async () => {
      await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    })

    it('should reject access without token', async () => {
      await request(app)
        .get('/api/profile')
        .expect(401)
    })
  })
})
```

### 文件上传测试

```typescript
import path from 'path'
import fs from 'fs'

describe('File Upload API', () => {
  it('should upload single file', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png')

    const response = await request(app)
      .post('/api/upload')
      .attach('file', filePath)
      .expect(200)

    expect(response.body.url).toBeDefined()
    expect(response.body.filename).toBeDefined()
  })

  it('should upload multiple files', async () => {
    const response = await request(app)
      .post('/api/upload/multiple')
      .attach('files', path.join(__dirname, 'fixtures', 'file1.txt'))
      .attach('files', path.join(__dirname, 'fixtures', 'file2.txt'))
      .expect(200)

    expect(response.body.files).toHaveLength(2)
  })

  it('should reject invalid file type', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', path.join(__dirname, 'fixtures', 'malicious.exe'))
      .expect(400)

    expect(response.body.error).toContain('File type not allowed')
  })

  it('should reject file exceeding size limit', async () => {
    // 创建大文件
    const largeFile = path.join(__dirname, 'fixtures', 'large.bin')
    fs.writeFileSync(largeFile, Buffer.alloc(11 * 1024 * 1024)) // 11MB

    const response = await request(app)
      .post('/api/upload')
      .attach('file', largeFile)
      .expect(413)

    expect(response.body.error).toContain('File too large')

    // 清理
    fs.unlinkSync(largeFile)
  })
})
```

## 数据库测试

### 测试数据库配置

```typescript
// test-setup.ts
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterAll, beforeEach } from 'vitest'

let mongoServer: MongoMemoryServer
let client: MongoClient

beforeAll(async () => {
  // 启动内存数据库
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  client = new MongoClient(uri)
  await client.connect()

  // 设置全局测试数据库连接
  global.__MONGO_CLIENT__ = client
  global.__MONGO_DB__ = client.db('test')
})

afterAll(async () => {
  await client.close()
  await mongoServer.stop()
})

beforeEach(async () => {
  // 每个测试前清空数据库
  const collections = await global.__MONGO_DB__.listCollections().toArray()
  for (const collection of collections) {
    await global.__MONGO_DB__.dropCollection(collection.name)
  }
})
```

### Repository 测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('UserRepository', () => {
  let repository: UserRepository

  beforeEach(() => {
    repository = new UserRepository(global.__MONGO_DB__)
  })

  describe('create', () => {
    it('should create user with generated id', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const user = await repository.create(userData)

      expect(user.id).toBeDefined()
      expect(user.name).toBe(userData.name)
      expect(user.email).toBe(userData.email)
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('should enforce unique email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'unique@example.com'
      }

      await repository.create(userData)

      await expect(repository.create(userData))
        .rejects.toThrow('Email already exists')
    })
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const created = await repository.create({
        name: 'Jane',
        email: 'jane@example.com'
      })

      const found = await repository.findById(created.id)

      expect(found).toEqual(created)
    })

    it('should return null when not found', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await repository.create({
        name: 'Old Name',
        email: 'old@example.com'
      })

      const updated = await repository.update(user.id, {
        name: 'New Name'
      })

      expect(updated.name).toBe('New Name')
      expect(updated.email).toBe('old@example.com')
    })
  })

  describe('delete', () => {
    it('should delete user', async () => {
      const user = await repository.create({
        name: 'To Delete',
        email: 'delete@example.com'
      })

      await repository.delete(user.id)

      const found = await repository.findById(user.id)
      expect(found).toBeNull()
    })
  })

  describe('query', () => {
    beforeEach(async () => {
      // 准备测试数据
      await repository.create({ name: 'Alice', email: 'alice@test.com', age: 25 })
      await repository.create({ name: 'Bob', email: 'bob@test.com', age: 30 })
      await repository.create({ name: 'Charlie', email: 'charlie@test.com', age: 35 })
    })

    it('should filter by age range', async () => {
      const users = await repository.findMany({
        age: { $gte: 30 }
      })

      expect(users).toHaveLength(2)
      expect(users.map(u => u.name)).toContain('Bob')
      expect(users.map(u => u.name)).toContain('Charlie')
    })

    it('should paginate results', async () => {
      const page1 = await repository.findMany({}, { skip: 0, limit: 2 })
      const page2 = await repository.findMany({}, { skip: 2, limit: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
    })

    it('should sort results', async () => {
      const users = await repository.findMany({}, { sort: { age: -1 } })

      expect(users[0].age).toBe(35)
      expect(users[1].age).toBe(30)
      expect(users[2].age).toBe(25)
    })
  })
})
```

### 事务测试

```typescript
describe('Transaction Tests', () => {
  let db: Db
  let session: ClientSession

  beforeEach(async () => {
    session = global.__MONGO_CLIENT__.startSession()
    session.startTransaction()
  })

  afterEach(async () => {
    await session.abortTransaction()
    await session.endSession()
  })

  it('should rollback on error', async () => {
    const orderRepo = new OrderRepository(db)
    const inventoryRepo = new InventoryRepository(db)

    try {
      await orderRepo.create({ productId: 'p1', quantity: 10 }, { session })
      await inventoryRepo.decrement('p1', 10, { session })

      // 模拟错误
      throw new Error('Simulated error')
    } catch (error) {
      await session.abortTransaction()
    }

    // 验证回滚
    const orders = await orderRepo.findAll()
    const inventory = await inventoryRepo.findById('p1')

    expect(orders).toHaveLength(0)
    expect(inventory.quantity).toBe(100) // 初始值
  })

  it('should commit successful transaction', async () => {
    const orderRepo = new OrderRepository(db)
    const inventoryRepo = new InventoryRepository(db)

    await orderRepo.create({ productId: 'p1', quantity: 5 }, { session })
    await inventoryRepo.decrement('p1', 5, { session })

    await session.commitTransaction()

    // 验证提交
    const orders = await orderRepo.findAll()
    const inventory = await inventoryRepo.findById('p1')

    expect(orders).toHaveLength(1)
    expect(inventory.quantity).toBe(95)
  })
})
```

### TestContainers (Docker)

```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('PostgreSQL Integration', () => {
  let container: StartedTestContainer
  let dbConfig: DatabaseConfig

  beforeAll(async () => {
    // 启动 PostgreSQL 容器
    container = await new GenericContainer('postgres:15')
      .withEnvironment({ POSTGRES_PASSWORD: 'test' })
      .withEnvironment({ POSTGRES_DB: 'testdb' })
      .withExposedPorts(5432)
      .start()

    dbConfig = {
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'testdb',
      username: 'postgres',
      password: 'test'
    }
  })

  afterAll(async () => {
    await container.stop()
  })

  it('should connect to database', async () => {
    const db = new Database(dbConfig)
    await db.connect()

    const result = await db.query('SELECT 1 as value')
    expect(result[0].value).toBe(1)

    await db.disconnect()
  })

  it('should perform CRUD operations', async () => {
    const db = new Database(dbConfig)
    await db.connect()

    // 创建表
    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE
      )
    `)

    // 插入
    await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2)',
      ['John Doe', 'john@example.com']
    )

    // 查询
    const users = await db.query('SELECT * FROM users')
    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('John Doe')

    await db.disconnect()
  })
})
```

## 测试环境管理

### 环境隔离

```typescript
// test-config.ts
export const testConfig = {
  development: {
    database: {
      host: 'localhost',
      port: 5432,
      name: 'test_db_dev'
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 1
    }
  },

  ci: {
    database: {
      host: process.env.CI_DB_HOST || 'localhost',
      port: parseInt(process.env.CI_DB_PORT || '5432'),
      name: 'test_db_ci'
    },
    redis: {
      host: process.env.CI_REDIS_HOST || 'localhost',
      port: parseInt(process.env.CI_REDIS_PORT || '6379'),
      db: 2
    }
  }
}

// 获取当前环境配置
export function getTestConfig() {
  return process.env.CI ? testConfig.ci : testConfig.development
}
```

### 测试夹具 (Fixtures)

```typescript
// fixtures.ts
export class TestFixtures {
  private db: Db

  constructor(db: Db) {
    this.db = db
  }

  async createUser(overrides: Partial<User> = {}): Promise<User> {
    const defaultUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashedPassword',
      role: 'user',
      createdAt: new Date()
    }

    const user = { ...defaultUser, ...overrides }
    const result = await this.db.collection('users').insertOne(user)

    return { ...user, id: result.insertedId.toString() }
  }

  async createProduct(overrides: Partial<Product> = {}): Promise<Product> {
    const defaultProduct = {
      name: 'Test Product',
      price: 100,
      stock: 10,
      category: 'test',
      createdAt: new Date()
    }

    const product = { ...defaultProduct, ...overrides }
    const result = await this.db.collection('products').insertOne(product)

    return { ...product, id: result.insertedId.toString() }
  }

  async createOrder(overrides: Partial<Order> = {}): Promise<Order> {
    const user = await this.createUser()
    const product = await this.createProduct()

    const defaultOrder = {
      userId: user.id,
      items: [{ productId: product.id, quantity: 1, price: product.price }],
      total: product.price,
      status: 'pending',
      createdAt: new Date()
    }

    const order = { ...defaultOrder, ...overrides }
    const result = await this.db.collection('orders').insertOne(order)

    return { ...order, id: result.insertedId.toString() }
  }

  async cleanup(): Promise<void> {
    await this.db.collection('users').deleteMany({})
    await this.db.collection('products').deleteMany({})
    await this.db.collection('orders').deleteMany({})
  }
}

// 使用示例
describe('Order Service', () => {
  let fixtures: TestFixtures

  beforeEach(async () => {
    fixtures = new TestFixtures(global.__MONGO_DB__)
  })

  afterEach(async () => {
    await fixtures.cleanup()
  })

  it('should process order', async () => {
    const user = await fixtures.createUser()
    const product = await fixtures.createProduct({ stock: 5 })

    const orderService = new OrderService(global.__MONGO_DB__)
    const order = await orderService.create({
      userId: user.id,
      items: [{ productId: product.id, quantity: 2 }]
    })

    expect(order.status).toBe('created')
  })
})
```

### Mock 外部服务

```typescript
// 使用 MSW Mock API
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// 定义 Mock 处理器
const handlers = [
  rest.get('https://api.payment.com/charge', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, transactionId: 'txn_123' })
    )
  }),

  rest.post('https://api.email.com/send', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ messageId: 'msg_123' })
    )
  })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Payment Integration', () => {
  it('should process payment', async () => {
    const paymentService = new PaymentService()
    const result = await paymentService.charge({
      amount: 1000,
      currency: 'USD'
    })

    expect(result.success).toBe(true)
    expect(result.transactionId).toBe('txn_123')
  })

  it('should handle payment failure', async () => {
    // 覆盖特定请求的 Mock
    server.use(
      rest.post('https://api.payment.com/charge', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Insufficient funds' })
        )
      })
    )

    const paymentService = new PaymentService()

    await expect(paymentService.charge({ amount: 1000 }))
      .rejects.toThrow('Insufficient funds')
  })
})
```

## 最佳实践

### 测试隔离

```typescript
// ✅ 正确：每个测试独立
describe('User Service', () => {
  let service: UserService
  let fixtures: TestFixtures

  beforeEach(async () => {
    // 每个测试创建新的实例
    service = new UserService(global.__MONGO_DB__)
    fixtures = new TestFixtures(global.__MONGO_DB__)
  })

  afterEach(async () => {
    // 每个测试后清理
    await fixtures.cleanup()
  })

  it('test 1', async () => {
    // 独立的测试数据
    const user = await fixtures.createUser({ name: 'User 1' })
    // ...
  })

  it('test 2', async () => {
    // 独立的测试数据，不依赖 test 1
    const user = await fixtures.createUser({ name: 'User 2' })
    // ...
  })
})

// ❌ 错误：测试之间共享状态
describe('User Service', () => {
  let sharedUser: User

  beforeAll(async () => {
    sharedUser = await createUser() // 所有测试共享
  })

  it('test 1', () => {
    sharedUser.name = 'Modified' // 修改共享状态
  })

  it('test 2', () => {
    // 依赖 test 1 的执行结果
    expect(sharedUser.name).toBe('Modified') // 不稳定
  })
})
```

### 测试数据管理

```typescript
// 使用工厂函数创建测试数据
class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: `user_${nanoid()}`,
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      role: 'user',
      ...overrides
    }
  }

  static createProduct(overrides: Partial<Product> = {}): Product {
    return {
      id: `product_${nanoid()}`,
      name: 'Test Product',
      price: 100,
      stock: 10,
      ...overrides
    }
  }

  static createOrder(overrides: Partial<Order> = {}): Order {
    return {
      id: `order_${nanoid()}`,
      status: 'pending',
      total: 100,
      ...overrides
    }
  }
}

// 使用
describe('Order Processing', () => {
  it('should process valid order', async () => {
    const user = TestDataFactory.createUser()
    const product = TestDataFactory.createProduct({ stock: 5 })
    const order = TestDataFactory.createOrder({
      userId: user.id,
      items: [{ productId: product.id, quantity: 2 }]
    })

    // 测试...
  })
})
```

### 测试命名和组织

```typescript
// 按功能模块组织测试
describe('UserService', () => {
  describe('create', () => {
    it('should create user with valid data', async () => {})
    it('should reject duplicate email', async () => {})
    it('should validate required fields', async () => {})
  })

  describe('update', () => {
    it('should update existing user', async () => {})
    it('should reject invalid updates', async () => {})
  })

  describe('delete', () => {
    it('should soft delete user', async () => {})
    it('should cleanup related data', async () => {})
  })
})
```

### 测试性能优化

```typescript
// 并行执行独立的测试
describe('User Operations', () => {
  // 这些测试可以并行执行
  it.concurrent('should create user', async () => {
    // ...
  })

  it.concurrent('should update user', async () => {
    // ...
  })

  it.concurrent('should delete user', async () => {
    // ...
  })
})

// 共享昂贵资源的测试串行执行
describe('Database Migrations', () => {
  // 这些测试需要串行执行
  it.serial('should run migration 1', async () => {
    // ...
  })

  it.serial('should run migration 2', async () => {
    // ...
  })
})
```

### 错误处理测试

```typescript
describe('Error Handling', () => {
  it('should handle database connection error', async () => {
    // 模拟数据库错误
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockRejectedValue(new Error('Connection lost'))
      })
    }

    const service = new UserService(mockDb)

    await expect(service.findById('123'))
      .rejects.toThrow('Connection lost')
  })

  it('should handle invalid input', async () => {
    const service = new UserService(db)

    await expect(service.create({ name: '' }))
      .rejects.toThrow(ValidationError)
  })

  it('should handle concurrent modifications', async () => {
    const service = new UserService(db)
    const user = await service.create({ name: 'Test' })

    // 模拟并发修改
    await service.update(user.id, { name: 'Update 1' })

    await expect(
      service.update(user.id, { name: 'Update 2' }, { version: user.version })
    ).rejects.toThrow(OptimisticLockError)
  })
})
```

## 下一步

- [端到端测试](./03-e2e.md)：了解完整用户流程测试
