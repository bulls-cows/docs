
# 提示词工程

提示词（Prompt）是与 AI 沟通的桥梁。掌握提示词工程，能显著提高 AI 生成代码的质量和效率。本章将介绍编写有效提示词的原则、技巧和最佳实践。

## 什么是提示词工程

提示词工程是设计和优化输入给 AI 模型的文本，以获得期望输出的技术。在 AI 辅助编程中，好的提示词能：

- 提高 AI 理解需求的准确度
- 生成更符合预期的代码
- 减少迭代修改的次数
- 节省开发时间

## 提示词的基本结构

### 标准结构

一个完整的提示词通常包含以下部分：

```markdown
## 角色（Role）
定义 AI 扮演的角色

## 上下文（Context）
提供背景信息和约束条件

## 任务（Task）
明确要完成的具体任务

## 要求（Requirements）
列出具体的输出要求

## 示例（Examples）
提供参考示例（可选）
```text

### 示例对比

#### ❌ 糟糕的提示词

```markdown
写一个登录功能
```text

问题：

- 缺少上下文
- 没有技术栈信息
- 没有具体要求

#### ✅ 好的提示词

```markdown
## 角色
你是一个经验丰富的后端开发者，精通 Node.js 和 TypeScript。

## 上下文
我正在开发一个电商平台的用户系统，使用以下技术栈：
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT 认证

## 任务
实现用户登录 API 接口。

## 要求
1. 接收 email 和 password 参数
2. 验证邮箱格式和密码强度
3. 使用 bcrypt 验证密码
4. 登录成功返回 JWT token（有效期 7 天）
5. 记录登录时间和 IP 地址
6. 返回标准 JSON 格式响应
7. 添加详细的错误处理
8. 代码需要有类型注释

## 示例响应格式
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```text

```text

## 提示词编写原则

### 原则一：清晰具体

#### 模糊 vs 清晰

```markdown
// ❌ 模糊
"优化这段代码"

// ✅ 清晰
"优化以下代码的性能：
1. 减少数据库查询次数
2. 添加缓存机制
3. 优化循环结构
目标：将响应时间从 2 秒降低到 500ms 以内"
```text

### 原则二：提供上下文

#### 缺少上下文 vs 提供上下文

```markdown
// ❌ 缺少上下文
"写一个分页组件"

// ✅ 提供上下文
"在 Vue 3 + TypeScript 项目中实现分页组件：
- 使用 Composition API
- 支持 Element Plus 风格
- 需要支持：页码切换、每页条数选择、总数显示
- 已有的 API 返回格式：{ list: [], total: 100, page: 1, pageSize: 10 }"
```text

### 原则三：分步骤描述

对于复杂任务，拆分为多个步骤：

```markdown
// 复杂任务拆分

## 步骤 1：创建数据模型
"创建 User 模型，包含字段：id、email、password、name、role、createdAt"

## 步骤 2：实现注册接口
"基于上面的模型，实现用户注册接口，包含邮箱验证和密码加密"

## 步骤 3：实现登录接口
"实现登录接口，验证邮箱和密码，返回 JWT token"

## 步骤 4：添加权限中间件
"创建认证中间件，验证 JWT token 并获取用户信息"
```text

### 原则四：指定约束条件

```markdown
// 添加约束条件

"实现文件上传功能，要求：
- 只允许上传图片（jpg、png、gif）
- 文件大小不超过 5MB
- 使用 multer 中间件
- 文件存储到 /uploads 目录
- 返回文件访问 URL
- 添加文件类型和大小验证"
```text

## 常用提示词模式

### 模式一：角色扮演

让 AI 扮演特定角色，获得更专业的输出：

```markdown
"你是一个资深安全工程师，请审查以下代码的安全漏洞："
"你是一个性能优化专家，请分析以下代码的性能瓶颈："
"你是一个代码规范专家，请检查以下代码是否符合最佳实践："
```text

### 模式二：示例驱动

提供示例让 AI 学习风格：

```markdown
"参考以下代码风格，实现用户编辑功能：

```typescript
// 现有代码风格示例
export const UserCreate: React.FC = () => {
  const [form, setForm] = useState<UserForm>({
    email: '',
    name: '',
  });

  const handleSubmit = async () => {
    // ...
  };

  return (
    // ...
  );
};
```text

请保持相同的代码风格和命名规范。"

```text

### 模式三：逐步引导

通过对话逐步完善：

```markdown
// 第 1 轮
"创建一个用户列表组件的基本结构"

// 第 2 轮
"为组件添加搜索功能，支持按姓名和邮箱搜索"

// 第 3 轮
"添加分页功能，每页显示 10 条记录"

// 第 4 轮
"添加排序功能，支持按创建时间排序"
```text

### 模式四：约束引导

通过约束条件引导输出：

```markdown
"实现用户管理功能，要求：
- 必须使用 TypeScript
- 必须有完整的类型定义
- 必须有错误处理
- 必须有单元测试
- 代码注释率不低于 30%"
```text

## 不同场景的提示词技巧

### 场景一：代码生成

```markdown
## 功能描述
实现用户密码重置功能

## 技术栈
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma

## 详细需求
1. 用户输入邮箱，发送重置链接
2. 重置链接有效期 1 小时
3. 用户点击链接，输入新密码
4. 密码强度验证（至少 8 位，包含字母和数字）
5. 重置成功后发送通知邮件

## 输出要求
- 完整的 API 实现
- 包含类型定义
- 包含错误处理
- 包含必要的注释
```text

### 场景二：代码解释

```markdown
"请解释以下代码的工作原理：

```typescript
const memoizedValue = useMemo(() => {
  return expensiveCalculation(dependency);
}, [dependency]);
```text

请说明：

1. 这段代码的作用
2. useMemo 的工作原理
3. 什么时候应该使用
4. 可能的性能影响"

```text

### 场景三：代码优化

```markdown
"以下代码存在性能问题，请优化：

```typescript
const userList = users.filter(user => {
  return orders.some(order => order.userId === user.id);
});
```text

当前问题：

- 用户数据量 10000+
- 订单数据量 50000+
- 执行时间超过 3 秒

优化目标：

- 将执行时间降低到 100ms 以内
- 保持代码可读性"

```text

### 场景四：Bug 修复

```markdown
"以下代码有 bug，请找出并修复：

```typescript
async function getUser(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  return user.name;
}
```text

问题描述：

- 当用户不存在时，代码报错
- 错误信息：Cannot read property 'name' of null

请：

1. 分析问题原因
2. 提供修复方案
3. 添加适当的错误处理"

```text

### 场景五：代码审查

```markdown
"请审查以下代码，重点关注：

```typescript
async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (user.password === password) {
    return { success: true, token: generateToken(user) };
  }
  return { success: false };
}
```text

审查要点：

1. 安全性问题
2. 错误处理
3. 代码质量
4. 性能问题

请列出所有问题并提供改进建议。"

```text

## 提示词优化技巧

### 技巧一：迭代优化

第一次提示词可能不够好，通过迭代改进：

```markdown
// 第 1 版
"写一个搜索功能"

// 第 2 版（添加上下文）
"在 Vue 3 项目中实现搜索功能"

// 第 3 版（添加详细需求）
"在 Vue 3 + TypeScript 项目中实现搜索功能：
- 支持关键词搜索
- 支持分类筛选
- 支持排序"

// 第 4 版（添加约束）
"在 Vue 3 + TypeScript 项目中实现搜索功能：
- 使用 Composition API
- 支持防抖（300ms）
- 支持关键词搜索、分类筛选、排序
- 使用 Element Plus 组件"
```text

### 技巧二：提供反馈

告诉 AI 哪里不对：

```markdown
"你生成的代码有以下问题：
1. 没有处理空值情况，会导致运行时错误
2. 变量命名不规范，应该使用 camelCase
3. 缺少类型定义

请修改代码解决这些问题。"
```text

### 技巧三：使用对比

通过对比让 AI 理解期望：

```markdown
"请参考以下好的示例和坏的示例，改进代码：

// ❌ 坏的示例
function calc(a, b) {
  return a + b
}

// ✅ 好的示例
function calculateSum(firstNumber: number, secondNumber: number): number {
  return firstNumber + secondNumber;
}

请按照好的示例风格改进以下代码：
[你的代码]"
```text

## 常见问题与解决

### 问题一：AI 理解偏差

**现象**：AI 生成的代码与预期不符

**解决**：

```markdown
// 提供更明确的约束
"注意：不要使用 any 类型"
"注意：必须使用 async/await，不要使用 Promise.then"
"注意：必须处理所有可能的错误情况"
```text

### 问题二：代码不完整

**现象**：AI 生成的代码缺少部分功能

**解决**：

```markdown
// 明确要求完整性
"请提供完整的实现，包括：
1. 完整的函数实现
2. 类型定义
3. 错误处理
4. 必要的导入语句"
```text

### 问题三：风格不一致

**现象**：AI 生成的代码风格与项目不一致

**解决**：

```markdown
// 提供风格指南或示例
"请遵循以下代码风格：
- 使用 2 空格缩进
- 使用单引号
- 使用 camelCase 命名
- 每个函数必须有注释

参考示例：
[项目中的代码示例]"
```text

### 问题四：上下文丢失

**现象**：多轮对话后 AI 忘记之前的信息

**解决**：

```markdown
// 在新提示词中重复关键信息
"继续之前的用户登录功能开发，技术栈是 Node.js + TypeScript + Express，请添加..."
```text

## 提示词模板库

### 功能开发模板

```markdown
## 功能名称
[功能名称]

## 技术栈
- 语言：[如 TypeScript]
- 框架：[如 React/Vue/Express]
- 数据库：[如 PostgreSQL]
- 其他：[如 Prisma/TypeORM]

## 功能需求
1. [需求 1]
2. [需求 2]
3. [需求 3]

## 技术要求
- [要求 1]
- [要求 2]

## 输出要求
- 完整的代码实现
- 类型定义
- 错误处理
- 必要的注释
```text

### Bug 修复模板

```markdown
## 问题描述
[描述 bug 的现象]

## 复现步骤
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

## 期望行为
[描述期望的正确行为]

## 当前代码
```typescript
[有问题的代码]
```text

## 错误信息

[错误信息或日志]

## 请

1. 分析问题原因
2. 提供修复方案
3. 添加预防措施

```text

### 代码审查模板

```markdown
## 审查目标
[描述要审查的代码]

## 审查重点
- [ ] 安全性
- [ ] 性能
- [ ] 代码质量
- [ ] 可维护性
- [ ] 测试覆盖

## 代码
```typescript
[待审查的代码]
```text

## 请列出

1. 发现的问题
2. 改进建议
3. 最佳实践建议

```text

## 小结

提示词工程的核心原则：

1. **清晰具体**：明确表达需求，避免模糊
2. **提供上下文**：给 AI 足够的背景信息
3. **分步描述**：复杂任务拆分为小步骤
4. **指定约束**：明确技术栈、规范等约束
5. **迭代优化**：通过反馈不断改进

好的提示词是高质量代码生成的基础，值得花时间打磨。

---

## 参考资料

- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [OpenAI Prompt Engineering Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [GitHub Copilot Prompt Crafting](https://github.blog/2023-06-14-how-to-use-ai-coding-tools-effectively/)
