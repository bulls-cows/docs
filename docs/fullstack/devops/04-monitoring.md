---
order: 40
---

# 监控与日志

监控与日志是 DevOps 实践中不可或缺的环节，构建完善的可观测性体系能够帮助团队快速发现问题、定位根因、优化性能。本章将介绍监控体系设计、日志管理、告警策略和常用工具实践。

## 监控体系设计

### 可观测性三支柱

现代监控体系建立在三个核心支柱之上：

```text
┌─────────────────────────────────────────────────────────┐
│                    可观测性（Observability）              │
├─────────────────┬─────────────────┬─────────────────────┤
│     指标        │      日志       │       追踪          │
│   (Metrics)     │     (Logs)      │     (Traces)        │
├─────────────────┼─────────────────┼─────────────────────┤
│ • CPU/内存使用  │ • 应用日志      │ • 请求链路          │
│ • 请求量/QPS    │ • 错误日志      │ • 服务依赖          │
│ • 响应时间      │ • 访问日志      │ • 性能瓶颈          │
│ • 错误率        │ • 系统日志      │ • 调用耗时          │
└─────────────────┴─────────────────┴─────────────────────┘
```

**指标（Metrics）**：数值型数据，适合聚合分析

```text
http_requests_total{method="GET", status="200"} 12345
http_request_duration_seconds{method="GET"} 0.123
```

**日志（Logs）**：事件记录，包含上下文信息

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "api-server",
  "trace_id": "abc123",
  "error": "Connection timeout"
}
```

**追踪（Traces）**：请求的完整调用链路

```text
请求 → API Gateway (5ms) → Auth Service (10ms) → Database (50ms) → Response
```

### 监控架构设计

典型的监控系统架构：

```text
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   应用服务   │    │   基础设施   │    │   中间件     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
              ┌────────────┴────────────┐
              │      数据采集层         │
              │  (Exporters/Agents)    │
              └────────────┬────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
│   指标存储   │    │   日志存储   │    │   追踪存储   │
│  Prometheus  │    │ Elasticsearch│    │    Jaeger   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌────────────┴────────────┐
              │      可视化层           │
              │      Grafana           │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │      告警层             │
              │   Alertmanager         │
              └─────────────────────────┘
```

### 监控指标分类

**系统指标**：基础设施层面的监控

```yaml
# Node Exporter 采集的系统指标
- node_cpu_seconds_total        # CPU 使用时间
- node_memory_MemAvailable_bytes # 可用内存
- node_filesystem_avail_bytes   # 磁盘可用空间
- node_network_receive_bytes_total # 网络接收流量
```

**应用指标**：业务应用层面的监控

```yaml
# 应用自定义指标
- http_requests_total           # 请求总数
- http_request_duration_seconds # 请求耗时
- http_requests_in_flight       # 正在处理的请求数
- database_connections_active   # 活跃数据库连接数
```

**业务指标**：业务层面的监控

```yaml
# 业务相关指标
- orders_total                  # 订单总数
- revenue_total                 # 收入总额
- active_users                  # 活跃用户数
- conversion_rate               # 转化率
```

## 日志管理最佳实践

### 结构化日志

使用 JSON 格式记录日志，便于解析和查询：

```javascript
// Node.js 结构化日志示例
const logger = require('pino')({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
})

logger.info({
  event: 'user_login',
  user_id: '12345',
  ip: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  duration_ms: 150
}, 'User logged in successfully')
```

输出：

```json
{
  "level": "info",
  "time": 1705312800000,
  "event": "user_login",
  "user_id": "12345",
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "duration_ms": 150,
  "msg": "User logged in successfully"
}
```

### 日志级别规范

```javascript
// 日志级别使用规范
logger.error('Database connection failed', { error: err.message })  // 错误，需要立即处理
logger.warn('High memory usage detected', { usage: '85%' })         // 警告，需要关注
logger.info('User registered', { user_id: userId })                 // 重要业务事件
logger.debug('Cache hit', { key: cacheKey })                        // 调试信息
logger.trace('Function called', { args })                           // 详细追踪
```

### 日志上下文

添加追踪信息，关联请求链路：

```javascript
// Express 中间件添加请求 ID
const { v4: uuidv4 } = require('uuid')

app.use((req, res, next) => {
  req.id = uuidv4()
  res.setHeader('X-Request-ID', req.id)
  
  // 为当前请求创建带上下文的 logger
  req.log = logger.child({
    request_id: req.id,
    method: req.method,
    path: req.path
  })
  
  next()
})

// 在路由中使用
app.get('/api/users/:id', (req, res) => {
  req.log.info({ user_id: req.params.id }, 'Fetching user')
  // ...
})
```

### ELK Stack 实践

Elasticsearch + Logstash + Kibana 是经典的日志管理方案：

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  filebeat:
    image: elastic/filebeat:8.11.0
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/log:/var/log:ro
    depends_on:
      - logstash

volumes:
  es-data:
```

Logstash 配置：

```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  json {
    source => "message"
  }
  
  # 解析时间戳
  date {
    match => ["timestamp", "ISO8601"]
  }
  
  # 添加地理位置信息
  geoip {
    source => "ip"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

## 告警策略

### 告警设计原则

**1. 可操作性**：每个告警都应该有明确的处理方式

```yaml
# 好的告警
alert: HighErrorRate
expr: rate(http_errors_total[5m]) > 0.1
annotations:
  summary: "High error rate detected"
  runbook_url: "https://wiki.example.com/runbooks/high-error-rate"
  action: "Check application logs, verify database connectivity"

# 不好的告警（缺乏可操作性）
alert: HighMemory
expr: node_memory_MemAvailable_bytes < 1000000000
annotations:
  summary: "Memory is low"  # 没有说明如何处理
```

**2. 合理的阈值**：避免告警风暴和漏报

```yaml
# 使用多级阈值
groups:
  - name: cpu-alerts
    rules:
      # 警告级别
      - alert: CPUUsageWarning
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 70
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage above 70%"
      
      # 严重级别
      - alert: CPUUsageCritical
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "CPU usage above 90%"
```

**3. 告警分级**：区分严重程度

```yaml
# Alertmanager 路由配置
route:
  receiver: 'default'
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    # 严重告警：立即通知
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: false
    
    # 警告级别：工作时间通知
    - match:
        severity: warning
      receiver: 'warning-alerts'
      active_time_intervals:
        - business-hours
    
    # 低优先级：仅记录
    - match:
        severity: info
      receiver: 'null'

receivers:
  - name: 'critical-alerts'
    pagerduty_configs:
      - service_key: '<service-key>'
  
  - name: 'warning-alerts'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
```

### Prometheus 告警规则

```yaml
# alert-rules.yml
groups:
  - name: application-alerts
    rules:
      # 错误率告警
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / 
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate ({{ $value | humanizePercentage }})"
          description: "Error rate has been above 5% for 5 minutes"
      
      # 响应时间告警
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"
      
      # 服务可用性
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
      
      # 磁盘空间
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} 
          / 
          node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Only {{ $value | humanizePercentage }} disk space remaining"
```

### 告警降噪

```yaml
# Alertmanager 配置
route:
  # 分组：相同分组的告警合并通知
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s      # 等待同组其他告警
  group_interval: 5m   # 同组新告警发送间隔
  repeat_interval: 4h  # 重复告警发送间隔
  
  # 抑制规则：某告警触发时抑制其他告警
inhibit_rules:
  # 服务宕机时，抑制该服务的其他告警
  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      alertname: '.*'
    equal: ['service', 'instance']
  
  # 集群故障时，抑制节点告警
  - source_match:
      alertname: 'ClusterDown'
    target_match_re:
      alertname: 'Node.*'
    equal: ['cluster']
```

## 常用工具

### Prometheus

开源的监控系统和时序数据库：

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # 监控 Prometheus 自身
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  # 监控 Node Exporter（系统指标）
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
  
  # 监控应用服务
  - job_name: 'app'
    static_configs:
      - targets: ['app1:8080', 'app2:8080']
    metrics_path: '/metrics'
  
  # 服务发现（Kubernetes）
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

应用集成 Prometheus：

```javascript
// Node.js 应用暴露指标
const client = require('prom-client')

// 创建 Registry
const register = new client.Registry()

// 默认指标（CPU、内存等）
client.collectDefaultMetrics({ register })

// 自定义指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
})

register.registerMetric(httpRequestDuration)

// Express 中间件
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer()
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status_code: res.statusCode })
  })
  next()
})

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
```

### Grafana

强大的可视化平台：

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./dashboards:/etc/grafana/provisioning/dashboards
      - ./datasources:/etc/grafana/provisioning/datasources
```

数据源配置：

```yaml
# datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

常用 PromQL 查询：

```promql
# CPU 使用率
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 请求速率（QPS）
sum(rate(http_requests_total[5m]))

# 错误率
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# 95 分位响应时间
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

### Jaeger 分布式追踪

```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # HTTP collector
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

Node.js 集成：

```javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')

// 配置 Jaeger 导出器
const exporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
})

// 创建 Tracer Provider
const provider = new NodeTracerProvider()
provider.addSpanProcessor(new SimpleSpanProcessor(exporter))
provider.register()

// 在应用中使用
const tracer = provider.getTracer('my-app')

app.get('/api/users/:id', async (req, res) => {
  const span = tracer.startSpan('get-user')
  
  try {
    const user = await getUser(req.params.id)
    span.setAttribute('user.id', req.params.id)
    res.json(user)
  } catch (error) {
    span.recordException(error)
    res.status(500).json({ error: error.message })
  } finally {
    span.end()
  }
})
```

## APM 实践

应用性能监控（APM）提供深度的应用性能分析。

### 关键指标

**RED 方法**（适用于请求驱动型服务）：

- **Rate**：请求速率
- **Errors**：错误率
- **Duration**：响应时间

**USE 方法**（适用于资源）：

- **Utilization**：资源使用率
- **Saturation**：饱和度
- **Errors**：错误数

### 性能基线

建立性能基线，识别异常：

```yaml
# SLO（服务等级目标）示例
slos:
  availability:
    target: 99.9%
    measurement_period: 30d
  
  latency:
    target: 95% requests < 200ms
    measurement_period: 7d
  
  error_rate:
    target: < 0.1%
    measurement_period: 7d
```

### 性能分析工具

```javascript
// Node.js 性能监控
const { performance, PerformanceObserver } = require('perf_hooks')

// 监控性能条目
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries()
  entries.forEach((entry) => {
    console.log({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    })
  })
})
obs.observe({ entryTypes: ['measure', 'mark'] })

// 标记性能节点
performance.mark('start-processing')
// ... 处理逻辑
performance.mark('end-processing')
performance.measure('processing', 'start-processing', 'end-processing')
```

## 监控仪表盘设计

### 系统监控仪表盘

```text
┌─────────────────────────────────────────────────────────────┐
│                    System Overview Dashboard                │
├──────────────────────┬──────────────────────────────────────┤
│   CPU Usage          │   Memory Usage                       │
│   [████████░░] 80%   │   [██████░░░░] 60%                   │
├──────────────────────┼──────────────────────────────────────┤
│   Disk I/O           │   Network Traffic                    │
│   Read: 100 MB/s     │   In: 50 Mbps  Out: 30 Mbps          │
├──────────────────────┴──────────────────────────────────────┤
│                    CPU Usage Over Time                       │
│   ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                          │
├─────────────────────────────────────────────────────────────┤
│                    Memory Usage Over Time                    │
│   ▅▆▇█▇▆▅▄▃▂▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄                           │
└─────────────────────────────────────────────────────────────┘
```

### 应用监控仪表盘

```text
┌─────────────────────────────────────────────────────────────┐
│                    Application Dashboard                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Requests   │   Errors     │   Latency    │   Active Users │
│   1,234/min  │   0.5%       │   120ms      │   456          │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                    Request Rate Over Time                    │
│   ▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█                      │
├─────────────────────────────────────────────────────────────┤
│                    Response Time Distribution                │
│   p50: 80ms   p90: 150ms   p95: 200ms   p99: 500ms          │
├─────────────────────────────────────────────────────────────┤
│                    Top Endpoints by Latency                  │
│   1. /api/search      - 450ms                               │
│   2. /api/reports     - 320ms                               │
│   3. /api/users       - 180ms                               │
└─────────────────────────────────────────────────────────────┘
```

## 最佳实践总结

### 1. 监控分层

- 基础设施层：CPU、内存、磁盘、网络
- 应用层：请求量、错误率、响应时间
- 业务层：订单量、用户活跃度、转化率

### 2. 日志规范

- 使用结构化日志（JSON）
- 包含请求 ID 和追踪信息
- 合理使用日志级别
- 避免敏感信息

### 3. 告警设计

- 每个告警都可操作
- 设置合理的阈值和持续时间
- 分级处理不同严重程度
- 避免告警疲劳

### 4. 持续优化

- 定期审查告警有效性
- 优化仪表盘布局
- 调整监控指标
- 更新 Runbook

## 延伸阅读

- [CI/CD 流水线](./03-ci-cd.md) - 自动化部署流程
- [云服务部署](./05-cloud.md) - 云平台监控集成
- [Docker 容器化](./02-docker.md) - 容器监控实践
