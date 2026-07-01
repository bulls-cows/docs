
# 最佳实践

## 1. 组件设计原则

- **单一职责**：每个组件只做一件事
- **Props Down, Events Up**：单向数据流
- **合理拆分**：避免组件过大或过小
- **可复用性**：提取通用逻辑到 composables

## 2. 性能优化

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

## 3. TypeScript 集成

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

## 4. 错误处理

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

- [Vue.js 实战](./index.md)
- [组件设计模式](./01-component-patterns.md)
- [实战案例](./04-examples.md)
- [自定义指令](./05-directives.md)
- [Element-UI 虚拟列表](./06-element-ui-virtual-list.md)
