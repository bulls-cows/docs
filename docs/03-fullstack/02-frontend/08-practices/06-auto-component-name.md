# 组件 name 自动注入方案

## 一、背景

Vue 组件的 `name` 属性有以下用途：

- Vue Devtools 的组件树显示依赖它，否则显示为 `AnonymousComponent`
- `keep-alive` 的 `include`/`exclude` 匹配依赖它
- 递归组件的自身引用依赖它

但组件名几乎总是等于文件名。需要说明的是，组件名不一定等于文件名，有些人习惯使用 `index.vue` 这类通用文件名，此时需要将父目录名（甚至更多的层级）纳入组件名来增加区分度。

**后文出于简化考虑，默认组件名等于文件名**。手动编写属于重复劳动。项目里组件数量一多，漏写的情况时有发生。既然组件名就等于文件名，这个逻辑完全可以自动化。

## 二、核心逻辑

自动注入的核心思路是：在文件被编译前，从文件路径提取文件名作为组件名，检查组件是否已定义 name，若未定义则自动追加。

```js
const filePathRegex = /src\/exampleUI\/components\/.+\.vue$/

function injectComponentName(source, id) {
  if (!filePathRegex.test(id)) return source

  const componentName = id.match(/[a-zA-Z]+(?=\.vue)/)?.[0] || ''
  const hasNameDefine = /<script lang="ts">/.test(source)

  if (hasNameDefine) return source

  const nameBlock = `<script lang="ts">
export default {
  name: '${componentName}',
}
</script>`
  return source + nameBlock
}
```

核心逻辑分三步：

**第一步，限定范围**。通过 `filePathRegex` 只处理 `src/exampleUI/components/` 目录下的 Vue 文件，避免影响到业务页面和第三方组件。

**第二步，提取组件名**。`id.match(/[a-zA-Z]+(?=\.vue)/)` 从文件路径中匹配出文件名部分，例如 `Button.vue` → `Button`，`Tabs.vue` → `Tabs`。

**第三步，判断并注入**。检查源码中是否存在 `<script lang="ts">`（注意不含 `setup`），如果存在说明已定义 name，跳过；否则将 name 定义以第二个 `<script>` 块的形式追加到文件末尾。

## 三、关键细节：双 script 块共存

Vue 3 中 `<script setup>` 可以和普通 `<script>` 同时存在。普通 `<script>` 专门用于处理 setup 里做不了的事，比如定义 `inheritAttrs`，也包括 `name`。插件生成的效果如下：

```vue
<template>
  ...
</template>

<script lang="ts" setup>
// 组合式逻辑
</script>

<script lang="ts">
export default {
  name: 'Button',
}
</script>
```

这种写法在 Vue 3 运行时会将两个 script 块合并成一个组件定义。

## 四、通过 Vite 插件落地

将上述核心逻辑封装为 Vite 插件。利用 `transform` 钩子在模块编译前拦截源码，设置 `enforce: 'pre'` 确保在其他编译步骤之前执行：

```js
export default function exampleUiPlugin() {
  return {
    name: 'example-ui-plugin',
    enforce: 'pre',
    transform(src, id) {
      if (!filePathRegex.test(id)) return null

      const componentName = id.match(/[a-zA-Z]+(?=\.vue)/)?.[0] || ''
      const hasNameDefine = /<script lang="ts">/.test(src)

      if (hasNameDefine) return null

      const nameBlock = `<script lang="ts">
export default {
  name: '${componentName}',
}
</script>`
      return {
        code: src + nameBlock,
        map: null,
      }
    },
  }
}
```

将插件注册到 `vite.config.ts` 后，所有目标目录下的组件都会自动拥有正确的组件名：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import exampleUiPlugin from './plugins/example-ui-plugin'

export default defineConfig({
  plugins: [vue(), exampleUiPlugin()],
})
```

插件本身的代码量很少——核心逻辑只有三步，三十行不到。关键在于利用 `enforce: 'pre'` + `transform` 钩子这个组合，在编译入口处完成了组件名的自动注入。
