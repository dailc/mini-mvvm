function Watcher(vm, namespace, cb) {
    this.depIds = {};
    this.vm = vm;
    this.cb = cb;
    // getter用来获取命名空间
    this.getter = this.parseGetterByNamespace(namespace);
    // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
    this.value = this.get();
}

Watcher.prototype.update = function update() {
    const value = this.get();
    const oldValue = this.value;

    if (value !== oldValue || Array.isArray(value)) {
        // 数组绑定dep.notify的关键
        // 如果是数组也需要进来，否则就算数组push了新元素，引用仍然相等的
        this.value = value;
        // 执行Compile中绑定的回调，更新视图
        this.cb.call(this.vm, value, oldValue);
    }
};

Watcher.prototype.get = function get() {
    /**
     * 1.Dep.target设为自己
     * 2.调用对应数据的get，这样数据就知道有Watcher需要添加了
     * 3.对应数据的dep会将这个Watcher添加到它的观察者队列中
     * 4.以后数据的任何变动（set），就会通知这个Watcher
     * 5.Dep.target再设为null，所以确保了Watcher只会被添加一次
     */
    Dep.target = this;
    // 触发getter，添加自己到属性订阅器中
    // 如果是初始化时，此时target刚好为这个watcher，则会被添加到数据的watcher里
    // 获取的是vm中对应的命名空间
    const value = this.getter.call(this.vm, this.vm);

    Dep.target = null;

    return value;
};

// 每个watcher都可以管理自己的依赖
// 确保不重复添加
// 也确保就算引用切断，每次调用时可以重新添加
Watcher.prototype.addDep = function addDep(dep) {
    if (!this.depIds.hasOwnProperty(dep.id)) {
        // 如果依赖中没有当前watcher，这个依赖将当前watcher添加进去
        dep.addWatcher(this);
        this.depIds[dep.id] = dep;
    }
};

Watcher.prototype.parseGetterByNamespace = function parseGetterByNamespace(namespace) {
    if (/[^\w.$]/.test(namespace)) {
        // 非法命名空间
        throw new Error('错误，Watcher必须接受一个命名空间');
    }

    const namespaceArr = namespace.split('.');

    // 返回一个命名空间 getter
    return function(val) {
        namespaceArr && namespaceArr.forEach(function(key) {
            if (val) {
                val = val[key];
            }
        });

        return val;
    };

};