
# Element-UI Select 下拉框虚拟列表

## 一、方案讨论

Element UI中select下拉框组件本身是不支持虚拟列表功能的，也就是说在需要一次性展示大量数据时，页面很容易卡顿。这就是为什么我们需要添加虚拟列表支持。

不过有一说一，虚拟列表的方案，要么展示会有一定延迟，要么就是多少还是会有些卡顿，并没有想象中那么美好。碰到这种要展示大量数据的需求的时候要尽量和产品据理力争。这种大数据场景下，最好是只显示一部分候选项，然后让用户输入关键词来过滤匹配，真的没必要一个下拉框里同时显示上万条选项——真的需要让用户从一万条里慢慢找他要的选项吗？

原理上来说：

- 就是列表可视范围内的选项如果有x条的话，往前往后再各显示x条，一共显示3x条（具体条数可以自行调整），这样可以避免稍微用户稍微滑动一下选项就看到空白区域。
- 将这3x条选项之外的选项直接就不显示。为了避免滚动条与真实显示大量数据时的滚动条不对应，需要将这3x条选项之前和之后的地方各留一个div，高度为不显示的选项所应占据的高度。所以我们需要有一个合适的时机去做滚动监听。这里我是直接看下拉框滚动时，有个选项高亮的样式效果，直接跳到源码里看了下他们这个样式效果的逻辑是在哪里做的，也就找到了适合我们做滚动监听的地方了（下面代码中的`this.$refs.select.$refs.scrollbar.$refs.wrap`）。

## 二、具体实现

这是简化版的代码，把其他各种属性都抹掉了。

```vue
<template>
    <el-select ref="select" :value="value" @focus="onFocus" @change="onChange">
        <el-option v-if="useVirtualList" class="opacity-0" :style="{ height: beforeHeight }" disabled :key="-10000" value="" :label="maxLengthLabel"></el-option>
        <el-option v-for="dt in showingDataList" :key="dt[propValue]" :value="dt[propValue]" :label="dt[propLabel]"></el-option>
        <el-option v-if="useVirtualList" class="opacity-0" :style="{ height: afterHeight }" disabled :key="-20000" value="" :label="maxLengthLabel"></el-option>
    </el-select>
</template>

<script>
const MAX_END_IDX = 999999;
export default {
    name: 'CommonSelect',
    model: {
        prop: 'value',
        event: 'changeValue',
    },
    props: {
        value: {
            type: [String, Number, Array],
        },
        // dataSource数据量较大且不会变化的情况下，传入dataSource时最好用Object.freeze方法先处理下，减少Vue不必要的依赖收集/监听过程
        dataSource: {
            type: Array,
            default: () => [],
        },
        // 是否针对下拉选项开启虚拟列表（仅选项很多时开启该开关）
        useVirtualList: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        /**
         * 获取最宽文字是为了避免下拉框宽度随着展示选项文案宽度的变化而剧烈抖动
         * 这里只是单纯通过比较字符串长度来判断最长的label
         * 暂时没考虑英文字符和中文字符宽度不一致的问题（放到DOM里去比较长度对性能影响较大，这个导致的宽度变化不明显，体验可以接受）
         */
        maxLengthLabel() {
            if (this.useVirtualList !== true) {
                return '';
            }
            const dataSource = this.dataSource || [];
            if (dataSource.length === 0) {
                return '';
            }
            let idx = 0;
            let maxLength = 0;
            const key = this.propLabel;
            dataSource.forEach((item, index) => {
                if (item[key].length > maxLength) {
                    maxLength = item[key].length;
                    idx = index;
                }
            });
            return dataSource[idx][key];
        },
        showingDataList() {
            if (this.useVirtualList !== true) {
                return this.dataSource;
            }
            return this.dataSource.slice(this.startIdx, this.endIdx);
        },
    },
    data() {
        return {
            dataSource: [],
            timer: null,

            /* 以下为虚拟列表需要的字段 start */
            wrap: null,
            startIdx: 0,
            endIdx: MAX_END_IDX,
            beforeHeight: '0px',
            afterHeight: '0px',
            timerForScroll: null,
            optionHeight: 0,
            numOfItemsVisible: 0, // 下拉列表里用户可见的选项个数
            /* 以上为虚拟列表需要的字段 end */
        };
    },
    methods: {
        onChange(val) {
            this.$emit('changeValue', val);
        },
        onFocus() {
            this.delayHandleScroll();
        },
        /**
         * 延迟执行
         * 1、此处暂时是用requestAnimationFrame来进行延迟，
         * + 所以实际dom的更新频率是比较高的，优点是用户能及时看到选项，缺点是耗性能
         *
         * 2、也可以换成setTimeout取一个合适的时间间隔，
         * + 缺点是用户可能看到选项由空白到被渲染出来的过程，优点是性能好一些，
         * + 用这个方案的话最好在空白阶段有个背景让用户感觉是在加载中(给第一个和最后一个填充距离用的el-option加background样式)
         */
        delayHandleScroll() {
            if (this.timerForScroll) {
                cancelAnimationFrame(this.timerForScroll);
                this.timerForScroll = null;
            }
            this.timerForScroll = requestAnimationFrame(this.handleScroll);
        },
        /**
         * 处理滚动回调
         * 注：这个方法里性能是首要考虑因素，代码可读性在影响性能的情况下可以适度牺牲（加注释弥补）
         */
        handleScroll() {
            const wrap = this.wrap;
            const dataSourceLength = this.dataSource.length;
            // 单条选项的高度
            const optionHeight = (() => {
                if (this.optionHeight > 0) {
                    return this.optionHeight;
                }
                const tempOptionHeight = wrap.querySelector('.el-select-dropdown__list').clientHeight / dataSourceLength;
                this.optionHeight = tempOptionHeight;

                return tempOptionHeight;
            })();
            if (optionHeight === 0) {
                return;
            }
            let numOfItemsVisible = this.numOfItemsVisible;
            if (numOfItemsVisible === 0) {
                numOfItemsVisible = Math.ceil(wrap.clientHeight / optionHeight);
                this.numOfItemsVisible = numOfItemsVisible;
            }
            const scrollTop = wrap.scrollTop;
            const startIdx = Math.max(Math.floor(scrollTop / optionHeight) - 10, 0);
            // 可视区域里有numOfItemsVisible个选项，往前、往后分别多渲染numOfItemsVisible个选项，一共numOfItemsVisible * 3个选项
            const endIdx = Math.min(startIdx + numOfItemsVisible * 3, dataSourceLength);
            const beforeHeight = `${Math.ceil(startIdx * optionHeight)}px`;
            const afterHeight = `${Math.ceil((dataSourceLength - endIdx) * optionHeight)}px`;
            this.startIdx = startIdx;
            this.endIdx = endIdx;
            this.beforeHeight = beforeHeight;
            this.afterHeight = afterHeight;
        },
    },
    beforeDestroy() {
        clearTimeout(this.timer);
        if (this.useVirtualList) {
            this.wrap && this.wrap.removeEventListener('scroll', this.delayHandleScroll, false);
        }
        if (this.timerForScroll) {
            cancelAnimationFrame(this.timerForScroll);
        }
    },
    mounted() {
        if (this.useVirtualList) {
            const wrap = this.$refs.select.$refs.scrollbar.$refs.wrap;
            this.wrap = wrap;
            wrap && wrap.addEventListener('scroll', this.delayHandleScroll, false);
        }
    },
};
</script>

<style scoped>
.opacity-0 {
    opacity: 0;
}
</style>
```
