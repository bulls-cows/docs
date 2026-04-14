
# 状态管理

状态管理是前端应用的核心问题之一。随着应用复杂度的增加，如何有效地管理应用状态变得越来越重要。本文将深入探讨状态管理演进历史、各方案对比、服务端状态管理以及最佳实践。

## 状态管理演进历史

### 1. 组件内部状态

最简单的状态管理方式是将状态保存在组件内部：

```tsx
// React
function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}

// Vue
const count = ref(0)
```

**适用场景**：简单的局部状态，不需要跨组件共享。

### 2. Props 传递

通过 Props 将状态传递给子组件：

```tsx
// 父组件
function Parent() {
  const [user, setUser] = useState<User | null>(null)
  return <Child user={user} onUpdate={setUser} />
}

// 子组件
function Child({ user, onUpdate }: Props) {
  return <div>{user?.name}</div>
}
```

**问题**：Props Drilling（属性透传），多层嵌套时需要逐层传递。

### 3. Context/Provide-Inject

React Context 和 Vue Provide/Inject 解决了 Props Drilling 问题：

```tsx
// React Context
const UserContext = createContext<User | null>(null)

function App() {
  const [user, setUser] = useState<User | null>(null)
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <DeepChild />
    </UserContext.Provider>
  )
}

function DeepChild() {
  const { user, setUser } = useContext(UserContext)
  return <div>{user?.name}</div>
}

// Vue Provide/Inject
// 父组件
const user = ref<User | null>(null)
provide('user', user)

// 子组件
const user = inject('user')
```

**问题**：Context 变化会导致所有消费者重渲染，不适合高频更新。

### 4. 全局状态管理库

Redux、Vuex 等库提供了更完善的全局状态管理方案：

```tsx
// Redux
const store = createStore(reducer)

function App() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}

function Counter() {
  const count = useSelector(state => state.count)
  const dispatch = useDispatch()
  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      {count}
    </button>
  )
}
```

**问题**：样板代码多，学习曲线陡峭。

### 5. 现代状态管理

Zustand、Jotai、Pinia 等现代库提供了更简洁的 API：

```tsx
// Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))

function Counter() {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)
  return <button onClick={increment}>{count}</button>
}
```

## 状态管理方案对比

### Redux Toolkit

Redux Toolkit 是 Redux 的官方推荐写法，简化了 Redux 的使用：

```tsx
// store/userSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface UserState {
  user: User | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null
}

// 异步 Thunk
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    clearUser: (state) => {
      state.user = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Unknown error'
      })
  }
})

export const { setUser, clearUser } = userSlice.actions
export default userSlice.reducer

// 使用
import { useSelector, useDispatch } from 'react-redux'
import { fetchUser } from './store/userSlice'

function UserProfile() {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state: RootState) => state.user)
  
  useEffect(() => {
    dispatch(fetchUser('123'))
  }, [dispatch])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{user?.name}</div>
}
```

**优点**：

- 功能完整，适合大型应用
- 时间旅行调试
- 强大的中间件生态
- 优秀的 DevTools

**缺点**：

- 概念较多，学习曲线陡
- 样板代码仍然存在

### Zustand

Zustand 是一个极简的状态管理库：

```tsx
// stores/userStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UserState {
  user: User | null
  loading: boolean
  
  fetchUser: (id: string) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        loading: false,
        
        fetchUser: async (id) => {
          set({ loading: true })
          try {
            const response = await fetch(`/api/users/${id}`)
            const user = await response.json()
            set({ user, loading: false })
          } catch (error) {
            set({ loading: false })
          }
        },
        
        logout: () => {
          set({ user: null })
        }
      }),
      {
        name: 'user-storage'
      }
    )
  )
)

// 使用
function UserProfile() {
  const user = useUserStore((state) => state.user)
  const fetchUser = useUserStore((state) => state.fetchUser)
  
  useEffect(() => {
    fetchUser('123')
  }, [fetchUser])
  
  return <div>{user?.name}</div>
}
```

**优点**：

- API 简洁，学习成本低
- 无需 Provider 包裹
- 优秀的 TypeScript 支持
- 轻量（约 1KB）

**缺点**：

- 生态不如 Redux 丰富
- 缺少时间旅行调试

### Pinia

Pinia 是 Vue 官方推荐的状态管理库：

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  
  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const userName = computed(() => user.value?.name ?? 'Guest')
  
  // Actions
  async function fetchUser(id: string) {
    loading.value = true
    try {
      const response = await fetch(`/api/users/${id}`)
      user.value = await response.json()
    } finally {
      loading.value = false
    }
  }
  
  function logout() {
    user.value = null
  }
  
  return {
    user,
    loading,
    isLoggedIn,
    userName,
    fetchUser,
    logout
  }
})

// 使用
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { user, loading, isLoggedIn } = storeToRefs(userStore)
const { fetchUser, logout } = userStore

onMounted(() => {
  fetchUser('123')
})
</script>
```

**优点**：

- Vue 官方推荐
- 完美的 TypeScript 支持
- 支持 Composition API
- 轻量且直观

**缺点**：

- 仅适用于 Vue

### Jotai

Jotai 提供了原子化的状态管理：

```tsx
// atoms/user.ts
import { atom } from 'jotai'

// 基础原子
export const userAtom = atom<User | null>(null)
export const loadingAtom = atom(false)

// 派生原子
export const isLoggedInAtom = atom((get) => !!get(userAtom))
export const userNameAtom = atom((get) => get(userAtom)?.name ?? 'Guest')

// 可写派生原子
export const fetchUserAtom = atom(
  null,
  async (get, set, id: string) => {
    set(loadingAtom, true)
    try {
      const response = await fetch(`/api/users/${id}`)
      set(userAtom, await response.json())
    } finally {
      set(loadingAtom, false)
    }
  }
)

// 使用
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

function UserProfile() {
  const user = useAtomValue(userAtom)
  const loading = useAtomValue(loadingAtom)
  const fetchUser = useSetAtom(fetchUserAtom)
  
  useEffect(() => {
    fetchUser('123')
  }, [fetchUser])
  
  if (loading) return <div>Loading...</div>
  return <div>{user?.name}</div>
}
```

**优点**：

- 原子化设计，细粒度更新
- 最小化重渲染
- 灵活的状态组合
- 轻量（约 2KB）

**缺点**：

- 概念较新，学习成本
- 生态相对较小

### 方案对比总结

| 方案 | 框架 | 大小 | 学习曲线 | 适用场景 |
|------|------|------|----------|----------|
| Redux Toolkit | React | ~11KB | 陡峭 | 大型企业应用 |
| Zustand | 通用 | ~1KB | 平缓 | 中大型应用 |
| Pinia | Vue | ~1KB | 平缓 | Vue 项目 |
| Jotai | React | ~2KB | 中等 | 需要精细控制的应用 |
| Valtio | React | ~3KB | 平缓 | 需要可变状态的应用 |

## 服务端状态管理

服务端状态（API 数据）有其特殊性：需要处理加载状态、错误处理、缓存、重新验证等。TanStack Query（React Query）专门解决这个问题。

### TanStack Query

```tsx
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 获取数据
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000 // 10 分钟后垃圾回收
  })
}

// 获取列表
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json())
  })
}

// 创建数据
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (user: CreateUserInput) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
      return response.json()
    },
    onSuccess: () => {
      // 创建成功后使列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}

// 更新数据
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return response.json()
    },
    onSuccess: (data, variables) => {
      // 更新特定用户的缓存
      queryClient.setQueryData(['user', variables.id], data)
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}

// 删除数据
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/users/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}

// 使用示例
function UserList() {
  const { data: users, isLoading, error } = useUsers()
  const createUser = useCreateUser()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <button
        onClick={() => createUser.mutate({ name: 'New User', email: 'new@example.com' })}
        disabled={createUser.isPending}
      >
        Add User
      </button>
      
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 乐观更新

```tsx
function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateUser,
    
    // 乐观更新：在请求发送前更新 UI
    onMutate: async (newUser) => {
      // 取消正在进行的请求
      await queryClient.cancelQueries({ queryKey: ['user', newUser.id] })
      
      // 保存旧数据以便回滚
      const previousUser = queryClient.getQueryData(['user', newUser.id])
      
      // 乐观更新
      queryClient.setQueryData(['user', newUser.id], newUser)
      
      return { previousUser }
    },
    
    // 错误时回滚
    onError: (err, newUser, context) => {
      queryClient.setQueryData(['user', newUser.id], context.previousUser)
    },
    
    // 无论成功失败，都重新获取数据
    onSettled: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', newUser.id] })
    }
  })
}
```

### 分页和无限滚动

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/users?page=${pageParam}`)
      return response.json()
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1
  })
}

function UserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteUsers()
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.items.map(user => (
            <div key={user.id}>{user.name}</div>
          ))}
        </Fragment>
      ))}
      
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  )
}
```

## 最佳实践

### 1. 状态分类

将状态分为以下几类，选择合适的管理方式：

| 状态类型 | 示例 | 推荐方案 |
|----------|------|----------|
| 组件状态 | 表单输入、UI 状态 | useState/ref |
| 应用状态 | 用户信息、主题 | Zustand/Pinia |
| 服务端状态 | API 数据 | TanStack Query |
| URL 状态 | 搜索参数、路由 | URL/Router |

### 2. 状态设计原则

**就近原则**：状态应该放在最近的共同父组件

```tsx
// 错误：将局部状态提升到全局
const useGlobalStore = create((set) => ({
  modalOpen: false, // 这个状态只在一个组件中使用
  toggleModal: () => set((state) => ({ modalOpen: !state.modalOpen }))
}))

// 正确：保持状态局部化
function Modal() {
  const [open, setOpen] = useState(false)
  // ...
}
```

**最小化状态**：能计算得出的不要存储

```tsx
// 错误：存储可计算的状态
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
const [fullName, setFullName] = useState('') // 冗余

// 正确：只存储基础状态
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
const fullName = `${firstName} ${lastName}` // 计算得出
```

**规范化状态**：避免嵌套和重复

```tsx
// 错误：嵌套和重复
interface State {
  users: User[]
  selectedUser: User | null // 可能与 users 中的数据不同步
}

// 正确：规范化
interface State {
  users: Record<string, User>
  userIds: string[]
  selectedUserId: string | null
}
```

### 3. 性能优化

**选择器优化**：只订阅需要的状态

```tsx
// 错误：订阅整个 store
const state = useUserStore()

// 正确：只订阅需要的状态
const userName = useUserStore((state) => state.user?.name)

// 使用 shallow 比较
import { shallow } from 'zustand/shallow'

const { user, loading } = useUserStore(
  (state) => ({ user: state.user, loading: state.loading }),
  shallow
)
```

**避免不必要的更新**：

```tsx
// Zustand：使用 selector
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] }))
}))

// 只在 items 变化时重渲染
const items = useStore((state) => state.items)

// Pinia：使用 storeToRefs
const { user, loading } = storeToRefs(userStore)
```

### 4. 持久化策略

```tsx
// Zustand 持久化
const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user })
    }),
    {
      name: 'user-storage',
      // 只持久化部分状态
      partialize: (state) => ({ user: state.user }),
      // 自定义序列化
      storage: createJSONStorage(() => sessionStorage)
    }
  )
)

// Pinia 持久化插件
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

### 5. DevTools 集成

```tsx
// Redux DevTools
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
})

// Zustand DevTools
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set) => ({
      // ...
    }),
    { name: 'MyStore' }
  )
)
```

## 选型建议

### 小型项目

- React：useState + Context
- Vue：ref/reactive + provide/inject

### 中型项目

- React：Zustand + TanStack Query
- Vue：Pinia + TanStack Query

### 大型企业项目

- React：Redux Toolkit + TanStack Query
- Vue：Pinia + TanStack Query

### 特殊场景

- 需要细粒度更新：Jotai
- 需要可变状态：Valtio
- 需要时间旅行调试：Redux

## 延伸阅读

- [Redux 官方文档](https://redux.js.org/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Jotai GitHub](https://github.com/pmndrs/jotai)
- [TanStack Query 官方文档](https://tanstack.com/query/)
- [Vue.js 实战](./02-vue.md)
- [React 实战](./03-react.md)
- [TypeScript 最佳实践](./04-typescript.md)
