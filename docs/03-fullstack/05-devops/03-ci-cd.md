
# CI/CD 流水线

CI/CD（持续集成/持续交付）是现代软件开发的核心实践，通过自动化构建、测试和部署流程，让团队能够快速、可靠地交付软件。本章将深入介绍 CI/CD 的概念和实践方法。

## CI/CD 基础概念

### 持续集成（CI）

持续集成要求开发人员频繁地将代码集成到主干分支，每次集成都通过自动化构建和测试来验证：

```text
代码提交 → 自动构建 → 自动测试 → 结果反馈
```

**核心实践**：

- 频繁提交代码（每天至少一次）
- 自动化构建流程
- 完善的测试覆盖
- 快速反馈机制

### 持续交付（CD）

持续交付确保代码随时可以部署到生产环境：

```text
CI 通过 → 自动部署到测试环境 → 人工审批 → 部署到生产环境
```

### 持续部署

持续部署更进一步，代码通过测试后自动部署到生产环境：

```text
CI 通过 → 自动部署到测试环境 → 自动测试 → 自动部署到生产环境
```

### CI/CD 流水线架构

典型的 CI/CD 流水线包含以下阶段：

```text
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  代码   │ → │  构建   │ → │  测试   │ → │  发布   │ → │  部署   │
│  提交   │   │  阶段   │   │  阶段   │   │  阶段   │   │  阶段   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     ↓             ↓             ↓             ↓             ↓
   Lint 检查    编译代码     单元测试      打包镜像      部署服务
   代码扫描     安装依赖     集成测试      生成制品      健康检查
   格式化       构建产物     E2E 测试      版本标记      烟雾测试
```

## GitHub Actions 实践

GitHub Actions 是 GitHub 原生的 CI/CD 平台，配置简单、功能强大。

### 基础配置结构

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### 工作流触发条件

```yaml
on:
  # 推送时触发
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'
  
  # PR 时触发
  pull_request:
    branches: [main]
  
  # 定时触发
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 0点
  
  # 手动触发
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        default: 'staging'
```

### 多任务流水线

```yaml
name: Full Pipeline

on: [push, pull_request]

jobs:
  # 代码质量检查
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
  
  # 单元测试
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
  
  # 构建
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
  
  # 部署
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
      - name: Deploy to production
        run: echo "Deploying to production..."
```

### 矩阵构建

跨多个版本和平台测试：

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [16, 18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

### 缓存优化

```yaml
steps:
  - uses: actions/checkout@v4
  
  # 缓存 npm 依赖
  - uses: actions/cache@v3
    id: cache-npm
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-node-
  
  - uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'
  
  - run: npm ci
```

### Secrets 管理

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        env:
          SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_IP: ${{ secrets.SERVER_IP }}
        run: |
          echo "$SSH_KEY" > private_key.pem
          chmod 600 private_key.pem
          ssh -i private_key.pem user@$SERVER_IP "cd /app && git pull && docker-compose up -d"
```

## 构建与测试自动化

### 构建阶段配置

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 设置 Node.js
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      # 安装依赖
      - name: Install dependencies
        run: npm ci
      
      # 代码检查
      - name: Lint
        run: npm run lint
      
      # 类型检查
      - name: Type check
        run: npm run type-check
      
      # 构建
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
      
      # 上传构建产物
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

### 测试阶段配置

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      # 测试数据库
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      # Redis
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      
      # 单元测试
      - name: Unit tests
        run: npm run test:unit
      
      # 集成测试
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      # E2E 测试
      - name: E2E tests
        run: npm run test:e2e
      
      # 上传测试覆盖率
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Docker 镜像构建

```yaml
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 设置 Docker Buildx
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      # 登录镜像仓库
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      # 构建并推送
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myapp:latest
            myapp:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 部署策略

### 蓝绿部署

维护两套完全相同的生产环境，通过切换流量实现零停机部署：

```yaml
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to Green environment
      run: |
        # 部署到 Green 环境
        kubectl apply -f k8s/green.yaml
        
        # 等待 Green 环境就绪
        kubectl rollout status deployment/app-green
        
        # 切换流量到 Green
        kubectl patch service app -p '{"spec":{"selector":{"version":"green"}}}'
        
        # 删除 Blue 环境
        kubectl delete deployment app-blue
```

### 金丝雀发布

逐步将流量导向新版本：

```yaml
deploy:
  steps:
    - name: Canary deployment
      run: |
        # 部署金丝雀版本（10% 流量）
        kubectl apply -f k8s/canary.yaml
        
        # 监控指标
        # 如果正常，逐步增加流量
        # 如果异常，快速回滚
```

### 滚动更新

逐步替换旧版本实例：

```yaml
# Kubernetes 滚动更新配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多多一个 Pod
      maxUnavailable: 0  # 不允许不可用
  template:
    # ...
```

### 功能开关

通过配置控制功能发布：

```yaml
deploy:
  steps:
    - name: Deploy with feature flags
      run: |
        # 部署新功能（默认关闭）
        # 通过配置中心逐步开启
        curl -X POST https://config.example.com/flags/new-feature \
          -H "Authorization: $TOKEN" \
          -d '{"enabled": true, "percentage": 10}'
```

## 实战配置

### 完整的前端项目 CI/CD

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
  pull_request:
    paths:
      - 'frontend/**'

defaults:
  run:
    working-directory: frontend

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Test
        run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          directory: frontend/coverage
  
  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - run: npm ci
        working-directory: frontend
      
      - name: Build
        run: npm run build
        working-directory: frontend
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
      
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/dist/
  
  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: frontend-dist
      
      - name: Deploy preview
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'Preview URL: ${{ steps.deploy.outputs.preview-url }}'
            })
  
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: frontend-dist
      
      - name: Deploy to production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 完整的后端项目 CI/CD

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    paths:
      - 'backend/**'

defaults:
  run:
    working-directory: backend

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test
      
      - uses: codecov/codecov-action@v3
        with:
          directory: backend/coverage
  
  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}/backend
          tags: |
            type=sha
            type=ref,event=branch
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
  
  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          # 使用 SSH 部署到服务器
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > private_key.pem
          chmod 600 private_key.pem
          ssh -o StrictHostKeyChecking=no -i private_key.pem ${{ secrets.SERVER_USER }}@${{ secrets.STAGING_SERVER }} << 'EOF'
            cd /opt/app
            docker-compose pull backend
            docker-compose up -d backend
            docker-compose exec -T backend npm run migrate
          EOF
  
  deploy-production:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > private_key.pem
          chmod 600 private_key.pem
          ssh -o StrictHostKeyChecking=no -i private_key.pem ${{ secrets.SERVER_USER }}@${{ secrets.PRODUCTION_SERVER }} << 'EOF'
            cd /opt/app
            docker-compose pull backend
            docker-compose up -d --no-deps backend
            docker-compose exec -T backend npm run migrate
          EOF
```

### 自动化发布流程

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 最佳实践

### 1. 保持流水线快速

- 并行执行独立任务
- 使用缓存加速
- 只在必要时运行完整测试

### 2. 失败快速反馈

- Lint 和单元测试优先
- 设置合理的超时时间
- 清晰的错误信息

### 3. 安全性

- 使用 Secrets 管理敏感信息
- 限制工作流权限
- 扫描依赖漏洞

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 4. 环境隔离

```yaml
environments:
  staging:
    url: https://staging.example.com
  production:
    url: https://example.com
    # 需要审批
    protection_rules:
      - type: required_reviewers
        required_reviewers: 2
```

## 延伸阅读

- [Docker 容器化](./02-docker.md) - 容器化基础知识
- [监控与日志](./04-monitoring.md) - 部署后监控
- [云服务部署](./05-cloud.md) - 云平台部署实践
