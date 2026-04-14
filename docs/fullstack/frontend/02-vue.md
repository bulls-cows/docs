---
order: 20
---

# Vue.js 实战

Vue.js 是一款渐进式 JavaScript 框架，以其易学易用、性能优异著称。本文将深入探讨 Vue 3 的核心概念、组件设计模式、路由管理、状态管理以及实战技巧。

## Vue 3 核心概念

### Composition API

Composition API 是 Vue 3 最重要的特性之一，提供了更灵活的逻辑组织方式。

#### setup 语法糖

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// 响应式状态
const count = ref(0)
const user = ref<{ name: string; age: number } | null>(null)

// 计算属性
const doubled = computed(() => count.value * 2)
const fullName = computed(() => {
  if (!user.value) return ''
  return `${user.value.name} (${user.value.age})`
})

// 方法
const increment = () => {
  count.value++
}

// 侦听器
watch(count, (newVal, oldVal) => {
  console.log(`count changed from ${oldVal} to ${newVal}`)
})

// 生命周期
onMounted(async () => {
  user.value = await fetchUser()
})

// 暴露给模板
defineExpose({
  count,
  increment
})
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

#### 响应式系统

Vue 3 使用 Proxy 重写了响应式系统，解决了 Vue 2 的局限性：

```typescript
import { ref, reactive, toRef, toRefs, shallowRef, shallowReactive } from 'vue'

// ref: 基本类型响应式
const count = ref(0)
count.value++

// reactive: 对象响应式
const state = reactive({
  name: 'Vue',
  version: 3,
  features: ['Composition API', 'Teleport', 'Fragments']
})
state.name = 'Vue 3'

// toRef: 将 reactive 属性转为 ref
const nameRef = toRef(state, 'name')

// toRefs: 解构 reactive 对象
const { name, version } = toRefs(state)

// shallowRef: 浅层响应式（只有 .value 变化才触发更新）
const shallowObj = shallowRef({ a: 1 })
shallowObj.value.a = 2 // 不触发更新
shallowObj.value = { a: 2 } // 触发更新

// shallowReactive: 浅层响应式对象
const shallowState = shallowReactive({
  nested: { count: 0 }
})
shallowState.nested.count++ // 不触发更新
```

#### 响应式原理

```typescript
// 简化的响应式实现
function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key) // 收集依赖
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key) // 触发更新
      return result
    }
  })
}

// 依赖收集
let activeEffect: Effect | null = null
const targetMap = new WeakMap()

function track(target: object, key: unknown) {
  if (!activeEffect) return
  
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  
  dep.add(activeEffect)
}

// 触发更新
function trigger(target: object, key: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => effect())
  }
}
```

### 生命周期

```vue
<script setup lang="ts">
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured
} from 'vue'

// 组件创建后
console.log('setup')

// 挂载前
onBeforeMount(() => {
  console.log('onBeforeMount')
})

// 挂载后
onMounted(() => {
  console.log('onMounted')
})

// 更新前
onBeforeUpdate(() => {
  console.log('onBeforeUpdate')
})

// 更新后
onUpdated(() => {
  console.log('onUpdated')
})

// 卸载前
onBeforeUnmount(() => {
  console.log('onBeforeUnmount')
})

// 卸载后
onUnmounted(() => {
  console.log('onUnmounted')
})

// 错误捕获
onErrorCaptured((err, instance, info) => {
  console.error('Error captured:', err, info)
  return false // 阻止错误继续传播
})
</script>
```

## 组件设计模式

### Props 与 Emits

```vue
<script setup lang="ts">
// 定义 Props
interface Props {
  title: string
  count?: number
  items: string[]
  config: {
    theme: 'light' | 'dark'
    size: 'small' | 'medium' | 'large'
  }
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// 定义 Emits
interface Emits {
  (e: 'update:count', value: number): void
  (e: 'submit', payload: { data: string }): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('update:count', props.count + 1)
  emit('submit', { data: 'test' })
}
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="handleClick">Update</button>
  </div>
</template>
```

### 插槽（Slots）

```vue
<!-- 父组件 -->
<template>
  <Card>
    <template #header>
      <h3>Card Title</h3>
    </template>
    
    <p>Card content goes here</p>
    
    <template #footer="{ close }">
      <button @click="close">Close</button>
    </template>
  </Card>
</template>

<!-- 子组件 Card.vue -->
<script setup lang="ts">
interface Props {
  title?: string
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">
        <h3>{{ title }}</h3>
      </slot>
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div class="card-footer">
      <slot name="footer" :close="() => emit('close')">
        <button @click="emit('close')">Close</button>
      </slot>
    </div>
  </div>
</template>
```

### 组合式函数（Composables）

```typescript
// composables/useFetch.ts
import { ref, watchEffect, type Ref } from 'vue'

interface FetchResult<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  execute: () => Promise<void>
}

export function useFetch<T>(
  url: string | Ref<string>,
  options?: RequestInit
): FetchResult<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(
        typeof url === 'string' ? url : url.value,
        options
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  // 自动响应 URL 变化
  if (typeof url !== 'string') {
    watchEffect(() => {
      execute()
    })
  }

  return { data, error, loading, execute }
}

// 使用示例
// <script setup lang="ts">
// import { useFetch } from '@/composables/useFetch'
// 
// const { data, loading, error } = useFetch<User[]>('/api/users')
// </script>
```

### 依赖注入

```typescript
// 提供依赖
// App.vue
<script setup lang="ts">
import { provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

// 定义类型安全的注入键
interface Theme {
  mode: 'light' | 'dark'
  toggle: () => void
}

const ThemeKey: InjectionKey<Theme> = Symbol('theme')

const mode = ref<'light' | 'dark'>('light')
const toggle = () => {
  mode.value = mode.value === 'light' ? 'dark' : 'light'
}

provide(ThemeKey, {
  mode: mode.value,
  toggle
})
</script>

// 注入依赖
// Child.vue
<script setup lang="ts">
import { inject } from 'vue'
import { ThemeKey } from './keys'

const theme = inject(ThemeKey)

if (!theme) {
  throw new Error('Theme not provided')
}

// 使用 theme.mode 和 theme.toggle
</script>
```

## Vue Router 路由管理

### 路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    children: [
      {
        path: ':id',
        name: 'UserDetail',
        component: () => import('@/views/UserDetail.vue'),
        props: true // 将路由参数作为 props 传递
      }
    ],
    beforeEnter: (to, from) => {
      // 路由独享守卫
      if (!isAuthenticated()) {
        return { name: 'Login', query: { redirect: to.fullPath } }
      }
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash }
    }
    return { top: 0 }
  }
})

export default router
```

### 导航守卫

```typescript
// 全局前置守卫
router.beforeEach((to, from) => {
  // 设置页面标题
  document.title = to.meta.title || 'My App'
  
  // 权限检查
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath }
    }
  }
  
  // 角色检查
  if (to.meta.roles) {
    const userRole = getUserRole()
    if (!to.meta.roles.includes(userRole)) {
      return { name: 'Forbidden' }
    }
  }
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 发送页面访问统计
  trackPageView(to.fullPath)
})

// 全局解析守卫（在组件内守卫和异步路由组件被解析之后调用）
router.beforeResolve(async (to) => {
  if (to.meta.requiresData) {
    await fetchData()
  }
})
```

### 组合式 API

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 访问路由参数
const userId = ref(route.params.id)

// 监听路由变化
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      // 加载用户数据
      await loadUser(newId as string)
    }
  }
)

// 编程式导航
const goToUser = (id: string) => {
  router.push({ name: 'UserDetail', params: { id } })
}

const goBack = () => {
  router.back()
}
</script>
```

## Pinia 状态管理

### Store 定义

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 组合式 API 风格
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.name ?? 'Guest')

  // Actions
  async function login(credentials: LoginCredentials) {
    loading.value = true
    try {
      const response = await authApi.login(credentials)
      token.value = response.token
      user.value = response.user
      localStorage.setItem('token', response.token)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function fetchUser() {
    if (!token.value) return
    
    loading.value = true
    try {
      user.value = await authApi.getCurrentUser()
    } catch (error) {
      logout()
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    userName,
    login,
    logout,
    fetchUser
  }
})

// 选项式 API 风格
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  
  getters: {
    doubled: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++
    },
    async incrementAsync() {
      await delay(1000)
      this.count++
    }
  }
})
```

### 使用 Store

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore, useCounterStore } from '@/stores'

const userStore = useUserStore()
const counterStore = useCounterStore()

// 解构响应式状态（需要使用 storeToRefs）
const { user, loading, isLoggedIn } = storeToRefs(userStore)

// Actions 可以直接解构
const { login, logout } = userStore

// 直接访问
console.log(userStore.userName)
counterStore.increment()
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="isLoggedIn">
      Welcome, {{ user?.name }}
      <button @click="logout">Logout</button>
    </div>
    <div v-else>
      <button @click="login({ email, password })">Login</button>
    </div>
  </div>
</template>
```

### 插件扩展

```typescript
// stores/plugins/persist.ts
import type { PiniaPluginContext } from 'pinia'

export function persistPlugin({ store }: PiniaPluginContext) {
  // 从 localStorage 恢复状态
  const stored = localStorage.getItem(`store-${store.$id}`)
  if (stored) {
    store.$patch(JSON.parse(stored))
  }

  // 监听变化并持久化
  store.$subscribe((mutation, state) => {
    localStorage.setItem(`store-${store.$id}`, JSON.stringify(state))
  })
}

// main.ts
import { createPinia } from 'pinia'
import { persistPlugin } from './stores/plugins/persist'

const pinia = createPinia()
pinia.use(persistPlugin)
```

## 实战案例

### 数据表格组件

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Column<T> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => string
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  selectable?: boolean
}

const props = withDefaults(defineProps<Props<any>>(), {
  pageSize: 10,
  selectable: false
})

const emit = defineEmits<{
  (e: 'select', rows: any[]): void
  (e: 'sort', key: string, order: 'asc' | 'desc'): void
}>()

// 分页
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(props.data.length / props.pageSize))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return props.data.slice(start, start + props.pageSize)
})

// 排序
const sortKey = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedData = computed(() => {
  if (!sortKey.value) return paginatedData.value
  
  return [...paginatedData.value].sort((a, b) => {
    const aVal = a[sortKey.value]
    const bVal = b[sortKey.value]
    
    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  emit('sort', key, sortOrder.value)
}

// 选择
const selectedRows = ref<Set<any>>(new Set())

const toggleSelect = (row: any) => {
  if (selectedRows.value.has(row)) {
    selectedRows.value.delete(row)
  } else {
    selectedRows.value.add(row)
  }
  emit('select', Array.from(selectedRows.value))
}

const toggleSelectAll = () => {
  if (selectedRows.value.size === paginatedData.value.length) {
    selectedRows.value.clear()
  } else {
    paginatedData.value.forEach(row => selectedRows.value.add(row))
  }
  emit('select', Array.from(selectedRows.value))
}
</script>

<template>
  <div class="data-table">
    <table>
      <thead>
        <tr>
          <th v-if="selectable">
            <input
              type="checkbox"
              :checked="selectedRows.size === paginatedData.length"
              @change="toggleSelectAll"
            />
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ sortable: col.sortable }"
            @click="col.sortable && handleSort(col.key)"
          >
            {{ col.title }}
            <span v-if="sortKey === col.key">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in sortedData" :key="index">
          <td v-if="selectable">
            <input
              type="checkbox"
              :checked="selectedRows.has(row)"
              @change="toggleSelect(row)"
            />
          </td>
          <td v-for="col in columns" :key="col.key">
            <slot :name="col.key" :row="row" :value="row[col.key]">
              {{ col.render ? col.render(row[col.key], row) : row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">
        Previous
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">
        Next
      </button>
    </div>
  </div>
</template>
```

### 表单验证

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface FormData {
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

const formData = reactive<FormData>({
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive<FormErrors>({})
const touched = reactive<Record<keyof FormData, boolean>>({
  email: false,
  password: false,
  confirmPassword: false
})

// 验证规则
const validators = {
  email: (value: string): string | undefined => {
    if (!value) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format'
    }
  },
  password: (value: string): string | undefined => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain number'
  },
  confirmPassword: (value: string): string | undefined => {
    if (!value) return 'Please confirm password'
    if (value !== formData.password) return 'Passwords do not match'
  }
}

// 验证单个字段
const validateField = (field: keyof FormData) => {
  const validator = validators[field]
  if (validator) {
    errors[field] = validator(formData[field])
  }
}

// 验证所有字段
const validateAll = (): boolean => {
  let isValid = true
  ;(Object.keys(formData) as Array<keyof FormData>).forEach(field => {
    touched[field] = true
    validateField(field)
    if (errors[field]) isValid = false
  })
  return isValid
}

// 表单是否有效
const isValid = computed(() => {
  return Object.values(errors).every(e => !e) &&
    Object.values(formData).every(v => v)
})

// 提交表单
const handleSubmit = async () => {
  if (!validateAll()) return
  
  try {
    await submitForm(formData)
    // 成功处理
  } catch (error) {
    // 错误处理
  }
}

// 字段失焦验证
const handleBlur = (field: keyof FormData) => {
  touched[field] = true
  validateField(field)
}

// 输入时清除错误
const handleInput = (field: keyof FormData) => {
  if (touched[field]) {
    validateField(field)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label>Email</label>
      <input
        v-model="formData.email"
        type="email"
        @blur="handleBlur('email')"
        @input="handleInput('email')"
      />
      <span v-if="touched.email && errors.email" class="error">
        {{ errors.email }}
      </span>
    </div>
    
    <div class="form-group">
      <label>Password</label>
      <input
        v-model="formData.password"
        type="password"
        @blur="handleBlur('password')"
        @input="handleInput('password')"
      />
      <span v-if="touched.password && errors.password" class="error">
        {{ errors.password }}
      </span>
    </div>
    
    <div class="form-group">
      <label>Confirm Password</label>
      <input
        v-model="formData.confirmPassword"
        type="password"
        @blur="handleBlur('confirmPassword')"
        @input="handleInput('confirmPassword')"
      />
      <span v-if="touched.confirmPassword && errors.confirmPassword" class="error">
        {{ errors.confirmPassword }}
      </span>
    </div>
    
    <button type="submit" :disabled="!isValid">
      Submit
    </button>
  </form>
</template>
```

## 最佳实践

### 1. 组件设计原则

- **单一职责**：每个组件只做一件事
- **Props Down, Events Up**：单向数据流
- **合理拆分**：避免组件过大或过小
- **可复用性**：提取通用逻辑到 composables

### 2. 性能优化

```vue
<script setup lang="ts">
import { ref, computed, shallowRef, shallowReactive } from 'vue'

// 使用 shallowRef 减少响应式开销
const largeList = shallowRef<Item[]>([])

// 使用 computed 缓存计算结果
const filteredList = computed(() => 
  largeList.value.filter(item => item.active)
)

// 使用 v-once 渲染静态内容
// <div v-once>{{ staticContent }}</div>

// 使用 v-memo 缓存子树
// <div v-memo="[item.id]">{{ item.name }}</div>
</script>
```

### 3. TypeScript 集成

```typescript
// 类型安全的组件 Props
interface Props {
  id: number
  name: string
  config?: {
    theme: 'light' | 'dark'
    size?: 'sm' | 'md' | 'lg'
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({ theme: 'light' })
})

// 类型安全的 Emits
const emit = defineEmits<{
  (e: 'update', value: string): void
  (e: 'delete', id: number): void
}>()
```

### 4. 错误处理

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

// 捕获子组件错误
onErrorCaptured((err) => {
  error.value = err
  return false // 阻止错误继续传播
})

// 异步错误处理
const asyncAction = async () => {
  try {
    await fetchData()
  } catch (err) {
    error.value = err as Error
  }
}
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h3>Something went wrong</h3>
    <p>{{ error.message }}</p>
    <button @click="error = null">Retry</button>
  </div>
  <slot v-else />
</template>
```

## 延伸阅读

- [Vue.js 官方文档](https://vuejs.org/)
- [Vue Router 官方文档](https://router.vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [TypeScript 最佳实践](./typescript.md)
- [状态管理](./state-management.md)
