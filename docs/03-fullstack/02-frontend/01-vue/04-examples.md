
# 实战案例

## 数据表格组件

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

## 表单验证

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

## 延伸阅读

- [Vue.js 实战](./index.md)
- [组件设计模式](./01-component-patterns.md)
- [自定义指令](./05-directives.md)
