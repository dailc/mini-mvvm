function def(obj, key, val, enumerable) {
    // 默认增加的都是不可枚举的
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: !!enumerable,
        writable: true,
        value: val
    });
}