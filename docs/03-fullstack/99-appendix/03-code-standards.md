
# 开发规范速查

本文提供代码规范的快速参考，详细规范请参考原项目文档。

## 命名规范

### 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | 小驼峰 | `userName`, `pageNo` |
| 常量 | 大写蛇形 | `MAX_SIZE`, `API_BASE_URL` |
| 函数 | 小驼峰 | `getUserInfo`, `calculateTotal` |
| 类 | 大驼峰 | `UserService`, `OrderController` |
| 接口 | 大驼峰 | `UserInfo`, `ApiResponse` |

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | 大驼峰 | `UserList.vue` |
| 工具函数 | 小驼峰 | `dateUtils.ts` |
| 类型定义 | 小驼峰 | `user.d.ts` |
| 控制器 | 小驼峰 | `user.mts` |
| 服务层 | 小驼峰 | `user.mts` |

### 数据库命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 表名 | 蛇形小写 | `user`, `article_category` |
| 字段名 | 蛇形小写 | `user_id`, `created_at` |
| 索引名 | `idx_` 前缀 | `idx_user_id` |

## API 规范

### 路由命名

- 使用复数形式：`/users`, `/articles`
- 嵌套资源：`/users/:userId/articles`

### 参数验证

```typescript
// GET 请求参数
export const sGetUserInfo = zod.object({
  id: zod.coerce.number().int().positive(),
});

// POST 请求参数
export const sCreateUser = zod.object({
  username: zod.string().min(3).max(50),
  email: zod.string().email(),
});
```

### 响应格式

```typescript
// 成功响应
res.success<ReturnApiGetUser>(data);

// 分页响应
res.successPage<ArticleListItem>({
  list: articles,
  total: 100,
  pageNo: 1,
  pageSize: 10,
});

// 错误响应
res.fail('错误信息', 400);
```

## TypeScript 规范

### 类型导入

```typescript
// 正确：使用 type 关键字
import { type FormInstance, type FormRules } from 'element-plus';

// 正确：值和类型分开导入
import { ElMessage, type FormInstance } from 'element-plus';

// 错误：类型没有使用 type 关键字
import { FormInstance } from 'element-plus';
```

### API 类型定义

```typescript
// 参数类型：ParamsApi* 前缀
interface ParamsApiGetUser {
  id: number;
}

// 返回类型：ReturnApi* 前缀
interface ReturnApiGetUser {
  id: number;
  username: string;
  email: string;
}

// 列表项：*ListItem 后缀
interface ArticleListItem {
  id: number;
  title: string;
  created_at: string;
}
```

## Vue 组件规范

### 组件命名

```vue
<!-- 正确：至少2个单词 -->
<SiteNavbar />
<UserList />

<!-- 错误：单单词 -->
<Navbar />
<List />
```

### defineModel 使用

```vue
<template>
  <el-dialog v-model="model" title="标题" />
</template>

<script setup lang="ts">
// 推荐方式
const model = defineModel<boolean>({ default: false });
</script>
```

### 模板简化

```vue
<!-- 错误：模板中嵌入复杂逻辑 -->
<span>{{ status === 1 ? '处理中' : status === 2 ? '已完成' : '失败' }}</span>

<!-- 正确：提取为工具函数 -->
<span>{{ getStatusText(status) }}</span>

<script setup lang="ts">
import { getStatusText } from '@/scripts/statusUtils';
</script>
```

## 数据库规范

### Boolean 类型

```typescript
// 正确：使用 integer
table.integer("is_active").defaultTo(1).comment("是否启用");

// 错误：使用 boolean
table.boolean("is_active"); // 不推荐
```

### 分页查询

```typescript
// 正确：分开查询
const [list, totalResult] = await Promise.all([
  query.clone().limit(limit).offset(offset),
  query.clone().clearSelect().count("id as count").first(),
]);
```

## 错误处理

### 服务层

```typescript
export async function getUserInfo(
  userId: number
): Promise<TReturn<UserInfo>> {
  try {
    const user = await knex('user').where({ id: userId }).first();
    if (!user) {
      return [new Error('用户不存在'), undefined];
    }
    return [null, user];
  } catch (err) {
    return [getError(err), undefined];
  }
}
```

### 控制器

```typescript
export const cGetUserInfo: ExpressRequestHandler = async (req, res, next) => {
  try {
    const user = req.user as UserInfo;
    const [err, data] = await getUserInfo(user.id);
    if (err) {
      res.fail(err.message);
      return;
    }
    res.success<ReturnApiGetUserInfo>(data);
  } catch (err) {
    logger.error('Error in cGetUserInfo:', err);
    next(err);
  }
};
```

## 代码检查清单

### 后端开发

- [ ] 控制器函数命名以 `c` 开头
- [ ] Schema 变量命名以 `s` 开头
- [ ] 使用 `ParamsApi*` 作为参数类型
- [ ] 使用 `ReturnApi*` 作为返回类型
- [ ] 服务层返回 `TReturn<T>`
- [ ] 控制器使用泛型 `res.success<T>()`
- [ ] GET 参数使用 `zod.coerce.number()`
- [ ] 错误处理使用 `try-catch` 和 `next(err)`

### 前端开发

- [ ] Vue 组件使用 `<script setup lang="ts">`
- [ ] 类型导入使用 `type` 关键字
- [ ] API 函数使用具名导入
- [ ] 组件命名至少 2 个单词
- [ ] 移动端适配（媒体查询）
- [ ] API 调用处理错误和加载状态

## 相关章节

- [开发环境搭建](./01-development.md) - 本地开发配置
- [部署上线](./02-deployment.md) - 生产环境部署
- [API设计规范](../03-backend/03-api-design.md) - 详细API设计规范
