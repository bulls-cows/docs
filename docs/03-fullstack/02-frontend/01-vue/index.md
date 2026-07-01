
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

## 本章目录

- [组件设计模式](./01-component-patterns.md)
- [路由管理](./02-router.md)
- [状态管理](./03-state-management.md)
- [实战案例](./04-examples.md)
- [自定义指令](./05-directives.md)
- [Element-UI 虚拟列表](./06-element-ui-virtual-list.md)
- [最佳实践](./07-best-practices.md)

## 延伸阅读

- [Vue.js 官方文档](https://vuejs.org/)
- [Vue Router 官方文档](https://router.vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [TypeScript 最佳实践](../03-typescript.md)
- [状态管理](../04-state-management.md)
