
# 组件设计模式

## Props 与 Emits

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

## 插槽（Slots）

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

## 组合式函数（Composables）

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

## 依赖注入

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

## 延伸阅读

- [Vue.js 实战](./index.md)
- [路由管理](./02-router.md)
- [状态管理](./03-state-management.md)
