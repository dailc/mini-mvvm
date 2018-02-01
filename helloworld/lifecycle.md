# vue生命周期

https://cn.vuejs.org/v2/guide/instance.html

```js
new Vue() -> init(Events & Lifecycle) -> 1.beforeCreate
-> init(injections & reactivity) -> 2.created
-> el与template的判断（如果没有el，必须生成el后才可进行） -> 3.beforeMount
-> Create vm.$el and replace 'el' width it -> 4.mounted
beforeMount与mounted之间主要的动作：将{{Name}}这种占位符替换为真实的DOM
（相当于就是把Virtualdom匹配挂载成真实DOM）

然后就是事件循环，包括数据更新 -> 5.beforeUpdate -> Virtual Dom的匹配和渲染 -> 6.updated

当调用vm.$destroy时 -> 7.beforeDestroy
-> 拆卸watcher，模版，以及事件监听 -> destroyed -> 8.destroyed
```