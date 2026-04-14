
# 云服务部署

云服务已成为现代应用部署的首选方案，提供了弹性、可靠、易维护的基础设施。本章将介绍主流云服务商、部署方案选择、成本优化和安全配置等实践内容。

## 云服务商概览

### 主流云服务商对比

| 服务商 | 特点 | 适用场景 | 价格竞争力 |
|--------|------|----------|------------|
| **AWS** | 服务最全面、生态最成熟 | 企业级应用、大数据 | 中等 |
| **Azure** | 与 Microsoft 生态深度集成 | 企业办公、.NET 应用 | 中等 |
| **GCP** | 容器和 AI/ML 服务领先 | 容器化应用、AI 项目 | 较高 |
| **Vercel** | 前端部署体验最佳 | 静态网站、SSR 应用 | 免费额度大 |
| **Cloudflare** | 边缘计算和 CDN 强大 | 全球加速、边缘应用 | 性价比高 |
| **阿里云** | 国内市场份额最大 | 国内业务、合规要求 | 中等 |
| **腾讯云** | 游戏和音视频服务突出 | 游戏应用、直播 | 中等 |

### 服务类型选择

**IaaS（基础设施即服务）**：虚拟机、存储、网络

```text
适用场景：
- 需要完全控制基础设施
- 传统应用迁移
- 特殊硬件需求

代表产品：AWS EC2、阿里云 ECS
```

**PaaS（平台即服务）**：应用托管平台

```text
适用场景：
- 快速部署应用
- 减少运维负担
- 中小型项目

代表产品：Heroku、Google App Engine
```

**Serverless（无服务器）**：函数即服务

```text
适用场景：
- 事件驱动型应用
- 流量波动大
- 微服务架构

代表产品：AWS Lambda、Cloudflare Workers
```

## Vercel 部署

Vercel 是前端应用部署的最佳选择，特别适合 Next.js、Vue、React 等现代前端框架。

### 项目配置

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://api.example.com"
  }
}
```

### 环境变量管理

```bash
# 通过 CLI 设置环境变量
vercel env add VITE_API_URL production
vercel env add DATABASE_URL production

# 拉取环境变量到本地
vercel env pull .env.local
```

### 自动化部署

```yaml
# .github/workflows/vercel.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 预览部署

Vercel 自动为每个 PR 创建预览环境：

```text
PR #123 → https://myapp-git-feature-123-username.vercel.app
```

配置 PR 评论：

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Preview
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
              body: `🚀 Preview deployed!\n\nURL: ${{ steps.deploy.outputs.preview-url }}`
            })
```

### Vercel 最佳实践

**1. 缓存优化**

```javascript
// next.config.js
module.exports = {
  // 静态资源缓存
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

**2. 边缘函数**

```javascript
// api/hello.js - Edge Function
export const config = { runtime: 'edge' }

export default function handler(request) {
  return new Response(
    JSON.stringify({ message: 'Hello from Edge!' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

**3. ISR（增量静态生成）**

```javascript
// pages/posts/[id].js
export async function getStaticProps({ params }) {
  const post = await getPost(params.id)
  
  return {
    props: { post },
    revalidate: 60, // 60 秒后重新生成
  }
}
```

## Cloudflare 部署

Cloudflare 提供强大的 CDN、边缘计算和安全服务。

### Cloudflare Pages

```yaml
# wrangler.toml
name = "my-app"
type = "javascript"
account_id = "your-account-id"

[site]
bucket = "./dist"
entry-point = "workers-site"
```

部署配置：

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录
wrangler login

# 部署
wrangler pages deploy dist
```

### Cloudflare Workers

```javascript
// workers/api.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // API 路由
    if (url.pathname.startsWith('/api/')) {
      const data = await handleAPI(request)
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // 静态资源
    return env.ASSETS.fetch(request)
  },
}

async function handleAPI(request) {
  // 业务逻辑
  return { message: 'Hello from Cloudflare Workers!' }
}
```

### D1 数据库

```javascript
// 使用 Cloudflare D1 数据库
export default {
  async fetch(request, env) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(1).all()
    
    return Response.json(results)
  },
}
```

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxx-xxx-xxx"
```

### R2 存储

```javascript
// 文件上传到 R2
export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      const file = await request.arrayBuffer()
      await env.MY_BUCKET.put('uploads/file.jpg', file)
      return new Response('Uploaded!')
    }
    
    const object = await env.MY_BUCKET.get('uploads/file.jpg')
    return new Response(object.body)
  },
}
```

## 云服务器部署

对于需要完全控制的应用，云服务器仍是重要选择。

### 服务器初始化脚本

```bash
#!/bin/bash
# init-server.sh

# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 安装 Nginx
apt install -y nginx

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 安装 Certbot（SSL 证书）
apt install -y certbot python3-certbot-nginx

# 创建应用目录
mkdir -p /opt/app
```

### Docker Compose 生产配置

```yaml
# /opt/app/docker-compose.yml
version: '3.8'

services:
  web:
    image: myapp:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web

volumes:
  postgres-data:
  redis-data:
```

### Nginx 反向代理配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server web:3000;
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name example.com www.example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name example.com www.example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Gzip 压缩
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

        # 静态文件缓存
        location /static/ {
            proxy_pass http://app;
            proxy_cache_valid 200 30d;
            add_header Cache-Control "public, max-age=2592000";
        }

        # API 代理
        location /api/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 前端应用
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

APP_DIR="/opt/app"
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting deployment..."

# 备份当前版本
echo "Creating backup..."
mkdir -p $BACKUP_DIR
cp -r $APP_DIR $BACKUP_DIR/app_$TIMESTAMP

# 拉取最新代码
cd $APP_DIR
git pull origin main

# 拉取最新镜像
docker-compose pull

# 停止旧容器
docker-compose down

# 启动新容器
docker-compose up -d

# 等待健康检查
echo "Waiting for health check..."
sleep 10

# 检查服务状态
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Deployment successful!"
    
    # 清理旧备份（保留最近 5 个）
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm -rf
else
    echo "Health check failed! Rolling back..."
    docker-compose down
    cp -r $BACKUP_DIR/app_$TIMESTAMP/* $APP_DIR/
    cd $APP_DIR
    docker-compose up -d
    exit 1
fi
```

### SSL 证书配置

```bash
# 使用 Let's Encrypt 获取免费 SSL 证书

# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d example.com -d www.example.com

# 自动续期（Certbot 会自动配置 cron）
sudo certbot renew --dry-run
```

## 成本优化

### 资源优化策略

**1. 选择合适的实例类型**

```text
开发/测试环境：
- 使用 Spot/Preemptible 实例（价格降低 60-90%）
- 选择较小规格实例
- 设置自动关机策略

生产环境：
- 使用 Reserved Instances（预留实例）
- 合理配置自动扩缩容
- 监控资源使用率，避免过度配置
```

**2. 存储优化**

```text
- 使用对象存储存储静态文件（S3、OSS）
- 配置生命周期策略，自动归档旧数据
- 使用 CDN 减少源站流量
- 定期清理未使用的磁盘快照
```

**3. 网络优化**

```text
- 使用 CDN 加速，减少回源流量
- 合理配置区域，减少跨区域流量
- 使用 VPC 内网通信
- 压缩传输数据
```

### 成本监控

```yaml
# AWS 成本告警示例
Resources:
  CostAlert:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: "MonthlyCostAlert"
      AlarmDescription: "Alert when monthly cost exceeds budget"
      Namespace: "AWS/Billing"
      MetricName: "EstimatedCharges"
      Dimensions:
        - Name: Currency
          Value: USD
      Statistic: Maximum
      Period: 21600  # 6 小时
      EvaluationPeriods: 1
      Threshold: 100  # $100
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
```

### Serverless 成本优化

```javascript
// Lambda 函数优化
exports.handler = async (event) => {
  // 1. 减少冷启动时间
  // - 使用较小的部署包
  // - 复用数据库连接
  
  // 2. 合理设置内存和超时
  // 内存越大，CPU 越强，执行时间越短
  
  // 3. 使用 Provisioned Concurrency（预置并发）
  // 对延迟敏感的函数
}

// 配置示例
{
  "FunctionName": "my-function",
  "MemorySize": 256,        // 内存
  "Timeout": 10,            // 超时秒数
  "ReservedConcurrentExecutions": 10  // 预留并发
}
```

## 安全配置

### 网络安全

**1. 防火墙配置**

```bash
# UFW（Uncomplicated Firewall）配置
# 只允许必要端口

# 默认拒绝入站
ufw default deny incoming
ufw default allow outgoing

# 允许 SSH
ufw allow 22/tcp

# 允许 HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 限制 SSH 登录尝试
ufw limit 22/tcp

# 启用防火墙
ufw enable
```

**2. 安全组规则（AWS 示例）**

```json
{
  "SecurityGroups": [
    {
      "GroupName": "web-server",
      "IpPermissions": [
        {
          "IpProtocol": "tcp",
          "FromPort": 80,
          "ToPort": 80,
          "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
        },
        {
          "IpProtocol": "tcp",
          "FromPort": 443,
          "ToPort": 443,
          "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
        },
        {
          "IpProtocol": "tcp",
          "FromPort": 22,
          "ToPort": 22,
          "IpRanges": [{"CidrIp": "10.0.0.0/8"}]  // 仅内网访问
        }
      ]
    }
  ]
}
```

### 应用安全

**1. 环境变量管理**

```bash
# 不要在代码中硬编码敏感信息
# 使用环境变量或密钥管理服务

# .env（不要提交到 Git）
DATABASE_URL=postgres://user:pass@host:5432/db
API_KEY=sk-xxx
JWT_SECRET=your-secret-key

# 使用云服务密钥管理
# AWS: Secrets Manager / Parameter Store
# GCP: Secret Manager
# Azure: Key Vault
```

**2. HTTPS 强制**

```javascript
// Express 强制 HTTPS
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`)
  }
  next()
})
```

**3. 安全头配置**

```javascript
// Helmet.js 配置安全头
const helmet = require('helmet')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))
```

### 访问控制

**1. SSH 安全**

```bash
# /etc/ssh/sshd_config

# 禁用 root 登录
PermitRootLogin no

# 使用密钥认证
PasswordAuthentication no
PubkeyAuthentication yes

# 修改默认端口
Port 2222

# 限制登录用户
AllowUsers deploy

# 重启 SSH 服务
sudo systemctl restart sshd
```

**2. IAM 最小权限原则**

```json
// AWS IAM 策略示例：只允许 S3 访问特定存储桶
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

### 安全审计

**1. 日志审计**

```yaml
# 启用访问日志
services:
  nginx:
    volumes:
      - ./logs/nginx:/var/log/nginx
    # ...

# 使用云服务日志服务
# AWS CloudTrail
# GCP Cloud Audit Logs
# Azure Activity Log
```

**2. 漏洞扫描**

```yaml
# GitHub Actions 安全扫描
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## 部署清单

### 上线前检查

```markdown
## 部署检查清单

### 基础设施
- [ ] 服务器配置正确
- [ ] 数据库备份策略已配置
- [ ] SSL 证书已安装
- [ ] 防火墙规则已配置
- [ ] DNS 解析已配置

### 应用配置
- [ ] 环境变量已设置
- [ ] 日志收集已配置
- [ ] 监控告警已配置
- [ ] 错误追踪已集成（Sentry）
- [ ] 性能监控已配置

### 安全检查
- [ ] 敏感信息不在代码中
- [ ] HTTPS 已强制启用
- [ ] 安全头已配置
- [ ] 数据库访问已限制
- [ ] API 速率限制已配置

### 备份与恢复
- [ ] 数据库自动备份已配置
- [ ] 备份恢复流程已测试
- [ ] 灾难恢复计划已制定

### 文档
- [ ] 部署文档已更新
- [ ] Runbook 已准备
- [ ] API 文档已更新
```

### 监控配置

```yaml
# 基础监控指标
监控项:
  系统监控:
    - CPU 使用率
    - 内存使用率
    - 磁盘使用率
    - 网络流量
  
  应用监控:
    - 请求量（QPS）
    - 响应时间
    - 错误率
    - 活跃连接数
  
  业务监控:
    - 用户活跃度
    - 订单量
    - 转化率
    - 支付成功率
  
  告警配置:
    - 服务宕机：立即告警
    - 错误率 > 1%：5 分钟内告警
    - 响应时间 > 1s：5 分钟内告警
    - 磁盘使用 > 80%：30 分钟内告警
```

## 延伸阅读

- [Docker 容器化](./02-docker.md) - 容器化部署基础
- [CI/CD 流水线](./03-ci-cd.md) - 自动化部署流程
- [监控与日志](./04-monitoring.md) - 云服务监控集成
