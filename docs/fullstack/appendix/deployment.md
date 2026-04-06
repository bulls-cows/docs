---
order: 20
---

# 部署上线

本文介绍项目的生产环境部署流程和注意事项。

## 部署前准备

### 服务器要求

| 配置 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 硬盘 | 50GB | 100GB+ |
| 系统 | Ubuntu 20.04 | Ubuntu 22.04 |

### 软件环境

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install -y mysql-server

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

## 部署步骤

### 1. 上传代码

```bash
# 方式一：Git 克隆
git clone <repository-url> /var/www/project

# 方式二：SCP 上传
scp -r ./dist user@server:/var/www/project
```

### 2. 安装依赖

```bash
cd /var/www/project
npm install --production
```

### 3. 配置环境变量

```bash
# 创建生产环境配置
cp .env.example .env.production

# 编辑配置
vim .env.production
```

配置内容：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT
JWT_SECRET=your_strong_secret

# 应用
NODE_ENV=production
PORT=9000
```

### 4. 运行数据库迁移

```bash
npm run migrate:latest
```

### 5. 构建应用

```bash
npm run build:production
```

### 6. 启动服务

```bash
# 使用 PM2 启动
pm2 start npm --name "api" -- run start:production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

## Nginx 配置

### API 代理配置

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 前端静态配置

```nginx
server {
    listen 80;
    server_name www.example.com;
    root /var/www/project/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

### HTTPS 配置

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d example.com -d www.example.com

# 自动续期
sudo certbot renew --dry-run
```

## PM2 常用命令

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart api

# 停止应用
pm2 stop api

# 删除应用
pm2 delete api

# 监控面板
pm2 monit
```

## 数据库备份

### 手动备份

```bash
# 备份数据库
mysqldump -u root -p database_name > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p database_name < backup_20240101.sql
```

### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="your_database"
DB_USER="your_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/$DB_NAME_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

添加到 crontab：

```bash
# 每天凌晨 2 点备份
0 2 * * * /var/www/project/scripts/backup.sh
```

## 监控告警

### PM2 监控

```bash
# 安装 PM2 监控模块
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 日志监控

```bash
# 实时查看日志
pm2 logs api --lines 100

# 查看错误日志
pm2 logs api --err
```

## 常见问题

### 服务启动失败

1. 检查端口是否被占用：`netstat -tlnp | grep 9000`
2. 检查环境变量配置
3. 查看错误日志：`pm2 logs api --err`

### 数据库连接失败

1. 检查 MySQL 服务状态：`systemctl status mysql`
2. 检查数据库用户权限
3. 检查防火墙配置

### 内存不足

1. 增加 Node.js 内存限制：`NODE_OPTIONS="--max-old-space-size=4096"`
2. 使用 PM2 集群模式：`pm2 start npm -i max`

## 相关章节

- [开发环境搭建](./development.md) - 本地开发配置
- [开发规范速查](./code-standards.md) - 代码规范
