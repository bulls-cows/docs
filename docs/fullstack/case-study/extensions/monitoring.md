# 日志监控

日志监控系统用于追踪应用错误、性能问题和用户行为。

## 核心功能

- **错误追踪**：捕获和记录应用错误
- **性能监控**：记录接口响应时间
- **用户行为**：追踪用户操作日志
- **告警通知**：错误阈值告警

## 数据库设计

### 错误日志表（error_log）

```sql
CREATE TABLE `error_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_name` varchar(100) NOT NULL COMMENT '应用名称',
  `environment` varchar(50) NOT NULL COMMENT '环境',
  `error_type` varchar(100) NOT NULL COMMENT '错误类型',
  `error_message` text COMMENT '错误信息',
  `stack_trace` text COMMENT '堆栈追踪',
  `request_url` varchar(500) DEFAULT NULL COMMENT '请求URL',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT 'User Agent',
  `resolved` tinyint(1) DEFAULT 0 COMMENT '是否已解决',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_type` (`app_name`, `error_type`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误日志表';
```

### 操作日志表（operation_log）

```sql
CREATE TABLE `operation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `action` varchar(100) NOT NULL COMMENT '操作类型',
  `resource` varchar(100) DEFAULT NULL COMMENT '资源类型',
  `resource_id` int(11) DEFAULT NULL COMMENT '资源ID',
  `detail` text COMMENT '操作详情',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT 'User Agent',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';
```

## 错误捕获中间件

```typescript
export const errorLoggerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  knex('error_log').insert({
    app_name: process.env.APP_NAME || 'app',
    environment: process.env.NODE_ENV || 'development',
    error_type: err.name,
    error_message: err.message,
    stack_trace: err.stack,
    request_url: req.originalUrl,
    request_method: req.method,
    user_id: req.user?.id || null,
    ip: req.ip,
    user_agent: req.get('user-agent'),
  }).catch(console.error);

  // 返回错误响应
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
  });
};
```

## 操作日志记录

```typescript
export const logOperation = async (
  userId: number | null,
  action: string,
  resource: string | null,
  resourceId: number | null,
  detail: string | null,
  req: Request
): Promise<void> => {
  await knex('operation_log').insert({
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    detail,
    ip: req.ip,
    user_agent: req.get('user-agent'),
  });
};

// 使用示例
router.post('/articles', authMiddleware(), async (req, res) => {
  // ...创建文章逻辑
  await logOperation(
    req.user!.id,
    'create',
    'article',
    articleId,
    JSON.stringify({ title: req.body.title }),
    req
  );
});
```

## 相关章节

- [部署上线](../../appendix/deployment.md) - 生产环境部署
