function MVVM(options) {
    this.$el = document.querySelector(options.el);
    this.$data = options.data;
    // 这个对象用来获取传入的所有可能配置
    this.$options = options;

    // 属性代理，实现 vm.xxx -> vm.data.xxx
    Object.keys(this.$data).forEach((key) => {
        // 请不要在data中输入methods等关键字符
        this.proxyData(key);
    });

    // 初始化initComputed，这样计算元素也可以当作一个属性
    this.initComputed();

    observe(this.$data);
    new Compile(this.$el, this);
}

MVVM.prototype.initComputed = function initComputed() {
    const computed = this.$options.computed;

    if (typeof computed === 'object') {
        // 遍历，找到所有的计算元素
        Object.keys(computed).forEach((key) => {
            Object.defineProperty(this, key, {
                // 如果是函数，直接就作为get，否则可能是一个对象，使用对象的get
                get: typeof computed[key] === 'function' ?
                    computed[key] : computed[key].get,
                set: function() {}
            });
        });
    }
};

MVVM.prototype.proxyData = function proxyData(key) {
    Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        get: function proxyGetter() {
            return this.$data[key];
        },
        set: function proxySetter(newVal) {
            this.$data[key] = newVal;
        }
    });
};

MVVM.prototype.$watch = function $watch(namespace, cb) {
    new Watcher(this, namespace, cb);
};