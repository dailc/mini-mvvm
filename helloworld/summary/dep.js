let uuid = 0;

function Dep() {
    this.id = uuid++;
    this.watchers = [];
}

// 检查依赖添加
Dep.prototype.depend = function depend() {
    if (Dep.target) {
        // 如果有观察者（Dep.target）
        // 观察者开始观察这个数据
        // 这样只要数据有变化就会通知观察者
        Dep.target.addDep(this);
    }
};

Dep.prototype.addWatcher = function addWatcher(watcher) {
    // 极简版的 watcher只考虑初始化时添加
    this.watchers.push(watcher);
};

Dep.prototype.removeWatcher = function removeWatcher(watcher) {
    const index = this.watchers.indexOf(watcher);
    
    if (index > -1) {
        this.watchers.splice(index, 1);
    }
};

Dep.prototype.notify = function notify() {
    this.watchers.forEach((watcher) => {
        // 每次数据改变时，它的依赖管理会通知它所有的watcher
        // 然后watcher依次更新自己的视图
        watcher.update();
    });
};

// 用来判断当前是哪一个Watcher初始化
Dep.target = null;