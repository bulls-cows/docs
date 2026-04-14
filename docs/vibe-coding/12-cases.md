---
order: 100
---

# 实战案例

本章通过完整的实战案例，展示 AI 辅助编程在实际项目中的应用。每个案例都包含完整的需求、实现过程和关键代码。

## 案例一：用户认证系统

### 需求描述

实现一个完整的用户认证系统，包括：

1. 用户注册
2. 用户登录
3. 密码重置
4. Token 刷新
5. 用户信息查询

技术栈：Node.js + Express + TypeScript + Prisma + PostgreSQL

### 实现过程

#### 第 1 步：定义数据模型

```markdown
// 提示词
"请使用 Prisma 定义用户认证相关的数据模型，包括：
- User 表：id、email、password、name、role、status、createdAt、updatedAt
- Token 表：id、userId、token、type、expiresAt、createdAt
- 支持邮箱唯一索引
- 支持软删除"

// AI 生成的 Prisma Schema
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      Role     @default(USER)
  status    Status   @default(ACTIVE)
  tokens    Token[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([email])
}

model Token {
  id        String      @id @default(uuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  token     String      @unique
  type      TokenType
  expiresAt DateTime
  createdAt DateTime    @default(now())

  @@index([token, type])
}

enum Role {
  USER
  ADMIN
}

enum Status {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum TokenType {
  ACCESS
  REFRESH
  RESET_PASSWORD
}
```text

#### 第 2 步：实现注册功能

```markdown
// 提示词
"请实现用户注册功能：
- 验证邮箱格式和唯一性
- 验证密码强度（至少 8 位，包含字母和数字）
- 使用 bcrypt 加密密码
- 发送欢迎邮件
- 返回用户信息（不包含密码）"

// AI 生成的代码
```typescript
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../db';
import { sendEmail } from '../utils/email';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers'),
  name: z.string().min(2).optional()
});

export async function register(data: unknown) {
  // 验证输入
  const validated = registerSchema.parse(data);
  
  // 检查邮箱是否已存在
  const existing = await db.user.findUnique({
    where: { email: validated.email }
  });
  
  if (existing) {
    throw new Error('Email already registered');
  }
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(validated.password, 10);
  
  // 创建用户
  const user = await db.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      name: validated.name
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
  
  // 发送欢迎邮件（异步，不阻塞响应）
  sendEmail({
    to: user.email,
    subject: 'Welcome!',
    body: `Hello ${user.name || 'User'}, welcome to our platform!`
  }).catch(console.error);
  
  return user;
}
```text

#### 第 3 步：实现登录功能

```markdown
// 提示词
"请实现用户登录功能：
- 验证邮箱和密码
- 登录失败 5 次锁定账户 30 分钟
- 生成 JWT access token（15 分钟有效）和 refresh token（7 天有效）
- 记录登录时间和 IP
- 返回 token 和用户信息"

// AI 生成的代码
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 分钟

export async function login(
  email: string,
  password: string,
  ipAddress: string
) {
  const user = await db.user.findUnique({ where: { email } });
  
  // 统一错误信息，防止用户枚举
  const invalidCredentials = 'Invalid email or password';
  
  if (!user) {
    throw new Error(invalidCredentials);
  }
  
  // 检查账户是否被锁定
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('Account is locked. Please try again later.');
  }
  
  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    // 记录失败次数
    const attempts = (user.loginAttempts || 0) + 1;
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: new Date(Date.now() + LOCK_TIME)
        }
      });
      throw new Error('Account locked due to too many failed attempts');
    }
    
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: attempts }
    });
    
    throw new Error(invalidCredentials);
  }
  
  // 生成 token
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  // 存储 refresh token
  await db.token.create({
    data: {
      userId: user.id,
      token: refreshToken,
      type: 'REFRESH',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  // 更新登录信息
  await db.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
      lastLoginIp: ipAddress
    }
  });
  
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}
```text

#### 第 4 步：实现密码重置

```markdown
// 提示词
"请实现密码重置功能：
1. 发送重置邮件：生成重置 token（1 小时有效），发送包含 token 的邮件
2. 重置密码：验证 token，更新密码"

// AI 生成的代码
```typescript
import crypto from 'crypto';
import { db } from '../db';
import { sendEmail } from '../utils/email';
import bcrypt from 'bcrypt';

// 发送重置邮件
export async function sendResetEmail(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  
  // 即使用户不存在也返回成功，防止用户枚举
  if (!user) return;
  
  // 生成重置 token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小时
  
  await db.token.create({
    data: {
      userId: user.id,
      token: resetToken,
      type: 'RESET_PASSWORD',
      expiresAt
    }
  });
  
  // 发送邮件
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  await sendEmail({
    to: email,
    subject: 'Password Reset',
    body: `Click the link to reset your password: ${resetUrl}`
  });
}

// 重置密码
export async function resetPassword(token: string, newPassword: string) {
  // 验证 token
  const tokenRecord = await db.token.findFirst({
    where: {
      token,
      type: 'RESET_PASSWORD',
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!tokenRecord) {
    throw new Error('Invalid or expired token');
  }
  
  // 验证密码强度
  if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new Error('Password does not meet requirements');
  }
  
  // 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await db.$transaction([
    db.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword }
    }),
    db.token.delete({ where: { id: tokenRecord.id } })
  ]);
}
```text

### 关键要点

1. **安全性**：使用 bcrypt 加密、防止用户枚举、登录失败限制
2. **验证**：使用 Zod 进行输入验证
3. **错误处理**：统一错误信息，不泄露敏感信息
4. **异步处理**：邮件发送异步处理，不阻塞响应

## 案例二：RESTful API 开发

### 项目背景

开发一个博客系统的 RESTful API，包括：

1. 文章 CRUD
2. 评论功能
3. 分页查询
4. 搜索功能

技术栈：Node.js + Express + TypeScript + Prisma

### 案例二实现过程

#### 定义数据模型

```prisma
model Post {
  id          String     @id @default(uuid())
  title       String
  content     String
  summary     String?
  authorId    String
  author      User       @relation(fields: [authorId], references: [id])
  comments    Comment[]
  tags        Tag[]
  viewCount   Int        @default(0)
  published   Boolean    @default(false)
  publishedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([authorId])
  @@index([published, publishedAt])
}

model Comment {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([postId])
}

model Tag {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]
}
```text

#### 第 2 步：实现文章 API

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 创建文章
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      summary: z.string().max(500).optional(),
      tags: z.array(z.string()).optional(),
      published: z.boolean().optional()
    });

    const data = schema.parse(req.body);

    const post = await db.post.create({
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        authorId: req.user!.id,
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
        tags: data.tags ? {
          connectOrCreate: data.tags.map(name => ({
            where: { name },
            create: { name }
          }))
        } : undefined
      },
      include: {
        author: { select: { id: true, name: true } },
        tags: true
      }
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// 获取文章列表（分页 + 搜索）
router.get('/', async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
      keyword: z.string().optional(),
      tag: z.string().optional(),
      authorId: z.string().optional()
    });

    const { page, pageSize, keyword, tag, authorId } = schema.parse(req.query);

    const where = {
      published: true,
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } }
        ]
      }),
      ...(tag && { tags: { some: { name: tag } } }),
      ...(authorId && { authorId })
    };

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          tags: true,
          _count: { select: { comments: true } }
        }
      }),
      db.post.count({ where })
    ]);

    res.json({
      data: posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取文章详情
router.get('/:id', async (req, res, next) => {
  try {
    const post = await db.post.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: { select: { id: true, name: true } },
        tags: true,
        comments: {
          include: {
            author: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

export default router;
```text

### 关键要点

1. **输入验证**：使用 Zod 进行严格的输入验证
2. **分页查询**：支持分页、搜索、筛选
3. **关联查询**：使用 Prisma 的 include 进行关联查询
4. **性能优化**：使用 Promise.all 并行查询

## 案例三：前端组件开发

### 案例三项目背景

开发一个可复用的表格组件，支持：

1. 分页
2. 排序
3. 筛选
4. 自定义列渲染
5. 加载状态

技术栈：Vue 3 + TypeScript + Element Plus

### 实现过程

```vue
<template>
  <div class="data-table">
    <!-- 筛选区域 -->
    <div v-if="$slots.filter" class="filter-section">
      <slot name="filter" :filter="filter" :reset="resetFilter" />
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      @sort-change="handleSortChange"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :sortable="col.sortable ? 'custom' : false"
        :formatter="col.formatter"
      >
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="scope.row" :column="col" />
        </template>
      </el-table-column>

      <template #empty>
        <slot name="empty">
          <el-empty description="暂无数据" />
        </slot>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="pagination-section">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Column {
  prop: string;
  label: string;
  width?: number;
  sortable?: boolean;
  formatter?: (row: any, column: any, value: any) => string;
  slot?: string;
}

interface Props {
  columns: Column[];
  fetchData: (params: any) => Promise<{ data: any[]; total: number }>;
  rowKey?: string;
  showPagination?: boolean;
  defaultPageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  showPagination: true,
  defaultPageSize: 10
});

const loading = ref(false);
const data = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(props.defaultPageSize);
const sortProp = ref('');
const sortOrder = ref('');
const filterData = ref<Record<string, any>>({});

const fetchParams = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  sortProp: sortProp.value,
  sortOrder: sortOrder.value,
  ...filterData.value
}));

const loadData = async () => {
  loading.value = true;
  try {
    const result = await props.fetchData(fetchParams.value);
    data.value = result.data;
    total.value = result.total;
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
};

const handleSortChange = ({ prop, order }: any) => {
  sortProp.value = prop;
  sortOrder.value = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : '';
  loadData();
};

const handlePageChange = () => {
  loadData();
};

const handleSizeChange = () => {
  currentPage.value = 1;
  loadData();
};

const filter = (params: Record<string, any>) => {
  filterData.value = params;
  currentPage.value = 1;
  loadData();
};

const resetFilter = () => {
  filterData.value = {};
  currentPage.value = 1;
  loadData();
};

// 初始加载
loadData();

// 暴露方法
defineExpose({
  refresh: loadData,
  filter,
  resetFilter
});
</script>

<style scoped>
.data-table {
  width: 100%;
}

.filter-section {
  margin-bottom: 16px;
}

.pagination-section {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
```text

### 使用示例

```vue
<template>
  <DataTable
    :columns="columns"
    :fetch-data="fetchPosts"
  >
    <template #filter="{ filter, reset }">
      <el-form :inline="true">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索标题" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch(filter)">搜索</el-button>
          <el-button @click="handleReset(reset)">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #actions="{ row }">
      <el-button size="small" @click="handleEdit(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataTable from './DataTable.vue';

const columns = [
  { prop: 'title', label: '标题', sortable: true },
  { prop: 'author', label: '作者' },
  { prop: 'createdAt', label: '创建时间', sortable: true },
  { prop: 'actions', label: '操作', slot: 'actions', width: 200 }
];

const searchForm = ref({
  keyword: ''
});

const fetchPosts = async (params: any) => {
  const response = await fetch(`/api/posts?${new URLSearchParams(params)}`);
  return response.json();
};

const handleSearch = (filter: Function) => {
  filter({ keyword: searchForm.value.keyword });
};

const handleReset = (reset: Function) => {
  searchForm.value.keyword = '';
  reset();
};
</script>
```text

## 小结

通过这些实战案例，我们可以看到 AI 辅助编程的实际应用：

1. **需求描述**：清晰描述需求，提供技术栈和约束条件
2. **分步实现**：将复杂功能拆分为多个步骤
3. **代码审查**：审查 AI 生成的代码，确保安全和质量
4. **迭代优化**：根据实际情况调整和优化代码

AI 辅助编程可以显著提高开发效率，但开发者仍需把控代码质量和安全性。

---

## 参考资料

- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Element Plus Documentation](https://element-plus.org/)
