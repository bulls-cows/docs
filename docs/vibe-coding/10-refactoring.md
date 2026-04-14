---
order: 80
---

# AI 辅助重构

代码重构是改善代码质量的重要手段。AI 可以帮助识别重构机会、生成重构代码、确保重构安全。本章介绍利用 AI 进行代码重构的策略和方法。

## 什么是代码重构

代码重构是在不改变代码外部行为的前提下，改善代码内部结构的过程。重构的目标：

1. **提高可读性**：让代码更容易理解
2. **降低复杂度**：简化代码逻辑
3. **消除重复**：提取公共代码
4. **提高可维护性**：便于后续修改
5. **优化性能**：改善执行效率

## AI 辅助重构的优势

### 传统重构 vs AI 辅助重构

| 传统重构 | AI 辅助重构 |
|---------|------------|
| 手动识别重构点 | AI 分析并建议重构 |
| 手动编写重构代码 | AI 生成重构代码 |
| 容易遗漏依赖 | AI 分析影响范围 |
| 重构风险较高 | AI 提供安全检查 |
| 耗时较长 | 效率显著提升 |

### AI 重构的核心价值

1. **识别机会**：AI 可以发现人眼容易忽略的重构点
2. **生成代码**：快速生成重构后的代码
3. **保证安全**：分析重构的影响范围
4. **保持一致**：遵循统一的代码风格
5. **文档生成**：自动生成重构说明

## 重构场景

### 场景一：提取函数

```markdown
// 提示词示例
"以下代码有一个过长的函数，请将其拆分为多个小函数：

```typescript
async function processOrder(orderId: string) {
  // 获取订单
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  
  // 验证订单状态
  if (order.status !== 'pending') {
    throw new Error('Order is not pending');
  }
  
  // 获取订单商品
  const items = await db.orderItem.findMany({
    where: { orderId },
    include: { product: true }
  });
  
  // 计算总价
  let total = 0;
  for (const item of items) {
    total += item.quantity * item.product.price;
  }
  
  // 应用折扣
  if (order.discountCode) {
    const discount = await db.discount.findUnique({
      where: { code: order.discountCode }
    });
    if (discount && discount.validUntil > new Date()) {
      total = total * (1 - discount.percentage / 100);
    }
  }
  
  // 更新订单
  await db.order.update({
    where: { id: orderId },
    data: { total, status: 'processed' }
  });
  
  // 发送通知
  const user = await db.user.findUnique({ where: { id: order.userId } });
  await sendEmail(user.email, 'Order Processed', `Total: ${total}`);
  
  return { order, items, total };
}
```text

请保持函数职责单一，每个函数不超过 20 行。"

// AI 重构结果

```typescript
async function processOrder(orderId: string) {
  const order = await getOrder(orderId);
  validateOrderStatus(order);
  
  const items = await getOrderItems(orderId);
  const total = await calculateOrderTotal(order, items);
  
  await updateOrderTotal(orderId, total);
  await sendOrderNotification(order, total);
  
  return { order, items, total };
}

async function getOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  return order;
}

function validateOrderStatus(order: Order) {
  if (order.status !== 'pending') {
    throw new Error('Order is not pending');
  }
}

async function getOrderItems(orderId: string) {
  return await db.orderItem.findMany({
    where: { orderId },
    include: { product: true }
  });
}

async function calculateOrderTotal(order: Order, items: OrderItem[]) {
  let total = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );
  
  if (order.discountCode) {
    total = await applyDiscount(total, order.discountCode);
  }
  
  return total;
}

async function applyDiscount(total: number, discountCode: string) {
  const discount = await db.discount.findUnique({
    where: { code: discountCode }
  });
  
  if (discount && discount.validUntil > new Date()) {
    return total * (1 - discount.percentage / 100);
  }
  
  return total;
}

async function updateOrderTotal(orderId: string, total: number) {
  await db.order.update({
    where: { id: orderId },
    data: { total, status: 'processed' }
  });
}

async function sendOrderNotification(order: Order, total: number) {
  const user = await db.user.findUnique({ where: { id: order.userId } });
  await sendEmail(user.email, 'Order Processed', `Total: ${total}`);
}
```text

```text

### 场景二：消除重复代码

```markdown
// 提示词示例
"以下代码有重复的逻辑，请消除重复：

```typescript
async function createProduct(data: CreateProductDTO) {
  if (!data.name) throw new Error('Name is required');
  if (!data.price || data.price < 0) throw new Error('Invalid price');
  
  const product = await db.product.create({
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      createdAt: new Date()
    }
  });
  
  return product;
}

async function updateProduct(id: string, data: UpdateProductDTO) {
  if (data.name !== undefined && !data.name) {
    throw new Error('Name is required');
  }
  if (data.price !== undefined && data.price < 0) {
    throw new Error('Invalid price');
  }
  
  const product = await db.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      updatedAt: new Date()
    }
  });
  
  return product;
}
```text

请提取公共逻辑。"

// AI 重构结果

```typescript
// 验证函数
function validateProductData(data: Partial<CreateProductDTO>) {
  if (data.name !== undefined && !data.name) {
    throw new Error('Name is required');
  }
  if (data.price !== undefined && data.price < 0) {
    throw new Error('Invalid price');
  }
}

// 数据准备函数
function prepareProductData(data: CreateProductDTO | UpdateProductDTO) {
  return {
    name: data.name,
    price: data.price,
    description: data.description
  };
}

async function createProduct(data: CreateProductDTO) {
  validateProductData(data);
  
  const product = await db.product.create({
    data: {
      ...prepareProductData(data),
      createdAt: new Date()
    }
  });
  
  return product;
}

async function updateProduct(id: string, data: UpdateProductDTO) {
  validateProductData(data);
  
  const product = await db.product.update({
    where: { id },
    data: {
      ...prepareProductData(data),
      updatedAt: new Date()
    }
  });
  
  return product;
}
```text

```text

### 场景三：简化条件逻辑

```markdown
// 提示词示例
"以下代码的条件逻辑很复杂，请简化：

```typescript
function calculateShipping(order: Order): number {
  let shipping = 0;
  
  if (order.items.length > 0) {
    if (order.user.level === 'VIP') {
      if (order.total > 500) {
        shipping = 0;
      } else if (order.total > 200) {
        shipping = 5;
      } else {
        shipping = 10;
      }
    } else if (order.user.level === 'GOLD') {
      if (order.total > 1000) {
        shipping = 0;
      } else if (order.total > 500) {
        shipping = 8;
      } else {
        shipping = 15;
      }
    } else {
      if (order.total > 1000) {
        shipping = 5;
      } else {
        shipping = 20;
      }
    }
  }
  
  return shipping;
}
```text

请使用策略模式或查找表简化。"

// AI 重构结果

```typescript
// 使用查找表简化
const SHIPPING_RATES = {
  VIP: [
    { minTotal: 500, shipping: 0 },
    { minTotal: 200, shipping: 5 },
    { minTotal: 0, shipping: 10 }
  ],
  GOLD: [
    { minTotal: 1000, shipping: 0 },
    { minTotal: 500, shipping: 8 },
    { minTotal: 0, shipping: 15 }
  ],
  NORMAL: [
    { minTotal: 1000, shipping: 5 },
    { minTotal: 0, shipping: 20 }
  ]
};

function calculateShipping(order: Order): number {
  if (order.items.length === 0) return 0;
  
  const rates = SHIPPING_RATES[order.user.level] || SHIPPING_RATES.NORMAL;
  const rate = rates.find(r => order.total > r.minTotal);
  
  return rate?.shipping ?? 0;
}
```text

```text

### 场景四：优化数据结构

```markdown
// 提示词示例
"以下代码使用数组查找效率低，请优化数据结构：

```typescript
class UserService {
  private users: User[] = [];
  
  addUser(user: User) {
    this.users.push(user);
  }
  
  findById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }
  
  findByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }
  
  removeUser(id: string) {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}
```text

请使用 Map 优化查找效率。"

// AI 重构结果

```typescript
class UserService {
  private usersById: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  
  addUser(user: User) {
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }
  
  findById(id: string): User | undefined {
    return this.usersById.get(id);
  }
  
  findByEmail(email: string): User | undefined {
    return this.usersByEmail.get(email);
  }
  
  removeUser(id: string) {
    const user = this.usersById.get(id);
    if (user) {
      this.usersById.delete(id);
      this.usersByEmail.delete(user.email);
    }
  }
  
  getAll(): User[] {
    return Array.from(this.usersById.values());
  }
}
```text

```text

### 场景五：引入设计模式

```markdown
// 提示词示例
"以下代码有大量条件判断，请使用策略模式重构：

```typescript
function processPayment(type: string, amount: number) {
  if (type === 'credit_card') {
    // 信用卡支付逻辑
    const fee = amount * 0.02;
    console.log(`Processing credit card payment: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  } else if (type === 'paypal') {
    // PayPal 支付逻辑
    const fee = amount * 0.03;
    console.log(`Processing PayPal payment: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  } else if (type === 'bank_transfer') {
    // 银行转账逻辑
    const fee = amount > 1000 ? 0 : 5;
    console.log(`Processing bank transfer: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  } else if (type === 'crypto') {
    // 加密货币支付逻辑
    const fee = amount * 0.01;
    console.log(`Processing crypto payment: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  }
  throw new Error('Unsupported payment type');
}
```text

请使用策略模式重构，便于扩展新的支付方式。"

// AI 重构结果

```typescript
// 支付策略接口
interface PaymentStrategy {
  process(amount: number): PaymentResult;
}

interface PaymentResult {
  success: boolean;
  fee: number;
}

// 信用卡支付策略
class CreditCardPayment implements PaymentStrategy {
  process(amount: number): PaymentResult {
    const fee = amount * 0.02;
    console.log(`Processing credit card payment: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  }
}

// PayPal 支付策略
class PayPalPayment implements PaymentStrategy {
  process(amount: number): PaymentResult {
    const fee = amount * 0.03;
    console.log(`Processing PayPal payment: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  }
}

// 银行转账策略
class BankTransferPayment implements PaymentStrategy {
  process(amount: number): PaymentResult {
    const fee = amount > 1000 ? 0 : 5;
    console.log(`Processing bank transfer: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  }
}

// 加密货币支付策略
class CryptoPayment implements PaymentStrategy {
  process(amount: number): PaymentResult {
    const fee = amount * 0.01;
    console.log(`Processing crypto payment: ${amount}, fee: ${fee}`);
    return { success: true, fee };
  }
}

// 支付处理器
class PaymentProcessor {
  private strategies: Map<string, PaymentStrategy> = new Map();
  
  constructor() {
    this.registerStrategy('credit_card', new CreditCardPayment());
    this.registerStrategy('paypal', new PayPalPayment());
    this.registerStrategy('bank_transfer', new BankTransferPayment());
    this.registerStrategy('crypto', new CryptoPayment());
  }
  
  registerStrategy(type: string, strategy: PaymentStrategy) {
    this.strategies.set(type, strategy);
  }
  
  processPayment(type: string, amount: number): PaymentResult {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unsupported payment type: ${type}`);
    }
    return strategy.process(amount);
  }
}

// 使用示例
const processor = new PaymentProcessor();
processor.processPayment('credit_card', 100);
processor.processPayment('paypal', 100);

// 添加新的支付方式
processor.registerStrategy('alipay', new AlipayPayment());
```text

```text

## 重构流程

### 标准重构流程

```markdown
## AI 辅助重构流程

### 1. 识别重构点
- 让 AI 分析代码，找出可重构的地方
- 关注：重复代码、过长函数、复杂条件、过大类

### 2. 评估影响
- 让 AI 分析重构的影响范围
- 确认是否有其他代码依赖

### 3. 准备测试
- 确保有足够的测试覆盖
- 让 AI 生成缺失的测试

### 4. 执行重构
- 让 AI 生成重构代码
- 小步重构，逐步验证

### 5. 验证结果
- 运行测试确保行为不变
- 进行代码审查

### 6. 提交代码
- 生成清晰的 commit 信息
- 记录重构原因
```text

### 重构请求模板

```markdown
## 重构请求

### 当前代码
```typescript
[待重构的代码]
```text

### 重构目标

[描述重构的目标，如：提取函数、消除重复、简化逻辑等]

### 约束条件

- 保持外部行为不变
- 遵循项目代码风格
- 每个函数不超过 [N] 行
- [其他约束]

### 请提供

1. 重构后的代码
2. 重构说明
3. 需要注意的风险点

```text

## 重构最佳实践

### 实践一：小步重构

```markdown
// ❌ 错误做法
一次性重构整个模块

// ✅ 正确做法
分步骤重构：
1. "提取 validateOrderStatus 函数"
2. "提取 calculateTotal 函数"
3. "提取 sendNotification 函数"
4. "优化主函数逻辑"
```text

### 实践二：保持测试覆盖

```markdown
// 重构前
"请为以下代码生成测试用例，确保重构安全"

// 重构中
"请重构代码，保持测试通过"

// 重构后
"运行测试，确保所有测试通过"
```text

### 实践三：保留历史记录

```markdown
// 让 AI 生成重构说明
"请为这次重构生成说明：
- 重构原因
- 主要改动
- 影响范围
- 风险点"

// AI 生成的说明
## 重构说明

### 重构原因
processOrder 函数过长（50+ 行），职责不单一，难以维护

### 主要改动
1. 提取 getOrder 函数 - 获取订单
2. 提取 validateOrderStatus 函数 - 验证状态
3. 提取 calculateOrderTotal 函数 - 计算总价
4. 提取 sendOrderNotification 函数 - 发送通知

### 影响范围
- processOrder 函数签名不变
- 新增 4 个内部函数
- 测试用例需要更新

### 风险点
- 异步调用顺序需要验证
- 错误处理需要保持一致
```text

## 小结

AI 辅助重构的关键点：

1. **识别机会**：让 AI 分析代码，找出重构点
2. **小步重构**：逐步重构，每步验证
3. **保证安全**：有测试覆盖再重构
4. **保持行为**：重构不改变外部行为
5. **记录说明**：生成重构说明，便于追溯

AI 可以显著提高重构效率，但重构决策和验证仍需人工把控。

---

## 参考资料

- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
- [Code Smells](https://refactoring.guru/refactoring/smells)
- [Design Patterns](https://refactoring.guru/design-patterns)
