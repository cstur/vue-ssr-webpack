const path = require('path');
const projectRoot = path.resolve(__dirname, '../');

module.exports = {
    devtool: '#source-map',
    entry: {
        app: path.join(projectRoot, 'src/client.js')
    },
    output: {
        path: path.join(projectRoot, 'www/static'),
        filename: 'index.js'
    },
    resolve: {
        extensions: ['', '.js', '.vue'],
        fallback: [path.join(projectRoot, 'node_modules')],
        alias: {
            'Common': path.join(projectRoot, 'src/vue/Common'),
            'Components': path.join(projectRoot, 'src/vue/Components')
        }
    },
    resolveLoader: {
        root: path.join(projectRoot, 'node_modules')
    },
    module: {
        loaders: [
            {
                test: /\.vue$/,
                loader: 'vue'
            },
            {
                test: /\.js$/,
                loader: 'babel',
                include: projectRoot,
                exclude: /node_modules/
            }
        ]
    }
};