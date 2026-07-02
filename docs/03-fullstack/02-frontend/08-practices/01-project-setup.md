
# 从零搭建一个前端项目

如果你要从头开始搭建一个新的前端项目，你会考虑哪些方面呢？本文视图以实际创建一个前端项目所经历的时间线为行文顺序，讲讲我一般会考虑的点，不权威，仅供参考。

## 一、技术选型

见[《前端技术选型可能会考虑的一些点》](https://www.orzzone.com/decide-frontend-skill.html)。

## 二、项目设计时要考虑的问题

这里构建工具以Webpack为例，项目就是普通的业务需求项目，而非写个库之类的技术项目。我不太喜欢那种把webpack配置都隐藏起来的cli，不过现在趋势好像都是这样，如果用的是react的官方cli（[Create React App](https://create-react-app.dev/)），我就会先跑一下`npm run eject`把隐藏的配置给弄出来，我觉得这样比较直观。如果你没有强烈的定制意图，或者你比较喜欢个人配置和脚手架配置分离然后到node_modules里找对应的配置对照着调整，你可以不这么做。

现在我们一步步开始我们的项目。

### 2.1、调整目录结构

那些cli创建的初始项目都是有一些目录结构的，通常我们还需要按自己的喜好调整一下。我一般会做如下调整：

- 项目根目录下新建一个build目录，用来放一些脚本，构建、部署、检测等的都放这里。
- 项目根目录下新建一个docs目录，可以存放一些markdown文档。需求迭代开发时，记录一些备忘事项（如UI链接、需求文档链接等），会比较方便。
- 项目根目录下确保有一个README.md，没有则新建之。
- src下新建一个apis目录，用于放接口api。
- src下新建一个pages目录，用于放各种页面组件。这里切记页面组件的路径（含文件名）一定要有规律，要能和非页面组件区分开来，这对我们后面要提到的webpack优化会带来方便。
- src下新建一个scripts目录，预建文件`Utils.js`、`Request.js`、`Storage.js`、`Jump.js`。
- src下新建一个constants目录，预建文件`ResponseCode.js`。
- src下新建一个models目录，用于存放各种接口响应的model类文件（见后文说明）。
- 如果你的项目经常需要改产物环境配置的话，新建一个不走webpack编译直接复制到产物里的环境变量文件。

### 2.2、安装依赖

见[《浅谈项目中node和依赖包的版本管理》](https://www.orzzone.com/version-management-node-package.html)。

### 2.3、代码风格检测

见[《约束团队代码风格，提高代码质量》](https://www.orzzone.com/team-code-style-lint-quality-maintenance.html)。

### 2.4、部署脚本

如果你在一些缺少基建的团队里（需要有这些基建但是暂时没有），或者你要写的项目是你给你父母的店弄的（没必要上部署相关的基建设施，上了反而麻烦）。你就需要在package.json的scripts里再加一个字段（这里稍微简化了下，实际视你的偷懒程度，你可能需要加`deployToTest`、`deployToProduction`、`deployToBoth`、`buildAndDeployToTest`、`buildAndDeployToProduction`、`buildAndDeployToBoth`）：

- npm run deploy：发布代码。

贴一下可以参考的代码：

```js
const path = require('path')
const Client = require('ssh2-sftp-client')
const {NodeSSH} = require('node-ssh')

const ssh = new NodeSSH()

const join = (relativePath) => path.join(__dirname, '..', relativePath)

const sshConfig = {
  host: '111.222.33.444',
  port: '22',
  username: 'username',
  password: 'password',
}

async function restart () {
  try {
    await ssh.connect(sshConfig)

    await ssh.exec('node -v && npm run pm2:restart', [], {
      cwd: '/target-path/client',
      onStdout(chunk) {
        console.log( chunk.toString('utf8'))
      },
      onStderr(chunk) {
        console.log(chunk.toString('utf8'))
      },
    })
    console.log('发布结束');
    process.exit(0)
  } catch (err) {
    throw err
  }
}

async function main() {
  const client = new Client()
  try {
    await client.connect(sshConfig)
    client.on('upload', info => {
      console.log(`已上传文件：${info.source.replace(join('/dist'), '')} ==> ${info.destination}`)
    })
    await Promise.all([
      client.uploadDir(join('/.next'), '/target-path/client/.next'),
      client.uploadDir(join('/src/theme'), '/target-path/client/src/theme', /\.nothingButGenerateSrcThemeFolder/),
    ])
    await Promise.all([
      '/package.json',
      '/package-lock.json',
      '/.npmrc',
      '/next.config.js',
      '/next-antd.config.js',
      '/src/theme/antd.less',
    ].map((filePath) => client.fastPut(join(filePath), `/target-path/client${filePath}`)))
  } finally {
    await client.end()
  }
}

main()
  .then(() => {
    restart().catch((err) => {
      setTimeout(() => {
        throw err
      }, 0)
    })
  })
  .catch(err => {
    setTimeout(() => {
      throw err
    }, 0)
  })
```

上面的代码里，main方法是上传文件用的，正常一个纯前端静态项目只需要参考这个main方法即可。restart没删掉只是供一些需要部署完静态文件后再运行相关命令的人参考（通常是部署一些服务），如果你的项目是纯前端静态项目的话直接忽略即可。

### 2.5、基础设施封装

项目目录结构确定好了，基本的命令也都加好了，现在我们就开始要写一些基础设施相关的东西了。我觉得比较重要的一些基础设施有下面这些。

#### ①、基础弹框

alert、confirm、toast、loading。这几个是很常用的，不一定要自己写，可以直接用一些三方库，但是一定要包一下，不要让后期同事们开发时需要在每个页面里直接调用第三方的API。

这里封装时除了直接功能的一个封装，建议再封装一个用来处理连续多次调用的版本。针对多次调用版本，alert、confirm、toast可以算一类，loading单独算一类。

alert、confirm、toast的连续调用版本优先级一般不高，先不封装也没事。一个弹框消失后显示下一个，这种我没封装过，可以弄个队列自己尝试下，或者网上找代码参考下。

loading的连续调用版本和上面的不太一样，loading不需要一个loading结束显示下一次，也不需要同一时间显示多个，所以需要弄个计数器，调用doLoading方法时传入boolean参数，如果为true就把计数器增1，为false就把计数器减1，当计数器从0增加到1后开启loading动画（1变2、2变3这些都不涉及loading动画的处理），当计数器从1减少到0的时候把loading动画关掉。另外可以考虑给loading动画的持续显示时间设置一个最小值和最大值，设置最小值是为了避免一个黑影从屏幕前一闪而过用户都不知道刚才的是个loading动画的问题，设置一个最大值是为了避免类似这样的尴尬：代码逻辑上有bug导致计数器迟迟没减到0，用户无法继续操作页面。

#### ②、页面跳转

先来看几行代码。

```generic
location.href = 'https://www.google.com'

location.replace('https://www.google.com')

this.$router.push({ path: '/page1' })

this.$router.replace({ path: '/page1', query: { a: '1' } })
```

像这种页面跳转的方法，非常容易出现在业务代码里。这种代码很短，容易觉得不需要封装，但是建议还是做一个封装。

- 因为很可能某一天会出来一个需求，让在单页应用内部跳转页面时在顶部显示一个假的加载进度条。
- 因为很可能某一天会出来一个需求，用户从不同渠道访问我们的项目时，着陆页url上会带一个渠道号，这个渠道号需要在后续的接口请求中透传给服务端同学。你当然可以考虑缓存之类的方法去存这个渠道号，问题是你知道什么时候清除这个渠道号吗？用户刷新页面时url上没有渠道号，但是本地缓存数据里有渠道号时，究竟哪个是真相？最简单的方案就是每次跳转页面时都在url上带上这个渠道号，这样真相永远就只有一个，也不用去考虑是否要清缓存之类的事情。

封装后的代码建议直接单独建一个`src/scripts/Jump.js`文件专门存放，一来可以增加这块代码的存在感，**二来方便强制校验，只需要判断这个文件之外如果存在类似上面那几种代码就直接process.exit(1)退出编译**。

#### ③、接口请求

这块单独建一个文件`src/scripts/Request.js`。

首先功能上要先封装一个基础版本的请求方法，这个方法是给其他方法用的，不需要对外暴露出去。方法伪代码如下。其中url是请求地址，data是上行参数，options是写业务代码时传的一些业务参数（比如是否显示loading动画），config则是一些底层配置，直接影响我们的封装方法内部的一些实现（开发业务时一般不用考虑这个参数）。

```generic
const request = async (url, data, options, config) => {
  // do something here
}
```

然后基于上面的基础方法，我们来封装对应的需要对外暴露的请求方法，供开发业务时使用。

```generic
const doGet = async (url, data, options, config = {}) => {
  return request(url, data, options, {
    method: 'GET',
    contentType: 'blabla',
    ...config,
  })
}

const doPost = async (url, data, options, config = {}) => {
  return request(url, data, options, {
    method: 'POST',
    contentType: 'blabla',
    ...config,
  })
}
```

这几个方法里第四个参数config虽然一般开发业务时不需要管这个参数，但还是要对外暴露一下。这里重点是contentType需要有调整，如果这里doPost大部分时候contentType用的是application/json这种，上传文件的时候一般就需要修改一下了，这种情况就需要传config参数来调整下。

另外，如果在封装loading方法时没做计数器处理的话，接口请求这里就需要做一下计数器处理。这里就不赘述了。

#### ④、缓存方法

这里有两点，一个是你的应用里如果有全局状态机的话（vuex、redux），最好支持下对里面部分字段做一个数据本地持久化（如果是vue的话可以参考npm仓库里vuex-persist这个包的使用）。另一个就是封装单独的缓存方法，见下文。

这块单独建一个文件`src/scripts/Storage.js`。注意事项有：

- **慎用会影响其他项目的方法。**可以在`npm run lint`时强制校验如果src下有localStorage.clear这种API时就直接报错（确有需要的地方后续加白名单）。
- **进一步减少影响其他项目数据/自己数组被影响的可能性。**同一个域名下可能会有不止一个项目——即便现在只有一个项目，未来也随时可能会多出来一个新项目。所以，一开始就需要考虑一些跨项目的事情（这点并不局限于缓存这块）。比如用localStorage做缓存时，key名上最好能体现出对应的应用，比如`app1:module1:page1`或者直接`app1`。如果要做一个跨项目共用的缓存数据，可以虚拟一个叫`common`的应用名。
- **封装的缓存方法要支持传一个有效期时间。**
- **禁止其他地方直接调用原生/三方api。**在检测脚本里检测下如果有在这个问价之外手写诸如localStorage、sessionStorage对象来调用其API的场景就报错终止。这样如果后续需要把localStorage换成localforage，或者如果是混合APP要在APP内使用APP提供的存储方法时，都要方便很多。
- **注意localStorage这种缓存的大小是有限制的。**一般是2.5M~5M左右。所以要try catch处理一下。不要影响页面功能。

## 三、其他注意事项

### 3.1、减少重复代码

对于一段经常被重复的代码：

- 如果代码行数很多，大部分人都会得出倾向于需要封装的结论；
- 如果代码行数很少，有些人会觉得需要封装，有些人会觉得不需要封装（过度封装是没意义的），不同人得出的结论差异可能就会比较大，这和每个人的经验或多或少有些关系。

这里我们以apis目录下请求方法的书写为例：

```generic
const apiPrefix = '/apis/'

export const api1 = (params) => doGet(`${apiPrefix}url1`, params)
export const api2 = (params) => doGet(`${apiPrefix}url2`, params)
export const api3 = (params) => doGet(`${apiPrefix}url3`, params)
export const api4 = (params) => doGet(`${apiPrefix}url4`, params)
export const api5 = (params) => doGet(`${apiPrefix}url5`, params)
export const api6 = (params) => doGet(`${apiPrefix}url6`, params)
export const api7 = (params) => doGet(`${apiPrefix}url7`, params)
```

这种返回一个函数的函数，可以封装成高阶函数再去调用，修改后的代码如下：

```js
const apiPrefix = '/apis/'
const requestGet = (url) => (params) => doGet(`${apiPrefix}${url}`, params)
export const api1 = requestGet('url1')
export const api2 = requestGet('url2')
export const api3 = requestGet('url3')
export const api4 = requestGet('url4')
export const api5 = requestGet('url5')
export const api6 = requestGet('url6')
export const api7 = requestGet('url7')
```

一开始搭建项目时，就需要在apis目录里起个头这样写，这样后续其他同事开发业务是就会参考这样的写法来写其他接口请求了。

### 3.2、加钩子

比如在React项目里导出页面组件时用一个统一的高阶函数处理下，这样后面可以很方便地做一些特定需求。比如原生导出的是这样的一个页面：

```generic
class PageComponent extends Component {
  render () {
    return (
      <div>Hello</div>
    )
  }
}

export default PageComponent
```

然后我们的高阶函数长这样：

```generic
export const generatePage = (pageComponent) => {
  return class NewPageComponent extends Component {
    componentDidMount () {
      // you do do something here
      const pageTitle = this.props.route.pageTitle
      pageTitle && addWebTitle(pageTitle)
    }

    render () {
      return (
        <div>
          <pageComponent {...this.props} />
        </div>
      )
    }
  }
}
```

这样就可以自动读取配置路由时配置的页面名来自动更新浏览器tab上显示的页面名。其他一些合适的逻辑也可以后续加到这个地方。如果业务一开始没有什么需要加的逻辑，这个高阶函数里可以啥都不干，传进来查就返回出去啥。这里仅做一个预留。

### 3.3、models目录说明

前面有提到一个目录，叫models。这个是用来存放各种接口响应内容的model。有时候接口返回的数据我们需要对其进行二次处理，而这部分代码通常都比较"脏"，可以单独拿出来，另外，如果所有涉及同一个接口的这些处理都被集中到一个地方，后续对我们不看接口文档直接了解响应数据的格式以及预留供以后做一些接口数据mock都会带来一定的便利性。

```generic
export default class ModelResponse {
    rawData = null
    code = null
    desc = null
    body = null
    timestampServer = null

    constructor(model) {
        this.rawData = model
        this.code = $hb.HbString.getString(model?.code)
        this.desc = $hb.HbString.getString(model?.desc)
        this.body = model?.body
        this.timestampServer = $hb.HbString.getString(model?.timestampServer)
    }

    // 判断数据是否是空的（还未被填充）
    isEmpty () {
        return this.getRawData() == null
    }

    getRawData () {
        return this.rawData
    }

    getCode () {
        return this.code
    }

    getDesc () {
        return this.desc
    }

    getBody () {
        return this.body
    }

    getTimestampServer () {
        return this.timestampServer
    }
}
```

然后其他具体的model继承上面的这个类：

```generic
import ModelResponse from "./ModelResponse";

export default class ModelQueryMemberLevelInfo extends ModelResponse {
    getSomeData () {
        return handleSomeData(this.getRawData()?.body?.data?.someValue)
    }
}
```

### ~~3.4、混合APP注意事项~~

~~有时间的话即兴发挥。~~

### ~~3.5、数据mock~~

## 四、补充意见汇总

分享后有一些补充意见，汇总一下，集思广益。

### 4.2、webpack优化

网上搜"webpack 优化"可以搜到很多常规优化方案，那些就不在这里赘述了，后面单独写个汇总的。这篇文章写到这里，wordpress已经提示我有16000多个字了，篇幅太长了。这里贴几个网上不太有的、**效果拔群的方案（注意这几个方案互相之间是没冲突，可以共存的，共存后的效果还没统计过所以没有实际数据可以看，这几个方案和网上的常规webpack优化方案之间也是没有冲突的，都可以加到一起）。**

**注：下面前2个方案里提到的时间是加上了html-webpack-plugin从版本2升级到版本3带来的收益的。**

#### 4.2.1、本地开发时去掉页面路由懒加载

vue项目里创建页面路由时，将类似下面这样的代码：

```generic
function createRoute(name) {
    return {
        path: `/${name}`,
        name,
        component: () => import(
            /* webpackChunkName: "[request]" */
            `../pages/${name}`
        ),
    };
}
```

改成下面这样：

```generic
function createRoute(name) {
    return {
        path: `/${name}`,
        name,
        component: () => import(
            /* webpackChunkName: "[request]" */
            /* webpackMode: "WEBPACK_MODE" */
            /* webpackInclude: /\.vue$/ */
            `../pages/${name}`
        ),
    };
}
```

这里我们注意下webpackMode，产线我们每个页面都是一个懒加载的js文件，实际对应的就是webpackMode: "lazy"，然后一般项目里都不会对这个字段区分dev和build，就导致本地开发时也会进行了懒加载，如果本地开发时使用webpackMode: "eager"，去掉懒加载，就可以显著提高编译时间。最近一个项目里的提升大概是**dev的热更新时间从12秒提升到2秒的样子**。上面代码里webpackMode的值需要我们写个webpack-loader去自动替换下。

#### 4.2.2、require、import资源时限制其范围

这就是本文开头提到页面组件要能和非页面组件区分开来的原因之一。比如下面这样的代码：

```generic
function createRoute(pageName) {
    return {
        path: `/${pageName}`,
        name,
        component: () => import(
            /* webpackChunkName: "[request]" */
            `../pages/${pageName}`
        ),
    };
}
```

将其修改为下面这样的代码（前提是页面组件的名字都是.page.vue结尾的）：

```generic
function createRoute(pageName) {
    return {
        path: `/${pageName}`,
        name,
        component: () => import(
            /* webpackChunkName: "[request]" */
            `../pages/${pageName}.page.vue`
        ),
    };
}
```

这样也能显著降低编译时间（dev和build的时间都会显著降低）。最近碰到的一个项目，因为页面组件和非页面组件没有一个很好写的统一的规则可以区分，所以直接将类似createRoute这样的方法去掉（放着不调用也会有影响的，一定要注释掉或者删掉），然后在调用的地方直接硬编码对应的页面配置，类似把下面这样的代码：

```generic
const routes = [
    // other pages
    createRoute('page1'),
    // other pages
]
```

都替换换成下面这样：

```generic
const routes = [
    // other pages
    {
        path: `/page1`,
        name: 'page1',
        component: () => import(/* webpackChunkName: "requestIndexPage" */ '../pages/page1'),
    },
    // other pages
]
```

在最近一个项目里试下来的实际效果也是**本地dev时热更新时间有12秒降低到2秒**。

#### 4.2.3、升级node版本

公司有个项目，同事用了个错误的node版本，然后编译体验就很好，**实际效果是本地热更新时间由12秒干到2秒**。这个不只是对热更新，其实对dev和build都是有效果的，没测量过。

### 4.3、选型时考虑一些其他事

备注1：如果用vue的话撸起袖子直接上nuxt.js怎么样，即可以开发纯前端项目，也可以开发需要前后端同构支持seo的项目？

备注2：考虑一些开发构建体验上的问题（这块后面单独写吧，webpack一篇，vite的一篇）。
