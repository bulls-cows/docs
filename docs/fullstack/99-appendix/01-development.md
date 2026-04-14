---
order: 10
---

# 开发环境搭建

本文介绍项目的本地开发环境配置和开发流程。

## 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 22.x | 推荐使用 LTS 版本 |
| npm | 10.x | Node.js 自带 |
| MySQL | 8.x | 数据库 |
| Redis | 7.x | 缓存（可选） |

## 安装 Node.js

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 或 [nvm-windows](https://github.com/coreybutler/nvm-windows) 管理Node.js版本。

```bash
# 安装 Node.js 22
nvm install 22

# 切换到 Node.js 22
nvm use 22

# 验证安装
node -v
npm -v
```

## 项目初始化

### 1. 克隆项目

```bash
git clone <repository-url>
cd project-name
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
cp .env.int.example .env.int
```

编辑 `.env` 和 `.env.int` 文件，配置数据库连接：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT 密钥
JWT_SECRET=your_jwt_secret
```

### 4. 运行数据库迁移

```bash
# 运行迁移
npm run migrate:latest

# 回滚迁移
npm run migrate:rollback
```

### 5. 启动开发服务器

```bash
# 使用 int 环境开发
npm run dev:int

# 使用 pre 环境开发
npm run dev:pre
```

启动后访问 `http://localhost:9000`。

## 项目结构

```text
project/
├── src/                    # 后端源码
│   ├── controllers/        # 控制器
│   ├── services/           # 服务层
│   ├── models/             # 数据模型
│   ├── routes/             # 路由定义
│   ├── middlewares/        # 中间件
│   └── scripts/            # 工具函数
├── apps/                   # 前端应用
│   ├── admin/              # 管理后台
│   └── account/            # 用户端
├── typings/                # 类型定义
├── migrations/             # 数据库迁移
└── package.json
```

## 开发流程

### 添加新功能

1. **设计数据库表**：在 `src/models/` 中创建模型定义
2. **创建迁移文件**：在 `migrations/` 中创建迁移
3. **实现服务层**：在 `src/services/` 中实现业务逻辑
4. **创建控制器**：在 `src/controllers/` 中处理请求
5. **定义路由**：在 `src/routes/` 中定义路由
6. **前端实现**：在 `apps/` 对应的前端应用中实现页面
7. **类型定义**：在 `typings/` 中定义类型

### 数据库迁移

```bash
# 生成迁移文件
npx knex migrate:make migration_name --knexfile knexfile.mts

# 运行迁移
npm run migrate:latest

# 回滚迁移
npm run migrate:rollback
```

### 构建部署

```bash
# 构建生产版本
npm run build:production

# 构建并部署
npm run buildAndDeploy:production
```

## 常见问题

### 端口被占用

```bash
# 查找占用端口的进程
netstat -ano | findstr :9000

# 终止进程
taskkill /PID <pid> /F
```

### 数据库连接失败

1. 检查 MySQL 服务是否启动
2. 检查 `.env` 文件中的数据库配置
3. 检查数据库用户权限

### 类型错误

1. 确保 TypeScript 配置正确
2. 检查类型定义文件是否完整
3. 运行 `npm run lint` 检查代码

## 相关章节

- [部署上线](./02-deployment.md) - 生产环境部署
- [开发规范速查](./03-code-standards.md) - 代码规范
