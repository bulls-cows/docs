---
order: 20
---

# 单元测试

单元测试是软件测试的基础层，它验证代码中最小可测试单元的正确性。良好的单元测试能够快速发现问题、提供即时反馈、促进代码设计改进。本文将深入讲解单元测试的原则、实践和最佳实践。

## 单元测试原则

### 什么是单元测试

单元测试是对软件中最小可测试单元（通常是函数、方法或类）进行验证的测试。它具有以下特征：

```typescript
// 单元测试的特征
interface UnitTestCharacteristics {
  isolated: boolean      // 隔离性：不依赖外部系统
  fast: boolean          // 快速：毫秒级执行
  repeatable: boolean    // 可重复：多次执行结果一致
  selfValidating: boolean // 自验证：自动判断通过/失败
  independent: boolean   // 独立性：不依赖其他测试
}
```

### FIRST 原则

```typescript
// FIRST 原则示例
describe('Calculator', () => {
  // F - Fast (快速)
  // 测试应该快速执行，毫秒级完成
  it('should add numbers quickly', () => {
    const result = add(1, 2)
    expect(result).toBe(3) // 执行时间 < 1ms
  })

  // I - Independent (独立)
  // 每个测试独立运行，不依赖其他测试
  describe('User', () => {
    let user: User

    beforeEach(() => {
      // 每个测试都有独立的数据
      user = new User({ name: 'test' })
    })

    it('should have correct name', () => {
      expect(user.name).toBe('test')
    })

    it('should update name', () => {
      user.name = 'updated'
      expect(user.name).toBe('updated')
    })
  })

  // R - Repeatable (可重复)
  // 测试可以在任何环境重复执行
  it('should generate consistent hash', () => {
    const hash1 = hashPassword('password')
    const hash2 = hashPassword('password')
    // 相同输入产生相同结果
    expect(hash1).toBe(hash2)
  })

  // S - Self-Validating (自验证)
  // 测试自动判断通过或失败
  it('should validate email format', () => {
    const result = validateEmail('test@example.com')
    expect(result).toBe(true) // 自动断言
  })

  // T - Timely (及时)
  // 测试应该在编写代码之前或同时编写
  // TDD: 先写测试，再写代码
})
```

### 单元测试 vs 集成测试

```typescript
// 单元测试：测试单个函数
describe('formatPrice', () => {
  it('should format price with currency symbol', () => {
    expect(formatPrice(100, 'CNY')).toBe('¥100.00')
    expect(formatPrice(100, 'USD')).toBe('$100.00')
  })
})

// 集成测试：测试多个组件协作
describe('OrderService', () => {
  it('should create order and update inventory', async () => {
    const orderService = new OrderService(database)
    const inventoryService = new InventoryService(database)

    // 测试多个服务的协作
    await orderService.createOrder({ productId: 'p1', quantity: 2 })

    const inventory = await inventoryService.getInventory('p1')
    expect(inventory.quantity).toBe(initialQuantity - 2)
  })
})
```

## Jest 实践

### 基础配置

```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
}

export default config
```

```typescript
// jest.setup.ts
import { beforeAll, afterAll, afterEach } from '@jest/globals'

// 全局设置
beforeAll(() => {
  // 初始化测试环境
})

afterAll(() => {
  // 清理测试环境
})

afterEach(() => {
  // 每个测试后清理
  jest.clearAllMocks()
})
```

### 常用断言

```typescript
describe('Jest Assertions', () => {
  // 基础断言
  test('basic matchers', () => {
    // 相等性
    expect(1 + 1).toBe(2)           // 严格相等 ===
    expect({ a: 1 }).toEqual({ a: 1 }) // 深度相等

    // 真值判断
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect('text').toBeDefined()

    // 数字比较
    expect(5).toBeGreaterThan(3)
    expect(5).toBeGreaterThanOrEqual(5)
    expect(3).toBeLessThan(5)
    expect(0.1 + 0.2).toBeCloseTo(0.3) // 浮点数比较

    // 字符串匹配
    expect('hello world').toMatch(/hello/)
    expect('hello world').toContain('world')

    // 数组
    expect([1, 2, 3]).toContain(2)
    expect([1, 2, 3]).toHaveLength(3)
    expect([{ id: 1 }]).toContainEqual({ id: 1 })

    // 对象
    expect({ a: 1, b: 2 }).toHaveProperty('a')
    expect({ a: 1, b: 2 }).toHaveProperty('a', 1)
  })

  // 异常测试
  test('error handling', () => {
    expect(() => {
      throw new Error('Something went wrong')
    }).toThrow()

    expect(() => {
      throw new Error('Something went wrong')
    }).toThrow('Something went wrong')

    expect(() => {
      throw new Error('Something went wrong')
    }).toThrow(/wrong/)
  })

  // 异步测试
  test('async operations', async () => {
    // Promise
    await expect(fetchData()).resolves.toBe('data')
    await expect(fetchData(true)).rejects.toThrow('Error')

    // async/await
    const data = await fetchData()
    expect(data).toBe('data')
  })

  // 快照测试
  test('snapshot', () => {
    const user = { name: 'John', age: 30 }
    expect(user).toMatchSnapshot()
  })
})
```

### 测试组织

```typescript
describe('UserService', () => {
  // 共享变量
  let userService: UserService
  let mockRepository: jest.Mocked<UserRepository>

  // 每个测试套件前执行一次
  beforeAll(() => {
    console.log('Test suite started')
  })

  // 每个测试前执行
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
    userService = new UserService(mockRepository)
  })

  // 每个测试后执行
  afterEach(() => {
    jest.clearAllMocks()
  })

  // 每个测试套件后执行一次
  afterAll(() => {
    console.log('Test suite finished')
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'John' }
      mockRepository.findById.mockResolvedValue(mockUser)

      const result = await userService.findById('1')

      expect(result).toEqual(mockUser)
      expect(mockRepository.findById).toHaveBeenCalledWith('1')
    })

    it('should return null when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await userService.findById('999')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create user with valid data', async () => {
      const userData = { name: 'John', email: 'john@example.com' }
      mockRepository.create.mockResolvedValue({ id: '1', ...userData })

      const result = await userService.create(userData)

      expect(result.name).toBe('John')
      expect(mockRepository.create).toHaveBeenCalledWith(userData)
    })
  })
})
```

## Vitest 实践

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
})
```

### Vitest 特性

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Vitest Features', () => {
  // 内置 Mock
  it('should mock functions', () => {
    const mockFn = vi.fn()
    mockFn('hello')
    mockFn('world')

    expect(mockFn).toHaveBeenCalled()
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenCalledWith('hello')
    expect(mockFn).toHaveBeenLastCalledWith('world')
  })

  // Mock 返回值
  it('should mock return values', () => {
    const mockFn = vi.fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockReturnValue('default')

    expect(mockFn()).toBe('first')
    expect(mockFn()).toBe('second')
    expect(mockFn()).toBe('default')
    expect(mockFn()).toBe('default')
  })

  // Mock 实现
  it('should mock implementation', () => {
    const mockFn = vi.fn((x: number) => x * 2)

    expect(mockFn(5)).toBe(10)
    expect(mockFn).toHaveBeenCalledWith(5)
  })

  // Spy 监视
  it('should spy on methods', () => {
    const obj = {
      method: (x: number) => x * 2
    }

    const spy = vi.spyOn(obj, 'method')

    expect(obj.method(5)).toBe(10)
    expect(spy).toHaveBeenCalledWith(5)

    spy.mockRestore()
  })

  // 定时器 Mock
  it('should mock timers', () => {
    vi.useFakeTimers()

    const callback = vi.fn()
    setTimeout(callback, 1000)

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalled()

    vi.useRealTimers()
  })

  // 快照测试
  it('should match snapshot', () => {
    const component = {
      name: 'Button',
      props: { variant: 'primary', size: 'medium' }
    }

    expect(component).toMatchSnapshot()
  })

  // 内联快照
  it('should match inline snapshot', () => {
    const data = { id: 1, name: 'test' }
    expect(data).toMatchInlineSnapshot(`
      {
        "id": 1,
        "name": "test",
      }
    `)
  })
})
```

### Vue 组件测试

```typescript
// Button.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('should render with correct text', () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Click me'
      }
    })

    expect(wrapper.text()).toContain('Click me')
  })

  it('should emit click event', async () => {
    const wrapper = mount(Button)

    await wrapper.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: { disabled: true }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('should apply variant class', () => {
    const wrapper = mount(Button, {
      props: { variant: 'primary' }
    })

    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('should render slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Slot Content'
      }
    })

    expect(wrapper.text()).toContain('Slot Content')
  })
})
```

## Mock 与 Stub

### Mock 概念

```typescript
/**
 * Mock: 模拟对象，用于验证行为
 * Stub: 桩对象，用于提供预设响应
 * Fake: 假对象，简化版的真实实现
 * Spy: 间谍，监视真实对象的调用
 */

// Stub 示例 - 提供预设响应
class EmailServiceStub implements IEmailService {
  async send(email: Email): Promise<boolean> {
    return true // 总是返回成功
  }
}

// Mock 示例 - 验证行为
const mockEmailService = {
  send: vi.fn().mockResolvedValue(true)
}

// Fake 示例 - 简化实现
class FakeUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map()

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user)
  }
}

// Spy 示例 - 监视真实对象
const realService = new EmailService()
const spy = vi.spyOn(realService, 'send')
```

### Mock 函数

```typescript
describe('Mock Functions', () => {
  it('should track calls', () => {
    const mockFn = vi.fn()

    mockFn('first')
    mockFn('second', 'third')

    // 验证调用
    expect(mockFn).toHaveBeenCalled()
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenCalledWith('first')
    expect(mockFn).toHaveBeenLastCalledWith('second', 'third')

    // 获取调用信息
    console.log(mockFn.mock.calls)
    // [['first'], ['second', 'third']]

    console.log(mockFn.mock.results)
    // [{ type: 'return', value: undefined }, ...]
  })

  it('should mock return values', () => {
    const mockFn = vi.fn()

    // 固定返回值
    mockFn.mockReturnValue('fixed')
    expect(mockFn()).toBe('fixed')

    // 链式返回值
    mockFn
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockReturnValue('default')

    expect(mockFn()).toBe('first')
    expect(mockFn()).toBe('second')
    expect(mockFn()).toBe('default')
    expect(mockFn()).toBe('default')
  })

  it('should mock resolved values', async () => {
    const mockFn = vi.fn()

    // Promise 返回值
    mockFn.mockResolvedValue('async data')
    await expect(mockFn()).resolves.toBe('async data')

    // 链式 Promise 返回值
    mockFn
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')

    await expect(mockFn()).resolves.toBe('first')
    await expect(mockFn()).resolves.toBe('second')
  })

  it('should mock implementation', () => {
    const mockFn = vi.fn((x: number, y: number) => x + y)

    expect(mockFn(1, 2)).toBe(3)
    expect(mockFn(5, 10)).toBe(15)
  })
})
```

### Mock 模块

```typescript
// 模拟整个模块
vi.mock('@/services/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'John' }),
  updateUser: vi.fn().mockResolvedValue(true)
}))

// 模拟部分模块
vi.mock('@/services/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/api')>()

  return {
    ...original,
    fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'Mock User' })
  }
})

// 使用示例
import { fetchUser, updateUser } from '@/services/api'

describe('API Mock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mock fetchUser', async () => {
    const user = await fetchUser('1')

    expect(user).toEqual({ id: '1', name: 'John' })
    expect(fetchUser).toHaveBeenCalledWith('1')
  })
})
```

### Mock 定时器

```typescript
describe('Timer Mocks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should handle setTimeout', () => {
    const callback = vi.fn()

    setTimeout(callback, 1000)

    // 时间还没到
    expect(callback).not.toHaveBeenCalled()

    // 推进时间
    vi.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalled()
  })

  it('should handle setInterval', () => {
    const callback = vi.fn()

    setInterval(callback, 100)

    // 推进时间 350ms
    vi.advanceTimersByTime(350)

    // 应该执行 3 次
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('should run all timers', () => {
    const callback = vi.fn()

    setTimeout(callback, 1000)
    setTimeout(callback, 2000)

    // 运行所有定时器
    vi.runAllTimers()

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
```

## 测试覆盖率

### 覆盖率类型

```typescript
/**
 * 行覆盖率 (Line Coverage): 已执行代码行的比例
 * 分支覆盖率 (Branch Coverage): 已执行分支的比例
 * 函数覆盖率 (Function Coverage): 已调用函数的比例
 * 语句覆盖率 (Statement Coverage): 已执行语句的比例
 */

// 示例代码
function calculateDiscount(price: number, isMember: boolean): number {
  if (isMember) {           // 分支 1
    if (price > 100) {      // 分支 2
      return price * 0.8    // 语句 1
    }
    return price * 0.9      // 语句 2
  }
  return price              // 语句 3
}

// 测试用例
describe('calculateDiscount', () => {
  // 覆盖: 分支 1-true, 分支 2-true, 语句 1
  it('should give 20% discount for members with price > 100', () => {
    expect(calculateDiscount(200, true)).toBe(160)
  })

  // 覆盖: 分支 1-true, 分支 2-false, 语句 2
  it('should give 10% discount for members with price <= 100', () => {
    expect(calculateDiscount(100, true)).toBe(90)
  })

  // 覆盖: 分支 1-false, 语句 3
  it('should give no discount for non-members', () => {
    expect(calculateDiscount(200, false)).toBe(200)
  })
})
// 结果: 100% 行覆盖率, 100% 分支覆盖率, 100% 函数覆盖率, 100% 语句覆盖率
```

### 覆盖率配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      // 覆盖率阈值
      thresholds: {
        perFile: true,  // 每个文件单独计算
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },

      // 包含/排除文件
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/**/types.ts',
        'src/**/*.test.ts'
      ],

      // 忽略未使用的文件
      all: false
    }
  }
})
```

### 覆盖率报告

```bash
# 运行测试并生成覆盖率报告
npm run test -- --coverage

# 输出示例
# ----------------|---------|----------|---------|---------|
# File            | % Stmts | % Branch | % Funcs | % Lines |
# ----------------|---------|----------|---------|---------|
# All files       |   85.71 |    78.57 |   90.00 |   85.71 |
#  utils/         |   92.31 |    88.89 |  100.00 |   92.31 |
#   format.ts     |   95.00 |    90.00 |  100.00 |   95.00 |
#   validate.ts   |   88.89 |    87.50 |  100.00 |   88.89 |
#  services/      |   80.00 |    70.00 |   83.33 |   80.00 |
#   user.ts       |   82.35 |    72.73 |   85.71 |   82.35 |
# ----------------|---------|----------|---------|---------|
```

## 最佳实践

### 测试命名

```typescript
// ✅ 好的命名 - 描述行为和预期结果
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user when given valid data', () => {})
    it('should throw ValidationError when email is invalid', () => {})
    it('should throw DuplicateError when email already exists', () => {})
  })
})

// ❌ 不好的命名
describe('UserService', () => {
  it('test1', () => {})
  it('works', () => {})
  it('should work correctly', () => {})
})
```

### AAA 模式

```typescript
describe('ShoppingCart', () => {
  it('should calculate total with discount', () => {
    // Arrange - 准备测试数据
    const cart = new ShoppingCart()
    cart.addItem({ id: '1', name: 'Product 1', price: 100, quantity: 2 })
    cart.addItem({ id: '2', name: 'Product 2', price: 50, quantity: 1 })
    const discountRate = 0.1

    // Act - 执行被测试的操作
    const total = cart.calculateTotal(discountRate)

    // Assert - 验证结果
    expect(total).toBe(225) // (200 + 50) * 0.9
  })
})
```

### 测试边界条件

```typescript
describe('divide', () => {
  // 正常情况
  it('should divide two numbers correctly', () => {
    expect(divide(10, 2)).toBe(5)
  })

  // 边界条件
  it('should handle division by 1', () => {
    expect(divide(10, 1)).toBe(10)
  })

  // 异常情况
  it('should throw error when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero')
  })

  // 边界值
  it('should handle very large numbers', () => {
    expect(divide(Number.MAX_SAFE_INTEGER, 2)).toBe(Number.MAX_SAFE_INTEGER / 2)
  })

  // 负数
  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5)
    expect(divide(10, -2)).toBe(-5)
    expect(divide(-10, -2)).toBe(5)
  })

  // 浮点数
  it('should handle floating point numbers', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333, 2)
  })
})
```

### 避免测试实现细节

```typescript
// ❌ 测试实现细节
describe('UserList', () => {
  it('should set internal state correctly', () => {
    const list = new UserList()
    list.addUser({ name: 'John' })
    // 测试内部状态
    expect(list._users.length).toBe(1)
    expect(list._users[0].name).toBe('John')
  })
})

// ✅ 测试公共行为
describe('UserList', () => {
  it('should return added users', () => {
    const list = new UserList()
    list.addUser({ name: 'John' })

    // 测试公共 API
    const users = list.getUsers()
    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('John')
  })
})
```

### 测试数据工厂

```typescript
// 测试数据工厂模式
function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    age: 25,
    createdAt: new Date('2024-01-01'),
    ...overrides
  }
}

describe('UserService', () => {
  it('should create user', async () => {
    const userData = createTestUser({ name: 'John' })
    const result = await userService.create(userData)

    expect(result.name).toBe('John')
  })

  it('should reject underage user', async () => {
    const userData = createTestUser({ age: 17 })

    await expect(userService.create(userData))
      .rejects.toThrow('User must be at least 18 years old')
  })
})

// 使用 faker.js 生成随机数据
import { faker } from '@faker-js/faker'

function createRandomUser(): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 80 }),
    createdAt: faker.date.past()
  }
}
```

### 参数化测试

```typescript
// 使用 test.each 进行参数化测试
describe('validateEmail', () => {
  test.each([
    ['test@example.com', true],
    ['user.name@example.com', true],
    ['user+tag@example.com', true],
    ['invalid', false],
    ['invalid@', false],
    ['@example.com', false],
    ['user@example', false]
  ])('should return %s for %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected)
  })
})

// 使用 describe.each 进行分组参数化
describe.each([
  { input: 0, expected: 0 },
  { input: 1, expected: 1 },
  { input: 2, expected: 4 },
  { input: 3, expected: 9 }
])('square($input)', ({ input, expected }) => {
  it(`should return ${expected}`, () => {
    expect(square(input)).toBe(expected)
  })
})
```

### 测试异步代码

```typescript
describe('Async Operations', () => {
  // Promise
  it('should handle resolved promise', async () => {
    const result = await fetchData()
    expect(result).toBeDefined()
  })

  it('should handle rejected promise', async () => {
    await expect(fetchData(true)).rejects.toThrow('Fetch failed')
  })

  // Callback
  it('should call callback with result', (done) => {
    fetchDataCallback((result) => {
      expect(result).toBeDefined()
      done()
    })
  })

  // 使用 resolves/rejects
  it('should resolve with correct data', () => {
    return expect(fetchData()).resolves.toEqual({ id: 1, name: 'test' })
  })

  // 并发测试
  it('should handle concurrent operations', async () => {
    const results = await Promise.all([
      fetchUser('1'),
      fetchUser('2'),
      fetchUser('3')
    ])

    expect(results).toHaveLength(3)
  })
})
```

## 下一步

- [集成测试](./integration.md)：了解模块间协作测试
- [端到端测试](./e2e.md)：掌握完整流程测试
