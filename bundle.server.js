const fs = require('fs');
const path = require('path');
const vueServerRenderer = require('vue-server-renderer');
global.Vue = require('vue');

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

// 监听5000端口
server.listen(5000, function (error) {
    if (error) throw error
    console.log('Server is running at localhost:5000')
});