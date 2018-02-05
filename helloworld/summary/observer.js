// 抽取观察函数，内部可以封装不少逻辑
function observe(value) {
    if (!value || typeof value !== 'object') {
        return;
    }
    let ob;

    if (Object.hasOwnProperty.call(value, '__ob__') &&
        value.__ob__ instanceof Observer) {
        // 如果这个数据已经添加过观察者
        ob = value.__ob__;
    } else {
        // 目前不做其它容错判断
        // 正常要排除mvvm对象本身，以及必须是isPlainObject，以及isExtensible为true
        ob = new Observer(value);
    }

    return ob;
}


function Observer(value) { // 能进来这个构造就说明已经符合基本要求了（对象或数组）
    this.value = value;
    // 每一个数据需要有自己的dep
    this.dep = new Dep();

    // 给每一个观察的数据对象增加一个__ob__属性，在数据内可以通过__ob__拿到Observer示例
    def(value, '__ob__', this);

    if (Array.isArray(value)) {
        // 让这个数据拥有arrayMethods的方法（其实是直接修改了array的原型指向，mdn上并不推荐）
        // 或者可以兼容用es6中的setPrototypeOf
        const augment = hasProto ?
            protoAugment :
            copyAugment

        augment(value, arrayMethods, arrayKeys);
        value.__proto__ = arrayMethods;
        this.observeArray(value);
    } else {
        this.walk(value);
    }
}

Observer.prototype.walk = function(data) {
    // 遍历，将对象所有的属性进行监听，包括递归
    Object.keys(data).forEach((name) => {
        this.defineReactive(data, name, data[name]);
    });

};
Observer.prototype.observeArray = function(items) {
    // 遍历数组所有元素，对单个元素进行 getter、setter 绑定
    for (var i = 0, l = items.length; i < l; i++) {
        observe(items[i]);
    }
};

Observer.prototype.defineReactive = function(data, key, value) {
    // 每一个绑定数据的依赖管理，管理着所有需要跟随这个数据更新的Watcher
    const dep = new Dep();
    let childObj = observe(value);

    Object.defineProperty(data, key, {
        configurable: false,
        enumerable: true,
        get: function getter() {
            // console.log('尝试读取：' + key + ', 值为：' + value);
            // 检测是否需要添加依赖
            if (Dep.target) {
                dep.depend();
                if (childObj) {
                    // 递归检查childObj的依赖
                    childObj.dep.depend();
                }
                if (Array.isArray(value)) {
                    // 如果当前是数组
                    const len = value.length;
                    let arrayItem;

                    for (let i = 0; i < len; i++) {
                        arrayItem = value[i];
                        arrayItem && arrayItem.__ob__ && arrayItem.__ob__.dep.depend();
                    }
                }
            }

            return value;
        },
        set: function setter(newValue) {
            if (newValue === value) {
                return;
            }
            // console.log(key + '属性改变成了：' + newValue);
            value = newValue;
            // 新的值是object的话，进行监听
            childObj = observe(newValue);
            // 通知这个属性的所有观察者，这样就实现了m->v
            dep.notify();
        }
    });
};