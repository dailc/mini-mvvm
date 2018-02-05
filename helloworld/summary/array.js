(function() {
    const arrayPrototype = Array.prototype;
    const arrayMethods = Object.create(arrayPrototype);

    // arrayMethods上需要监听的方法
    [
        'push',
        'pop',
        'shift',
        'unshift',
        'splice',
        'sort',
        'reverse'
    ].forEach((method) => {
        const original = arrayPrototype[method];

        // 通过def来新增需要观察的属性
        def(arrayMethods, method, function mutator(...args) {
            /**
             * 关键操作是：
             * 检测到数组的push等操作后，如果有新增的数据，则需要也observe它
             */
            // console.log('调用数组方法：' + method);
            // 先得到调用方法后的原始结果
            const res = original.apply(this, args);
            // 获取这个数据对象对应的观察者
            const ob = this.__ob__;
            // 这个用来记录真正的新增元素
            let inserted;

            switch (method) {
                case 'push':
                case 'unshift':
                    // 有插入元素
                    inserted = args;
                    break;
                case 'splice':
                    // 去除前两个参数（前两个分别是index以及删除元素的数量）
                    inserted = args.slice(2);
                    break;
                default:
                    break;
            }

            if (inserted) {
                // 直接就观察这个数组
                ob.observeArray(inserted);
            }

            // 通知改变（所有的操作都会通知）
            // 注意，是通过observer的dep，而不是每一个key值的observer
            ob.dep.notify();

            return res;
        });

    });

    window.arrayMethods = arrayMethods;
})();

const hasProto = '__proto__' in {};
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

function protoAugment(target, src) {
    target.__proto__ = src;
}

function copyAugment(target, src, keys) {
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        def(target, key, src[key]);
    }
}

