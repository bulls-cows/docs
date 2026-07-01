
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

## 实战案例

### 按钮点击回调的节流处理

#### 一、应用场景

有这么一些可能发生连续点击的场景：

1. 极快的连击：用户可能以为只点击了一次但是实际上发生了快速的连击。
2. 较快的连击：用户实际上是比较慢的触发了连续的点击，但是因为比如接口返回的速度比较快导致虽然请求有带loading动画但是请求很快就结束了loading也就随之结束了然后用户又点了下按钮，或者请求本身就没带loading，用户在请求还没结束前就可能又点了下按钮。
3. 很慢的连击：用户点击后去上了个厕所，界面还停留在刚才的地方，上完厕所回来后忘记了刚才是否有点击过按钮了，于是又点击了一下。

第三种情况从<span style="color: #000000;">按钮层面</span>去处理会涉及到一个变量状态的维护，而且这种场景很大情况下已经不能算前端程序问题了。如果要处理这种情况，建议是从接口层面去做接口地址和参数组合的重复性判断，如果相同接口和最近一次的请求触发的参数一样，并且上一次请求是成功的，可以弹框提示用户进行二次确认后再提交。这个弹框的确定和取消按钮对应一个promise的resolve和reject，就可以直接封装到ajax请求方法里了。

所以，本文不考虑很慢的连击的场景。

#### 二、节流函数

直接抛代码。这段代码的入参和setTimeout的入参是反过来的，先传时间再传回调函数（也可以不传时间直接传回调函数，这样会用一个默认的时间）。然后如果传入的函数的返回值是Promise的实例，则await等待一下它，同时也await一个promise化的timeout，当其中一个被reject或者两个都被resolve时才允许下一轮的执行（也就是说如果回调函数是一个接口请求的promise，我们传的时间入参是2000毫秒，那么如果接口返回速度很快，用户也要在2秒后才能触发下一轮的执行，不容易触发连击）。
```js
/**
 * 对函数进行节流处理（可以只传回调函数）
 * @param lazyMilliseconds [number] 延迟时间（单位：毫秒），可以不传
 * @param fn [function] 回调函数
 * @returns {(function(): Promise<void>)}
 */
const DEFAULT_LAZY_MILLISECONDS = 2000;
export const throttle = (lazyMilliseconds, fn) => {
    // 参数预处理
    if (typeof lazyMilliseconds === 'function') {
        fn = lazyMilliseconds;
        lazyMilliseconds = DEFAULT_LAZY_MILLISECONDS;
    }
    lazyMilliseconds = lazyMilliseconds || DEFAULT_LAZY_MILLISECONDS;

    // 参数校验
    if (typeof fn !== 'function') {
        throw new Error(`slow函数的入参fn应为函数，但是实际收到的是${typeof fn}类型的入参`);
    }
    if (typeof lazyMilliseconds !== 'number') {
        throw new Error(`slow函数的入参lazyMilliseconds应为数字，但是实际收到的是${typeof lazyMilliseconds}类型的入参`);
    }

    let timer = null;
    const context = this;
    // 返回包装后的函数
    return async function() {
        if (timer) return;
        const returnVal = fn.apply(context, Array.from(arguments));

        // 如果返回值是Promise实例，在其还处于pending状态时不应该允许二次触发fn函数
        if (returnVal instanceof Promise) {
            timer = 1024; // 随便给个数字
            try {
                /**
                 * 当promise结束且指定的等待时间已过，才允许下一次执行fn
                 * 1、当lazyMilliseconds时间已到，但是promise的pending状态还未结束时，也禁止下一次执行fn
                 */
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, lazyMilliseconds));
                // 当returnVal被reject时，或者returnVal和timeoutPromise都被resolve时，Promise.all的状态才会变成reject或者resolve
                await Promise.all([returnVal, timeoutPromise]);
            } finally {
                timer = null;
            }
            return;
        }

        // 如果返回值不是promise就正常按设定的延迟时间来
        timer = setTimeout(() => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }, lazyMilliseconds);
    };
};
```
这其实就是一个高阶函数（返回函数的函数）。跟节流按钮组件相比，这种方式的适用性更广。比如纯文本内容的确认框，其实我们是不用常规的显示组件的方式去写的，那些写起来太繁琐——毕竟使用的地方太多了。而且对比按钮组件，在重构老项目时，使用节流函数也会更方便一些。举个例子，我们可能会这样封装确认框：
```js
Vue.prototype.$doConfirm = params => {
    let message;
    let title;
    let options;
    if (typeof params === 'string') {
        message = params;
    } else {
        message = params.message;
        title = params.title;
        options = params.options;
    }
    return new Promise(resolve => {
        Vue.prototype
            .$confirm(message, title === undefined ? '提示' : title, options || {})
            .then(() => resolve(true))
            .catch(() => resolve(false));
    });
};
```
这样在调用侧（Vue组件里）只需要这么写：
```js
{
    methods: {
        async confirmToDoSomething() {
            if (!(await this.$doConfirm('确定要这么做吗，老铁？'))) return;
            // 点击确定按钮之后的逻辑
            await IEatThis();
            await YouEatThat();
            await SpNothingForHim();
        },
    },
}
```
这种要改成使用按钮组件是比较麻烦的，但是要改成使用节流函数就很容易，像下面这样：
```js
{
    methods: {
        async confirmToDoSomething() {
            if (!(await this.$doConfirm('确定要这么做吗，老铁？'))) return;
            // 点击确定按钮之后的逻辑
            this.yesIConfirmIWillDoThat();
        },
        yesIConfirmIWillDoThat: throttle(async function () {
            await IEatThis();
            await YouEatThat();
            await SpNothingForHim();
        }),
    },
}
```
#### 三、节流按钮组件

这个组件封装得逻辑有点多，所以看起来会有点复杂。可以先跳过代码看后面的思路说明。
```vue
<template>
    <el-button :type="type" :size="size" :class="{ 'is-disabled': disabledAfterTokenUsed }" @click="onClick">
        <slot></slot>
        <span v-show="timerCountingDown && isDelayTimeIntegralSecondsNoLessThan1Second">（{{ countingDown }}s）</span>
    </el-button>
</template>

<script>
import { getTypeBoolean, getTypeNumber, getTypeString } from 'blablabla1 /这个不是真实包名/';
import { apiGetToken } from 'blablabla2 /这个不是真实包名/';

export default {
    name: 'ThrottleButton',
    props: {
        // 禁用时间，传0或不传表示不延迟
        delay: getTypeNumber(),
        defaultToken: getTypeString(),
        type: getTypeString({ default: 'default' }),
        size: getTypeString({ default: 'small' }),
        getTokenOnMount: getTypeBoolean(),
    },
    data() {
        return {
            // 防连续点击触发逻辑的计时器
            timer: null,
            // 防网络抖动用的token
            token: this.defaultToken || '',
            // 消耗掉token时，一定时间内按钮呈禁用状态
            timerDisabledAfterTokenUsed: null,
            disabledAfterTokenUsed: false,
            timerCountingDown: null,
            countingDown: 0,
        };
    },
    computed: {
        // 延迟时间是否为大于等于2秒的整数秒
        isDelayTimeIntegralSecondsNoLessThan1Second() {
            return this.delay > 1000 && this.delay / 1000 === Math.round(this.delay / 1000);
        },
    },
    watch: {
        token: {
            immediate: true,
            handler(newVal, oldVal) {
                if (!newVal && oldVal) {
                    if (this.timerDisabledAfterTokenUsed) return;
                    this.disabledAfterTokenUsed = true;
                    this.timerDisabledAfterTokenUsed = setTimeout(() => {
                        this.clearTimerDisabledAfterTokenUsed();
                        this.disabledAfterTokenUsed = false;
                    }, this.delay || 0);
                    // 如果延迟时间大于等于2秒，且为整数秒，则展示一个倒计时按钮
                    if (this.isDelayTimeIntegralSecondsNoLessThan1Second) {
                        this.startCountingDown();
                    }
                }
            },
        },
    },
    beforeDestroy() {
        this.clearTimer();
        this.clearTimerDisabledAfterTokenUsed();
        this.clearTimerCountingDown();
    },
    mounted() {
        if (this.getTokenOnMount) {
            this.refreshToken();
        }
    },
    methods: {
        startCountingDown() {
            if (this.timerCountingDown) return;
            this.countingDown = this.delay / 1000;
            this.timerCountingDown = setInterval(() => {
                this.countingDown--;
                if (this.countingDown <= 0) {
                    this.clearTimerCountingDown();
                }
            }, 1000);
        },
        clearTimer() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        },
        clearTimerDisabledAfterTokenUsed() {
            if (this.timerDisabledAfterTokenUsed) {
                clearTimeout(this.timerDisabledAfterTokenUsed);
                this.timerDisabledAfterTokenUsed = null;
            }
        },
        clearTimerCountingDown() {
            if (this.timerCountingDown) {
                clearTimeout(this.timerCountingDown);
                this.timerCountingDown = null;
            }
        },
        onClick() {
            if (!this.delay) {
                this.triggerClick();
                return;
            }
            if (this.disabledAfterTokenUsed) return;
            if (this.timer) return;
            this.timer = setTimeout(this.clearTimer, this.delay);
            // 如果延迟时间大于等于2秒，且为整数秒，则展示一个倒计时按钮
            if (this.isDelayTimeIntegralSecondsNoLessThan1Second) { this.startCountingDown(); }
            this.triggerClick();
        },
        triggerClick() {
            this.$emit('click');
        },
        refreshToken() {
            const token = await apiGetToken({});
            this.token = token;
            return token;
        },
        getToken() {
            const returnToken = this.token;
            // token只允许访问一次
            this.token = '';
            // 如果被读取时token不存在，说明使用上出问题了
            if (!returnToken) this.$message.error('网络异常，请退出或刷新页面后重试');
            return returnToken;
        },
    },
};
</script>
```
这个组件支持传入delay属性表示按钮组件需要节流的时间间隔，比如传入300，则在300毫秒的时间段内只有第一次点击会生效。

点击按钮后如果触发请求，会使用token（我们的场景是后续触发的接口请求中需要带上这个token，这种变量我不建议直接在页面业务代码里维护，所以封装到组件里了，这个方案我是不赞成的，但是生活中到处都有需要妥协的地方——你可以把这里的token换成一个布尔值的flag开关用来保证按钮默认情况下只能被使用一次，稍加修改下逻辑都能走通）。这个token在触发请求时会被消耗掉，这样可以保证按钮只能被使用一次，如果需要按钮可以多次操作，则在触发请求之后从调用侧手动刷新token即可。

在delay指定时间内按钮会呈现禁用状态，并且如果delay指定的时间是一个大于等于2秒的整数秒，按钮上会呈现出一个倒计时的状态。

上文中getTypeNumber、getTypeString等函数返回的其实就是Vue里对prop属性的类型声明配置，由于项目里很多地方都会用到，直接像下面这样写的话，是会对代码阅读代码一定的心智负担的（打开一个文件一看代码行数这么长就容易有抵触心理，这里减少一些行数，那里减少一些行数，最后对代码阅读体验的提升还是很客观的）：
```generic
props: {
    value: {
        type: String,
        default: '',
    },
    // ...
},
```
这个封装的具体实现如下（这个不是本文重点，不关心的话可以直接忽略）：
```js
/**
 * 处理传给本文件中其他方法的入参
 * 允许传类似这样的数据结构进来：'required'、{ required: true }、['required']、['required', { default: 0 }]
 * @param params {string|object|string[]|(string|object)[]}
 * @returns {object}
 */
const transformParams = (params = {}) => {
    if (!params) return {};
    if (typeof params === 'string') {
        if (params === 'required') return { required: true };
        throw new Error(`params参数${params}错误，请仔细检查`);
    }
    if (Array.isArray(params)) {
        return params.reduce((pre, cur) => {
            return { ...pre, ...transformParams(cur) };
        }, {});
    }
    if (typeof params === 'object') return params;
    throw new Error(`params参数${params}错误，请仔细检查`);
};

const generateGetTypeFunc = (defaultOpt = {}) => (additionalOpt = {}) => ({
    ...defaultOpt,
    ...transformParams(additionalOpt),
});

export const getTypeBoolean = generateGetTypeFunc({ type: Boolean, default: false });

export const getTypeString = generateGetTypeFunc({ type: String, default: '' });

export const getTypeArray = generateGetTypeFunc({ type: Array, default: () => [] });

export const getTypeNumber = generateGetTypeFunc({ type: Number, default: 0 });

export const getTypeObject = generateGetTypeFunc({ type: Object, default: () => {} });

export const getTypeArrayOrNull = generateGetTypeFunc({
    validator(value) {
        return Array.isArray(value) || value === null;
    },
    default: () => null,
});

export const getTypeStringOrArray = generateGetTypeFunc({
    validator(value) {
        return Array.isArray(value) || typeof value === 'string';
    },
    default: () => '',
});
```

### 混合 APP 中 H5 页面的缓存处理

先说明，此处所讲的混合APP，就是hybrid APP，意思是APP中并非全部都是原生页面，而是原生与H5并存。甚至于有些混合APP中基本都是H5页面，APP仅作为一个壳，用行话来讲的话叫套壳APP，其作用是抢占用户手机上的一个应用入口，提高用户黏度，拉近用户与H5的距离——毕竟每次都要先打开浏览器再输入地址回车或者从浏览器收藏夹里点开页面的过程就跟这句话念起来的感觉一样——烦琐。这篇文章里我将谈一下如何处理混合APP中H5页面的缓存。此处可以有点掌声（自嘲状）。

在提出解决方案之前，我们先要明确一个前提，给APP加功能的时候应当尽可能的灵活些，不要轻易写死某些功能，因为APP一旦发版本上线，就算后续版本中修复了历史版本中的某些bug，但用户手机上装的APP不一定都是最新版本，这会导致某些bug长期存在。有一些bug，可以通过H5这边写脏代码做hack处理，但有些bug是没办法处理的——所以APP加新功能后一定要仔细测试，因为它没法像H5那么灵活。

ok，现在言归正传谈一下解决方案。

#### 一、方案描述

配置H5链接的时候在链接的search部分添加一个可选的refresh=1参数。当APP打开某个H5链接时判断url上是否有配置refresh=1：

1、如果url上没有配置refresh参数或者配置的值不是1，则APP直接走默认处理，这个默认处理一般是根据服务端（含CDN）的响应头里的过期时间来处理。

2、如果url上有配置refresh=1，则APP自动在链接的search部分添加一个**动态的参数值**，如ts=1586147745670，这里的参数值可以是时间戳。

#### 二、方案解读

有人可能会问，既然可以直接根据响应头的过期时间来自动处理，为啥还要另外多此一举？如我服务端响应头里告诉浏览器说过期时间是1天，那么这1天里浏览器可能就不重复向服务器请求对应资源了，但是这个时候如果发现了产线bug就是需要更新资源呢？另外对于使用了CDN的情况，公司服务器下发响应头的更新到CDN更新在时间点上通常也不是完全同步的，而且一般公司用的都是外部CDN，那么沟通成本也是难免的。

有人可会问，这个方案貌似只是针对html文件的。对的，没错。因为只要html文件的缓存问题可控，html里面所引用的资源的缓存问题就完全可以由H5这边随意控制的，只要对需要更新的资源的引用地址进行修改即可（修改文件名或者添加版本号之类的），目前H5流行的webpack构建根据可以**根据文件内容**来生成contentHash，这样只要内容有变化才会改变该值，不需要人为手动控制。

可以说，本文中提到的这个方案不但效果拔群，而且成本小，对现有页面也不会产生影响。这里需要注意的点是，APP添加动态参数值时，必须要添加到url的search中，不能添加到hash中。因为仅hash值改变对于浏览器来说还是同一个"地址"（其实location.href是变了的，这里的"地址"可以理解为缓存库中用来取缓存的key，仅改变hash不会影响key，所以仍会命中的同一个缓存内容），但是search部分改变后对于浏览器而言就是一个全新的地址key了，不存在已缓存的内容，所以会从服务端重新获取资源更新。

采用该方案时需要注意，能缓存的东西还是要尽量去缓存的，所以：

1、对于不常更新的资源，一般不用配置refresh=1。

2、对于不重要的资源更新，一般不用配置refresh=1，就慢慢等资源过期时间到了自动更新就行了。

3、如果是对不常更新的资源进行了重要的内容更新，可以临时开启refresh=1，等响应头里配置的资源过期时间到了以后再去掉refresh=1配置。

4、对于经常更新的前端资源，在配置refresh=1的同时，记得把html里的内嵌资源抽出来用单独的script或者link标签去引用资源，不然每次刷新都会有大量没更新的内容占用宽带影响资源的下载速度。一般对于单页应用而言HTML本身通常没多少东西，所以这一点主要是针对一些未对样式、脚本和html进行分离的历史项目而言的。

#### 三、题外话：普及下url的search和hash

因为我发现不管是服务端、客户端还是H5端，很多同学根本不分url中的search和hash。公司的项目以及做的一些私活里都碰到过这样的问题，取url上的参数时不是先去区分search和hash，而是根据?和#的相对位置来处理，可读性非常不好。

举个例子，对于链接：https://www.baidu.com/?searchKey=searchVal#hashRouter?hashKey=hashVal，其各个组成部分的内容可以参考下面的图片示意。

如果还不清楚的话，可以自己在浏览器地址栏随便输入一个地址，回车后在浏览器控制台中输入location并回车来查看下location对应的内容来帮助理解。

## 延伸阅读

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Chrome DevTools 文档](https://developer.chrome.com/docs/devtools/)
- [Vite 官方文档](https://vitejs.dev/)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Vue 性能优化](https://vuejs.org/guide/best-practices/performance.html)
- [前端技术栈](./index.md)
- [Vue.js 实战](./01-vue/index.md)
- [前端工程化](./07-engineering/index.md)
