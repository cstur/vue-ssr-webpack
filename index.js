import Vue from 'vue';

import App from './src/App';


Vue.filter('byte-format', value => {
    const unit = ['Byte', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;
    let size = parseInt(value, 10);

    while (size >= 1024 && index < unit.length) {
        size /= 1024;
        index++;
    }

    return [size.toString().substr(0, 5), unit[index]].join(' ');
});


const createApp = function createApp(options) {
    const VueApp = Vue.extend(App);

    return new VueApp(Object.assign({}, options));
};

export {Vue, createApp};