
# 按钮点击回调的节流处理

## 一、应用场景

有这么一些可能发生连续点击的场景：

1. 极快的连击：用户可能以为只点击了一次但是实际上发生了快速的连击。
2. 较快的连击：用户实际上是比较慢的触发了连续的点击，但是因为比如接口返回的速度比较快导致虽然请求有带loading动画但是请求很快就结束了loading也就随之结束了然后用户又点了下按钮，或者请求本身就没带loading，用户在请求还没结束前就可能又点了下按钮。
3. 很慢的连击：用户点击后去上了个厕所，界面还停留在刚才的地方，上完厕所回来后忘记了刚才是否有点击过按钮了，于是又点击了一下。

第三种情况从<span style="color: #000000;">按钮层面</span>去处理会涉及到一个变量状态的维护，而且这种场景很大情况下已经不能算前端程序问题了。如果要处理这种情况，建议是从接口层面去做接口地址和参数组合的重复性判断，如果相同接口和最近一次的请求触发的参数一样，并且上一次请求是成功的，可以弹框提示用户进行二次确认后再提交。这个弹框的确定和取消按钮对应一个promise的resolve和reject，就可以直接封装到ajax请求方法里了。

所以，本文不考虑很慢的连击的场景。

## 二、节流函数

直接抛代码。这段代码的入参和setTimeout的入参是反过来的，先传时间再传回调函数（也可以不传时间直接传回调函数，这样会用一个默认的时间）。然后如果传入的函数的返回值是Promise的实例，则await等待一下它，同时也await一个promise化的timeout，当其中一个被reject或者两个都被resolve时才允许下一轮的执行（也就是说如果回调函数是一个接口请求的promise，我们传的时间入参是2000毫秒，那么如果接口返回速度很快，用户也要在2秒后才能触发下一轮的执行，不容易触发连击）。

```js
/**
 * 对函数进行节流处理（可以只传回调函数）
 * @param lazyMilliseconds [number] 延迟时间（单位：毫秒），可以不传
 * @param fn [function] 回调函数
 * @returns {(function(): Promise<void>)}
 */
const DEFAULT_LAZY_MILLISECONDS = 2000;
export const throttle = (lazyMilliseconds, fn) => {
    // 参数预处理
    if (typeof lazyMilliseconds === 'function') {
        fn = lazyMilliseconds;
        lazyMilliseconds = DEFAULT_LAZY_MILLISECONDS;
    }
    lazyMilliseconds = lazyMilliseconds || DEFAULT_LAZY_MILLISECONDS;

    // 参数校验
    if (typeof fn !== 'function') {
        throw new Error(`slow函数的入参fn应为函数，但是实际收到的是${typeof fn}类型的入参`);
    }
    if (typeof lazyMilliseconds !== 'number') {
        throw new Error(`slow函数的入参lazyMilliseconds应为数字，但是实际收到的是${typeof lazyMilliseconds}类型的入参`);
    }

    let timer = null;
    const context = this;
    // 返回包装后的函数
    return async function() {
        if (timer) return;
        const returnVal = fn.apply(context, Array.from(arguments));

        // 如果返回值是Promise实例，在其还处于pending状态时不应该允许二次触发fn函数
        if (returnVal instanceof Promise) {
            timer = 1024; // 随便给个数字
            try {
                /**
                 * 当promise结束且指定的等待时间已过，才允许下一次执行fn
                 * 1、当lazyMilliseconds时间已到，但是promise的pending状态还未结束时，也禁止下一次执行fn
                 */
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, lazyMilliseconds));
                // 当returnVal被reject时，或者returnVal和timeoutPromise都被resolve时，Promise.all的状态才会变成reject或者resolve
                await Promise.all([returnVal, timeoutPromise]);
            } finally {
                timer = null;
            }
            return;
        }

        // 如果返回值不是promise就正常按设定的延迟时间来
        timer = setTimeout(() => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }, lazyMilliseconds);
    };
};
```

这其实就是一个高阶函数（返回函数的函数）。跟节流按钮组件相比，这种方式的适用性更广。比如纯文本内容的确认框，其实我们是不用常规的显示组件的方式去写的，那些写起来太繁琐——毕竟使用的地方太多了。而且对比按钮组件，在重构老项目时，使用节流函数也会更方便一些。举个例子，我们可能会这样封装确认框：

```js
Vue.prototype.$doConfirm = params => {
    let message;
    let title;
    let options;
    if (typeof params === 'string') {
        message = params;
    } else {
        message = params.message;
        title = params.title;
        options = params.options;
    }
    return new Promise(resolve => {
        Vue.prototype
            .$confirm(message, title === undefined ? '提示' : title, options || {})
            .then(() => resolve(true))
            .catch(() => resolve(false));
    });
};
```

这样在调用侧（Vue组件里）只需要这么写：

```js
{
    methods: {
        async confirmToDoSomething() {
            if (!(await this.$doConfirm('确定要这么做吗，老铁？'))) return;
            // 点击确定按钮之后的逻辑
            await IEatThis();
            await YouEatThat();
            await SpNothingForHim();
        },
    },
}
```

这种要改成使用按钮组件是比较麻烦的，但是要改成使用节流函数就很容易，像下面这样：

```js
{
    methods: {
        async confirmToDoSomething() {
            if (!(await this.$doConfirm('确定要这么做吗，老铁？'))) return;
            // 点击确定按钮之后的逻辑
            this.yesIConfirmIWillDoThat();
        },
        yesIConfirmIWillDoThat: throttle(async function () {
            await IEatThis();
            await YouEatThat();
            await SpNothingForHim();
        }),
    },
}
```

## 三、节流按钮组件

这个组件封装得逻辑有点多，所以看起来会有点复杂。可以先跳过代码看后面的思路说明。

```vue
<template>
    <el-button :type="type" :size="size" :class="{ 'is-disabled': disabledAfterTokenUsed }" @click="onClick">
        <slot></slot>
        <span v-show="timerCountingDown && isDelayTimeIntegralSecondsNoLessThan1Second">（{{ countingDown }}s）</span>
    </el-button>
</template>

<script>
import { getTypeBoolean, getTypeNumber, getTypeString } from 'blablabla1 /这个不是真实包名/';
import { apiGetToken } from 'blablabla2 /这个不是真实包名/';

export default {
    name: 'ThrottleButton',
    props: {
        // 禁用时间，传0或不传表示不延迟
        delay: getTypeNumber(),
        defaultToken: getTypeString(),
        type: getTypeString({ default: 'default' }),
        size: getTypeString({ default: 'small' }),
        getTokenOnMount: getTypeBoolean(),
    },
    data() {
        return {
            // 防连续点击触发逻辑的计时器
            timer: null,
            // 防网络抖动用的token
            token: this.defaultToken || '',
            // 消耗掉token时，一定时间内按钮呈禁用状态
            timerDisabledAfterTokenUsed: null,
            disabledAfterTokenUsed: false,
            timerCountingDown: null,
            countingDown: 0,
        };
    },
    computed: {
        // 延迟时间是否为大于等于2秒的整数秒
        isDelayTimeIntegralSecondsNoLessThan1Second() {
            return this.delay > 1000 && this.delay / 1000 === Math.round(this.delay / 1000);
        },
    },
    watch: {
        token: {
            immediate: true,
            handler(newVal, oldVal) {
                if (!newVal && oldVal) {
                    if (this.timerDisabledAfterTokenUsed) return;
                    this.disabledAfterTokenUsed = true;
                    this.timerDisabledAfterTokenUsed = setTimeout(() => {
                        this.clearTimerDisabledAfterTokenUsed();
                        this.disabledAfterTokenUsed = false;
                    }, this.delay || 0);
                    // 如果延迟时间大于等于2秒，且为整数秒，则展示一个倒计时按钮
                    if (this.isDelayTimeIntegralSecondsNoLessThan1Second) {
                        this.startCountingDown();
                    }
                }
            },
        },
    },
    beforeDestroy() {
        this.clearTimer();
        this.clearTimerDisabledAfterTokenUsed();
        this.clearTimerCountingDown();
    },
    mounted() {
        if (this.getTokenOnMount) {
            this.refreshToken();
        }
    },
    methods: {
        startCountingDown() {
            if (this.timerCountingDown) return;
            this.countingDown = this.delay / 1000;
            this.timerCountingDown = setInterval(() => {
                this.countingDown--;
                if (this.countingDown <= 0) {
                    this.clearTimerCountingDown();
                }
            }, 1000);
        },
        clearTimer() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        },
        clearTimerDisabledAfterTokenUsed() {
            if (this.timerDisabledAfterTokenUsed) {
                clearTimeout(this.timerDisabledAfterTokenUsed);
                this.timerDisabledAfterTokenUsed = null;
            }
        },
        clearTimerCountingDown() {
            if (this.timerCountingDown) {
                clearTimeout(this.timerCountingDown);
                this.timerCountingDown = null;
            }
        },
        onClick() {
            if (!this.delay) {
                this.triggerClick();
                return;
            }
            if (this.disabledAfterTokenUsed) return;
            if (this.timer) return;
            this.timer = setTimeout(this.clearTimer, this.delay);
            // 如果延迟时间大于等于2秒，且为整数秒，则展示一个倒计时按钮
            if (this.isDelayTimeIntegralSecondsNoLessThan1Second) { this.startCountingDown(); }
            this.triggerClick();
        },
        triggerClick() {
            this.$emit('click');
        },
        refreshToken() {
            const token = await apiGetToken({});
            this.token = token;
            return token;
        },
        getToken() {
            const returnToken = this.token;
            // token只允许访问一次
            this.token = '';
            // 如果被读取时token不存在，说明使用上出问题了
            if (!returnToken) this.$message.error('网络异常，请退出或刷新页面后重试');
            return returnToken;
        },
    },
};
</script>
```

这个组件支持传入delay属性表示按钮组件需要节流的时间间隔，比如传入300，则在300毫秒的时间段内只有第一次点击会生效。

点击按钮后如果触发请求，会使用token（我们的场景是后续触发的接口请求中需要带上这个token，这种变量我不建议直接在页面业务代码里维护，所以封装到组件里了，这个方案我是不赞成的，但是生活中到处都有需要妥协的地方——你可以把这里的token换成一个布尔值的flag开关用来保证按钮默认情况下只能被使用一次，稍加修改下逻辑都能走通）。这个token在触发请求时会被消耗掉，这样可以保证按钮只能被使用一次，如果需要按钮可以多次操作，则在触发请求之后从调用侧手动刷新token即可。

在delay指定时间内按钮会呈现禁用状态，并且如果delay指定的时间是一个大于等于2秒的整数秒，按钮上会呈现出一个倒计时的状态。

上文中getTypeNumber、getTypeString等函数返回的其实就是Vue里对prop属性的类型声明配置，由于项目里很多地方都会用到，直接像下面这样写的话，是会对代码阅读代码一定的心智负担的（打开一个文件一看代码行数这么长就容易有抵触心理，这里减少一些行数，那里减少一些行数，最后对代码阅读体验的提升还是很客观的）：

```generic
props: {
    value: {
        type: String,
        default: '',
    },
    // ...
},
```

这个封装的具体实现如下（这个不是本文重点，不关心的话可以直接忽略）：

```js
/**
 * 处理传给本文件中其他方法的入参
 * 允许传类似这样的数据结构进来：'required'、{ required: true }、['required']、['required', { default: 0 }]
 * @param params {string|object|string[]|(string|object)[]}
 * @returns {object}
 */
const transformParams = (params = {}) => {
    if (!params) return {};
    if (typeof params === 'string') {
        if (params === 'required') return { required: true };
        throw new Error(`params参数${params}错误，请仔细检查`);
    }
    if (Array.isArray(params)) {
        return params.reduce((pre, cur) => {
            return { ...pre, ...transformParams(cur) };
        }, {});
    }
    if (typeof params === 'object') return params;
    throw new Error(`params参数${params}错误，请仔细检查`);
};

const generateGetTypeFunc = (defaultOpt = {}) => (additionalOpt = {}) => ({
    ...defaultOpt,
    ...transformParams(additionalOpt),
});

export const getTypeBoolean = generateGetTypeFunc({ type: Boolean, default: false });

export const getTypeString = generateGetTypeFunc({ type: String, default: '' });

export const getTypeArray = generateGetTypeFunc({ type: Array, default: () => [] });

export const getTypeNumber = generateGetTypeFunc({ type: Number, default: 0 });

export const getTypeObject = generateGetTypeFunc({ type: Object, default: () => {} });

export const getTypeArrayOrNull = generateGetTypeFunc({
    validator(value) {
        return Array.isArray(value) || value === null;
    },
    default: () => null,
});

export const getTypeStringOrArray = generateGetTypeFunc({
    validator(value) {
        return Array.isArray(value) || typeof value === 'string';
    },
    default: () => '',
});
```
