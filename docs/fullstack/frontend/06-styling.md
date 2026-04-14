---
order: 60
---

# 样式方案

CSS 样式方案经历了从传统 CSS 到 CSS-in-JS 的演进，各种方案各有优劣。本文将深入探讨 CSS 方案演进、Tailwind CSS 实践、CSS Modules、CSS-in-JS 方案以及主题定制。

## CSS 方案演进

### 1. 传统 CSS

最原始的 CSS 写法，使用单独的 `.css` 文件：

```css
/* styles.css */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-primary {
  background-color: #007bff;
  color: white;
}
```

**问题**：

- 全局作用域，样式冲突
- 命名困难
- 难以维护

### 2. CSS 预处理器

Sass/Less 提供了变量、嵌套、混入等特性：

```scss
// styles.scss
$primary-color: #007bff;
$border-radius: 4px;

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  padding: 10px 20px;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  
  &-primary {
    background-color: $primary-color;
    color: white;
    
    &:hover {
      background-color: darken($primary-color, 10%);
    }
  }
  
  &-secondary {
    background-color: #6c757d;
    color: white;
  }
}
```

**优点**：

- 变量和混入提高复用性
- 嵌套语法更直观
- 模块化支持

**问题**：

- 仍然是全局作用域
- 编译后文件可能很大

### 3. CSS Modules

CSS Modules 提供了局部作用域：

```css
/* Button.module.css */
.button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}

.primary {
  background-color: #007bff;
  color: white;
}
```

```tsx
// Button.tsx
import styles from './Button.module.css'

export function Button({ variant = 'primary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      Click me
    </button>
  )
}
```

**优点**：

- 局部作用域，避免冲突
- 可以和预处理器结合
- 零运行时开销

**问题**：

- 类名不够直观
- 动态样式处理困难

### 4. CSS-in-JS

Styled-components、Emotion 等库将 CSS 写在 JS 中：

```tsx
import styled from 'styled-components'

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  background-color: ${props => 
    props.$variant === 'secondary' ? '#6c757d' : '#007bff'
  };
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
`

// 使用
<Button>Primary</Button>
<Button $variant="secondary">Secondary</Button>
```

**优点**：

- 真正的组件级样式隔离
- 动态样式支持
- 自动添加前缀

**问题**：

- 运行时开销
- 增加包体积
- SSR 配置复杂

### 5. Utility-First CSS

Tailwind CSS 代表了 Utility-First 的理念：

```tsx
function Button({ variant = 'primary' }) {
  const baseClasses = 'px-4 py-2 border-none rounded cursor-pointer text-white'
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600'
  }
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      Click me
    </button>
  )
}
```

**优点**：

- 快速开发
- 一致的设计系统
- 极小的生产包体积

**问题**：

- 类名冗长
- HTML 可读性降低
- 需要学习工具类

## Tailwind CSS 实践

### 基础配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

### 组件抽象

```tsx
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
        ghost: 'hover:bg-gray-100'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-8 text-lg'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

// 使用
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="lg">Outline Large</Button>
```

### 响应式设计

```tsx
function ResponsiveLayout() {
  return (
    <div className="container mx-auto px-4">
      {/* 移动端单列，平板双列，桌面三列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Card 1</div>
        <div className="bg-white p-4 rounded shadow">Card 2</div>
        <div className="bg-white p-4 rounded shadow">Card 3</div>
      </div>
      
      {/* 响应式字体大小 */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
        Responsive Title
      </h1>
      
      {/* 响应式间距 */}
      <div className="mt-4 md:mt-6 lg:mt-8">
        Content with responsive margin
      </div>
    </div>
  )
}
```

### 暗色模式

```tsx
// tailwind.config.js
export default {
  darkMode: 'class', // 或 'media'
  // ...
}

// 组件
function ThemeToggle() {
  const [dark, setDark] = useState(false)
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  
  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}

// 使用暗色模式
function Card() {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold">Card Title</h2>
      <p className="text-gray-600 dark:text-gray-300">Card content</p>
    </div>
  )
}
```

## CSS Modules

### 基础用法

```css
/* Card.module.css */
.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.content {
  color: #666;
  line-height: 1.6;
}

/* 组合类 */
.cardFeatured {
  composes: card;
  border: 2px solid #007bff;
}
```

```tsx
// Card.tsx
import styles from './Card.module.css'

interface CardProps {
  title: string
  children: React.ReactNode
  featured?: boolean
}

export function Card({ title, children, featured }: CardProps) {
  return (
    <div className={featured ? styles.cardFeatured : styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
```

### 与 Sass 结合

```scss
// Button.module.scss
$primary-color: #007bff;
$border-radius: 4px;

.button {
  padding: 10px 20px;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.primary {
  background-color: $primary-color;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: darken($primary-color, 10%);
  }
}

.secondary {
  background-color: #6c757d;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: darken(#6c757d, 10%);
  }
}

// 使用变量导出
:export {
  primaryColor: $primary-color;
}
```

### 类型安全（TypeScript）

```typescript
// styles.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}
```

## CSS-in-JS 方案

### Styled Components

```tsx
import styled, { css, keyframes } from 'styled-components'

// 基础样式
const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

// 变体样式
const PrimaryButton = styled(Button)`
  background-color: #007bff;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`

// Props 驱动样式
interface CardProps {
  $elevated?: boolean
  $padding?: string
}

const Card = styled.div<CardProps>`
  background-color: white;
  border-radius: 8px;
  padding: ${props => props.$padding || '16px'};
  
  ${props => props.$elevated && css`
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `}
`

// 动画
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const AnimatedCard = styled(Card)`
  animation: ${fadeIn} 0.3s ease;
`

// 主题
const ThemedButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.md};
`
```

### Emotion

```tsx
/** @jsxImportSource @emotion/react */
import { css, styled } from '@emotion/react'

// css prop
function Button({ children, variant = 'primary' }) {
  return (
    <button
      css={css`
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background-color: ${variant === 'primary' ? '#007bff' : '#6c757d'};
        color: white;
        
        &:hover {
          opacity: 0.9;
        }
      `}
    >
      {children}
    </button>
  )
}

// styled API
const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

// 动态样式
interface FlexProps {
  direction?: 'row' | 'column'
  gap?: number
  align?: 'start' | 'center' | 'end'
}

const Flex = styled.div<FlexProps>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  gap: ${props => props.gap || 0}px;
  align-items: ${props => props.align || 'center'};
`

// 使用
<Flex direction="column" gap={16} align="start">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</Flex>
```

### Vanilla Extract（零运行时）

```typescript
// styles.css.ts
import { style, createTheme, globalStyle } from '@vanilla-extract/css'

// 创建主题
export const [themeClass, vars] = createTheme({
  color: {
    primary: '#007bff',
    secondary: '#6c757d',
    text: '#333333',
    background: '#ffffff'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  }
})

// 定义样式
export const button = style({
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  ':hover': {
    opacity: 0.9
  },
  
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
})

export const primary = style({
  backgroundColor: vars.color.primary,
  color: '#ffffff'
})

// 全局样式
globalStyle('body', {
  margin: 0,
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: vars.color.background,
  color: vars.color.text
})
```

```tsx
// 使用
import { themeClass, button, primary } from './styles.css'

function App() {
  return (
    <div className={themeClass}>
      <button className={`${button} ${primary}`}>
        Primary Button
      </button>
    </div>
  )
}
```

## 主题定制

### CSS 变量方案

```css
/* themes/light.css */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-text: #333333;
  --color-background: #ffffff;
  --color-surface: #f8f9fa;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* themes/dark.css */
[data-theme="dark"] {
  --color-primary: #3b82f6;
  --color-secondary: #9ca3af;
  --color-text: #f3f4f6;
  --color-background: #1f2937;
  --color-surface: #374151;
}
```

```tsx
// ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: 'system',
  setTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme
    return stored || 'system'
  })
  
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.setAttribute('data-theme', systemTheme)
    } else {
      root.setAttribute('data-theme', theme)
    }
    
    localStorage.setItem('theme', theme)
  }, [theme])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

### Tailwind 主题

```tsx
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 语义化颜色
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        
        // 背景色
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        
        // 文本色
        text: 'var(--color-text)'
      }
    }
  }
}

// 使用
function Card() {
  return (
    <div className="bg-surface text-text rounded-lg shadow-md p-4">
      <h2 className="text-primary">Title</h2>
      <p className="text-secondary">Description</p>
    </div>
  )
}
```

## 方案对比

| 方案 | 运行时 | 类型安全 | SSR 支持 | 学习曲线 | 适用场景 |
|------|--------|----------|----------|----------|----------|
| CSS Modules | 无 | 一般 | 优秀 | 低 | 传统项目 |
| Tailwind CSS | 无 | 优秀 | 优秀 | 中 | 快速开发 |
| Styled Components | 有 | 一般 | 复杂 | 中 | React 项目 |
| Emotion | 有 | 优秀 | 复杂 | 中 | React 项目 |
| Vanilla Extract | 无 | 优秀 | 优秀 | 高 | 性能优先 |

## 最佳实践

### 1. 选择合适的方案

- **新项目**：Tailwind CSS 或 CSS Modules
- **React 项目**：Tailwind CSS + CSS-in-JS
- **Vue 项目**：Tailwind CSS + CSS Modules
- **性能敏感**：Vanilla Extract

### 2. 命名规范

```css
/* BEM 命名 */
.card {}
.card__title {}
.card__content {}
.card--featured {}

/* 工具类命名 */
.text-center {}
.mt-4 {}
.flex {}

/* 组件类命名 */
.Button {}
.Card {}
```

### 3. 避免过度嵌套

```scss
// 错误：嵌套过深
.page {
  .header {
    .nav {
      .item {
        .link {
          .icon {
            // ...
          }
        }
      }
    }
  }
}

// 正确：扁平化
.page {}
.header {}
.nav {}
.nav-item {}
.nav-link {}
.nav-icon {}
```

### 4. 使用设计系统

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      // ...
      900: '#1e3a8a'
    },
    neutral: {
      50: '#fafafa',
      // ...
      900: '#171717'
    }
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    // ...
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      // ...
    }
  }
}
```

## 延伸阅读

- [Tailwind CSS 官方文档](https://tailwindcss.com/)
- [CSS Modules 规范](https://github.com/css-modules/css-modules)
- [Styled Components 官方文档](https://styled-components.com/)
- [Emotion 官方文档](https://emotion.sh/)
- [Vanilla Extract 官方文档](https://vanilla-extract.style/)
- [Vue.js 实战](./vue.md)
- [React 实战](./react.md)
