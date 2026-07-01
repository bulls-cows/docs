
# 公共请求的封装

可以说是个前端项目都需要封装ajax请求。其实封装的思路都是一样的，要考虑调用方使用是否方便、是否带loading处理逻辑、请求的相对安全性、防网络抖动处理、防同接口同参数请求的快速连续触发、不同的Content-Type等。对于一个新项目，直接封装就好了。对于一个老项目，其实也是可以直接封装的，风险通过code review是能排除掉的（视团队的技术能力），但是只要不是单人项目，就存在可能不让直接动现有的ajax方法的可能性，这时候就需要考虑对原方法进行代理。这段话信息量有点大，下面我们具体展开来说一下。

## 一、调用的便利度

### 1.1、参数数量不宜太多

我见过一些项目里的某些函数会有七八个入参，那简直了，调用的时候很容易错传——谁吃饱了撑的能记住第5个参数和第7个参数分别表示什么意思呢？这对调用这个方法的开发者和阅读这段代码的开发者来说，都是一种折磨。

作为一个请求方法，最多传3个参数，一般传2个参数就足够了。第一个参数表示必传的接口地址，第二个参数表示可选的请求参数，第三个表示可选的一些配置项（如控制是否显示loading动画、修改请求头）。类似下面这样：
```generic
// 这是基础方法，在模块内部使用，不对外暴露
const request = (method, apiUrl, data, config) => {
    // ajax请求的具体实现
}

// 第一个参数表示必传的接口地址，第二个参数表示可选的请求参数，第三个表示可选的一些配置项
export const doGet = (apiUrl, data, config) => request('GET', apiUrl, data, config);
// 第一个参数表示必传的接口地址，第二个参数表示可选的请求参数，第三个表示可选的一些配置项
export const doPost = (apiUrl, data, config) => request('POST', apiUrl, data, config);
```
一般我们只需要有一个get请求和一个post请求的封装就行了。如果有其他需要可以类似的封装doJSONP、doPut等。

这里顺带提一下，上面封装出来的doGet和doPost不是让你直接在具体页面里调用的。作为一个工程项目，接口应该集中定义到一个目录/文件里。类似下面这样：
```generic
import { doGet } from '../utils/request';

// 一个接口前缀对应一个后端服务，将同一个服务提供的接口列到一个文件里
const apiPrefix = '/apiprefix1'
const tryDoGet = (apiUrl) => (data, config) => doGet(`${apiPrefix}${apiUrl}`, data, config);

export doGetApi1 = tryDoGet('url_api1');

export doGetApi2 = tryDoGet('url_api2');
```
然后在具体的业务代码里引用上面的doGetApi1、doGetApi2即可，使用时一般只需要传接口入参即可。

在上面的讨论里，可能有人会有疑问，说我post请求如果想同时传query search参数怎么办？这个问题问得好，确实是可以这样传参数的，这也是为什么axios里传参时会有data和params两个字段可以用，一般人都是get用params，post用data，其实post时同时往data和params里传参是没问题的，所以这种通用性的ajax库肯定要提供这些字段——万一有人就是要这么传参数呢？但是具体到具体项目，这样的情况是很少的，而且是完全可以避免的，所以我们封装方法时，对外只需要提供一个data参数即可，调用者不需要关心这个data实际是在axios里当data用的还是当params用的。

### 1.2、设置合理的默认值

比如，如果需要应用里大部分请求都带loading动画，而封装的方法里是通过一个叫showLoading的布尔值变量来控制的。那么showLoading的默认值就应该为true，个别不需要带loading的场景，由调用方显示地传入showLoading: false的配置即可。这样，对大部分调用的地方，只需要像下面这样写：
```generic
const res = await apiGetSomething(apiUrl, data);
```
只有少数不需要显示loading的地方才需要传第三个参数：
```generic
const res = await apiGetSomething(apiUrl, data, { showLoading: false });
```
## 二、请求的相对安全性

在以前用http的时候，我们会需要多做一些安全方面的处理。现在大家都用https，安全性已经好了很多。但是我还是建议做一下这种处理。没有绝对安全，只有相对安全。而且这种处理的成分是非常小的，对业务开发同学来说也是无感的。

### 2.1、对请求参数整体做一个转换

这样做可以降低入参的可读性，而且这里可以有一个简单的转换规则，服务端相应地反转换时，如果发现入参不是按规则转换过的，说明可能是被攻击了，这时候可以直接返回个404。
```generic
unction request (/* 入参 */) {
    $.ajax({
        // ...
        data: (() => {
            if (requestData instanceof FormData) {
                return requestData
            }
            const d = new Date().getTime()
            return {
                requestTime: d,
                sessionToken: hexMd5((d + '').substring((d + '').length - 8)),
                requestBody: JSON.stringify(requestData)
            }
        })(),
        // ...
    })
}
```
上面这样做确实是很好破解，但是有非正常目的的人已经不太好直接用发请求的客户端（如postman）来调试了，需要写脚本去调试我们的接口了。

### 2.2、密码等敏感字段的加密

业务上可以前后端约定几个字段用来传敏感信息字段，在封装的方法里判断有这些字段时对其进行加密处理后再上传。注意，这里的加密只是为了不明文传输。并不等价于，而且也不能等价于落到数据库里的密码。

## 三、loading动画的处理

### 3.1、计数器

假设默认情况下请求需要带loading动画。如果我们每个请求开始的时候显示loading动画，然后结束的时候关闭loading动画，这样是最简单的，不过这样会有个问题。如果你的loading动画是个单例模式，然后你并行请求A和B两个接口，这样就有可能A和B都请求后，A先返回了接口后关闭了loading，此时B请求还没结束，但是页面上已经没有loading动画了。这显然不是我们想要的交互体验。

解决方案就是用计数器，除了调用者显示地传入showLoading: false配置项，否则默认每个请求触发时给计数器加1（初始值为0），请求结束时给计数器减1。当计数器从0增加到1时开启loading动画，当计数器从1减少到0时关闭loading动画。

### 3.2、延迟关闭

另外还有一种场景，假设我们需要先请求A，然后等A请求结束后紧接着请求B接口（比如B接口依赖A接口返回的数据）。这样如果按上面的计数器方案，还是会有一点瑕疵。因为会出现：loading出现，loading消失，loading马上又出现，loading消失。我们希望对于紧挨着的请求，loading只出现一次，只消失一次。

解决方案也很简单，就是延迟关闭，这个延迟时间设置短一点就可以了，只要足够让loading连续不中断即可。设置得太长会导致只有一个请求时用户也要等很久。

## 四、防网络抖动

这个处理需要前后端协同。

### 4.1、前端生成唯一ID

对于不需要考虑单个用户同时操作多个终端的场景（这个场景很少，基本是可以忽略的）。前端可以生成类似UUID作用的唯一性ID——用userId拼接时间戳再拼接一个单客户端里单调递增的全局ID（每次自增1）。然后在前端的请求里带上这个uid公参到服务端，这样服务端就可以判断如果相同参数的请求，处理完一次后在紧接着的一个较短的时间内不再处理来自前端的相同参数的请求。

这种前端生成uid的方案，如果像上面说的那样带入了一个单客户端里单调递增的全局ID（每次自增1）的话，后期拓展一下就可以实现复现<span style="color: #ff0000;">用户端接口请求顺序</span>的功能（用户触发接口请求的顺序和服务端接收到接口请求的顺序不是完全对应的）。

### 4.2、服务端生成唯一ID

和上面说的其实差不多，主要区别就是这个唯一ID是前端请求服务端获取的（当然也可以在获取后拼接一个前端单客户端全局单调递增的ID）。

## 五、防请求被连续触发

这里指的是不要连续触发相同的请求，不是连续多个相同参数请求被触发后如何避免重复处理的事情。比如指定一个时间段内同一个接口相同参数的请求默认只允许其触发一次（可通过配置项关闭该逻辑）。这个也有2种方案：

### 5.1、按钮侧进行节流控制（这个和本文所要讲的接口请求封装没关系）

注意是节流，不是防抖。经常可以看到有朋友会在按钮的点击事件回调里写一段防抖的逻辑。像下面这样（需要在Vue的beforeDestroy或者React的componentWillUnmount等钩子里做下timer定时器的清除逻辑，这里就不写了）：
```generic
/**
 * 这里是示意版。
 * 如果你用vue，这个timer可以放在data里，onClick可以放在methods里，。
 * 如果你用react，这个timer可以放在组件类的实例上（不建议放在state里，因为不需要触发页面渲染），onClick也直接放在类实例上
 */
let timer = null;

function onClick() {
    if (timer) {
        clearTimeout(timer);
        timer = null;
        return;
    }
    timer = setTimeout(() => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            return;
        }
        doSomething();
    }, 300);
}
```
这样会影响用户体验的，虽然用户的确没法快速触发两次请求了，但是用户第一次点击的时候也要等一段时间才执行，这个等待是完全没必要的。其实只要简单一改，就可以达到不影响用户体验的情况下达到相同的效果：
```generic
let timer = null;

function onClick() {
    if (timer) {
        return;
    }
    timer = setTimeout(() => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            return;
        }
    }, 300);
    doSomething();
}
```
### 5.2、在接口侧进行节流控制

实现方案就是先const map = new Map()。然后在触发请求时，用接口url和入参拼接成一个专属的key，然后在map.set(key, timer)，这里的timer就是一个针对该url和入参的定时器。当下一次有请求触发时，在这个map里找是否存在对应的timer，有的话就直接忽略不触发请求即可，没有的话就正常触发请求并更新这个timer。当timer到时间执行具体内容时记得清楚这个key即可。

如果不需要所有请求都做这种处理，可以在请求侧传入一个配置项来控制是否要触发/取消这种处理逻辑。

## 六、接口分级

如果只是为了控制一个配置项，那么直接传就好了，但是如果我们想针对不同重要级别的接口来影响好几个配置项，每次都传好几个配置项就太麻烦了，如果有这样的场景就会涉及到接口分级。

比如我们现在有个需求，希望将接口分为重要、一般、不重要三个层级。

1. 重要的接口：请求要带loading动画，出错时要将报错文案提示给用户，并且要在前端侧将错误日志上报，超时时间设置为30秒。
2. 一般的接口：同重要的接口，但是超时时间设置为10秒。
3. 不重要的接口：请求不用带loading动画，出错时不用提示文案，也不用在前端侧上报接口错误日志（在服务端自己的错误日志里体现即可），超时时间设置为10秒。像请求广告图片地址的接口就属于不重要的接口。

如果每个调用侧都传showLoading、handleError、reportError、timeout四个字段，就会很麻烦，可以直接传一个apiLevel字段（传1、2、3，默认为2）。

## 七、不同的Content-Type

常见的几种情况都需要在封装时考虑到。主要是：

1. application/json：一般是传非FormData实例的post请求。
2. application/x-www-form-urlencoded：这个get和post请求都挺常见，不过get请求用这个的最常见。
3. multipart/form-data; boundary=blablabla：一般是要传FormData实例的post请求。
