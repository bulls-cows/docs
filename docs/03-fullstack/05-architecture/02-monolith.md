
# 单体应用

单体应用是一种传统的软件架构风格，整个应用作为一个独立的单元进行开发、部署和运行。尽管微服务备受关注，单体架构在许多场景下仍然是务实的选择。

## 单体架构优势

### 简单直接

单体架构最大的优势在于简单：

```text
单体应用结构：
┌─────────────────────────────────────────────────────┐
│                    单体应用                          │
│  ┌───────────────────────────────────────────────┐  │
│  │              表现层 (UI)                       │  │
│  ├───────────────────────────────────────────────┤  │
│  │              业务逻辑层                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │  │
│  │  │ 用户模块 │ │ 订单模块 │ │ 商品模块 │         │  │
│  │  └─────────┘ └─────────┘ └─────────┘         │  │
│  ├───────────────────────────────────────────────┤  │
│  │              数据访问层                        │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │              数据库                            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**简单性体现在**：

| 方面 | 单体架构 | 微服务架构 |
|------|----------|------------|
| 部署 | 一个文件/容器 | 多个服务独立部署 |
| 网络 | 进程内调用 | 网络通信 (HTTP/RPC) |
| 事务 | 本地事务 ACID | 分布式事务 |
| 调试 | 单进程调试 | 分布式追踪 |
| 测试 | 集成测试简单 | 需要服务 Mock |

### 开发效率高

**快速启动**：

```bash
# 单体应用启动
git clone project
npm install
npm start
# 完成！

# 微服务启动
git clone project-a
git clone project-b
git clone project-c
# 配置服务发现
# 配置消息队列
# 配置配置中心
# 配置 API 网关
# ...可能需要一整天
```

**代码共享简单**：

```typescript
// 单体应用中共享代码非常简单
// src/shared/utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 任何模块都可以直接导入
import { formatDate } from '../shared/utils';

// 微服务中需要：
// 1. 发布到私有 npm 包
// 2. 或者复制代码
// 3. 或者创建共享服务
```

### 事务处理简单

```typescript
// 单体应用：本地事务
async function createOrder(orderData: OrderData) {
  await this.db.transaction(async (trx) => {
    // 1. 创建订单
    const order = await trx('orders').insert(orderData);

    // 2. 扣减库存
    await trx('inventory').decrement('stock', orderData.quantity);

    // 3. 扣减余额
    await trx('accounts').decrement('balance', orderData.total);

    // 全部成功或全部回滚，ACID 保证
  });
}

// 微服务：需要复杂的分布式事务
async function createOrder(orderData: OrderData) {
  // 需要 Saga/TCC 等模式处理
  // 代码复杂度大幅增加
}
```

### 运维成本低

```text
单体应用运维：
┌─────────────────────────────────────┐
│  监控：一个应用                      │
│  日志：一个来源                      │
│  部署：一个流程                      │
│  扩容：整体复制                      │
└─────────────────────────────────────┘

微服务运维：
┌─────────────────────────────────────┐
│  监控：N 个服务 + 基础设施           │
│  日志：需要聚合系统                  │
│  部署：N 个独立流程                  │
│  扩容：按服务独立决策                │
└─────────────────────────────────────┘
```

### 性能优势

**进程内调用**：

```typescript
// 单体应用：进程内调用，微秒级
const user = this.userService.getUser(userId);  // ~1μs

// 微服务：网络调用，毫秒级
const user = await this.userClient.getUser(userId);  // ~10ms
```

**数据访问优化**：

```typescript
// 单体应用：JOIN 查询，一次数据库访问
SELECT orders.*, users.name, products.title
FROM orders
JOIN users ON orders.user_id = users.id
JOIN products ON orders.product_id = products.id;

// 微服务：需要多次服务调用
// 1. 调用订单服务获取订单
// 2. 调用用户服务获取用户信息
// 3. 调用商品服务获取商品信息
// 数据组装在应用层完成
```

## 模块化设计

单体应用不等于"大泥球"，良好的模块化设计是关键。

### 分层架构

```text
经典分层架构：
┌─────────────────────────────────────────────────────┐
│                  表现层 (Presentation)               │
│              Controllers / Routes / Views           │
├─────────────────────────────────────────────────────┤
│                  应用层 (Application)                │
│              Application Services / DTOs            │
├─────────────────────────────────────────────────────┤
│                  领域层 (Domain)                     │
│           Entities / Value Objects / Aggregates     │
├─────────────────────────────────────────────────────┤
│                  基础设施层 (Infrastructure)         │
│           Repositories / External Services          │
└─────────────────────────────────────────────────────┘
```

**代码组织**：

```text
src/
├── modules/                    # 按业务模块组织
│   ├── user/
│   │   ├── controllers/        # 控制器
│   │   ├── services/           # 业务服务
│   │   ├── repositories/       # 数据访问
│   │   ├── entities/           # 实体类
│   │   └── dto/                # 数据传输对象
│   ├── order/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── entities/
│   │   └── dto/
│   └── product/
├── shared/                     # 共享模块
│   ├── utils/
│   ├── middleware/
│   └── config/
└── main.ts                     # 入口文件
```

### 模块边界

**使用接口定义边界**：

```typescript
// modules/user/interfaces/user-service.interface.ts
export interface IUserService {
  getUser(id: string): Promise<User>;
  createUser(dto: CreateUserDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}

// modules/order/services/order.service.ts
class OrderService {
  // 通过接口依赖，而非具体实现
  constructor(private readonly userService: IUserService) {}

  async createOrder(userId: string, items: OrderItem[]) {
    // 通过接口调用用户服务
    const user = await this.userService.getUser(userId);
    // ...
  }
}
```

**模块间通信规范**：

```typescript
// 好的做法：通过公开的 Service 接口
class OrderService {
  constructor(
    private readonly userService: IUserService,
    private readonly productService: IProductService
  ) {}
}

// 不好的做法：直接访问其他模块的 Repository
class OrderService {
  constructor(
    private readonly userRepository: UserRepository,  // 跨模块访问
    private readonly productRepository: ProductRepository
  ) {}
}
```

### 依赖注入

```typescript
// 使用依赖注入管理模块依赖
import { Container } from 'typedi';

// 注册服务
Container.set('UserService', new UserService(userRepository));
Container.set('OrderService', new OrderService(
  Container.get('UserService'),
  Container.get('ProductService')
));

// 在控制器中使用
class OrderController {
  private orderService = Container.get<OrderService>('OrderService');

  async create(req: Request, res: Response) {
    const order = await this.orderService.createOrder(req.body);
    res.json(order);
  }
}
```

### 内部模块化

```text
模块内部结构：
┌─────────────────────────────────────────────────────┐
│                    OrderModule                       │
├─────────────────────────────────────────────────────┤
│  Public API (对外暴露)                               │
│  ├── IOrderService                                  │
│  ├── OrderController                                │
│  └── DTOs                                           │
├─────────────────────────────────────────────────────┤
│  Internal (内部实现)                                 │
│  ├── OrderService (实现)                            │
│  ├── OrderRepository                                │
│  ├── OrderEntity                                    │
│  └── Domain Events                                  │
└─────────────────────────────────────────────────────┘
         ↑
    只通过 Public API 访问
```

## 单体优先策略

### 为什么单体优先

```text
项目发展阶段：
┌─────────────────────────────────────────────────────────────┐
│  阶段1：探索期        阶段2：验证期       阶段3：成熟期      │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐        │
│  │ 单体应用 │   →    │ 模块化   │   →    │ 微服务   │        │
│  │ 快速迭代 │        │ 单体应用 │        │ 按需拆分 │        │
│  └─────────┘        └─────────┘        └─────────┘        │
│                                                             │
│  特点：              特点：              特点：              │
│  - 业务不确定        - 边界清晰          - 规模大            │
│  - 团队小            - 独立部署需求      - 团队大            │
│  - 快速验证          - 部分服务高负载    - 独立扩展需求      │
└─────────────────────────────────────────────────────────────┘
```

**单体优先的理由**：

1. **业务不确定性**：早期业务需求变化快，单体架构更容易重构
2. **团队规模小**：小团队难以承担微服务的运维复杂度
3. **验证 MVP**：快速验证产品想法，不需要过早优化
4. **降低风险**：避免过早引入分布式系统的复杂性

### 何时考虑拆分

**拆分信号**：

```text
拆分信号检查清单：

业务层面：
┌─────────────────────────────────────────────────────┐
│ [ ] 业务边界已经清晰稳定                              │
│ [ ] 不同模块有不同的扩展需求                          │
│ [ ] 需要独立部署特定模块                              │
│ [ ] 部分模块需要不同的技术栈                          │
└─────────────────────────────────────────────────────┘

团队层面：
┌─────────────────────────────────────────────────────┐
│ [ ] 团队规模超过 20 人                               │
│ [ ] 多团队协作存在冲突                               │
│ [ ] 需要独立团队负责特定模块                         │
└─────────────────────────────────────────────────────┘

技术层面：
┌─────────────────────────────────────────────────────┐
│ [ ] 单体应用部署时间过长                              │
│ [ ] 故障影响范围大                                   │
│ [ ] 性能瓶颈在特定模块                               │
│ [ ] 代码耦合严重影响开发效率                         │
└─────────────────────────────────────────────────────┘
```

## 演进到微服务

### 演进策略

**1. 前置准备**

```text
演进前必须具备的能力：
┌─────────────────────────────────────────────────────┐
│ 基础设施                                             │
│ ├── CI/CD 流程成熟                                   │
│ ├── 容器化部署 (Docker/Kubernetes)                   │
│ ├── 监控告警体系完善                                 │
│ └── 日志聚合系统                                     │
├─────────────────────────────────────────────────────┤
│ 团队能力                                             │
│ ├── 分布式系统经验                                   │
│ ├── DevOps 能力                                      │
│ └── 服务治理经验                                     │
├─────────────────────────────────────────────────────┤
│ 架构基础                                             │
│ ├── 模块边界清晰                                     │
│ ├── 依赖关系明确                                     │
│ └── 接口抽象完善                                     │
└─────────────────────────────────────────────────────┘
```

**2. 渐进式拆分**

```text
拆分顺序建议：
┌─────────────────────────────────────────────────────────────┐
│                                                                                                                         │
│  第一步：拆分边缘服务                                        │
│  ├── 通知服务（邮件、短信）                                  │
│  ├── 文件服务（上传、处理）                                  │
│  └── 报表服务（数据分析）                                    │
│      特点：独立性强、故障影响小                              │
│                                                             │
│  第二步：拆分通用服务                                        │
│  ├── 用户认证服务                                           │
│  ├── 权限服务                                               │
│  └── 配置服务                                               │
│      特点：被多个模块依赖                                    │
│                                                             │
│  第三步：拆分核心业务                                        │
│  ├── 订单服务                                               │
│  ├── 库存服务                                               │
│  └── 支付服务                                               │
│      特点：核心业务、事务复杂                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**3. 拆分步骤**

```text
单个服务拆分流程：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Step 1: 模块化                                             │
│  ├── 明确模块边界                                           │
│  ├── 定义公开接口                                           │
│  └── 消除跨模块直接依赖                                      │
│                                                             │
│  Step 2: 数据分离                                           │
│  ├── 识别模块数据                                           │
│  ├── 创建独立 Schema                                        │
│  └── 数据迁移                                               │
│                                                             │
│  Step 3: 服务提取                                           │
│  ├── 创建独立服务项目                                       │
│  ├── 迁移业务代码                                           │
│  └── 实现服务接口                                           │
│                                                             │
│  Step 4: 接入调用                                           │
│  ├── 原单体改为调用新服务                                    │
│  ├── 灰度切换                                               │
│  └── 监控验证                                               │
│                                                             │
│  Step 5: 清理优化                                           │
│  ├── 删除原模块代码                                         │
│  ├── 优化服务性能                                           │
│  └── 完善监控告警                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据库拆分

```typescript
// 阶段1：共享数据库，独立 Schema
// 单体应用
const db = {
  users: 'shared_db.users',
  orders: 'shared_db.orders',
  products: 'shared_db.products'
};

// 阶段2：逻辑分离，同一实例
const db = {
  users: 'user_db.users',
  orders: 'order_db.orders',
  products: 'product_db.products'
};

// 阶段3：物理分离
// 用户服务 -> user-db:5432
// 订单服务 -> order-db:5432
// 商品服务 -> product-db:5432
```

**数据迁移策略**：

```text
数据迁移步骤：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. 双写阶段                                                │
│     ├── 新数据同时写入新旧数据库                             │
│     └── 读取仍从旧数据库                                     │
│                                                             │
│  2. 数据同步                                                │
│     ├── 历史数据迁移到新数据库                               │
│     └── 验证数据一致性                                       │
│                                                             │
│  3. 切换读取                                                │
│     ├── 读取切换到新数据库                                   │
│     └── 验证功能正常                                         │
│                                                             │
│  4. 停止双写                                                │
│     ├── 停止写入旧数据库                                     │
│     └── 下线旧数据库                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API 兼容层

```typescript
// 在拆分过程中，保持 API 兼容
class OrderFacade {
  // 原单体应用的接口
  async createOrderLegacy(req: CreateOrderRequest) {
    // 内部调用新的微服务
    const user = await this.userService.getUser(req.userId);
    const products = await this.productService.getProducts(req.productIds);
    const order = await this.orderService.createOrder({
      user,
      products,
      ...req
    });
    return order;
  }
}
```

## 最佳实践

### 保持模块独立性

```typescript
// 使用事件解耦模块
class OrderService {
  async createOrder(orderData: OrderData) {
    const order = await this.orderRepository.create(orderData);

    // 发布事件，而非直接调用其他模块
    this.eventBus.publish('order.created', {
      orderId: order.id,
      userId: order.userId,
      total: order.total
    });

    return order;
  }
}

// 其他模块订阅事件
class InventoryService {
  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.reserveStock(event.orderId);
  }
}

class NotificationService {
  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.sendOrderConfirmation(event.userId, event.orderId);
  }
}
```

### 明确模块边界

```text
模块边界检查：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  好的模块边界：                                              │
│  ├── 单一职责：一个模块只做一件事                            │
│  ├── 高内聚：模块内功能紧密相关                              │
│  ├── 松耦合：模块间依赖少                                    │
│  └── 独立部署：可以独立部署                                  │
│                                                             │
│  坏的模块边界：                                              │
│  ├── 职责混乱：用户模块处理订单逻辑                          │
│  ├── 循环依赖：A 依赖 B，B 又依赖 A                          │
│  ├── 过度耦合：修改一个模块影响多个模块                      │
│  └── 边界模糊：模块间共享内部实现                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 代码组织规范

```text
推荐的项目结构：
project/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.entity.ts
│   │   │   └── dto/
│   │   ├── order/
│   │   └── product/
│   │
│   ├── shared/               # 共享模块
│   │   ├── common/           # 公共组件
│   │   ├── events/           # 事件定义
│   │   ├── middleware/       # 中间件
│   │   └── utils/            # 工具函数
│   │
│   ├── config/               # 配置
│   ├── database/             # 数据库配置
│   └── main.ts               # 入口
│
├── tests/                    # 测试
├── package.json
└── tsconfig.json
```

### 监控与日志

```typescript
// 结构化日志
import { Logger } from 'winston';

class OrderService {
  constructor(private logger: Logger) {}

  async createOrder(orderData: OrderData) {
    this.logger.info('Creating order', {
      module: 'order',
      action: 'create',
      userId: orderData.userId,
      itemCount: orderData.items.length
    });

    try {
      const order = await this.orderRepository.create(orderData);

      this.logger.info('Order created successfully', {
        module: 'order',
        orderId: order.id
      });

      return order;
    } catch (error) {
      this.logger.error('Failed to create order', {
        module: 'order',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### 性能优化

```typescript
// 缓存策略
class ProductService {
  constructor(
    private cache: CacheService,
    private productRepository: ProductRepository
  ) {}

  async getProduct(productId: string): Promise<Product> {
    // 缓存优先
    const cached = await this.cache.get(`product:${productId}`);
    if (cached) return cached;

    // 数据库查询
    const product = await this.productRepository.findById(productId);

    // 写入缓存
    await this.cache.set(`product:${productId}`, product, 3600);

    return product;
  }
}

// 批量查询优化
class OrderService {
  async getOrdersWithDetails(orderIds: string[]) {
    // 批量查询，避免 N+1 问题
    const orders = await this.orderRepository.findByIds(orderIds);
    const userIds = [...new Set(orders.map(o => o.userId))];
    const users = await this.userService.getUsers(userIds);

    // 组装数据
    return orders.map(order => ({
      ...order,
      user: users.find(u => u.id === order.userId)
    }));
  }
}
```

## 小结

单体架构不是落后的代名词，而是一种务实的选择：

**适合单体架构的场景**：

- 创业公司、初创项目
- 业务复杂度不高
- 团队规模较小
- 快速验证产品想法
- 运维资源有限

**单体架构成功的关键**：

1. **模块化设计**：清晰的模块边界，为未来拆分做准备
2. **分层架构**：关注点分离，代码组织有序
3. **持续重构**：避免代码腐化，保持架构清晰
4. **监控完善**：即使单体应用也需要完善的监控
5. **渐进演进**：根据实际需求决定是否拆分

记住：**架构服务于业务，而非业务服务于架构**。选择最适合当前阶段的架构，而不是最时髦的架构。
