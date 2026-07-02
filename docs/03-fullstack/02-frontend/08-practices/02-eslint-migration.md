
# 如何在老项目里推行 ESLint 代码风格检测

一个新项目要推行ESLint在技术上是非常容易的，用成熟的脚手架新建项目后一般默认就有这一块功能了。即便是自己搭建的项目，要加个ESLint检测功能也是很简单的事情，本文不加赘述这方面的细节。本文重点在于如何在已有很多代码的老项目里推行ESLint检测。

有人会建议直接用ESLint的自动修复功能去对全项目做一个整体的自动修复，然后对没能自动修复掉的问题集中性地进行人工修复。这么做的改动量太大，风险是不可控的（你没有那么多的精力一下子去review那么多的代码量）。我用的软着陆方案是对所有新文件都强制进行ESLint检测，但是对老文件里的代码则允许慢慢修改，具体是这样的：

1. 配置好ESLint规则。
2. 新建.eslintignore文件，将node_modules、.git等常规的不需要纳入ESLint检测的文件/目录列于其中。
3. 用ESLint（不开fix自动修复）检测一遍项目源码获得所有存在报错（Error）和警告（Warning）的文件清单，并新建.eslintignore_old_files文件存放这份清单。
4. 对新代码和没问题的老代码进行强制检测。
5. 随着业务迭代陆续修改老代码。

## 一、配置好ESLint规则

指定ESLint的规则是为了让团队成员的代码风格尽量统一，并且能预防一些潜在的bug。对大部分规则来说，其实没有大家一起讨论的必要。但还是有一些建议给到大家：

### 1.1、尽可能让代码规则可以方便日后的代码搜索定位

比如下面这种代码，一共有3处对val的赋值，当我们想搜代码里所有对val进行复制的地方，我们可能需要写正则来搜：/val\s*=\s*/。

```generic
let val  = null;
if (true) {
    val = '1';
} else {
    val='2';
}
```

但是如果我们的代码是下面这样的，你只需要搜"timer ="。这样的例子其实是很多的，在我们排查产线紧急bug时，代码定位的便捷度其实是一个很重要的点。

```generic
let timer = null;
if (true) {
    timer = '1';
} else {
    timer = '2';
}
```

&nbsp;

### 1.2、尽可能让代码规则可以帮助减少code review时的差异量

比如下面这样的代码：

```generic
const obj = {
    a: 1,
    b: 2,
    c: 3
}
```

我会倾向于使用下面这种代码风格（3后面有个逗号）：

```generic
const obj = {
    a: 1,
    b: 2,
    c: 3,
}
```

这是因为当我需要新增一个属性d时：

- 在前面那种写法里我需要修改c所在行并增加一行给d用，在code review时会发现一共有2行的代码差异。
- 在后面那种写法里我只需要新增一行给d用，在code review时只会有1行的代码差异。

## 二、新建.eslintignore文件

将确实不需要进行ESLint检测的文件和目录列到.eslintignore文件中，比如node_modules、.git、/dist（假定产物目录是dist）。

注意，暂时不需要检测但是以后需要检测的文件和目录不要列到这里面。一旦你列进去，当你用编辑器、IDE修改这些代码时，编辑器和IDE很可能就不会给你对应的代码风格提示了。因为编辑器、IDE的这种提示是非强制性的，仅仅是提示，并不会影响你项目的最终编译，所以我们建议要保留这种提示。

## 三、新建.eslintignore_old_files文件

鉴于上面所说的原因，我们需要新建一个.eslintignore_old_files（这个文件名没有强制要求）文件，把那些暂时不需要检测但是存在问题且以后需要检测的文件和目录列进去（<span style="color: #ff0000;">没问题的老文件不需要列进去</span>）。那么这个文件的作用是什么呢？

- 编辑器和IDE是不认.eslintignore_old_files文件的，所以对于列于其中的文件，你在开发时仍能得到来自编辑器/IDE的温馨提示。
- 编译时可以控制程序忽略掉这个文件里列的文件和目录。

简言之就是：让你有时间可以慢慢去修改老代码中的ESLint文件——能让你能知道代码里存在的问题，但是又不影响项目的编译。

那怎么去获得需要列到.eslintignore_old_files文件中的精确清单呢？直接抛代码，大家可以参考：

在项目根目录下新建build/update-eslintignore-old-files.js文件，代码如下：

```generic
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

const execSync = cmd => {
    return childProcess
        .execSync(cmd)
        .toString()
        .trim();
};

let fileList = [];
let hasMore = true;
const pathRoot = path.resolve(__dirname, '../');
const pathForEslintIgnoreOldFiles = path.resolve(pathRoot, '.eslintignore_old_files');

// 先清空.eslintignore_old_files
fs.writeFileSync(pathForEslintIgnoreOldFiles, '');

/**
 * 由于eslint检出时似乎不是全量检出，这里做循环处理：
 * 1、每次检出一部分文件后就添加到.eslintignore_old_files中，然后基于这个黑名单继续检出；
 * 2、将每次检出的结果汇总、去重后更新到.eslintignore_old_files。
 * 3、当某次无文件检出时退出循环。
 */
while (hasMore) {
    const output = execSync("eslint --cache --ignore-path .eslintignore_old_files --format 'build/eslint-formatter.js' --ext .vue,.js build webpack src");
    /**
     * 注意：exec方法输出的长度有上限，配置maxBuffer并没有用
     * 这里的方案是通过正则从不完整的字符串中匹配出可以识别出来是文件路径的部分
     */
    const filesCheckedOut = output.match(/(?<=")[^,]*?(?=")/g) || [];
    fileList = fileList.concat(filesCheckedOut);
    fileList = [...new Set(fileList)];
    let returnStr = '';
    if (fileList.length) {
        returnStr += fileList.join('\n');
        returnStr += '\n';
    }
    fs.writeFileSync(pathForEslintIgnoreOldFiles, returnStr);
    if (filesCheckedOut.length === 0) hasMore = false;
}

console.log(`最终检出文件${fileList.length}个至.eslintignore_old_files`); // eslint-disable-line
```

&nbsp;

在项目根目录下再新建一个build/eslint-formatter.js文件，代码如下：

```generic
const path = require('path');

module.exports = function(results) {
    const items = [];
    const pathRoot = path.resolve(__dirname, '../');
    results.forEach(item => {
        if (item.warningCount || item.errorCount) {
            items.push(item);
        }
    });
    console.log(''); // eslint-disable-line
    console.log(`--------本次检出异常文件${items.length}个--------`); // eslint-disable-line
    const fileList = items.map(file => path.resolve(file.filePath).replace(pathRoot, ''));
    console.log(JSON.stringify(fileList)); // eslint-disable-line
    console.log('---------------end----------------------------'); // eslint-disable-line
    console.log(''); // eslint-disable-line
    process.exit(0);
};
```

&nbsp;

最后在package.json的scripts字段下新增一行：

```generic
"eslint:updateEslintIgnoreOldFiles": "node build/update-eslintignore-old-files.js"
```

&nbsp;

这样你只需要执行一次npm run eslint:updateEslintIgnoreOldFiles命令，就可以自动更新.eslintignore_old_files文件里的清单了。

## 四、对新代码和没问题的老代码进行强制lint检测

在package.json的scripts字段里添加类似下面这样的代码，就可以强制检测了（检测不通过就没法编译发布）：

```generic
"prebuild": "npm run lint && 清空产物目录",
"build": "构建命令",
"lint": "eslint --ignore-path .eslintignore_old_files --ext .vue,.js build src",
"lint:fix": "eslint --ignore-path .eslintignore_old_files --fix --ext .vue,.js build src",
```

说明：

1、上面的build命令表示正式构建命令，名字是随意的（按你项目中当前的名字来即可），你也可以换成start等。需要注意的是，这里如果换成其他名字，需要把prebuild里的build也换成其他的名字。比如build换成start的话，prebuild就要换成prestart。这种pre前缀带来的效果是，当你执行npm run build时，npm会去找prebuild命令，如果有就会先执行它。

2、上面的lint:fix是可以让ESLint去尝试自动修复的命令，这个命令是很实用的。

## 五、陆续修改老代码

完成了上面的操作后，我们只需要跟着业务迭代逐步修改当前业务迭代会涉及到的老代码即可，每次改一点不要贪多，让测试同学可以不花什么额外成本就覆盖到我们的改动是最好的。

怎么改呢？先跑npm run lint:fix让ESLint帮你修改掉大部分报错，然后再手动修改剩下的报错。千万别多个空格这种问题都自己手动修复，那样太麻烦了。
