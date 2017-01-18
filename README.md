# Getting start vue SSR with webpack

how to run:

```
npm i 
npm run dev
``` 


#
# high level changes

#### template parser no longer relies on the DOM

#### The compiler and the runtime can now be separated,There will be two different builds:

1. Standalone build,包含模板编译器,依赖于浏览器的接口的存在，所以你不能使用它来为服务器端渲染\[新增\]

```
//webpack
resolve: {
alias: {
'vue$': 'vue/dist/vue.common.js'
}
}

//Browserify
"browser": {
"vue": "vue/dist/vue.common"
}
```

1. Runtime only build,要比独立构件轻量30%,不支持template选项，可以使用单文件组件或者render方法\[新增\]，render方法更接近编译器

```
// main.js
import Vue from 'vue'
import App from './App'

new Vue({
el: '#app',
render: h => h(App) // createElement
// template: '<App/>',
// components: { App }
})
```

> 有些插件需要使用standalone,例如vue-router

#### 源码用es6+flow 重写


#
## global config

* deprecated，[迁移文档](https://vuefe.cn/v2/guide/migration.html)
* Vue.config.debug, 因为errorHandler[新增]默认打印错误栈
* Vue.config.async, async is required for rendering performance
* Vue.config.unsafeDelimiters deprecated, use v-html，1.0中会先编译成v-html,多余
* Vue.config.delimiters reworked as a component-level option,这样可以在使用自定义分隔符时避免影响第三方模板

* new/change

```
const config: Config = {
/**
* Option merge strategies (used in core/util/options)
*/
// mixin有相同属性时的合并策略
optionMergeStrategies: Object.create(null),
/**
* Error handler for watcher errors
*/
/* Sentry */
errorHandler: null,

silent: false,
devtools: process.env.NODE_ENV !== 'production',
keyCodes: Object.create(null),
ignoredElements: []
}
```

* 自定义合并策略的选项

默认钩子函数都会被调用，对象键名冲突时，取组件对象的键值对
```
var mixin = {
created: function () {
console.log('混合对象的钩子被调用')
}
}
new Vue({
mixins: [mixin],
created: function () {
console.log('组件钩子被调用')
}
})
```

* 按键别名
替换Vue1.0里的Vue.directive('on').keyCodes

```
// 自定义
Vue.config.keyCodes.f1 = 112

// 使用
<input @keyup.f1="submit">


```

* Global API

* Vue.nextTick
在下次 DOM 更新循环结束之后执行延迟回调
```
// 修改数据
vm.msg = 'Hello'
// DOM 还没有更新
Vue.nextTick(function () {
// DOM 更新了
})
```
* 实例方法变全局方法 Vue.set/Vue.delete
> Vue no longer extends Object.prototype with $set and $delete methods. This has been causing issues with libraries that rely on these properties in certain condition checks (e.g. minimongo in Meteor). Instead of object.$set(key, value) and object.$delete(key), use the new global methods Vue.set(object, key, value) and Vue.delete(object, key).

* 新增Vue.compile, 在render函数中编译模板字符串，只在独立构件有效
```
var res = Vue.compile('<div><span>{{ msg }}</span></div>')
new Vue({
data: {
msg: 'hello'
},
render: res.render,
staticRenderFns: res.staticRenderFns
})
```

### 数据
* v-bind, .once .sync 移除,子组件需要显式地传递一个事件而不是依赖于隐式地双向绑定
* props

```
// 简单语法
Vue.component('props-demo-simple', {
props: ['size', 'myMessage']
})
// 对象语法，提供校验
Vue.component('props-demo-advanced', {
props: {
// 只检测类型
height: Number,
// 检测类型 + 其他验证
age: {
type: Number,
default: 0,
required: true,
validator: function (value) {
return value >= 0
}
}
}
})
```

### DOM
* replace，默认为true, 组件只能有一个根节点(vdom)，并且不能替换body,
1.0 解决dom限制（例如：tr只能包含td,th）使用replace=false,
2.0 使用虚拟dom,所以不受限制

```
<div id="app">
<table>
<tr><th class="bar" is="my-component">stuff</th></tr>
<tr><th class="bar" is="bad-component">stuff</th></tr>
</table>
</div>
```

```
const MyComponent = Vue.extend({
name: 'my-component',
template: '<th class="foo">my <slot></slot></th>',
});

const BadComponent = Vue.extend({
name: 'bad-component',
template: '<div class="foo">bad <slot></slot></div>',
});

new Vue({
el: '#app',
components: {
MyComponent,
BadComponent,
},
})
```
### 指令
* v-once 替代 {{* foo }}
* v-html 替代 {{{ foo }}}

### event bus

适用简单场景
```
var bus = new Vue()

```

```
// 在组件 A 的方法中
bus.$emit('id-selected', 1)

// 在组件 B 的 created 中
bus.$on('id-selected', function (id) {
// ...
})
```

#
## Virtual DOM

* 核心概念

JS对象树表示DOM树，数据状态变化后直接修改JS对象，然后对比修改前后的JS对象，记录需要的DOM操作

* vue virtual dom 实现

1. 创建VNode对象模拟DOM树

* 方法一，直接写render
* 方法二，template/el-&gt;ast树-&gt;render

2. VNode patch 生成DOM

* createElm创建真实DOM
* patchVnode做出合理DOM更新


#
## 优势:首次渲染, SEO, 减少HTTP请求,旧客户端
### 普通服务端渲染
```
var renderer = require('vue-server-renderer').createRenderer()
renderer.renderToString(new Vue(mycomponent),(error,html)=>{})

```
### 流式渲染结合express

继承自node的可读流
```
export default class RenderStream extends stream.Readable
```

```
// 拆分布局成两段HTML
var layoutSections = layout.split('<div id="app"></div>')
var preAppHTML = layoutSections[0]
var postAppHTML = layoutSections[1]
// 处理所有的Get请求
server.get('*', function (request, response) {
// 渲染我们的Vue实例作为流
var stream = renderer.renderToStream(require('./assets/app')())
// 将预先的HTML写入响应
response.write(preAppHTML)
// 每当新的块被渲染
stream.on('data', function (chunk) {
// 将块写入响应
response.write(chunk)
})
// 当所有的块被渲染完成
stream.on('end', function () {
// 将post-app HTML写入响应
response.end(postAppHTML)
})
// 当渲染时发生错误
stream.on('error', function (error) {
// 打印错误到控制台
console.error(error)
// 告诉客服端发生了错误
return response
.status(500)
.send('Server Error')
})
})
```

### SSR + Webpack

[example code](https://github.com/cstur/vue-ssr-webpack)

* 使用bundle render

```
// 读取 bundle 文件，并创建渲染器
const code = fs.readFileSync('./view/bundle.server.js', 'utf8');
const bundleRenderer = vueServerRenderer.createBundleRenderer(code);
var layout = fs.readFileSync('./index.html', 'utf8')

// 创建一个Express服务器
var express = require('express');
var server = express();

// 处理所有的 Get 请求
server.get('*', function (request, response) {
// 设置一些数据，可以是数据库读取等等
const options = {
data: {
title: 'hello world'
}
};

// 渲染 Vue 应用为一个字符串
bundleRenderer.renderToString(options, (err, html) => {
// 如果渲染时发生了错误
if (err) {
// 打印错误到控制台
console.error(err);
// 告诉客户端错误
return response.status(500).send('Server Error');
}

// 发送布局和HTML文件
response.send(layout.replace('<div id="app"></div>', html));
});
});

```

* 打包方式不同

```
const webpack = require('webpack');
const base = require('./webpack.base.conf');

const path = require('path');
const projectRoot = path.resolve(__dirname, './');

const env = process.env.NODE_ENV || 'development';

module.exports = Object.assign({}, base, {
target: 'node',
devtool: null,
entry: {
app: path.join(projectRoot, './server.js')
},
output: Object.assign({}, base.output, {
path: path.join(projectRoot, 'view'),
filename: 'bundle.server.js',
libraryTarget: 'commonjs2'
}),
plugins: [
new webpack.DefinePlugin({
'process.env.NODE_ENV': JSON.stringify(env),
'process.env.VUE_ENV': '"server"',
'isBrowser': false
})
]
});
```

1
. 执行vue-migration-helper

按照提示逐条替换

```
93. Replace :value.sync='currentClosePosition.topLimitPercent' with :value='currentClosePosition.topLimitPercent', then $emit an event from the child component to trigger an update to currentClosePosition.topLimitPercent in the parent
Line 44: src/components/modals/cancer-position-modal.vue
Reason: v-bind.sync and v-bind.once have removed to enforce one-way down props, leaving side effects to more explicit component events
More info: http://vuejs.org/guide/migration.html#v-bind-with-once-and-sync-Modifiers
```

2. 执行构件命令，compiler error／console error

```
[Vue warn]: Do not use built-in or reserved HTML elements as component id: dt
[Vue warn]: Failed to resolve directive: repeat

```


3. 执行测试用例／自测


* 注意事项
* 注意编译不报错的情况
```
<div :v-component = "videoview"></div>
```
```
inherit:true
```
* 升级版本尽量介绍业务代码变更，测试通过后再进行业务代码重构

#
# 预渲染

使用场景：改善少数的营销页面
prerender-spa-plugin

## render函数

```
// @returns {VNode}
createElement(
// {String | Object | Function}
// 一个 HTML 标签，组件选项，或一个函数
// 必须 Return 上述其中一个
'div',
// {Object}
// 一个对应属性的数据对象
// 您可以在 template 中使用.可选项.
{
},
// {String | Array}
// 子节点(VNodes). 可选项.
[
createElement('h1', 'hello world'),
createElement(MyComponent, {
props: {
someProp: 'foo'
}
}),
'bar'
]
)
```

*
ssr
* 对第三放组件更友好(ignoredElements,rework delimiters,Vue.set
)
* 性能提升(v-dom,standalone/runtime,unsafeDelimiters deprecated，v-dom)