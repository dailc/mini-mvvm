# mini-mvvm

mvvm模式源码分析，还原一个极简版的双向绑定框架。

## 极简版MVVM示例

这是 hello world 级别的，应该找不到比这更简单的MVVM示例了

hello world系列。

可以分别展开讲述下，从最简单，到后来的一步一步增加

- mvvm_helloworld.html：最原始的mvvm，仅仅有简单的mvvm功能

- mvvm_helloworld2_deep.html：深度递归，可以递归对对象进行监听

- mvvm_helloworld3_event.html：增加了监听的事件绑定，如click等

- mvvm_helloworld4_watch.html：增加了对数据的watch功能

- mvvm_helloworld5_watchergetter.html：重新组织了下代码，优化了下结构

- mvvm_helloworld6_computed.html：增加计算元素功能

- mvvm_helloworld7_class.html：增加普通html、css样式的绑定

- mvvm_helloworld8_list.html：增加支持列表指令以及模版的渲染（没有考虑优化）

- mvvm_helloworld9_if.html：增加if指令的支持

- summary：最后总结归纳了下，拆分为多个文件，便于整体梳理。

基本上，一套走下来，会发现核心仍然是MVVM以及数据监听、DOM劫持等，其余的指令更多的都是附加，并不影响对整体的理解

## AST&VDOM

预计新增AST以及Virtual-Dom功能

[helloworld/mvvm_helloworld.html](helloworld/mvvm_helloworld.html)
