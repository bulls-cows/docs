
# 自定义指令

## 一、建议少用指令

用Vue的指令（directive）写法确实是可以实现防止快速点击的作用。但是我们要知道，在一个Vue项目里，代码复用和抽象的主要形式应该是组件而不是指令。像这种防快速点击的需求，其实最好还是封装一个Vue组件，相应的节流（而非防抖）逻辑写到Vue的组件内。不建议使用指令的方式。

不过还是给下指令的具体实现代码供参考（**不建议用**）：

```js
import Vue from 'vue';

function bind(el, binding) {
    el.dataset.lazyReady = '1';
    el.onclick = function() {
        if (el.dataset.lazyReady === '0') return;
        if (el.disabled) return;
        el.dataset.lazyReady = '0';
        setTimeout(() => {
            el.dataset.lazyReady = '1';
        }, 800);
        if (typeof binding.value === 'function') {
            binding.value();
        }
    };
}

Vue.directive('lazy-click', { bind });
```

然后像下面这样使用就行了：

```vue
<el-button v-lazy-click="searchData">查询</el-button>
```

## 二、Vue指令的坑

有个项目里按钮的权限是通过指令来实现的，主要的思路是使用这个指令时会传一个code，然后在指令的bind钩子上用code（稍微简化了下，实际是路由和code拼接出来的"code"）去匹配权限数据，如果按钮不可用则禁用按钮（设置disable属性并添加不可用的样式），否则为可用。

我们发现问题的场景是这样的，在一个微前端项目里，主应用在加载子应用的同时也会请求权限数据接口（主应用会一次性请求所有菜单和按钮的权限数据，请求到的数据会共享给子应用，子应用不再自己请取数据），这两者是并行的。当接口请求比页面里的按钮加载出来慢的时候，就会出现按钮权限指令的bind钩子里我们还拿不到权限数据，所以无法进行匹配权限的逻辑。

解决方案是组件权限指令的bind钩子中，我们将匹配权限的逻辑封装到一个函数function handlePermissionFn(element, binding) {}中，然后我们依旧是根据code去走匹配权限的逻辑（调用），如果能拿到权限数据那么就正常根据权限数据来确定按钮是否要禁用。如果拿不到数据，就往一个数组里推这个待执行的函数以及对应的两个入参（这个过程称之为**依赖收集**）：

```js
function bind(el, binding) {
    // ...
    el.dataset.routeName = routeName;
    const returnVal = handlePermissionFn(el, binding);

    // 如果当前没有权限数据，则先收集到数组中等有权限数据时再执行一下对应逻辑（binding.value就是我们传给指令的code）
    if (returnVal === 'noPermissionListData') {
        pendingButtonPermissions.push(() => handlePermissionFn(el, binding));
    }
}
```

然后用**观察模式**去监测权限数据的变动（vuex的store实例提供了直接监测的现成方法：watch），当能拿到权限数据的时候遍历我们刚才收集到的依赖即可（能匹配到权限数据的依赖在匹配后需要移除，没匹配到的需要记录保留在依赖列表里等待后续新的数据进来时再重新判断）。

```js
storeInstance.watch(
    state => {
        return state.permissionsData;
    },
    () => {
        for (let i = pendingButtonPermissions.length - 1; i >= 0; i--) {
            const returnVal = pendingButtonPermissions[i]();
            if (returnVal !== 'noPermissionListData') {
                pendingButtonPermissions.pop();
            }
        }
    },
    { immediate: true, deep: true }
);
```
