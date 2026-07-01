
# 路由管理

## 路由配置

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

## 导航守卫

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

## 组合式 API

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

## 延伸阅读

- [Vue.js 实战](./index.md)
- [组件设计模式](./01-component-patterns.md)
- [状态管理](./03-state-management.md)
