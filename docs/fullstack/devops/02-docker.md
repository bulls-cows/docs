---
order: 20
---

# Docker 容器化

Docker 是现代 DevOps 的基石，通过容器技术实现了应用的标准化打包、分发和运行。容器化让"一次构建，到处运行"成为现实，大幅简化了环境配置和部署流程。

## Docker 核心概念

### 容器 vs 虚拟机

理解容器与虚拟机的区别：

```text
虚拟机（VM）                    容器（Container）
┌─────────────────┐            ┌─────────────────┐
│    App A        │            │    App A        │
├─────────────────┤            ├─────────────────┤
│    Bins/Libs    │            │    Bins/Libs    │
├─────────────────┤            ├─────────────────┤
│    Guest OS     │            │                 │
├─────────────────┤            │  Docker Engine  │
│   Hypervisor    │            ├─────────────────┤
├─────────────────┤            │    Host OS      │
│    Host OS      │            ├─────────────────┤
├─────────────────┤            │   Hardware      │
│   Hardware      │            └─────────────────┘
└─────────────────┘
```

**容器优势**：

- 启动速度快（秒级）
- 资源占用少
- 更高的密度
- 一致的运行环境

### 核心组件

**镜像（Image）**：只读模板，包含运行应用所需的一切

```bash
# 查看本地镜像
docker images

# 拉取镜像
docker pull node:18-alpine

# 查看镜像详情
docker inspect node:18-alpine
```

**容器（Container）**：镜像的运行实例

```bash
# 运行容器
docker run -d -p 3000:3000 --name myapp myimage:v1

# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 进入容器
docker exec -it myapp sh
```

**仓库（Registry）**：存储和分发镜像

```bash
# 登录仓库
docker login registry.example.com

# 推送镜像
docker push registry.example.com/myapp:v1

# 拉取私有镜像
docker pull registry.example.com/myapp:v1
```

### 数据管理

**Volume（卷）**：持久化存储

```bash
# 创建卷
docker volume create mydata

# 挂载卷
docker run -v mydata:/app/data myimage

# 查看卷
docker volume ls
```

**Bind Mount（绑定挂载）**：主机目录映射

```bash
# 挂载主机目录
docker run -v /host/path:/container/path myimage

# 开发环境常用
docker run -v $(pwd):/app -w /app node:18 npm run dev
```

### 网络模式

```bash
# bridge 模式（默认）
docker run --network bridge myimage

# host 模式（直接使用主机网络）
docker run --network host myimage

# 自定义网络
docker network create mynetwork
docker run --network mynetwork --name app1 myimage
docker run --network mynetwork --name app2 myimage
# app1 和 app2 可以通过容器名互相访问
```

## Dockerfile 编写最佳实践

### 基础结构

```dockerfile
# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
```

### 多阶段构建

优化镜像大小，分离构建和运行环境：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 最佳实践要点

**1. 选择合适的基础镜像**

```dockerfile
# 推荐：使用 Alpine 版本（体积小）
FROM node:18-alpine

# 生产环境指定具体版本
FROM node:18.19.0-alpine3.19

# 避免使用 latest 标签
# 不推荐：FROM node:latest
```

**2. 优化层缓存**

```dockerfile
# 好的做法：先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm install
COPY . .

# 不好的做法：每次代码变动都重新安装依赖
COPY . .
RUN npm install
```

**3. 减少镜像层数**

```dockerfile
# 合并多个 RUN 命令
RUN apt-get update \
    && apt-get install -y curl git \
    && rm -rf /var/lib/apt/lists/*

# 使用 && 连接命令，减少层数
```

**4. 使用 .dockerignore**

```text
# .dockerignore
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
coverage
.nyc_output
```

**5. 安全实践**

```dockerfile
# 使用非 root 用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001
USER nextjs

# 设置只读文件系统
# docker run --read-only myimage
```

### 不同类型应用的 Dockerfile

**Node.js 应用**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Vue/React 前端应用**

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段：使用 Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Python 应用**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
```

## Docker Compose 多服务编排

### 基础配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://db:5432/myapp
    depends_on:
      - db
      - redis
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

### 开发环境配置

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data

  adminer:
    image: adminer
    ports:
      - "8080:8080"
```

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f web

# 进入容器
docker-compose exec web sh

# 停止服务
docker-compose down

# 停止并删除卷
docker-compose down -v

# 重新构建
docker-compose build --no-cache

# 使用多个配置文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 镜像优化

### 优化策略

**1. 选择精简基础镜像**

```dockerfile
# 优化前
FROM node:18          # 约 900MB

# 优化后
FROM node:18-alpine   # 约 170MB
```

**2. 多阶段构建**

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# 运行阶段：只保留必要文件
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

**3. 清理缓存**

```dockerfile
RUN npm install \
    && npm cache clean --force \
    && rm -rf /tmp/*
```

**4. 压缩镜像**

```bash
# 导出并压缩
docker save myimage:v1 | gzip > myimage-v1.tar.gz

# 加载镜像
docker load < myimage-v1.tar.gz
```

### 镜像分析工具

```bash
# 使用 dive 分析镜像层
dive myimage:v1

# 查看镜像历史
docker history myimage:v1

# 查看镜像大小
docker images myimage:v1
```

## 实战案例

### 案例 1：全栈应用部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

  # 后端 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - app-network

  # 数据库
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  # 缓存
  redis:
    image: redis:7-alpine
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
```

### 案例 2：CI/CD 中的 Docker

```yaml
# GitHub Actions 构建 Docker 镜像
name: Build Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 案例 3：健康检查配置

```dockerfile
# Dockerfile 中配置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

```yaml
# docker-compose.yml 中配置
services:
  web:
    image: myapp:v1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

## 常用命令速查

```bash
# 镜像管理
docker build -t myapp:v1 .          # 构建镜像
docker images                        # 查看镜像列表
docker rmi myapp:v1                  # 删除镜像
docker image prune                   # 清理悬空镜像

# 容器管理
docker run -d -p 3000:3000 myapp:v1  # 运行容器
docker ps                            # 查看运行中的容器
docker stop <container_id>           # 停止容器
docker rm <container_id>             # 删除容器
docker logs -f <container_id>        # 查看日志

# 系统管理
docker system df                     # 查看磁盘使用
docker system prune                  # 清理未使用资源
docker info                          # 查看系统信息

# 调试命令
docker exec -it <container> sh       # 进入容器
docker cp <container>:/app/file .    # 复制文件
docker stats                         # 查看资源使用
```

## 延伸阅读

- [CI/CD 流水线](./03-ci-cd.md) - 将 Docker 集成到自动化流程
- [监控与日志](./04-monitoring.md) - 容器监控实践
- [云服务部署](./05-cloud.md) - 容器云平台部署
