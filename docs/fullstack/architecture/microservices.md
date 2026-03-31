---
order: 20
---

# 微服务架构

微服务架构是一种将应用构建为一组小型、独立服务的方法，每个服务运行在自己的进程中，通过轻量级机制通信。本章深入探讨微服务架构的核心概念和实践方法。

## 微服务概念与优势

### 什么是微服务

微服务架构的核心特征：

| 特征 | 描述 |
|------|------|
| **服务自治** | 每个服务独立开发、部署、扩展 |
| **业务边界** | 按业务能力划分，而非技术层面 |
| **去中心化** | 数据管理、治理去中心化 |
| **弹性设计** | 容错机制，服务降级策略 |
| **技术异构** | 不同服务可使用不同技术栈 |

```text
微服务架构示意：
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│                    (统一入口、路由、鉴权)                      │
└────────┬──────────┬──────────┬──────────┬───────────────────┘
         │          │          │          │
    ┌────┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐
    │ 用户服务 │ │ 订单服务 │ │ 商品服务 │ │ 支付服务 │
    │ :8001   │ │ :8002   │ │ :8003   │ │ :8004   │
    └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
         │          │          │          │
    ┌────┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐
    │ 用户DB  │ │ 订单DB  │ │ 商品DB  │ │ 支付DB  │
    │ MySQL   │ │ MySQL   │ │ MongoDB │ │ MySQL   │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 微服务 vs 单体架构

```text
单体架构：
┌─────────────────────────────────────┐
│            单体应用                  │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ 用户模块 │ │ 订单模块 │ │商品模块 │ │
│  └─────────┘ └─────────┘ └────────┘ │
│  ┌─────────────────────────────────┐│
│  │          共享数据库              ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
优点：部署简单、调试方便、事务简单
缺点：扩展受限、技术绑定、耦合度高

微服务架构：
┌───────────┐ ┌───────────┐ ┌───────────┐
│  用户服务  │ │  订单服务  │ │  商品服务  │
│  (独立DB) │ │  (独立DB) │ │  (独立DB) │
└───────────┘ └───────────┘ └───────────┘
优点：独立扩展、技术自由、故障隔离
缺点：运维复杂、分布式问题、数据一致性
```

### 微服务的优势

**1. 独立部署**

每个服务可以独立部署，不影响其他服务：

```bash
# 只部署用户服务
kubectl set image deployment/user-service user-service=user-service:v2.0

# 其他服务不受影响，继续运行
```

**2. 技术多样性**

不同服务可选择最适合的技术：

```text
用户服务：Node.js + Express（高并发 I/O）
数据分析：Python + Pandas（数据处理）
核心交易：Java + Spring Boot（稳定性）
实时推送：Go + WebSocket（高性能）
```

**3. 弹性扩展**

按需扩展特定服务：

```text
流量分布：
┌─────────────┐
│   用户服务   │ × 2 实例（低负载）
├─────────────┤
│   订单服务   │ × 5 实例（高负载）
├─────────────┤
│   商品服务   │ × 3 实例（中负载）
└─────────────┘
```

**4. 故障隔离**

单个服务故障不会导致整体崩溃：

```text
正常状态：
服务A ──→ 服务B ──→ 服务C ──→ 服务D
  ✓         ✓         ✓         ✓

服务B故障时：
服务A ──→ 服务B ──→ 服务C ──→ 服务D
  ✓         ✗    ───→  ✓         ✓
           (熔断降级)
```

## 服务拆分策略

### 按业务能力拆分

基于领域驱动设计 (DDD) 的限界上下文：

```
电商系统业务边界：
┌─────────────────────────────────────────────────┐
│                   电商系统                       │
├─────────────┬─────────────┬─────────────────────┤
│  用户上下文  │  商品上下文  │     订单上下文       │
│  ┌───────┐  │  ┌───────┐  │  ┌───────────────┐  │
│  │ 注册  │  │  │ 商品  │  │  │     下单      │  │
│  │ 登录  │  │  │ 分类  │  │  │     支付      │  │
│  │ 权限  │  │  │ 库存  │  │  │     物流      │  │
│  └───────┘  │  └───────┘  │  └───────────────┘  │
└─────────────┴─────────────┴─────────────────────┘
```

### 服务拆分原则

**1. 单一职责**

每个服务只负责一个业务领域：

```typescript
// 好的服务边界
class OrderService {
  // 只处理订单相关逻辑
  createOrder() {}
  cancelOrder() {}
  getOrderStatus() {}
}

// 不好的服务边界
class BusinessService {
  // 混合多个业务领域
  createOrder() {}
  manageUser() {}
  handlePayment() {}
}
```

**2. 高内聚**

服务内部功能紧密相关：

```
订单服务内部结构：
┌─────────────────────────────────┐
│          OrderService           │
├─────────────────────────────────┤
│  OrderController                │
│  ├── createOrder()              │
│  ├── cancelOrder()              │
│  └── getOrder()                 │
├─────────────────────────────────┤
│  OrderService (业务逻辑)         │
│  OrderRepository (数据访问)      │
│  OrderValidator (校验逻辑)       │
└─────────────────────────────────┘
```

**3. 松耦合**

服务间依赖最小化：

```typescript
// 紧耦合：直接依赖具体实现
class OrderService {
  private userService = new UserService();
  
  createOrder(userId: string) {
    const user = this.userService.getUser(userId); // 直接调用
  }
}

// 松耦合：通过接口和消息通信
class OrderService {
  constructor(private userClient: UserClient) {}
  
  async createOrder(userId: string) {
    const user = await this.userClient.getUser(userId); // HTTP/RPC 调用
  }
}
```

### 服务粒度控制

服务粒度的权衡：

```
粒度过细：
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│登录│ │注册│ │修改│ │查询│ │删除│
└───┘ └───┘ └───┘ └───┘ └───┘
问题：通信开销大、运维复杂、事务困难

粒度过粗：
┌─────────────────────────────┐
│        用户订单商品服务        │
└─────────────────────────────┘
问题：失去微服务优势、耦合度高

合适粒度：
┌─────────┐ ┌─────────┐ ┌─────────┐
│ 用户服务 │ │ 订单服务 │ │ 商品服务 │
└─────────┘ └─────────┘ └─────────┘
平衡：业务边界清晰、独立部署、适度规模
```

**粒度判断标准**：

- 服务代码量：1万-5万行较为合适
- 团队规模：一个服务由2-5人团队维护
- 变更频率：服务内部变更频繁，服务间变更较少
- 数据依赖：服务拥有独立的数据存储

## 服务通信模式

### 同步通信

**RESTful API**

```typescript
// 服务间 REST 调用
class OrderClient {
  private baseUrl = 'http://order-service:8002';
  
  async getOrder(orderId: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`);
    return response.json();
  }
  
  async createOrder(order: CreateOrderDto): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.json();
  }
}
```

**gRPC**

适用于高性能内部通信：

```protobuf
// order.proto
syntax = "proto3";

service OrderService {
  rpc GetOrder (GetOrderRequest) returns (Order);
  rpc CreateOrder (CreateOrderRequest) returns (Order);
}

message GetOrderRequest {
  string order_id = 1;
}

message Order {
  string id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;
  double total = 4;
}
```

```typescript
// gRPC 客户端调用
import { OrderServiceClient } from './generated/order_grpc';

const client = new OrderServiceClient(
  'order-service:50051',
  grpc.credentials.createInsecure()
);

client.getOrder({ order_id: '123' }, (err, order) => {
  if (err) console.error(err);
  else console.log(order);
});
```

### 异步通信

**消息队列模式**

```
发布-订阅模式：
┌─────────────┐
│  订单服务    │
│ (发布者)    │
└──────┬──────┘
       │ 发布 OrderCreated 事件
       ↓
┌─────────────┐
│ 消息队列     │
│ (RabbitMQ/  │
│  Kafka)     │
└──────┬──────┘
       │ 订阅
       ├──────────┬──────────┐
       ↓          ↓          ↓
┌───────────┐ ┌───────────┐ ┌───────────┐
│ 库存服务   │ │ 通知服务   │ │ 积分服务   │
│ (订阅者)  │ │ (订阅者)   │ │ (订阅者)   │
└───────────┘ └───────────┘ └───────────┘
```

```typescript
// 事件发布
class OrderEventPublisher {
  constructor(private messageQueue: MessageQueue) {}
  
  async publishOrderCreated(order: Order) {
    await this.messageQueue.publish('order.created', {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      timestamp: Date.now()
    });
  }
}

// 事件订阅
class InventorySubscriber {
  constructor(private inventoryService: InventoryService) {}
  
  async subscribe() {
    await this.messageQueue.subscribe('order.created', async (event) => {
      await this.inventoryService.reserveStock(event.items);
    });
  }
}
```

**事件溯源**

```
传统方式：存储当前状态
┌─────────────────────────────┐
│ Order Table                 │
│ id | status | total | ...   │
│ 1  | PAID   | 100   | ...   │ ← 只存最终状态
└─────────────────────────────┘

事件溯源：存储状态变更事件
┌─────────────────────────────────────────┐
│ Event Store                              │
│ type          | data        | timestamp │
│ OrderCreated  | {...}       | t1        │
│ ItemAdded     | {...}       | t2        │
│ OrderPaid     | {...}       | t3        │
│ OrderShipped  | {...}       | t4        │
└─────────────────────────────────────────┘
通过重放事件重建任意时刻的状态
```

### 服务发现

```
服务发现流程：
┌─────────────┐     1. 注册      ┌─────────────┐
│ 订单服务    │ ──────────────→  │ 服务注册中心 │
│ :8002       │                  │ (Consul/    │
└─────────────┘                  │  Nacos/     │
                                 │  Eureka)    │
┌─────────────┐     2. 发现      └─────────────┘
│ 用户服务    │ ──────────────→        ↑
│ (调用方)    │                        │
└─────────────┘     3. 返回服务列表    │
       ↓            ←──────────────────┘
       │ 4. 调用目标服务
       ↓
┌─────────────┐
│ 订单服务    │
│ :8002       │
└─────────────┘
```

```typescript
// 客户端服务发现
class ServiceDiscovery {
  private services: Map<string, ServiceInstance[]> = new Map();
  
  async getService(name: string): Promise<ServiceInstance> {
    const instances = this.services.get(name) || [];
    // 负载均衡：轮询、随机、权重等
    return this.loadBalance(instances);
  }
}

// 使用服务发现调用
class UserClient {
  constructor(private discovery: ServiceDiscovery) {}
  
  async getUser(userId: string) {
    const service = await this.discovery.getService('user-service');
    const response = await fetch(`http://${service.host}:${service.port}/users/${userId}`);
    return response.json();
  }
}
```

## 分布式事务

### 分布式事务挑战

```
本地事务（ACID）：
┌─────────────────────────────────────┐
│           单数据库事务               │
│  BEGIN;                             │
│    UPDATE accounts SET balance -= 100; │
│    UPDATE accounts SET balance += 100; │
│  COMMIT;                            │
└─────────────────────────────────────┘
保证：原子性、一致性、隔离性、持久性

分布式事务：
┌───────────┐     ┌───────────┐     ┌───────────┐
│ 订单服务   │     │ 库存服务   │     │ 支付服务   │
│  (DB1)    │     │  (DB2)    │     │  (DB3)    │
└───────────┘     └───────────┘     └───────────┘
挑战：网络分区、部分失败、超时重试
```

### 解决方案

**1. 两阶段提交 (2PC)**

```
两阶段提交流程：
┌─────────────────────────────────────────────────┐
│                   协调者                          │
└───────────────┬─────────────┬───────────────────┘
                │             │
    ┌───────────┴───┐    ┌────┴──────────┐
    │   参与者 A     │    │   参与者 B     │
    └───────────────┘    └───────────────┘

阶段1：准备阶段
协调者 → 参与者：PREPARE
参与者 → 协调者：READY（或 ABORT）

阶段2：提交阶段
如果所有参与者都 READY：
  协调者 → 参与者：COMMIT
否则：
  协调者 → 参与者：ROLLBACK
```

**缺点**：同步阻塞、单点故障、数据不一致风险

**2. 三阶段提交 (3PC)**

在 2PC 基础上增加预提交阶段，减少阻塞：

```
阶段1：CanCommit（询问是否可以提交）
阶段2：PreCommit（预提交）
阶段3：DoCommit（正式提交）
```

**3. TCC (Try-Confirm-Cancel)**

```typescript
// TCC 模式实现
class OrderTccService {
  
  // Try 阶段：预留资源
  async tryCreateOrder(orderDto: CreateOrderDto): Promise<Order> {
    // 1. 创建订单（状态：PENDING）
    const order = await this.orderRepository.create({
      ...orderDto,
      status: 'PENDING'
    });
    
    // 2. 预留库存
    await this.inventoryClient.reserveStock(orderDto.items);
    
    // 3. 预扣金额
    await this.paymentClient.freezeAmount(orderDto.userId, orderDto.total);
    
    return order;
  }
  
  // Confirm 阶段：确认提交
  async confirmOrder(orderId: string): Promise<void> {
    // 1. 更新订单状态
    await this.orderRepository.updateStatus(orderId, 'CONFIRMED');
    
    // 2. 确认扣减库存
    await this.inventoryClient.confirmDeduction(orderId);
    
    // 3. 确认扣款
    await this.paymentClient.confirmDeduction(orderId);
  }
  
  // Cancel 阶段：取消回滚
  async cancelOrder(orderId: string): Promise<void> {
    // 1. 更新订单状态
    await this.orderRepository.updateStatus(orderId, 'CANCELLED');
    
    // 2. 释放库存
    await this.inventoryClient.releaseReservation(orderId);
    
    // 3. 解冻金额
    await this.paymentClient.unfreezeAmount(orderId);
  }
}
```

**4. Saga 模式**

```
Saga 编排模式：
┌──────────────────────────────────────────────────────┐
│                    Saga 协调器                        │
└──────────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────┐     成功     ┌─────────┐     成功     ┌─────────┐
    │ 创建订单 │ ─────────→  │ 扣减库存 │ ─────────→  │ 扣减余额 │
    └─────────┘             └─────────┘             └─────────┘
         │                       │                       │
         │ 失败                  │ 失败                  │ 失败
         ↓                       ↓                       ↓
    ┌─────────┐             ┌─────────┐             ┌─────────┐
    │ 取消订单 │ ←────────── │ 恢复库存 │ ←────────── │ 恢复余额 │
    └─────────┘   补偿      └─────────┘   补偿      └─────────┘
```

```typescript
// Saga 编排器
class CreateOrderSaga {
  private steps: SagaStep[] = [
    { action: 'createOrder', compensate: 'cancelOrder' },
    { action: 'reserveStock', compensate: 'releaseStock' },
    { action: 'processPayment', compensate: 'refundPayment' }
  ];
  
  async execute(orderData: OrderData): Promise<void> {
    const completedSteps: number[] = [];
    
    for (let i = 0; i < this.steps.length; i++) {
      try {
        await this.executeStep(this.steps[i].action, orderData);
        completedSteps.push(i);
      } catch (error) {
        // 执行补偿
        for (const stepIndex of completedSteps.reverse()) {
          await this.executeStep(this.steps[stepIndex].compensate, orderData);
        }
        throw error;
      }
    }
  }
}
```

**5. 本地消息表**

```
本地消息表模式：
┌─────────────────────────────────────────────────────┐
│                    订单服务                          │
│  ┌─────────────┐    ┌─────────────────────────────┐ │
│  │ 本地事务：   │    │ 本地消息表                   │ │
│  │ 1. 创建订单 │    │ id | event_type | status   │ │
│  │ 2. 写入消息 │    │ 1  | stock.reserve | PENDING│ │
│  └─────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                              │
                              ↓ 消息投递
                    ┌─────────────────┐
                    │    库存服务      │
                    │ 处理消息并确认   │
                    └─────────────────┘
```

### 最终一致性

微服务架构通常采用最终一致性模型：

```
一致性级别对比：
┌─────────────────┬─────────────────────────────────┐
│ 强一致性         │ 所有节点同时看到相同数据          │
│                 │ 性能低，实现复杂                  │
├─────────────────┼─────────────────────────────────┤
│ 最终一致性       │ 一定时间后所有节点看到相同数据    │
│                 │ 性能高，实现相对简单              │
└─────────────────┴─────────────────────────────────┘

实现方式：
- 异步事件通知
- 定时任务补偿
- 手动对账修复
```

## 实战考量

### 可观测性

**日志聚合**

```
┌───────────┐   ┌───────────┐   ┌───────────┐
│ 服务 A    │   │ 服务 B    │   │ 服务 C    │
│ 日志      │   │ 日志      │   │ 日志      │
└─────┬─────┘   └─────┬─────┘   └─────┬─────┘
      │               │               │
      └───────────────┼───────────────┘
                      ↓
              ┌───────────────┐
              │  日志聚合系统  │
              │ (ELK/Loki)    │
              └───────────────┘
                      │
              ┌───────────────┐
              │  统一查询界面  │
              └───────────────┘
```

**分布式追踪**

```typescript
// 使用 OpenTelemetry
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function createOrder(orderData: OrderData) {
  const span = tracer.startSpan('createOrder');
  
  try {
    // 设置追踪属性
    span.setAttributes({
      'order.userId': orderData.userId,
      'order.itemCount': orderData.items.length
    });
    
    // 业务逻辑
    await processOrder(orderData);
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

```
追踪链示例：
┌─────────────────────────────────────────────────────────────┐
│ Trace ID: abc123                                            │
├─────────────────────────────────────────────────────────────┤
│ [API Gateway]     0ms ────────────────────────── 50ms      │
│ [Order Service]   5ms ──────────────── 45ms                │
│ [Inventory]       10ms ──────── 25ms                        │
│ [Payment]         30ms ────────────── 40ms                  │
└─────────────────────────────────────────────────────────────┘
```

### 容错设计

**熔断器模式**

```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold = 5;
  private readonly timeout = 30000;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
      }, this.timeout);
    }
  }
}
```

```
熔断器状态机：
┌─────────────────────────────────────────────────┐
│                                                 │
│    失败次数 < 阈值         成功                  │
│  ┌─────────┐          ┌─────────┐              │
│  │  CLOSED │ ←─────── │HALF_OPEN│              │
│  │ (正常)  │          │ (探测)  │              │
│  └────┬────┘          └────┬────┘              │
│       │                    │                    │
│       │ 失败次数 >= 阈值    │ 失败               │
│       ↓                    ↓                    │
│  ┌─────────┐          ┌─────────┐              │
│  │  OPEN   │ ──────── │  OPEN   │              │
│  │ (熔断)  │ 超时后    │ (熔断)  │              │
│  └─────────┘          └─────────┘              │
└─────────────────────────────────────────────────┘
```

**重试策略**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 指数退避
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

**降级策略**

```typescript
class OrderService {
  private recommendationService: RecommendationClient;
  
  async getOrderRecommendations(userId: string): Promise<Product[]> {
    try {
      return await this.recommendationService.getRecommendations(userId);
    } catch (error) {
      // 降级：返回热门商品
      console.warn('Recommendation service unavailable, using fallback');
      return this.getHotProducts();
    }
  }
  
  private async getHotProducts(): Promise<Product[]> {
    // 从缓存或数据库获取热门商品
    return this.cache.get('hot_products') || [];
  }
}
```

### 配置管理

**集中式配置**

```
配置中心架构：
┌─────────────────────────────────────────────────┐
│                 配置中心                         │
│              (Apollo/Nacos/Consul)              │
└───────────────────────┬─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ 服务 A        │ │ 服务 B        │ │ 服务 C        │
│ 配置热更新     │ │ 配置热更新     │ │ 配置热更新     │
└───────────────┘ └───────────────┘ └───────────────┘
```

```typescript
// 配置使用示例
import { ConfigService } from '@nestjs/config';

@Injectable()
class OrderService {
  constructor(private config: ConfigService) {}
  
  async createOrder() {
    const maxItems = this.config.get('ORDER_MAX_ITEMS', 100);
    const timeout = this.config.get('ORDER_TIMEOUT', 5000);
    // 使用配置...
  }
}
```

### API 网关

```
API 网关职责：
┌─────────────────────────────────────────────────────┐
│                    API Gateway                       │
├─────────────────────────────────────────────────────┤
│  路由转发    →  请求路由到对应服务                    │
│  负载均衡    →  分发请求到服务实例                    │
│  认证授权    →  统一身份验证                          │
│  限流熔断    →  保护后端服务                          │
│  日志监控    →  统一日志收集                          │
│  协议转换    →  HTTP/gRPC/WebSocket 转换             │
└─────────────────────────────────────────────────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│用户服务│ │订单服务│ │商品服务│ │支付服务│
└───────┘ └───────┘ └───────┘ └───────┘
```

## 小结

微服务架构不是银弹，需要权衡利弊：

**适用场景**：

- 业务复杂度高，需要独立扩展
- 团队规模较大，需要并行开发
- 对可用性要求高，需要故障隔离
- 业务边界清晰，服务划分合理

**不适用场景**：

- 业务简单，团队规模小
- 对延迟敏感，无法接受网络开销
- 团队缺乏微服务运维经验
- 没有明确的业务边界

**关键成功因素**：

1. 清晰的服务边界划分
2. 完善的基础设施支持
3. 成熟的运维能力
4. 团队对分布式系统的理解
5. 渐进式的演进策略

从单体开始，在真正需要时再拆分为微服务，是更务实的选择。
