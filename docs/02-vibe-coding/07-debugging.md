
# 调试技巧

调试是开发过程中不可避免的环节。AI 可以显著提高调试效率，帮助你快速定位和解决问题。本章介绍 AI 辅助调试的方法和技巧。

## AI 辅助调试的优势

### 传统调试 vs AI 辅助调试

| 传统调试 | AI 辅助调试 |
|---------|------------|
| 手动分析错误信息 | AI 解释错误含义 |
| 逐行检查代码 | AI 定位问题代码 |
| 搜索解决方案 | AI 提供修复建议 |
| 反复尝试修复 | AI 给出多种方案 |

### AI 调试的核心价值

1. **快速理解**：AI 可以解释复杂的错误信息
2. **精准定位**：AI 可以分析代码并定位问题
3. **方案建议**：AI 可以提供多种修复方案
4. **知识积累**：AI 可以解释问题根因，帮助学习

## 调试流程

### 标准调试流程

```mermaid
graph LR
    A[发现错误] --> B[描述问题]
    B --> C[AI 分析]
    C --> D[获取建议]
    D --> E[应用修复]
    E --> F{问题解决}
    F -->|否| G[提供反馈]
    G --> C
    F -->|是| H[总结经验]
```text

### 步骤一：描述问题

向 AI 清晰描述遇到的问题：

```markdown
## 问题描述模板

### 错误信息
```text

[完整的错误信息或堆栈跟踪]

```text

### 相关代码
```typescript
[出问题的代码片段]
```text

### 预期行为

[描述期望的正确行为]

### 实际行为

[描述实际的错误行为]

### 环境

- Node.js 版本：18.x
- 框架：Express 4.x
- 数据库：PostgreSQL

```text

### 步骤二：AI 分析

让 AI 分析问题原因：

```markdown
// 提示词示例
"请分析以下错误：

错误信息：
TypeError: Cannot read properties of undefined (reading 'id')

代码：
```typescript
async function getUser(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  return user.id;
}
```text

请：

1. 解释错误原因
2. 指出问题代码位置
3. 提供修复方案"

```text

### 步骤三：应用修复

根据 AI 的建议修复代码：

```markdown
// AI 可能给出的建议
问题原因：当 user 不存在时，user 为 null，访问 null.id 会报错

修复方案：
```typescript
async function getUser(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }
  return user.id;
}
```text

```text

### 步骤四：验证修复

```markdown
// 验证步骤
1. 运行测试用例
2. 测试边界情况
3. 检查是否引入新问题
```text

## 常见调试场景

### 场景一：类型错误

```markdown
// 问题
"遇到 TypeScript 类型错误：

错误信息：
Type 'string | undefined' is not assignable to type 'string'.

代码：
```typescript
interface User {
  name?: string;
}

function getUserName(user: User): string {
  return user.name;
}
```text

请帮我修复这个类型错误。"

// AI 分析
问题原因：user.name 可能是 undefined，但返回类型要求 string

修复方案：

```typescript
function getUserName(user: User): string {
  return user.name ?? 'Unknown';
}
```text

```text

### 场景二：异步错误

```markdown
// 问题
"异步代码报错：

错误信息：
UnhandledPromiseRejectionWarning: TypeError: ...

代码：
```typescript
async function fetchUsers() {
  const response = await fetch('/api/users');
  const data = response.json();
  return data;
}
```text

请帮我找出问题。"

// AI 分析
问题原因：response.json() 返回 Promise，需要 await

修复方案：

```typescript
async function fetchUsers() {
  const response = await fetch('/api/users');
  const data = await response.json();
  return data;
}
```text

```text

### 场景三：空值处理

```markdown
// 问题
"代码在处理空值时崩溃：

代码：
```typescript
function getFirstItem(items: Item[]) {
  return items[0].name;
}
```text

当 items 为空数组时报错。"

// AI 分析
问题原因：空数组时 items[0] 为 undefined

修复方案：

```typescript
function getFirstItem(items: Item[]): string | undefined {
  return items[0]?.name;
}

// 或提供默认值
function getFirstItem(items: Item[], defaultName = 'Unknown'): string {
  return items[0]?.name ?? defaultName;
}
```text

```text

### 场景四：性能问题

```markdown
// 问题
"以下代码执行很慢，请帮我优化：

```typescript
async function getUserOrders(userId: string) {
  const orders = await db.order.findMany();
  return orders.filter(order => order.userId === userId);
}
```text

数据库有 100 万条订单记录，执行时间超过 10 秒。"

// AI 分析
问题原因：先查询所有记录再过滤，效率极低

修复方案：

```typescript
async function getUserOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
}
```text

```text

### 场景五：依赖问题

```markdown
// 问题
"安装依赖时报错：

错误信息：
npm ERR! peer dep missing: react@>=16.8.0, required by react-hook-form@7.x

项目使用 React 15.x，无法升级 React 版本。"

// AI 分析
问题原因：react-hook-form 7.x 需要 React 16.8+

解决方案：
1. 降级 react-hook-form 到兼容版本
2. 或升级 React 到 16.8+

推荐方案：
```bash
npm install react-hook-form@6.x
```text

```text

## 高级调试技巧

### 技巧一：提供完整上下文

```markdown
// ❌ 信息不足
"代码报错了，帮我看看"

// ✅ 提供完整信息
"以下代码报错，请帮我分析：

错误信息：
[完整错误信息]

代码：
[相关代码]

环境：
- Node.js 18.x
- Express 4.x
- TypeScript 5.x

我尝试过：
- 检查了变量类型
- 添加了 console.log 调试

请帮我找出问题原因并提供修复方案。"
```text

### 技巧二：逐步缩小范围

```markdown
// 当问题复杂时，逐步缩小范围

// 第 1 步：确认整体问题
"这个函数执行时崩溃，请帮我分析原因"

// 第 2 步：定位具体位置
"错误发生在第 15 行，这行代码的作用是什么？"

// 第 3 步：理解细节
"为什么这个变量可能是 undefined？"

// 第 4 步：验证修复
"这个修复方案是否会影响其他功能？"
```text

### 技巧三：让 AI 解释代码

```markdown
// 当不理解代码时
"请解释以下代码的工作原理：

```typescript
const result = arr.reduce((acc, cur) => {
  acc[cur.type] = acc[cur.type] || [];
  acc[cur.type].push(cur);
  return acc;
}, {} as Record<string, Item[]>);
```text

请逐行解释代码的作用。"

// AI 解释
这段代码使用 reduce 方法将数组按 type 分组：

1. `acc` 是累加器，初始值为空对象
2. `acc[cur.type] = acc[cur.type] || []` 确保每个 type 对应一个数组
3. `acc[cur.type].push(cur)` 将当前元素添加到对应数组
4. 最后返回分组后的对象

示例：
输入：[{type: 'A', value: 1}, {type: 'B', value: 2}, {type: 'A', value: 3}]
输出：{A: [{type: 'A', value: 1}, {type: 'A', value: 3}], B: [{type: 'B', value: 2}]}

```text

### 技巧四：请求多种方案

```markdown
// 获取多种解决方案
"我有以下问题，请提供至少 3 种解决方案：

[问题描述]

请分析每种方案的优缺点。"

// AI 可能给出
方案 1：使用 Optional chaining
优点：简洁，代码量少
缺点：可能隐藏问题

方案 2：添加显式检查
优点：逻辑清晰，便于调试
缺点：代码稍长

方案 3：使用默认值
优点：保证返回值类型一致
缺点：可能掩盖数据问题
```text

### 技巧五：请求预防措施

```markdown
// 修复后请求预防措施
"问题已修复，请告诉我如何预防类似问题：

1. 如何在编码阶段发现这类问题？
2. 有哪些工具可以帮助检测？
3. 有哪些编码规范可以预防？"

// AI 可能给出
预防措施：
1. 使用 TypeScript 严格模式
2. 配置 ESLint 规则
3. 编写单元测试覆盖边界情况
4. 代码审查时关注空值处理
```text

## 调试工具配合

### 配合断点调试

```markdown
// AI 辅助设置断点
"我想调试以下代码，应该在哪里设置断点？

```typescript
async function processOrder(orderId: string) {
  const order = await getOrder(orderId);
  const items = await getItems(order.items);
  const total = calculateTotal(items);
  await updateOrder(orderId, { total });
  return { order, items, total };
}
```text

// AI 建议
建议在以下位置设置断点：

1. `const order = await getOrder(orderId)` - 检查订单获取
2. `const items = await getItems(order.items)` - 检查商品列表
3. `const total = calculateTotal(items)` - 检查计算结果
4. `await updateOrder(...)` - 检查更新操作

```text

### 配合日志调试

```markdown
// AI 辅助添加日志
"请帮我添加调试日志：

```typescript
async function processOrder(orderId: string) {
  const order = await getOrder(orderId);
  const items = await getItems(order.items);
  const total = calculateTotal(items);
  await updateOrder(orderId, { total });
  return { order, items, total };
}
```text

// AI 生成

```typescript
async function processOrder(orderId: string) {
  console.log('[processOrder] 开始处理订单:', orderId);
  
  const order = await getOrder(orderId);
  console.log('[processOrder] 获取订单:', order);
  
  const items = await getItems(order.items);
  console.log('[processOrder] 获取商品:', items.length, '件');
  
  const total = calculateTotal(items);
  console.log('[processOrder] 计算总价:', total);
  
  await updateOrder(orderId, { total });
  console.log('[processOrder] 更新订单成功');
  
  return { order, items, total };
}
```text

```text

### 配合单元测试

```markdown
// AI 辅助生成测试用例
"请为以下函数生成测试用例，覆盖各种边界情况：

```typescript
function calculateDiscount(price: number, level: string): number {
  if (price < 0) throw new Error('Invalid price');
  const rates = { VIP: 0.8, GOLD: 0.9, NORMAL: 1 };
  return price * (rates[level] || 1);
}
```text

// AI 生成

```typescript
describe('calculateDiscount', () => {
  test('VIP 用户享受 8 折', () => {
    expect(calculateDiscount(100, 'VIP')).toBe(80);
  });

  test('GOLD 用户享受 9 折', () => {
    expect(calculateDiscount(100, 'GOLD')).toBe(90);
  });

  test('普通用户无折扣', () => {
    expect(calculateDiscount(100, 'NORMAL')).toBe(100);
  });

  test('未知等级按原价', () => {
    expect(calculateDiscount(100, 'UNKNOWN')).toBe(100);
  });

  test('负数价格抛出错误', () => {
    expect(() => calculateDiscount(-100, 'VIP')).toThrow('Invalid price');
  });

  test('零价格', () => {
    expect(calculateDiscount(0, 'VIP')).toBe(0);
  });
});
```text

```text

## 调试最佳实践

### 实践一：记录问题和解决方案

```markdown
// 建立问题解决记录

## 问题：TypeError: Cannot read properties of undefined

### 原因
访问 undefined 或 null 对象的属性

### 解决方案
使用 Optional chaining 或添加空值检查

### 预防措施
- 启用 TypeScript 严格模式
- 配置 ESLint 规则
- 编写边界测试用例
```text

### 实践二：学习错误类型

```markdown
// 让 AI 解释错误类型

"请解释 JavaScript 中常见的错误类型：
1. TypeError
2. ReferenceError
3. SyntaxError
4. RangeError

并举例说明每种错误的典型场景。"
```text

### 实践三：使用调试工具

```markdown
// 常用调试工具

1. **浏览器开发者工具**
   - 断点调试
   - 网络请求监控
   - 性能分析

2. **Node.js 调试**
   - node --inspect
   - Chrome DevTools
   - VS Code 调试器

3. **日志工具**
   - console.log / console.error
   - winston / pino
   - debug 库
```text

## 小结

AI 辅助调试的核心方法：

1. **清晰描述问题**：提供错误信息、代码、环境信息
2. **让 AI 分析**：请求解释错误原因和定位问题
3. **获取多种方案**：请求多个修复方案并比较
4. **验证修复**：测试修复效果，检查边界情况
5. **总结经验**：记录问题和解决方案，预防再次发生

AI 是调试的强大助手，但仍需开发者理解问题本质，做出正确决策。

---

## 参考资料

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [TypeScript Debugging](https://www.typescriptlang.org/docs/handbook/debugging.html)
