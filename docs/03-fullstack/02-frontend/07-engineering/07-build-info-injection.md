# 编译信息注入方案

## 一、背景

线上排查 bug 时，最常遇到的一个问题是：当前环境跑的是哪个版本的代码？本地无法复现的 bug，可能是版本没部署到位，也可能是缓存没更新。如果能一眼看出当前环境的编译时间和代码版本，排查效率会高很多。

编译信息注入做的事情就是在编译时将构建时间和版本标识写入 HTML，开发者和运维人员通过控制台或页面源码就能直接确认版本。

## 二、工具函数

### 2.1、时间格式化

```js
const getDateTimeString = () => {
  const now = new Date()
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return [
    [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-'),
    [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(':'),
  ].join(' ')
}
```

输出格式为 `YYYY-MM-DD HH:mm:ss`，例如 `2026-07-01 14:30:25`。

### 2.2、版本标识获取

```js
import { execSync } from 'child_process'

const getBranchOrTagName = () => {
  // CI/CD 环境下通过流水线注入环境变量
  if (process.env.BUILD_VERSION) {
    return process.env.BUILD_VERSION
  }

  // 本地开发通过 git 命令获取
  try {
    return execSync('git symbolic-ref --short -q HEAD').toString().trim()
  } catch {
    // 非分支状态（如 detached HEAD），尝试获取最近的 tag
  }

  try {
    return execSync('git describe --tags').toString().trim()
  } catch {
    return ''
  }
}
```

采用三层兜底策略：

1. **环境变量 `BUILD_VERSION`**：为 CI/CD 准备，Docker 等构建环境不一定有 git，通过流水线注入最可靠。
2. **`git symbolic-ref --short -q HEAD`**：获取当前分支名，适用于本地开发。
3. **`git describe --tags`**：detached HEAD 状态下的 fallback，获取最近的 tag 名。

从最精确到最模糊，确保任何构建环境下都能拿到可用的版本标识。

## 三、核心逻辑

整个方案由三个注入点组成，分别对应不同的使用场景。

### 3.1、全局变量注入

在 HTML 中放置一个 `<script id="globalVariables">` 占位标签，编译时在其内插入定义全局变量的实际脚本：

```js
const GLOBAL_BUILD_TIME = getDateTimeString()
const GLOBAL_APP_VERSION = getBranchOrTagName()

const textInsideScriptTag = [
  `window.GLOBAL_BUILD_TIME = '${GLOBAL_BUILD_TIME}';`,
  `window.GLOBAL_APP_VERSION = '${GLOBAL_APP_VERSION}';`
].join("");
html = html.replace(
  '<script id="globalVariables"></script>',
  `<script id="globalVariables">${textInsideScriptTag}</script>`
)
```

效果：在浏览器控制台中输入 `window.GLOBAL_BUILD_TIME` 和 `window.GLOBAL_APP_VERSION` 即可查看。

### 3.2、HTML 占位符替换

将 HTML 中的 `${buildTime}` 占位符替换为编译时间，常用于静态资源的版本号拼装：

```js
html = html.replace(
  /\$\{buildTime}/g,
  GLOBAL_BUILD_TIME.replace(/[- :]/g, '')
)
```

说明：`replace(/[- :]/g, '')` 去掉时间中的横线和冒号，生成紧凑的数字串。

### 3.3、data-build 属性标记

在 `<html>` 标签上添加 `data-build` 属性，便于运维脚本通过正则匹配直接获取版本信息，无需打开浏览器：

```js
const buildInfo = [GLOBAL_BUILD_TIME, GLOBAL_APP_VERSION].join(' ')
html = html.replace(/<html([^>]*)>/, `<html$1 data-build="${buildInfo}">`)
```

`data-*` 属性是标准做法，不影响页面渲染，同时可通过 DOM 直接访问。

## 四、通过 Vite 插件落地

上述三部分逻辑可以封装在 Vite 的 `transformIndexHtml` 钩子中。这个钩子专门处理 `index.html`，是 HTML 级别的操作，不像 `transform` 那样需要关注文件范围：

```js
import { getBranchOrTagName, getDateTimeString } from '../utils.mjs'

export default function htmlPlugin() {
  return {
    name: 'html-plugin',

    transformIndexHtml(html) {
      const GLOBAL_BUILD_TIME = getDateTimeString()
      const GLOBAL_APP_VERSION = getBranchOrTagName()

      const textInsideScriptTag = `window.GLOBAL_BUILD_TIME = '${GLOBAL_BUILD_TIME}'; window.GLOBAL_APP_VERSION = '${GLOBAL_APP_VERSION}';`
      html = html.replace(
        '<script id="globalVariables"></script>',
        `<script id="globalVariables">${textInsideScriptTag}</script>`
      )

      html = html.replace(
        /\$\{buildTime}/g,
        GLOBAL_BUILD_TIME.replace(/[- :]/g, '')
      )

      const buildInfo = [GLOBAL_BUILD_TIME, GLOBAL_APP_VERSION].join(' ')
      html = html.replace(/<html([^>]*)>/, `<html$1 data-build="${buildInfo}">`)

      return html
    },
  }
}
```

将插件注册到 `vite.config.ts` 后，每次构建都会自动在 HTML 中嵌入编译时间和版本信息：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import htmlPlugin from './plugins/html-plugin'

export default defineConfig({
  plugins: [vue(), htmlPlugin()],
})
```
