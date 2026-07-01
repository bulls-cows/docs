
# 状态管理

## Store 定义

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

## 使用 Store

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

## 插件扩展

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

## 延伸阅读

- [Vue.js 实战](./index.md)
- [组件设计模式](./01-component-patterns.md)
- [路由管理](./02-router.md)
