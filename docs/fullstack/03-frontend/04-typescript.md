---
order: 40
---

# TypeScript 最佳实践

TypeScript 为 JavaScript 添加了静态类型系统，能在编译时发现潜在错误，提升代码质量和开发效率。本文将深入探讨 TypeScript 类型系统、泛型与类型推断、类型体操技巧以及前后端类型共享。

## 类型系统深入

### 基础类型

```typescript
// 基本类型
let str: string = 'hello'
let num: number = 42
let bool: boolean = true
let empty: null = null
let notDefined: undefined = undefined

// 数组
let arr1: number[] = [1, 2, 3]
let arr2: Array<number> = [1, 2, 3]

// 元组
let tuple: [string, number] = ['hello', 42]

// 对象
let obj: { name: string; age: number } = {
  name: 'Alice',
  age: 30
}

// 函数
function add(a: number, b: number): number {
  return a + b
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b

// 可选参数和默认值
function greet(name: string, greeting?: string): string {
  return `${greeting ?? 'Hello'}, ${name}!`
}

// 函数重载
function format(input: string): string
function format(input: number): string
function format(input: string | number): string {
  return String(input)
}
```

### 接口与类型别名

```typescript
// 接口
interface User {
  id: number
  name: string
  email: string
  age?: number // 可选属性
  readonly createdAt: Date // 只读属性
}

// 扩展接口
interface Admin extends User {
  role: 'admin'
  permissions: string[]
}

// 类型别名
type ID = string | number
type Point = { x: number; y: number }
type UserKeys = keyof User // 'id' | 'name' | 'email' | 'age' | 'createdAt'

// 联合类型
type Status = 'pending' | 'approved' | 'rejected'
type Result = Success | Error

// 交叉类型
type Employee = User & {
  department: string
  salary: number
}

// 接口 vs 类型别名
// 接口可以被扩展和实现
// 类型别名可以表示联合类型、元组等
interface IPoint {
  x: number
  y: number
}

type TPoint = {
  x: number
  y: number
}

// 两者大多数情况下可以互换
// 但接口支持声明合并
interface Config {
  host: string
}

interface Config {
  port: number
}

// Config 现在包含 host 和 port
```

### 类型断言与类型守卫

```typescript
// 类型断言
let value: unknown = 'hello'
let length1: number = (value as string).length
let length2: number = (<string>value).length // JSX 中不可用

// 非空断言
let element = document.getElementById('app')!
element.innerHTML = 'Hello'

// 类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function process(value: string | number) {
  if (isString(value)) {
    console.log(value.toUpperCase()) // value 是 string
  } else {
    console.log(value.toFixed(2)) // value 是 number
  }
}

// instanceof 守卫
class Dog {
  bark() {}
}

class Cat {
  meow() {}
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark()
  } else {
    animal.meow()
  }
}

// in 操作符守卫
interface Car {
  drive(): void
}

interface Boat {
  sail(): void
}

function move(vehicle: Car | Boat) {
  if ('drive' in vehicle) {
    vehicle.drive()
  } else {
    vehicle.sail()
  }
}

// 可辨识联合
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rectangle'; width: number; height: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'square':
      return shape.size ** 2
    case 'rectangle':
      return shape.width * shape.height
  }
}
```

## 泛型与类型推断

### 泛型基础

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg
}

let output1 = identity<string>('hello') // 显式指定类型
let output2 = identity(42) // 类型推断

// 泛型接口
interface Container<T> {
  value: T
  getValue(): T
}

const container: Container<string> = {
  value: 'hello',
  getValue() {
    return this.value
  }
}

// 泛型类
class Stack<T> {
  private items: T[] = []
  
  push(item: T): void {
    this.items.push(item)
  }
  
  pop(): T | undefined {
    return this.items.pop()
  }
  
  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }
}

const numberStack = new Stack<number>()
numberStack.push(1)
numberStack.push(2)

// 泛型约束
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}

logLength('hello') // OK
logLength([1, 2, 3]) // OK
// logLength(123) // Error: number 没有 length 属性
```

### 多泛型参数

```typescript
// 多个类型参数
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value]
}

const p = pair('name', 'Alice') // [string, string]

// 泛型默认值
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const response: ApiResponse = {
  code: 200,
  message: 'OK',
  data: { id: 1 }
}

// 条件类型中的泛型
type NonNullable<T> = T extends null | undefined ? never : T

type Result1 = NonNullable<string | null> // string
type Result2 = NonNullable<number | undefined> // number
```

### 类型推断

```typescript
// 类型推断
let x = 42 // number
let arr = [1, 2, 3] // number[]
let obj = { name: 'Alice', age: 30 } // { name: string; age: number }

// 上下文类型推断
window.addEventListener('click', (event) => {
  // event 自动推断为 MouseEvent
  console.log(event.clientX)
})

// ReturnType 获取函数返回类型
function fetchData() {
  return { id: 1, name: 'Alice' }
}

type Data = ReturnType<typeof fetchData>
// { id: number; name: string }

// Parameters 获取函数参数类型
type Params = Parameters<typeof fetchData>
// []

// InstanceType 获取构造函数实例类型
class Person {
  name: string
  constructor(name: string) {
    this.name = name
  }
}

type PersonInstance = InstanceType<typeof Person>
// Person

// infer 关键字
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type Result = UnwrapPromise<Promise<string>> // string
```

## 类型体操技巧

### 工具类型

```typescript
// Partial - 所有属性可选
interface User {
  name: string
  age: number
}

type PartialUser = Partial<User>
// { name?: string; age?: number }

// Required - 所有属性必需
type RequiredUser = Required<PartialUser>
// { name: string; age: number }

// Readonly - 所有属性只读
type ReadonlyUser = Readonly<User>
// { readonly name: string; readonly age: number }

// Pick - 选取部分属性
type UserName = Pick<User, 'name'>
// { name: string }

// Omit - 排除部分属性
type UserWithoutAge = Omit<User, 'age'>
// { name: string }

// Record - 构造对象类型
type UserMap = Record<string, User>
// { [key: string]: User }

// Exclude - 排除联合类型成员
type T0 = Exclude<'a' | 'b' | 'c', 'a'>
// 'b' | 'c'

// Extract - 提取联合类型成员
type T1 = Extract<'a' | 'b' | 'c', 'a' | 'f'>
// 'a'

// NonNullable - 排除 null 和 undefined
type T2 = NonNullable<string | null | undefined>
// string

// ReturnType - 获取函数返回类型
type T3 = ReturnType<() => string>
// string

// Parameters - 获取函数参数类型
type T4 = Parameters<(a: string, b: number) => void>
// [string, number]
```

### 高级类型技巧

```typescript
// 递归类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

interface Config {
  server: {
    host: string
    port: number
  }
  database: {
    url: string
    name: string
  }
}

type PartialConfig = DeepPartial<Config>
// 所有嵌套属性都变为可选

// 条件类型
type IsArray<T> = T extends any[] ? true : false

type A = IsArray<string[]> // true
type B = IsArray<string> // false

// 分布式条件类型
type ToArray<T> = T extends any ? T[] : never

type StrArr = ToArray<string | number>
// string[] | number[]

// 模板字面量类型
type EventName = 'click' | 'focus' | 'blur'
type Handler = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

type PropEventSource<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (newValue: T[K]) => void
}

interface User {
  name: string
  age: number
}

type UserEvents = PropEventSource<User>
// {
//   onNameChange: (newValue: string) => void
//   onAgeChange: (newValue: number) => void
// }

// 映射类型
type Getter<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type UserGetters = Getter<User>
// {
//   getName: () => string
//   getAge: () => number
// }
```

### 实用类型体操

```typescript
// 获取对象路径类型
type PathValue<T, P extends string> = 
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PathValue<T[K], Rest>
      : never
    : P extends keyof T
      ? T[P]
      : never

interface Config {
  server: {
    host: string
    port: number
  }
}

type Host = PathValue<Config, 'server.host'> // string

// 联合转交叉
type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never

// 对象合并
type Merge<T, U> = Omit<T, keyof U> & U

type Merged = Merge<{ a: string; b: number }, { b: boolean; c: number }>
// { a: string; b: boolean; c: number }

// 必选键
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

// 可选键
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

// 数组元素类型
type ArrayElement<T> = T extends (infer E)[] ? E : never

type Element = ArrayElement<string[]> // string
```

## 前后端类型共享

### 共享类型定义

```typescript
// shared/types/api.ts

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户相关
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

// 文章相关
export interface Article {
  id: number
  title: string
  content: string
  author: User
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateArticleRequest {
  title: string
  content: string
  tags: string[]
}
```

### 类型安全的 API 客户端

```typescript
// client/api.ts
import type { ApiResponse, LoginRequest, LoginResponse, User } from '@shared/types'

class ApiClient {
  private baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
  
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<ApiResponse<LoginResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/api/user/me')
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint)
  }
  
  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const api = new ApiClient('/api')
```

### 类型安全的路由

```typescript
// shared/routes.ts
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  user: {
    profile: (id: number) => `/user/${id}`,
    settings: '/user/settings'
  },
  article: {
    list: '/articles',
    detail: (id: number) => `/article/${id}`,
    create: '/article/create'
  }
} as const

// 类型安全的路由参数
type RouteParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof RouteParams<Rest>]: string | number }
  : T extends `${string}:${infer Param}`
    ? { [K in Param]: string | number }
    : {}

// 使用
const path = routes.user.profile(123) // '/user/123'
```

### 类型安全的表单

```typescript
// shared/form.ts
import { z } from 'zod'

// 使用 Zod 定义 schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export type LoginFormData = z.infer<typeof loginSchema>

// 表单验证
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

// 使用
const result = validateForm(loginSchema, {
  email: 'test@example.com',
  password: '12345678'
})

if (result.success) {
  // result.data 类型为 LoginFormData
  console.log(result.data.email)
}
```

## 常见类型模式

### 选项模式

```typescript
interface Options {
  timeout?: number
  retries?: number
  baseUrl?: string
}

function createClient(options: Options = {}) {
  const {
    timeout = 5000,
    retries = 3,
    baseUrl = 'https://api.example.com'
  } = options
  
  // ...
}

// 使用
createClient({ timeout: 10000 })
```

### 构建器模式

```typescript
interface QueryConfig {
  table?: string
  fields?: string[]
  where?: Record<string, any>
  orderBy?: string
  limit?: number
}

class QueryBuilder<T extends Record<string, any>> {
  private config: QueryConfig = {}
  
  from(table: string): this {
    this.config.table = table
    return this
  }
  
  select<K extends keyof T>(...fields: K[]): this {
    this.config.fields = fields as string[]
    return this
  }
  
  where(conditions: Partial<T>): this {
    this.config.where = conditions
    return this
  }
  
  orderBy(field: keyof T): this {
    this.config.orderBy = field as string
    return this
  }
  
  limit(count: number): this {
    this.config.limit = count
    return this
  }
  
  build(): QueryConfig {
    return this.config
  }
}

// 使用
const query = new QueryBuilder<User>()
  .from('users')
  .select('id', 'name', 'email')
  .where({ role: 'admin' })
  .orderBy('createdAt')
  .limit(10)
  .build()
```

### 工厂模式

```typescript
interface Animal {
  speak(): string
}

class Dog implements Animal {
  speak() {
    return 'Woof!'
  }
}

class Cat implements Animal {
  speak() {
    return 'Meow!'
  }
}

type AnimalType = 'dog' | 'cat'

function createAnimal(type: AnimalType): Animal {
  switch (type) {
    case 'dog':
      return new Dog()
    case 'cat':
      return new Cat()
  }
}

const dog = createAnimal('dog')
console.log(dog.speak()) // 'Woof!'
```

### 单例模式

```typescript
class Database {
  private static instance: Database | null = null
  
  private constructor(private connectionString: string) {}
  
  static getInstance(connectionString: string): Database {
    if (!Database.instance) {
      Database.instance = new Database(connectionString)
    }
    return Database.instance
  }
  
  query(sql: string) {
    // ...
  }
}

const db = Database.getInstance('postgresql://localhost/mydb')
```

## 最佳实践

### 1. 类型定义原则

- **避免 any**：尽量使用具体类型
- **使用 unknown**：当类型不确定时使用 unknown
- **保持简单**：不要过度复杂化类型定义
- **复用类型**：提取公共类型到单独文件

### 2. 类型导入导出

```typescript
// 使用 type 关键字导入类型
import type { User, Article } from './types'

// 使用 type 关键字导出类型
export type { User, Article }

// 运行时导入和类型导入分离
import { formatDate } from './utils'
import type { User } from './types'
```

### 3. 类型注释

```typescript
/**
 * 用户信息
 */
interface User {
  /** 用户 ID */
  id: number
  /** 用户名 */
  name: string
  /** 邮箱地址 */
  email: string
}

/**
 * 创建新用户
 * @param data - 用户数据
 * @returns 创建的用户
 */
function createUser(data: Omit<User, 'id'>): User {
  // ...
}
```

### 4. 类型守卫

```typescript
// 使用类型守卫进行运行时检查
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value
  )
}

// 使用
function processUser(data: unknown) {
  if (isUser(data)) {
    console.log(data.name) // 类型安全
  }
}
```

## 延伸阅读

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Vue.js 实战](./02-vue.md)
- [React 实战](./03-react.md)
- [状态管理](./05-state-management.md)
