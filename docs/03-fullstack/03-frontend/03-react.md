
# React 实战

React 是由 Meta 开发的用于构建用户界面的 JavaScript 库。本文将深入探讨 React 核心概念、状态管理方案、路由管理、性能优化技巧以及实战案例。

## React 核心概念

### 组件思维

React 的核心思想是将 UI 拆分为独立、可复用的组件，每个组件负责渲染一部分 UI。

```tsx
// 函数组件
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

// 使用组件
function App() {
  const handleClick = () => console.log('clicked')
  
  return (
    <div>
      <Button label="Primary" onClick={handleClick} />
      <Button label="Secondary" onClick={handleClick} variant="secondary" />
    </div>
  )
}
```

### Hooks 机制

Hooks 是 React 16.8 引入的特性，让函数组件拥有状态和生命周期能力。

#### useState：状态管理

```tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  // 函数式更新（基于前一个状态）
  const increment = () => setCount(prev => prev + 1)
  
  // 惰性初始化（只执行一次）
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('items')
    return saved ? JSON.parse(saved) : []
  })
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
    </div>
  )
}
```

#### useEffect：副作用处理

```tsx
import { useState, useEffect } from 'react'

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 清理函数
    let cancelled = false
    
    async function fetchUser() {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}`)
        const data = await response.json()
        if (!cancelled) {
          setUser(data)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    fetchUser()
    
    // 清理函数：组件卸载或依赖变化时执行
    return () => {
      cancelled = true
    }
  }, [userId]) // 依赖数组
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>
  
  return <div>{user.name}</div>
}
```

#### useMemo 和 useCallback：性能优化

```tsx
import { useState, useMemo, useCallback, memo } from 'react'

// useMemo：缓存计算结果
function ExpensiveList({ items, filter }: Props) {
  const filteredItems = useMemo(() => {
    console.log('Filtering items...')
    return items.filter(item => item.name.includes(filter))
  }, [items, filter])
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}

// useCallback：缓存函数引用
function ParentComponent() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Item[]>([])
  
  // 不使用 useCallback，每次渲染都会创建新函数
  // const handleClick = (id: string) => {
  //   setItems(items.filter(item => item.id !== id))
  // }
  
  // 使用 useCallback，只有 items 变化时才创建新函数
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ItemList items={items} onDelete={handleDelete} />
    </div>
  )
}

// memo：避免不必要的重渲染
interface ItemListProps {
  items: Item[]
  onDelete: (id: string) => void
}

const ItemList = memo(function ItemList({ items, onDelete }: ItemListProps) {
  console.log('ItemList rendered')
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => onDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
})
```

#### useRef：引用和持久化

```tsx
import { useRef, useEffect } from 'react'

function TextInputWithFocus() {
  const inputRef = useRef<HTMLInputElement>(null)
  const renderCount = useRef(0)
  
  // 持久化值（不触发重渲染）
  useEffect(() => {
    renderCount.current += 1
  })
  
  const focusInput = () => {
    inputRef.current?.focus()
  }
  
  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus Input</button>
      <p>Render count: {renderCount.current}</p>
    </div>
  )
}
```

#### useReducer：复杂状态逻辑

```tsx
import { useReducer } from 'react'

type State = {
  count: number
  history: number[]
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number }
  | { type: 'undo' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return {
        count: state.count + 1,
        history: [...state.history, state.count]
      }
    case 'decrement':
      return {
        count: state.count - 1,
        history: [...state.history, state.count]
      }
    case 'reset':
      return {
        count: action.payload,
        history: []
      }
    case 'undo':
      if (state.history.length === 0) return state
      const previous = state.history[state.history.length - 1]
      return {
        count: previous,
        history: state.history.slice(0, -1)
      }
    default:
      return state
  }
}

function CounterWithHistory() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    history: []
  })
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset', payload: 0 })}>Reset</button>
      <button 
        onClick={() => dispatch({ type: 'undo' })}
        disabled={state.history.length === 0}
      >
        Undo
      </button>
    </div>
  )
}
```

### 自定义 Hooks

```tsx
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })
  
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, storedValue])
  
  return [storedValue, setStoredValue]
}

// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])
  
  return debouncedValue
}

// 使用示例
function SearchInput() {
  const [query, setQuery] = useLocalStorage('search-query', '')
  const debouncedQuery = useDebounce(query, 300)
  
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery)
    }
  }, [debouncedQuery])
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

## 状态管理方案

### Zustand：轻量级状态管理

Zustand 是一个极简的状态管理库，API 简洁，无需 Provider 包裹。

```tsx
// stores/userStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  
  // Actions
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isLoggedIn: false,
        
        login: async (credentials) => {
          const response = await authApi.login(credentials)
          set({
            user: response.user,
            token: response.token,
            isLoggedIn: true
          })
        },
        
        logout: () => {
          set({
            user: null,
            token: null,
            isLoggedIn: false
          })
        },
        
        fetchUser: async () => {
          const { token } = get()
          if (!token) return
          
          const user = await authApi.getCurrentUser()
          set({ user })
        }
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ token: state.token })
      }
    )
  )
)

// 使用
function UserProfile() {
  const { user, isLoggedIn, login, logout } = useUserStore()
  
  if (!isLoggedIn) {
    return <button onClick={() => login({ email, password })}>Login</button>
  }
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

// 选择器优化（避免不必要的重渲染）
function UserName() {
  const userName = useUserStore((state) => state.user?.name)
  return <span>{userName}</span>
}
```

### Jotai：原子化状态管理

Jotai 提供了原子化的状态管理方式，状态可以组合和派生。

```tsx
// atoms/user.ts
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

// 基础原子
const userAtom = atom<User | null>(null)
const tokenAtom = atom<string | null>(null)

// 派生原子（只读）
const isLoggedInAtom = atom((get) => !!get(tokenAtom))
const userNameAtom = atom((get) => get(userAtom)?.name ?? 'Guest')

// 可写派生原子
const loginAtom = atom(
  null,
  async (get, set, credentials: Credentials) => {
    const response = await authApi.login(credentials)
    set(userAtom, response.user)
    set(tokenAtom, response.token)
  }
)

const logoutAtom = atom(null, (get, set) => {
  set(userAtom, null)
  set(tokenAtom, null)
})

// 使用
function UserProfile() {
  const [user] = useAtom(userAtom)
  const isLoggedIn = useAtomValue(isLoggedInAtom)
  const login = useSetAtom(loginAtom)
  const logout = useSetAtom(logoutAtom)
  
  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>Welcome, {user?.name}</p>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <button onClick={() => login({ email, password })}>Login</button>
      )}
    </div>
  )
}
```

### 状态管理方案对比

| 方案 | 特点 | 适用场景 |
|------|------|----------|
| useState | 内置，简单 | 组件内简单状态 |
| useReducer | 内置，适合复杂逻辑 | 组件内复杂状态 |
| Context + useReducer | 内置，跨组件共享 | 中小型应用 |
| Zustand | 轻量，API 简洁 | 中大型应用 |
| Jotai | 原子化，细粒度更新 | 需要精细控制的场景 |
| Redux Toolkit | 功能完整，生态丰富 | 大型企业应用 |

## React Router 路由

### 路由配置

```tsx
// router/index.tsx
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// 懒加载组件
const Home = lazy(() => import('@/pages/Home'))
const Users = lazy(() => import('@/pages/Users'))
const UserDetail = lazy(() => import('@/pages/UserDetail'))
const Admin = lazy(() => import('@/pages/Admin'))

// 布局组件
function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

// 错误边界
function ErrorBoundary() {
  const error = useRouteError()
  
  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <Link to="/">Go Home</Link>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'users',
        element: <Users />,
        children: [
          {
            path: ':userId',
            element: <UserDetail />,
            loader: async ({ params }) => {
              return fetch(`/api/users/${params.userId}`).then(r => r.json())
            }
          }
        ]
      },
      {
        path: 'admin',
        element: <Admin />,
        loader: async () => {
          if (!isAdmin()) {
            throw redirect('/login')
          }
          return null
        }
      }
    ]
  }
])

export function Router() {
  return <RouterProvider router={router} />
}
```

### 路由 Hooks

```tsx
import { 
  useNavigate, 
  useParams, 
  useSearchParams, 
  useLocation,
  useLoaderData
} from 'react-router-dom'

function UserDetail() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const user = useLoaderData() as User
  
  // 获取查询参数
  const tab = searchParams.get('tab') || 'overview'
  
  // 更新查询参数
  const setTab = (newTab: string) => {
    setSearchParams({ tab: newTab })
  }
  
  // 编程式导航
  const goToUsers = () => {
    navigate('/users', { replace: true })
  }
  
  return (
    <div>
      <h1>{user.name}</h1>
      <nav>
        <button onClick={() => setTab('overview')}>Overview</button>
        <button onClick={() => setTab('posts')}>Posts</button>
      </nav>
      <button onClick={goToUsers}>Back to Users</button>
    </div>
  )
}
```

## 性能优化技巧

### 1. 代码分割

```tsx
import { lazy, Suspense } from 'react'

// 路由级别分割
const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}

// 组件级别分割
const HeavyChart = lazy(() => import('./HeavyChart'))

function Analytics() {
  const [showChart, setShowChart] = useState(false)
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<Loading />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  )
}
```

### 2. 虚拟列表

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // 每项高度
    overscan: 5 // 预渲染数量
  })
  
  return (
    <div
      ref={parentRef}
      style={{ height: '500px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. 避免不必要的渲染

```tsx
import { memo, useMemo, useCallback } from 'react'

// 使用 memo 避免不必要的重渲染
interface ItemProps {
  id: string
  name: string
  onSelect: (id: string) => void
}

const Item = memo(function Item({ id, name, onSelect }: ItemProps) {
  console.log(`Item ${id} rendered`)
  return (
    <li onClick={() => onSelect(id)}>
      {name}
    </li>
  )
})

// 父组件优化
function ItemList({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  
  // 缓存回调函数
  const handleSelect = useCallback((id: string) => {
    setSelected(id)
  }, [])
  
  // 缓存排序结果
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])
  
  return (
    <ul>
      {sortedItems.map(item => (
        <Item
          key={item.id}
          id={item.id}
          name={item.name}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  )
}
```

### 4. 使用 React Compiler

React Compiler（React 19）自动优化组件，无需手动使用 memo/useMemo/useCallback：

```tsx
// 编译前
function MyComponent({ items, onClick }) {
  const filtered = items.filter(item => item.active)
  return (
    <div>
      {filtered.map(item => (
        <Item key={item.id} item={item} onClick={onClick} />
      ))}
    </div>
  )
}

// 编译后（自动优化）
// React Compiler 会自动添加 memoization
```

## 实战案例

### 数据获取 Hook

```tsx
// hooks/useQuery.ts
import { useState, useEffect, useCallback } from 'react'

interface QueryResult<T> {
  data: T | null
  error: Error | null
  loading: boolean
  refetch: () => void
}

export function useQuery<T>(
  url: string,
  options?: {
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  
  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      options?.onSuccess?.(result)
    } catch (e) {
      const err = e as Error
      setError(err)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [url, options?.enabled])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, error, loading, refetch: fetchData }
}

// 使用
function UserList() {
  const { data: users, loading, error, refetch } = useQuery<User[]>('/api/users')
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 表单处理

```tsx
// hooks/useForm.ts
import { useState, useCallback } from 'react'

interface FormOptions<T> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: FormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])
  
  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    // 验证单个字段
    if (validate) {
      const validationErrors = validate(values)
      if (validationErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: validationErrors[name] }))
      }
    }
  }, [values, validate])
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // 标记所有字段为 touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Record<keyof T, boolean>)
    setTouched(allTouched)
    
    // 验证所有字段
    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }
    
    // 提交表单
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])
  
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  }
}

// 使用
interface LoginForm {
  email: string
  password: string
}

function LoginForm() {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm<LoginForm>({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginForm, string>> = {}
      if (!values.email) errors.email = 'Email is required'
      if (!values.password) errors.password = 'Password is required'
      return errors
    },
    onSubmit: async (values) => {
      await authApi.login(values)
    }
  })
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
        />
        {touched.email && errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>
      
      <div>
        <input
          type="password"
          value={values.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
        />
        {touched.password && errors.password && (
          <span className="error">{errors.password}</span>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

## 最佳实践

### 1. 组件设计原则

- **单一职责**：每个组件只做一件事
- **组合优于继承**：使用组合模式复用逻辑
- **Props 解构**：明确组件的输入
- **合理的抽象层级**：避免过度抽象

### 2. 状态管理原则

- **就近原则**：状态应该放在最近的共同父组件
- **提升状态**：当多个组件需要共享状态时提升
- **下放状态**：当状态只被一个组件使用时下放
- **避免冗余状态**：能计算得出的不要存储

### 3. 性能优化原则

- **测量优先**：使用 React DevTools Profiler 测量
- **避免过早优化**：只在必要时优化
- **使用正确的工具**：memo、useMemo、useCallback
- **代码分割**：按路由或功能分割代码

### 4. 错误处理

```tsx
// Error Boundary
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

## 延伸阅读

- [React 官方文档](https://react.dev/)
- [React Router 官方文档](https://reactrouter.com/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Jotai GitHub](https://github.com/pmndrs/jotai)
- [TypeScript 最佳实践](./04-typescript.md)
- [状态管理](./05-state-management.md)
- [性能优化](./07-performance.md)
