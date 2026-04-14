---
order: 60
---

# AI 代码审查

代码审查是保证代码质量的重要环节。AI 可以辅助代码审查，提高审查效率和覆盖面。本章介绍如何利用 AI 进行有效的代码审查。

## AI 代码审查的价值

### 传统代码审查 vs AI 辅助审查

| 传统代码审查 | AI 辅助审查 |
|-------------|------------|
| 依赖审查者经验 | AI 提供专业建议 |
| 时间成本高 | 快速完成初步审查 |
| 可能遗漏问题 | 系统性检查 |
| 审查质量不稳定 | 质量相对稳定 |
| 人工主观性强 | 基于最佳实践 |

### AI 审查的优势

1. **效率提升**：快速完成初步审查，节省时间
2. **覆盖全面**：系统性检查多个维度
3. **知识积累**：基于大量代码库的最佳实践
4. **一致性**：审查标准稳定一致
5. **学习机会**：通过 AI 建议学习最佳实践

## 审查维度

AI 可以从多个维度审查代码：

### 维度一：安全性审查

```markdown
// 提示词示例
"请审查以下代码的安全性：

```typescript
async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (user && user.password === password) {
    return { success: true, token: generateToken(user) };
  }
  return { success: false, message: 'Login failed' };
}
```text

请检查：

1. SQL 注入风险
2. XSS 漏洞
3. 密码处理安全
4. 认证机制安全
5. 敏感信息泄露"

// AI 审查结果
发现以下安全问题：

1. **密码明文比较** - 密码应该使用 bcrypt 等加密库验证
2. **缺少登录失败限制** - 容易遭受暴力破解攻击
3. **错误信息过于笼统** - 应区分"用户不存在"和"密码错误"
4. **缺少输入验证** - email 格式未验证

修复建议：

```typescript
async function login(email: string, password: string) {
  // 输入验证
  if (!isValidEmail(email)) {
    return { success: false, message: 'Invalid email format' };
  }

  const user = await db.user.findUnique({ where: { email } });
  
  // 使用 bcrypt 验证密码
  if (user && await bcrypt.compare(password, user.password)) {
    // 检查登录失败次数
    if (user.loginAttempts >= 5) {
      return { success: false, message: 'Account locked' };
    }
    
    // 重置失败次数
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0 }
    });
    
    return { success: true, token: generateToken(user) };
  }
  
  // 记录失败次数
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: { increment: 1 } }
    });
  }
  
  return { success: false, message: 'Login failed' };
}
```text

### 维度二：性能审查

```markdown
// 提示词示例
"请审查以下代码的性能：

```typescript
async function getUserOrders(userId: string) {
  const orders = await db.order.findMany();
  const result = [];
  for (const order of orders) {
    const items = await db.orderItem.findMany({
      where: { orderId: order.id }
    });
    if (order.userId === userId) {
      result.push({ ...order, items });
    }
  }
  return result;
}
```text

请分析性能问题并提供优化建议。"

// AI 审查结果
发现以下性能问题：

1. **N+1 查询问题** - 循环中查询数据库
2. **全表扫描** - 查询所有订单再过滤
3. **内存浪费** - 加载不必要的数据

优化建议：

```typescript
async function getUserOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
}
```text

### 维度三：代码质量审查

```markdown
// 提示词示例
"请审查以下代码的质量：

```typescript
function calc(a, b, c) {
  let r = 0;
  if (c == 'add') {
    r = a + b;
  } else if (c == 'sub') {
    r = a - b;
  } else if (c == 'mul') {
    r = a * b;
  } else if (c == 'div') {
    r = a / b;
  }
  return r;
}
```text

请检查：

1. 命名规范
2. 类型安全
3. 错误处理
4. 代码可读性
5. 可维护性"

// AI 审查结果
发现以下质量问题：

1. **命名不清晰** - calc, a, b, c, r 都是无意义命名
2. **缺少类型定义** - 应使用 TypeScript 类型
3. **缺少错误处理** - 除零、无效操作未处理
4. **使用 == 而非 ===** - 可能导致类型转换问题
5. **可扩展性差** - 添加新操作需要修改函数

改进建议：

```typescript
type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

function calculate(
  firstNumber: number,
  secondNumber: number,
  operation: Operation
): number {
  const operations: Record<Operation, (a: number, b: number) => number> = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    }
  };

  const operationFn = operations[operation];
  if (!operationFn) {
    throw new Error(`Unknown operation: ${operation}`);
  }

  return operationFn(firstNumber, secondNumber);
}
```text

### 维度四：最佳实践审查

```markdown
// 提示词示例
"请审查以下代码是否符合最佳实践：

```typescript
export const UserList: React.FC = () => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);
  
  return (
    <ul>
      {users.map(user => (
        <li>{user.name}</li>
      ))}
    </ul>
  );
};
```text

请检查 React 最佳实践。"

// AI 审查结果
发现以下问题：

1. **缺少类型定义** - users 应该有类型
2. **缺少错误处理** - fetch 可能失败
3. **缺少 loading 状态** - 用户体验差
4. **缺少 key 属性** - 列表渲染需要 key
5. **缺少依赖清理** - 组件卸载时可能内存泄漏

改进建议：

```typescript
interface User {
  id: string;
  name: string;
}

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users', {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
    
    return () => controller.abort();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```text

```text

## 审查流程

### 完整审查流程

```markdown
## AI 代码审查流程

### 1. 提交代码给 AI 审查
提供完整的代码上下文，包括：
- 代码文件
- 相关依赖
- 项目背景
- 审查重点

### 2. AI 初步审查
AI 从多个维度检查代码：
- 安全性
- 性能
- 代码质量
- 最佳实践

### 3. 人工复核
开发者审核 AI 的建议：
- 确认问题是否真实存在
- 评估修复优先级
- 决定是否采纳建议

### 4. 修复问题
根据审查结果修复代码

### 5. 再次审查
修复后再次进行 AI 审查，确保问题解决
```text

### 审查请求模板

```markdown
## 代码审查请求

### 代码描述
[简述代码功能]

### 代码文件
```typescript
[待审查的代码]
```text

### 项目背景

- 技术栈：[如 React + TypeScript]
- 项目类型：[如 电商平台]
- 代码用途：[如 用户认证模块]

### 审查重点

- [ ] 安全性
- [ ] 性能
- [ ] 代码质量
- [ ] 可维护性
- [ ] 测试覆盖

### 特殊关注

[如果有特别需要关注的问题]

```text

## 审查实践

### 实践一：分阶段审查

```markdown
// 开发阶段审查
"请审查这段代码的设计思路是否合理"

// 完成后审查
"请全面审查这段代码的安全性、性能和质量"

// 提交前审查
"请检查这段代码是否符合提交标准"
```text

### 实践二：专项审查

```markdown
// 安全专项
"请专注于安全审查，检查：
- SQL 注入
- XSS 攻击
- CSRF 攻击
- 敏感数据处理
- 权限控制"

// 性能专项
"请专注于性能审查，检查：
- 数据库查询优化
- 内存使用
- 算法复杂度
- 网络请求优化"

// 可维护性专项
"请专注于可维护性审查，检查：
- 代码结构
- 命名规范
- 注释完整性
- 模块化程度"
```text

### 实践三：对比审查

```markdown
// 对比两个实现方案
"我有两种实现方案，请对比分析：

方案 A：
```typescript
[代码 A]
```text

方案 B：

```typescript
[代码 B]
```text

请从性能、可读性、可维护性角度对比。"

```text

## 审查结果处理

### 问题分级

```markdown
## 问题严重程度分级

### P0 - 严重问题（必须修复）
- 安全漏洞
- 数据丢失风险
- 系统崩溃风险
- 性能严重问题

### P1 - 重要问题（应该修复）
- 潜在 bug
- 性能优化空间
- 代码质量问题
- 最佳实践违反

### P2 - 一般问题（建议修复）
- 代码风格问题
- 注释缺失
- 可读性问题
- 轻微优化

### P3 - 建议改进（可选）
- 更好的实现方式
- 代码组织建议
- 文档建议
```text

### 审查报告模板

```markdown
## 代码审查报告

### 审查概述
- 文件：[文件名]
- 审查时间：[时间]
- 审查维度：[安全性/性能/质量/最佳实践]

### 发现的问题

#### P0 - 严重问题
1. [问题描述]
   - 位置：[代码位置]
   - 影响：[影响说明]
   - 建议：[修复建议]

#### P1 - 重要问题
1. [问题描述]
   - 位置：[代码位置]
   - 影响：[影响说明]
   - 建议：[修复建议]

#### P2 - 一般问题
1. [问题描述]
   - 位置：[代码位置]
   - 建议：[修复建议]

### 总体评价
[代码质量总体评价]

### 改进建议
[整体改进建议]
```text

## AI 审查的局限

### 局限一：上下文理解有限

AI 可能无法完全理解项目的业务逻辑和架构设计。

**解决方法**：

```markdown
// 提供充分的上下文
"这是一个电商平台的订单处理模块，使用事件驱动架构，
需要保证订单状态的一致性。请在这个背景下审查代码。"
```text

### 局限二：无法运行代码

AI 无法实际运行代码，只能静态分析。

**解决方法**：

```markdown
// 结合测试
"AI 审查后，请运行以下测试：
1. 单元测试
2. 集成测试
3. 性能测试
4. 安全扫描"
```text

### 局限三：可能误报

AI 可能对某些代码提出不准确的建议。

**解决方法**：

```markdown
// 人工判断
"对 AI 的建议进行人工审核：
1. 确认问题是否真实存在
2. 评估修复的必要性
3. 考虑项目的实际情况"
```text

## 小结

AI 代码审查的关键点：

1. **多维度审查**：安全性、性能、质量、最佳实践
2. **提供上下文**：让 AI 理解项目背景
3. **人工复核**：AI 建议需要人工判断
4. **分级处理**：根据严重程度优先修复
5. **持续改进**：记录问题，预防再次发生

AI 代码审查是提高代码质量的有效工具，但不能完全替代人工审查。最佳实践是 AI 初审 + 人工复核。

---

## 参考资料

- [Google Engineering Practices - Code Review](https://google.github.io/eng-practices/review/)
- [Conventional Comments](https://conventionalcomments.org/)
- [AI-Assisted Code Review Best Practices](https://www.sonarsource.com/blog/ai-assisted-code-review/)
