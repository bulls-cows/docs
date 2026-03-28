---
order: 10
---

# 测试概览

测试是保证软件质量的重要手段。一个完善的测试体系能够帮助团队快速发现问题、降低回归成本、提升代码可维护性。本文将介绍测试的核心概念、策略设计和工具生态。

## 测试金字塔

测试金字塔是由 Mike Cohn 提出的经典测试分层模型，它描述了不同类型测试的数量比例和投资策略。

### 金字塔结构

```text
        /\
       /  \
      / E2E \          数量少、成本高、速度慢
     /______\
    /        \
   / Integration \     数量适中、成本适中、速度适中
  /______________\
 /                \
/   Unit Tests     \   数量多、成本低、速度快
/__________________\
```

### 各层测试特点

| 测试类型 | 数量 | 执行速度 | 维护成本 | 隔离性 | 反馈速度 |
|---------|------|---------|---------|--------|---------|
| 单元测试 | 最多 | 毫秒级 | 低 | 高 | 即时 |
| 集成测试 | 适中 | 秒级 | 中 | 中 | 快 |
| E2E 测试 | 最少 | 分钟级 | 高 | 低 | 慢 |

### 金字塔原则

```typescript
// 推荐的测试数量比例
const testPyramid = {
  unit: 70,        // 70% 单元测试
  integration: 20, // 20% 集成测试
  e2e: 10          // 10% 端到端测试
}

// 测试投资策略
const investmentStrategy = {
  unit: {
    focus: '业务逻辑、工具函数、组件',
    benefit: '快速反馈、精确定位问题',
    cost: '编写简单、运行快速'
  },
  integration: {
    focus: '模块交互、API 接口、数据库操作',
    benefit: '验证组件协作、发现集成问题',
    cost: '需要测试环境、运行较慢'
  },
  e2e: {
    focus: '核心业务流程、用户关键路径',
    benefit: '验证真实用户体验',
    cost: '维护成本高、调试困难'
  }
}
```

## 测试策略设计

### 测试策略制定流程

```text
需求分析 → 风险评估 → 测试分层 → 工具选型 → 持续优化
```

### 1. 需求分析

识别测试重点，确定哪些功能需要重点测试：

```typescript
interface Feature {
  name: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  testTypes: ('unit' | 'integration' | 'e2e')[]
}

const featureAnalysis: Feature[] = [
  {
    name: '用户认证',
    priority: 'critical',
    testTypes: ['unit', 'integration', 'e2e']
  },
  {
    name: '支付流程',
    priority: 'critical',
    testTypes: ['integration', 'e2e']
  },
  {
    name: 'UI 动画',
    priority: 'low',
    testTypes: ['unit']
  }
]
```

### 2. 风险评估

基于风险评估分配测试资源：

```typescript
interface RiskAssessment {
  feature: string
  impact: number      // 影响程度 1-5
  likelihood: number  // 发生概率 1-5
  testPriority: number
}

function calculatePriority(risk: RiskAssessment): number {
  return risk.impact * risk.likelihood
}

// 风险矩阵示例
const riskMatrix = {
  highImpact_highLikelihood: '必须全面测试',
  highImpact_lowLikelihood: '重点集成测试',
  lowImpact_highLikelihood: '基础单元测试',
  lowImpact_lowLikelihood: '可选测试'
}
```

### 3. 测试分层策略

```typescript
// 项目测试配置示例
const testStrategy = {
  // 前端测试策略
  frontend: {
    unit: {
      tools: ['Vitest', 'Jest'],
      coverage: 80,
      focus: ['组件逻辑', 'Hooks', '工具函数', '状态管理']
    },
    integration: {
      tools: ['Testing Library', 'MSW'],
      coverage: 60,
      focus: ['组件交互', 'API 集成', '路由导航']
    },
    e2e: {
      tools: ['Playwright', 'Cypress'],
      coverage: '核心流程',
      focus: ['用户登录', '关键业务流程', '支付流程']
    }
  },

  // 后端测试策略
  backend: {
    unit: {
      tools: ['Jest', 'Mocha'],
      coverage: 85,
      focus: ['业务逻辑', '数据处理', '工具函数']
    },
    integration: {
      tools: ['Supertest', 'TestContainers'],
      coverage: 70,
      focus: ['API 端点', '数据库操作', '外部服务']
    },
    e2e: {
      tools: ['Playwright', 'Newman'],
      coverage: 'API 契约',
      focus: ['完整业务流程', '第三方集成']
    }
  }
}
```

## 测试工具生态

### 前端测试工具

```yaml
单元测试:
  - Vitest: Vite 原生支持，速度极快
  - Jest: 生态成熟，功能全面
  - Mocha: 灵活配置，适合定制

组件测试:
  - Vue Test Utils: Vue 官方测试库
  - React Testing Library: React 测试最佳实践
  - Svelte Testing Library: Svelte 组件测试

E2E 测试:
  - Playwright: 跨浏览器支持，功能强大
  - Cypress: 开发体验优秀，调试方便
  - WebdriverIO: 协议标准，兼容性好

Mock 工具:
  - MSW: Mock Service Worker，API Mock
  - MirageJS: 前端 Mock 服务器
  - json-server: 快速创建 Mock API
```

### 后端测试工具

```yaml
单元测试:
  - Jest: JavaScript 全栈测试框架
  - Mocha + Chai: 经典组合，灵活配置
  - Vitest: 支持后端测试

API 测试:
  - Supertest: HTTP 断言库
  - Dredd: API 文档测试
  - Postman/Newman: API 测试集合

数据库测试:
  - TestContainers: Docker 容器化测试
  - mongodb-memory-server: 内存数据库
  - sqlite3: 内存 SQLite 测试

性能测试:
  - k6: 现代负载测试工具
  - Artillery: 云原生负载测试
  - Locust: Python 编写的负载测试
```

### 工具选型建议

```typescript
// 根据项目类型选择测试工具
function selectTestTools(project: ProjectConfig): TestTools {
  const { framework, bundler, complexity } = project

  // Vite 项目优先选择 Vitest
  if (bundler === 'vite') {
    return {
      unit: 'Vitest',
      e2e: 'Playwright',
      mock: 'MSW'
    }
  }

  // React 项目推荐组合
  if (framework === 'react') {
    return {
      unit: 'Jest + React Testing Library',
      e2e: 'Cypress',
      mock: 'MSW'
    }
  }

  // Vue 项目推荐组合
  if (framework === 'vue') {
    return {
      unit: 'Vitest + Vue Test Utils',
      e2e: 'Playwright',
      mock: 'MSW'
    }
  }

  // 复杂企业级项目
  if (complexity === 'enterprise') {
    return {
      unit: 'Jest',
      integration: 'Supertest + TestContainers',
      e2e: 'Playwright',
      performance: 'k6'
    }
  }

  return defaultTools
}
```

## 测试驱动开发

### TDD 流程

测试驱动开发（Test-Driven Development）遵循"红-绿-重构"循环：

```text
┌─────────────────────────────────────────────┐
│                                             │
│    ┌─────────┐    ┌─────────┐    ┌───────┐ │
│    │   RED   │───▶│  GREEN  │───▶│REFACTOR│ │
│    │ 写失败测试│    │ 写最少代码│    │ 优化代码 │ │
│    └─────────┘    └─────────┘    └───────┘ │
│         ▲                               │   │
│         └───────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### TDD 实践示例

```typescript
// 示例：开发一个计算器函数

// 第一步：RED - 编写失败的测试
describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    const calc = new Calculator()
    expect(calc.add(2, 3)).toBe(5)
  })

  it('should subtract two numbers correctly', () => {
    const calc = new Calculator()
    expect(calc.subtract(5, 3)).toBe(2)
  })
})

// 第二步：GREEN - 编写最少代码使测试通过
class Calculator {
  add(a: number, b: number): number {
    return a + b
  }

  subtract(a: number, b: number): number {
    return a - b
  }
}

// 第三步：REFACTOR - 优化代码
class Calculator {
  add(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new TypeError('Arguments must be numbers')
    }
    return a + b
  }

  subtract(a: number, b: number): number {
    if (typeof a !== 'number' || b !== 'number') {
      throw new TypeError('Arguments must be numbers')
    }
    return a - b
  }
}
```

### TDD 最佳实践

```typescript
// 1. 测试先行
// ✅ 正确：先写测试
describe('UserService', () => {
  it('should create user with valid data', () => {
    // 先定义期望行为
  })
})
// 然后再实现功能

// 2. 小步迭代
// ✅ 正确：每次只测试一个行为
it('should validate email format', () => {
  expect(validateEmail('test@example.com')).toBe(true)
})

it('should reject invalid email', () => {
  expect(validateEmail('invalid')).toBe(false)
})

// 3. 使用描述性的测试名称
// ✅ 正确
it('should return 404 when user does not exist', () => {})

// ❌ 错误
it('test user', () => {})

// 4. 遵循 AAA 模式
it('should calculate total price with discount', () => {
  // Arrange - 准备
  const cart = new ShoppingCart()
  cart.addItem({ price: 100, quantity: 2 })
  const discount = 0.1

  // Act - 执行
  const total = cart.calculateTotal(discount)

  // Assert - 断言
  expect(total).toBe(180)
})
```

### BDD 行为驱动开发

BDD 是 TDD 的扩展，强调从用户行为角度编写测试：

```typescript
// 使用 Gherkin 语法描述行为
describe('User Login', () => {
  // Scenario: 成功登录
  it('should allow user to login with valid credentials', () => {
    // Given - 前置条件
    const user = createTestUser({ email: 'test@example.com', password: 'password123' })

    // When - 执行操作
    const result = login(user.email, user.password)

    // Then - 验证结果
    expect(result.success).toBe(true)
    expect(result.token).toBeDefined()
  })

  // Scenario: 登录失败
  it('should reject login with invalid credentials', () => {
    // Given
    const user = createTestUser({ email: 'test@example.com' })

    // When
    const result = login(user.email, 'wrongpassword')

    // Then
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid credentials')
  })
})
```

## 测试覆盖率

### 覆盖率指标

```typescript
interface CoverageMetrics {
  lineCoverage: number      // 行覆盖率
  branchCoverage: number    // 分支覆盖率
  functionCoverage: number  // 函数覆盖率
  statementCoverage: number // 语句覆盖率
}

// 推荐的覆盖率目标
const coverageTargets = {
  critical: {
    line: 90,
    branch: 85,
    function: 90,
    statement: 90
  },
  normal: {
    line: 80,
    branch: 70,
    function: 80,
    statement: 80
  },
  utility: {
    line: 70,
    branch: 60,
    function: 70,
    statement: 70
  }
}
```

### 覆盖率配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
})
```

## 持续集成中的测试

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 测试最佳实践总结

### 测试原则

1. **FAST 原则**
   - **F**ast：测试要快速执行
   - **A**utonomous：测试要独立运行
   - **S**elf-validating：测试要自动验证
   - **T**imely：测试要及时编写

2. **FIRST 原则**
   - **F**ast：快速
   - **I**ndependent：独立
   - **R**epeatable：可重复
   - **S**elf-validating：自验证
   - **T**imely：及时

### 常见反模式

```typescript
// ❌ 反模式：测试依赖外部状态
let sharedState: any

beforeEach(() => {
  sharedState = { count: 0 }
})

// ❌ 反模式：测试之间有依赖
it('test1', () => {
  sharedState.count = 1
})

it('test2', () => {
  // 依赖 test1 的执行顺序
  expect(sharedState.count).toBe(1)
})

// ✅ 正确：每个测试独立
it('should increment count', () => {
  const counter = new Counter()
  counter.increment()
  expect(counter.count).toBe(1)
})
```

### 测试命名规范

```typescript
// 使用清晰的命名模式
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user when given valid data', () => {})
    it('should throw error when email is invalid', () => {})
    it('should throw error when password is too short', () => {})
  })

  describe('deleteUser', () => {
    it('should delete existing user', () => {})
    it('should throw 404 when user does not exist', () => {})
  })
})
```

## 下一步

- [单元测试](./unit-testing.md)：深入学习单元测试实践
- [集成测试](./integration.md)：了解集成测试策略
- [端到端测试](./e2e.md)：掌握 E2E 测试方法
