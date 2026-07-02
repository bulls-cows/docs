
# 性能优化

前端性能直接影响用户体验和业务指标。本文将深入探讨性能指标与测量、加载性能优化、运行时性能优化、资源优化策略以及监控与分析工具。

## 性能指标与测量

### Core Web Vitals

Google 定义的核心 Web 指标：

| 指标 | 含义 | 良好 | 需改进 | 差 |
|------|------|------|--------|-----|
| LCP (Largest Contentful Paint) | 最大内容绘制时间 | ≤2.5s | 2.5s-4s | >4s |
| FID (First Input Delay) | 首次输入延迟 | ≤100ms | 100-300ms | >300ms |
| CLS (Cumulative Layout Shift) | 累积布局偏移 | ≤0.1 | 0.1-0.25 | >0.25 |

### 其他重要指标

```typescript
// 使用 Performance API 测量
interface PerformanceMetrics {
  // 首次内容绘制
  FCP: number
  // 最大内容绘制
  LCP: number
  // 首次输入延迟
  FID: number
  // 累积布局偏移
  CLS: number
  // 交互时间
  TTI: number
  // 总阻塞时间
  TBT: number
  // 首字节时间
  TTFB: number
}

// 收集性能指标
function collectMetrics(): PerformanceMetrics {
  const paintEntries = performance.getEntriesByType('paint')
  const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
  
  return {
    FCP: fcp?.startTime ?? 0,
    LCP: 0, // 需要 PerformanceObserver
    FID: 0, // 需要 PerformanceObserver
    CLS: 0, // 需要 PerformanceObserver
    TTI: 0, // 需要计算
    TBT: 0, // 需要计算
    TTFB: performance.timing.responseStart - performance.timing.requestStart
  }
}

// 使用 PerformanceObserver 监听
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP:', entry.startTime)
    }
    if (entry.entryType === 'first-input') {
      console.log('FID:', entry.processingStart - entry.startTime)
    }
    if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
      console.log('CLS:', entry.value)
    }
  }
})

observer.observe({
  entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
})
```

### Web Vitals 库

```typescript
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname
  })
  
  // 使用 sendBeacon 确保数据发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body)
  } else {
    fetch('/analytics', { body, method: 'POST', keepalive: true })
  }
}

// 收集指标
getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getLCP(sendToAnalytics)
getFCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

## 加载性能优化

### 代码分割

```typescript
// 动态导入
const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))

// 条件加载
async function loadModule() {
  if (condition) {
    const { module } = await import('./module')
    return module
  }
}

// 预加载
const prefetchModule = () => import('./module')

// 使用
<Link to="/dashboard" onMouseEnter={prefetchModule}>
  Dashboard
</Link>
```

### 路由级分割

```typescript
// React Router
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  )
}

// Vue Router
const routes = [
  {
    path: '/',
    component: () => import('./pages/Home.vue')
  },
  {
    path: '/about',
    component: () => import('./pages/About.vue')
  }
]
```

### 资源预加载

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/css/critical.css" as="style">
<link rel="preload" href="/js/app.js" as="script">

<!-- 预连接 -->
<link rel="preconnect" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- 预获取 -->
<link rel="prefetch" href="/js/dashboard.js" as="script">

<!-- 预渲染 -->
<link rel="prerender" href="/about">
```

### 图片优化

```tsx
// 响应式图片
<picture>
  <source 
    srcset="/images/hero-small.webp 480w, /images/hero-medium.webp 768w"
    sizes="(max-width: 768px) 100vw, 768px"
    type="image/webp"
  />
  <img 
    src="/images/hero.jpg" 
    alt="Hero image"
    loading="lazy"
    decoding="async"
    width="800"
    height="600"
  />
</picture>

// 懒加载
<img 
  src="/images/photo.jpg" 
  alt="Photo"
  loading="lazy"
  decoding="async"
/>

// 占位图
function ImageWithPlaceholder({ src, alt }: Props) {
  const [loaded, setLoaded] = useState(false)
  
  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'opacity-100' : 'opacity-0'}
      />
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
```

### 字体优化

```css
/* 字体显示策略 */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* 立即显示后备字体，字体加载后替换 */
}

/* 可选字体 */
@font-face {
  font-family: 'Optional';
  src: url('/fonts/optional.woff2') format('woff2');
  font-display: optional; /* 仅在快速加载时使用 */
}
```

```tsx
// 字体加载检测
const fontLoader = async () => {
  try {
    await document.fonts.load('16px Inter')
    document.documentElement.classList.add('font-loaded')
  } catch (error) {
    console.error('Font loading failed:', error)
  }
}

// 关键字体内联
// <style>
//   @font-face {
//     font-family: 'Inter';
//     src: url('data:font/woff2;base64,...') format('woff2');
//   }
// </style>
```

## 运行时性能优化

### 虚拟列表

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  })
  
  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 防抖与节流

```typescript
// 防抖
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// 节流
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 使用
const handleSearch = debounce((query: string) => {
  searchAPI(query)
}, 300)

const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)
```

### React 性能优化

```tsx
import { memo, useMemo, useCallback, useRef, useEffect } from 'react'

// memo 避免不必要的重渲染
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* 复杂渲染 */}</div>
})

// useMemo 缓存计算结果
function FilteredList({ items, filter }: Props) {
  const filteredItems = useMemo(() => {
    console.log('Filtering...')
    return items.filter(item => item.name.includes(filter))
  }, [items, filter])
  
  return <List items={filteredItems} />
}

// useCallback 缓存函数
function Parent() {
  const [count, setCount] = useState(0)
  
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child onClick={handleClick} />
    </div>
  )
}

// 使用 key 优化列表
function List({ items }: Props) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}

// 状态下放
function Parent() {
  return (
    <div>
      <StaticContent />
      <DynamicComponent />
    </div>
  )
}

function DynamicComponent() {
  const [count, setCount] = useState(0) // 状态下放到需要的组件
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Vue 性能优化

```vue
<script setup lang="ts">
import { ref, computed, shallowRef, shallowReactive } from 'vue'

// 使用 shallowRef 减少响应式开销
const largeList = shallowRef<Item[]>([])

// 使用 computed 缓存
const filteredList = computed(() => 
  largeList.value.filter(item => item.active)
)

// 使用 v-once 渲染静态内容
// 使用 v-memo 缓存子树
</script>

<template>
  <!-- 静态内容使用 v-once -->
  <div v-once>
    <h1>Static Title</h1>
  </div>
  
  <!-- 条件缓存使用 v-memo -->
  <div v-for="item in list" :key="item.id" v-memo="[item.selected]">
    {{ item.name }}
  </div>
  
  <!-- 使用 v-show 替代频繁切换的 v-if -->
  <div v-show="isVisible">Content</div>
</template>
```

## 资源优化策略

### 构建优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['element-plus'],
          'utils': ['lodash', 'dayjs']
        }
      }
    },
    
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // CSS 代码分割
    cssCodeSplit: true,
    
    // 资源文件名
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name ?? '')) {
            return 'images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
```

### Gzip 压缩

```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240 // 大于 10KB 才压缩
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
})
```

### CDN 加速

```typescript
// vite.config.ts
import { cdn } from 'vite-plugin-cdn-import'

export default defineConfig({
  plugins: [
    cdn({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          path: 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js'
        },
        {
          name: 'vue-router',
          var: 'VueRouter',
          path: 'https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js'
        }
      ]
    })
  ]
})
```

### Service Worker 缓存

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 小时
              }
            }
          }
        ]
      }
    })
  ]
})
```

## 监控与分析工具

### Chrome DevTools

```text
1. Performance 面板
   - 录制性能快照
   - 分析长任务
   - 查看帧率

2. Lighthouse
   - 综合性能评分
   - 优化建议

3. Coverage 面板
   - 查看未使用的代码
   - 优化代码分割

4. Network 面板
   - 资源加载时间
   - 请求瀑布图
```

### Bundle 分析

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
})
```

### 性能监控

```typescript
// 性能监控 SDK
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  // 记录指标
  record(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }
  
  // 获取统计信息
  getStats(name: string) {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return null
    
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const sorted = [...values].sort((a, b) => a - b)
    const p50 = sorted[Math.floor(values.length * 0.5)]
    const p95 = sorted[Math.floor(values.length * 0.95)]
    const p99 = sorted[Math.floor(values.length * 0.99)]
    
    return { count: values.length, avg, p50, p95, p99 }
  }
  
  // 上报数据
  report() {
    const data: Record<string, any> = {}
    this.metrics.forEach((_, name) => {
      data[name] = this.getStats(name)
    })
    
    navigator.sendBeacon('/api/performance', JSON.stringify(data))
  }
}

const monitor = new PerformanceMonitor()

// 监控 API 请求
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const start = performance.now()
  try {
    return await originalFetch(...args)
  } finally {
    const duration = performance.now() - start
    monitor.record('api_duration', duration)
  }
}
```

### 错误监控

```typescript
// 全局错误捕获
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  
  // 上报错误
  reportError({
    type: 'error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  })
})

// Promise 未捕获错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
  
  reportError({
    type: 'unhandledrejection',
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack
  })
})

// Vue 错误捕获
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err)
  reportError({
    type: 'vue_error',
    message: (err as Error).message,
    stack: (err as Error).stack,
    component: vm?.$options.name,
    info
  })
}

// React 错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError({
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }
}
```

## 最佳实践总结

### 1. 加载性能

- 使用代码分割减少首屏加载
- 预加载关键资源
- 图片懒加载和优化
- 字体优化

### 2. 运行时性能

- 虚拟列表处理大数据
- 防抖节流控制频率
- 避免不必要的重渲染
- Web Worker 处理复杂计算

### 3. 资源优化

- 代码压缩和 Tree Shaking
- Gzip/Brotli 压缩
- CDN 加速
- Service Worker 缓存

### 4. 监控告警

- 建立性能指标体系
- 实时监控和告警
- 定期分析优化

## 延伸阅读

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Chrome DevTools 文档](https://developer.chrome.com/docs/devtools/)
- [Vite 官方文档](https://vitejs.dev/)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Vue 性能优化](https://vuejs.org/guide/best-practices/performance.html)
- [前端技术栈](./index.md)
- [Vue.js 实战](./01-vue/index.md)
- [前端工程化](./07-engineering.md)
- [前端实战技巧](./08-practices/index.md)
