---
order: 40
---

# 无服务器架构

无服务器架构 (Serverless) 是一种云计算执行模型，云提供商动态管理服务器资源的分配和扩展。开发者只需关注业务代码，无需管理基础设施。本章深入探讨 Serverless 架构的核心概念和实践方法。

## Serverless 概念

### 什么是 Serverless

Serverless 并非"没有服务器"，而是"无需管理服务器"：

```text
传统架构 vs Serverless 架构：
┌─────────────────────────────────────────────────────────────┐
│ 传统架构                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  开发者负责：代码 + 运行时 + 中间件 + OS + 服务器 + 网络   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Serverless 架构                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  开发者负责：代码                                        │ │
│ │  云厂商负责：运行时 + 中间件 + OS + 服务器 + 网络         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Serverless 核心特征

| 特征 | 描述 |
|------|------|
| **无服务器管理** | 无需配置、维护、打补丁服务器 |
| **自动弹性伸缩** | 根据请求量自动扩展或收缩 |
| **按需计费** | 只为实际执行付费，空闲时不收费 |
| **事件驱动** | 函数由事件触发执行 |
| **无状态** | 每次执行独立，不依赖之前的状态 |

### Serverless 组成部分

```text
Serverless 生态：
┌─────────────────────────────────────────────────────────────┐
│                     Serverless 应用                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FaaS (函数即服务)          BaaS (后端即服务)                │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │ AWS Lambda       │      │ 数据库服务                │    │
│  │ Azure Functions  │      │ ├── DynamoDB             │    │
│  │ Google Cloud     │      │ ├── Firestore            │    │
│  │ Functions        │      │ └── MongoDB Atlas        │    │
│  │ 阿里云函数计算    │      │                          │    │
│  │ 腾讯云 SCF       │      │ 存储服务                  │    │
│  └──────────────────┘      │ ├── S3 / OSS             │    │
│                            │ └── Cloud Storage        │    │
│                            │                          │    │
│                            │ 认证服务                  │    │
│                            │ ├── Cognito              │    │
│                            │ └── Auth0                │    │
│                            │                          │    │
│                            │ 消息服务                  │    │
│                            │ ├── SQS                  │    │
│                            │ └── EventBridge          │    │
│                            └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## FaaS 平台实践

### 主流 FaaS 平台对比

| 平台 | 提供商 | 运行时支持 | 执行时长限制 | 内存配置 |
|------|--------|-----------|-------------|---------|
| Lambda | AWS | Node.js, Python, Java, Go, .NET, Ruby | 15 分钟 | 128MB - 10GB |
| Azure Functions | Microsoft | Node.js, Python, Java, C#, PowerShell | 10 分钟 | 128MB - 14GB |
| Cloud Functions | Google | Node.js, Python, Java, Go, .NET, Ruby | 9 分钟 | 128MB - 32GB |
| 函数计算 | 阿里云 | Node.js, Python, Java, PHP, Go | 10 分钟 | 128MB - 3GB |
| SCF | 腾讯云 | Node.js, Python, Java, PHP, Go | 900 秒 | 128MB - 3GB |

### 函数开发示例

**AWS Lambda 函数**：

```typescript
// handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // 业务逻辑处理
    const result = await processOrder(body);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed successfully',
        data: result
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};

async function processOrder(orderData: any) {
  // 处理订单逻辑
  return { orderId: '12345', status: 'completed' };
}
```

**函数配置**：

```yaml
# serverless.yml (Serverless Framework)
service: order-service

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  timeout: 30
  memorySize: 512
  environment:
    DB_TABLE: orders

functions:
  createOrder:
    handler: handler.createOrder
    events:
      - http:
          path: orders
          method: post
          cors: true
  
  getOrder:
    handler: handler.getOrder
    events:
      - http:
          path: orders/{id}
          method: get
```

### 触发器类型

```text
常见触发器类型：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  HTTP 触发器                                                │
│  ├── API Gateway (REST API)                                │
│  ├── Application Load Balancer                             │
│  └── HTTP API (简化版)                                      │
│                                                             │
│  消息队列触发器                                              │
│  ├── SQS (Simple Queue Service)                            │
│  ├── SNS (Simple Notification Service)                     │
│  ├── Kinesis (数据流)                                       │
│  └── Kafka / MSK                                           │
│                                                             │
│  存储触发器                                                  │
│  ├── S3 (对象上传/删除)                                     │
│  ├── DynamoDB Streams                                      │
│  └── Aurora Database                                       │
│                                                             │
│  定时触发器                                                  │
│  ├── EventBridge (CloudWatch Events)                       │
│  └── Schedule Expression                                   │
│                                                             │
│  其他触发器                                                  │
│  ├── Cognito (用户认证事件)                                 │
│  ├── CloudWatch Logs                                       │
│  └── SES (邮件事件)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**多触发器函数示例**：

```typescript
// 同一函数可由多种事件触发
export const handler = async (event: any) => {
  // 判断触发源
  if (event.Records) {
    // SQS 或 S3 触发
    for (const record of event.Records) {
      if (record.eventSource === 'aws:sqs') {
        await processSQSMessage(record);
      } else if (record.eventSource === 'aws:s3') {
        await processS3Event(record);
      }
    }
  } else if (event['detail-type']) {
    // EventBridge 触发
    await processScheduledEvent(event);
  } else if (event.httpMethod) {
    // API Gateway 触发
    return handleHttpRequest(event);
  }
};
```

### 函数设计模式

**1. 函数粒度**

```text
函数粒度选择：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  单一用途函数 (推荐)                                         │
│  ├── createOrder    → 创建订单                              │
│  ├── processPayment → 处理支付                              │
│  └── sendEmail      → 发送邮件                              │
│  优点：独立部署、独立扩展、职责清晰                           │
│                                                             │
│  多用途函数 (不推荐)                                         │
│  └── orderHandler   → 创建/查询/取消订单                     │
│  缺点：耦合度高、难以独立扩展                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**2. 函数编排**

```typescript
// 使用 Step Functions 编排多个函数
// 定义状态机
{
  "Comment": "Order processing workflow",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:validateOrder",
      "Next": "ProcessPayment"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:processPayment",
      "Next": "UpdateInventory"
    },
    "UpdateInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:updateInventory",
      "Next": "SendConfirmation"
    },
    "SendConfirmation": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:sendConfirmation",
      "End": true
    }
  }
}
```

```text
Step Functions 流程图：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │ Validate    │────→│ Process     │────→│ Update      │   │
│  │ Order       │     │ Payment     │     │ Inventory   │   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘   │
│                                                  │          │
│                                                  ↓          │
│                                          ┌─────────────┐   │
│                                          │ Send        │   │
│                                          │ Confirmation│   │
│                                          └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## BaaS 服务集成

### 数据库服务

**DynamoDB (AWS)**：

```typescript
// DynamoDB 操作示例
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 创建/更新
async function putOrder(order: Order) {
  await docClient.send(new PutCommand({
    TableName: 'Orders',
    Item: order
  }));
}

// 查询单条
async function getOrder(orderId: string): Promise<Order | null> {
  const result = await docClient.send(new GetCommand({
    TableName: 'Orders',
    Key: { orderId }
  }));
  return result.Item as Order;
}

// 查询列表
async function getOrdersByUser(userId: string): Promise<Order[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: 'Orders',
    IndexName: 'UserIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));
  return result.Items as Order[];
}
```

**DynamoDB 数据模型设计**：

```
DynamoDB 单表设计：
┌─────────────────────────────────────────────────────────────┐
│ Table: Orders                                               │
├─────────────────────────────────────────────────────────────┤
│ PK              │ SK              │ Attributes              │
├─────────────────┼─────────────────┼────────────────────────┤
│ ORDER#123       │ ORDER#123       │ status, total, date    │
│ ORDER#123       │ ITEM#001        │ productId, quantity    │
│ ORDER#123       │ ITEM#002        │ productId, quantity    │
│ USER#U001       │ ORDER#123       │ orderDate, status      │
│ USER#U001       │ ORDER#124       │ orderDate, status      │
└─────────────────────────────────────────────────────────────┘

访问模式：
- 按 orderId 查询：PK = ORDER#123
- 查询用户所有订单：PK = USER#U001, SK begins_with ORDER#
```

### 存储服务

**S3 对象存储**：

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

// 上传文件
async function uploadFile(bucket: string, key: string, body: Buffer) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/pdf'
  }));
}

// 下载文件
async function downloadFile(bucket: string, key: string): Promise<Buffer> {
  const result = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }));
  return Buffer.from(await result.Body.transformToByteArray());
}

// S3 触发器处理上传文件
export const processUpload = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);
    
    // 处理上传的文件
    const file = await downloadFile(bucket, key);
    // ... 处理逻辑
  }
};
```

### 认证服务

**Cognito 用户池**：

```typescript
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});

// 用户注册
async function signUp(email: string, password: string) {
  await cognito.send(new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email }
    ]
  }));
}

// 用户登录
async function signIn(email: string, password: string) {
  const result = await cognito.send(new InitiateAuthCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  }));
  
  return {
    accessToken: result.AuthenticationResult.AccessToken,
    idToken: result.AuthenticationResult.IdToken,
    refreshToken: result.AuthenticationResult.RefreshToken
  };
}
```

### 消息服务

**SQS 队列**：

```typescript
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

// 发送消息
async function sendMessage(queueUrl: string, message: any) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    DelaySeconds: 0
  }));
}

// Lambda 处理 SQS 消息
export const processSQS = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    await processMessage(message);
  }
};
```

## 冷启动优化

### 什么是冷启动

```
Lambda 执行生命周期：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  冷启动流程：                                                │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ 下载代码  │──→│ 创建容器  │──→│ 初始化    │──→│ 执行函数  │ │
│  │  ~100ms  │   │  ~200ms  │   │  ~500ms   │   │  业务逻辑 │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                             │
│  热启动流程：                                                │
│  ┌──────────┐                                               │
│  │ 执行函数  │  ← 容器和运行时已就绪                         │
│  │ 业务逻辑  │                                               │
│  └──────────┘                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 冷启动影响因素

| 因素 | 影响 | 优化建议 |
|------|------|----------|
| 运行时 | Java > .NET > Node.js > Python > Go | 选择轻量级运行时 |
| 内存配置 | 内存越大，CPU 越强，冷启动越快 | 适当增加内存 |
| 代码包大小 | 包越大，加载越慢 | 减少依赖，使用 Layer |
| VPC 配置 | VPC 内冷启动更慢 | 非必要不使用 VPC |
| 初始化代码 | 全局初始化影响启动时间 | 延迟加载 |

### 优化策略

**1. 选择合适的运行时**

```typescript
// Go 函数：冷启动最快
package main

import (
  "github.com/aws/aws-lambda-go/lambda"
)

func handler() (string, error) {
  return "Hello from Go!", nil
}

func main() {
  lambda.Start(handler)
}
```

```typescript
// Node.js：冷启动较快，推荐使用
export const handler = async (event) => {
  return { message: 'Hello from Node.js!' };
};
```

**2. 减少依赖**

```typescript
// 不好的做法：引入整个库
import _ from 'lodash';  // 整个 lodash 约 70KB

// 好的做法：只引入需要的函数
import debounce from 'lodash/debounce';  // 只引入需要的部分
```

**3. 使用 Layer 共享依赖**

```yaml
# serverless.yml
layers:
  commonDeps:
    path: layers/common
    compatibleRuntimes:
      - nodejs18.x

functions:
  myFunction:
    handler: handler.main
    layers:
      - { Ref: CommonDepsLambdaLayer }
```

**4. 延迟初始化**

```typescript
// 不好的做法：全局初始化
const db = new DynamoDBClient({});  // 模块加载时就初始化

export const handler = async (event) => {
  // 使用 db
};

// 好的做法：延迟初始化
let db: DynamoDBClient | null = null;

const getDb = () => {
  if (!db) {
    db = new DynamoDBClient({});
  }
  return db;
};

export const handler = async (event) => {
  const database = getDb();  // 首次调用时才初始化
  // 使用 database
};
```

**5. Provisioned Concurrency**

```yaml
# 预置并发配置
functions:
  criticalFunction:
    handler: handler.main
    provisionedConcurrency: 5  # 保持 5 个实例预热
```

```
预置并发效果：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  无预置并发：                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 请求 → 冷启动 → 执行 → 冷启动 → 执行 → 冷启动 → 执行  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  有预置并发：                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [预热实例][预热实例][预热实例]                         │   │
│  │ 请求 → 热启动 → 执行 → 热启动 → 执行 → 热启动 → 执行  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**6. 保持函数温暖**

```typescript
// 定时触发器保持函数温暖
export const warmup = async (event: any) => {
  // 如果是预热请求，直接返回
  if (event.source === 'serverless-plugin-warmup') {
    return 'warmup';
  }
  
  // 正常业务逻辑
  return processBusinessLogic(event);
};
```

```yaml
# serverless.yml 配置预热
functions:
  myFunction:
    handler: handler.warmup
    events:
      - schedule:
          rate: rate(5 minutes)
          input:
            source: serverless-plugin-warmup
```

## 成本与限制

### 成本模型

**Lambda 定价模型**：

```text
成本 = 请求费用 + 计算费用

请求费用：
- 前 100 万次请求免费
- 之后每 100 万次请求 $0.20

计算费用：
- 内存 × 执行时间 × 请求次数
- 128MB × 100ms × 100 万次 ≈ $0.21

示例计算：
┌─────────────────────────────────────────────────────────────┐
│ 假设：                                                      │
│ - 每月 1000 万次请求                                        │
│ - 平均执行时间 100ms                                        │
│ - 内存配置 512MB                                            │
│                                                             │
│ 请求费用：(1000万 - 100万) × $0.20 / 100万 = $1.80         │
│ 计算费用：1000万 × 0.1s × $0.0000002083 × 4 = $0.83        │
│ 总费用：$1.80 + $0.83 = $2.63/月                            │
└─────────────────────────────────────────────────────────────┘
```

**成本对比**：

```text
EC2 vs Lambda 成本对比（月度）：
┌─────────────────────────────────────────────────────────────┐
│ 场景：API 服务，平均 100 QPS，峰值 1000 QPS                  │
├─────────────────────────────────────────────────────────────┤
│ EC2 (t3.medium × 2)                                         │
│ ├── 实例费用：$60/月                                        │
│ ├── 负载均衡器：$20/月                                      │
│ └── 总计：$80/月                                            │
├─────────────────────────────────────────────────────────────┤
│ Lambda                                                      │
│ ├── 请求费用：$5/月                                         │
│ ├── 计算费用：$15/月                                        │
│ └── 总计：$20/月                                            │
├─────────────────────────────────────────────────────────────┤
│ 结论：低流量场景 Lambda 更划算                               │
│       高流量持续负载场景 EC2 可能更经济                       │
└─────────────────────────────────────────────────────────────┘
```

### 服务限制

**Lambda 限制**：

| 限制项 | 默认值 | 可调整 |
|--------|--------|--------|
| 执行时长 | 15 分钟 | 否 |
| 内存 | 128MB - 10GB | 是 |
| 临时存储 | 512MB - 10GB | 是 |
| 部署包大小 (直接上传) | 50MB | 否 |
| 部署包大小 (S3) | 250MB | 否 |
| 环境变量总大小 | 4KB | 否 |
| 并发执行数 | 1000 | 是 (可申请提高) |

**应对策略**：

```typescript
// 执行时长限制应对：拆分长时间任务
export const handler = async (event: any) => {
  const timeout = Date.now() + 12000; // 预留 3 秒安全时间
  
  while (hasMoreWork() && Date.now() < timeout) {
    await processBatch();
  }
  
  if (hasMoreWork()) {
    // 触发下一个 Lambda 继续处理
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.FUNCTION_NAME,
      InvocationType: 'Event', // 异步调用
      Payload: JSON.stringify({ continueFrom: currentOffset })
    }));
  }
};
```

### 适用场景分析

**适合 Serverless 的场景**：

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. 流量波动大                                               │
│     ├── 促销活动期间流量激增                                 │
│     ├── 夜间流量极低                                        │
│     └── 自动伸缩，按需付费                                   │
│                                                             │
│  2. 事件驱动处理                                             │
│     ├── 文件上传后处理                                       │
│     ├── 数据库变更触发                                       │
│     └── 定时任务                                            │
│                                                             │
│  3. API 网关后端                                             │
│     ├── REST API                                            │
│     ├── GraphQL                                             │
│     └── WebSocket                                           │
│                                                             │
│  4. 数据处理管道                                             │
│     ├── ETL 任务                                            │
│     ├── 日志分析                                            │
│     └── 图像处理                                            │
│                                                             │
│  5. 微服务架构                                               │
│     ├── 小型独立服务                                         │
│     ├── 快速迭代                                            │
│     └── 低运维需求                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**不适合 Serverless 的场景**：

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. 长时间运行任务                                           │
│     ├── 视频转码（超过 15 分钟）                             │
│     ├── 大规模数据处理                                       │
│     └── 建议：使用 ECS/EC2                                  │
│                                                             │
│  2. 高频低延迟要求                                           │
│     ├── 实时游戏服务器                                       │
│     ├── 高频交易系统                                        │
│     └── 建议：使用 EC2/专用服务器                            │
│                                                             │
│  3. 复杂依赖环境                                             │
│     ├── 需要特定系统库                                       │
│     ├── 大型机器学习模型                                     │
│     └── 建议：使用容器服务                                   │
│                                                             │
│  4. 持续高负载                                               │
│     ├── 稳定高流量                                          │
│     ├── 成本敏感                                            │
│     └── 建议：使用 EC2 预留实例                              │
│                                                             │
│  5. 需要状态保持                                             │
│     ├── WebSocket 长连接                                    │
│     ├── 会话状态管理                                        │
│     └── 建议：使用 Fargate/ECS                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 最佳实践

### 函数设计

```typescript
// 单一职责原则
// 好的设计：每个函数做一件事
export const createOrder = async (event: APIGatewayProxyEvent) => {
  const order = await orderService.create(event.body);
  return successResponse(order);
};

export const processPayment = async (event: SQSEvent) => {
  for (const record of event.Records) {
    await paymentService.process(JSON.parse(record.body));
  }
};

// 不好的设计：一个函数处理多种逻辑
export const orderHandler = async (event: any) => {
  if (event.httpMethod === 'POST') {
    // 创建订单
  } else if (event.httpMethod === 'GET') {
    // 查询订单
  } else if (event.source === 'aws.sqs') {
    // 处理队列消息
  }
  // 函数变得臃肿，难以维护
};
```

### 错误处理

```typescript
export const handler = async (event: any) => {
  try {
    const result = await processEvent(event);
    return result;
  } catch (error) {
    // 结构化错误日志
    console.error(JSON.stringify({
      level: 'ERROR',
      message: error.message,
      stack: error.stack,
      requestId: event.requestContext?.requestId,
      timestamp: new Date().toISOString()
    }));
    
    // 根据错误类型返回不同响应
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message })
      };
    }
    
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }
    
    // 未知错误
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
```

### 本地开发与测试

```typescript
// 使用 serverless-offline 本地开发
// 安装：npm install serverless-offline --save-dev

// 本地测试函数
import { handler } from './handler';

describe('Order Handler', () => {
  it('should create order successfully', async () => {
    const event = {
      body: JSON.stringify({
        productId: '123',
        quantity: 2
      })
    };
    
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).orderId).toBeDefined();
  });
});
```

### 监控与告警

```yaml
# CloudWatch 告警配置
Resources:
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: LambdaErrorRate
      AlarmDescription: Alert on Lambda error rate
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: myFunction
```

## 小结

Serverless 架构的核心价值：

**优势**：

- 零运维：无需管理服务器
- 自动伸缩：按需扩展，应对流量波动
- 按需付费：只为实际使用付费
- 快速迭代：专注业务代码开发

**挑战**：

- 冷启动延迟：需要优化策略
- 执行限制：时长、内存、并发限制
- 调试复杂：分布式环境排查困难
- 厂商锁定：依赖特定云服务

**选择建议**：

1. **初创项目**：快速验证，低成本启动
2. **事件驱动**：文件处理、定时任务、消息处理
3. **流量波动大**：自动伸缩应对峰值
4. **微服务架构**：小型独立服务

Serverless 不是万能的，但在合适的场景下，它能显著降低运维成本，提高开发效率。理解其限制，选择合适的场景，才能真正发挥 Serverless 的价值。
