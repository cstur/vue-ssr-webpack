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