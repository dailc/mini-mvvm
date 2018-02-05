function Compile(node, vm) {
    this.vm = vm;
    this.node = node;

    // 现将所有的节点劫持到frag中，然后再进行初始化（譬如解析指令，绑定数据等）
    // 然后解析完毕后再将frag重新添加会DOM中，这是一种优化手段（不过现代浏览器就算不这样做，也有自己的优化的）
    // 注意，这里是真的“劫持”，会从DOM树中消失，劫持到frag中
    const frag = this.nodeToFragment(this.node, this.vm);

    // 劫持完毕后，再frag中编译所有元素，包括解析指令，绑定数据等
    this.compile(frag, this.vm);
    // 上面所有的节点都已经被劫持到frag中了，所以这里再重新添加回DOM
    this.node.appendChild(frag);
}

Compile.prototype.nodeToFragment = function nodeToFragment(node, vm) {
    const frag = document.createDocumentFragment();
    let child;

    while (child = node.firstChild) {
        frag.appendChild(child);
    }

    return frag;
};

// 编译，目前只识别{{}}展示DOM和input输入DOM
Compile.prototype.compile = function compile(node, vm) {
    // 遍历循环编译所有的节点，这样就不会错漏
    const childNodes = node.childNodes;

    [].slice.call(childNodes).forEach((node) => {
        if (node.nodeType === 1) {
            // 元素节点
            this.compileElement(node, vm);
        } else if (node.nodeType === 3) {
            // 文本节点
            this.compileText(node, vm);
        }

        // 暂时用耦合的方式跳过v-for(isNeedSkip)
        if (node.childNodes && node.childNodes.length && !this.isNeedSkip) {
            // 递归编译
            this.compile(node, vm);
        }
        this.isNeedSkip = false;
    });
};

Compile.prototype.compileText = function compileText(node, vm) {
    const textReg = /[{]{2}(.*)[}]{2}/;

    // 节点类型为text
    // 需要识别textReg
    if (textReg.test(node.nodeValue)) {
        // 获取正则刚刚匹配的捕获组
        const namespace = RegExp.$1;

        // 它的作用和文本指令一样
        directiveUtil.text(node, vm, namespace);
    }
};

Compile.prototype.compileElement = function compileElement(node, vm) {
    // 节点类型为元素
    // 需要解析属性，看看有没有指令
    [].slice.call(node.attributes).forEach((attr) => {
        this.handleDirective(node, vm, attr);
    })
};

Compile.prototype.handleDirective = function handleDirective(node, vm, attr) {
    const REG_DIRECTIVE = /^v-/;
    const REG_DIRECTIVE_EVENT = /^v-on/;
    const REG_DIRECTIVE_FOR = /^v-for/;
    const directive = attr.nodeName;
    const expression = attr.nodeValue;

    if (REG_DIRECTIVE.test(directive)) {
        // 路径，如v-html、v-class分别获取html、class
        const dir = directive.substring(2);
        // 如果是指令
        if (REG_DIRECTIVE_EVENT.test(directive)) {
            // 事件指令
            directiveUtil.handleEvent(node, vm, expression, directive);
        } else {
            // 普通指令，存在指令处理方法采取处理
            // 兼容v-for，v-for直接交由v-for处理
            if (REG_DIRECTIVE_FOR.test(directive)) {
                this.isNeedSkip = true;
            }
            // 注意，this指针
            directiveUtil[dir] && directiveUtil[dir](node, vm, expression);
        }

        // 移除已经解析完毕的指令
        node.removeAttribute(directive);
    }
};

// 指令工具合集，抽象并复用代码
const directiveUtil = {
    text: function(node, vm, expression) {
        this.bind(node, vm, expression, 'text');
    },
    class: function(node, vm, expression) {
        this.bind(node, vm, expression, 'class');
    },
    html: function(node, vm, expression) {
        this.bind(node, vm, expression, 'html');
    },
    model: function(node, vm, expression) {
        this.bind(node, vm, expression, 'model');

        // model除了要单向绑定，还需主动监听
        // 获取v-model绑定的属性名，将视图和model绑定
        const namespace = expression;

        node.addEventListener('input', (e) => {
            // 监听到视图更新，然后同步更新数据，这样也会带动展示视图的更新
            // 设置这个命名空间下的新值
            this.setVMValByNamespace(vm, namespace, e.target.value);
        });
    },
    // bind的作用是，数据更新时，让视图也更新
    bind: function(node, vm, expression, dir) {
        // 找到更新函数
        const updaterFn = updater[dir + 'Updater'];
        const namespace = expression;

        if (updaterFn) {
            // 先更新
            updaterFn(node, this.getVMValByNamespace(vm, namespace));
            // 让这个更新DOM跟随数据更新的
            new Watcher(vm, namespace, function(value, oldValue) {
                updaterFn(node, value, oldValue);
            });
        }
    },
    // if操作
    if: function(node, vm, expression) {
        // 需要先找到下一个的else模版，然后通过display控制显隐（要求必须是相邻的，否则无效）
        const next = node.nextElementSibling;
        // if对应的变量属性
        const namespace = expression;
        // 缓存以前的真值
        let oldValue;
        let elseEl;

        if (next && next.getAttribute('v-else') !== undefined) {
            // 先移除v-else指令，有可能是空
            next.removeAttribute('v-else');
            elseEl = next;
        }

        const update = (value) => {
            if (value === oldValue) {
                // 没有改变，就什么都不做
                return;
            }
            oldValue = value;

            if (value) {
                /**
                 * 这里实际上这样用是不对的，但这里仅仅是为了演示就这样用了
                 * 实际上，应该放到虚拟dom中，这样结合做才不会污染原有的布局
                 * 但是这个示例截至目前为止还没有引入虚拟dom，所以就这样用了
                 */
                node.style.display = 'block';
                elseEl && (elseEl.style.display = 'none');
            } else {
                node.style.display = 'none';
                elseEl && (elseEl.style.display = 'block');
            }
        };

        update(!!this.getVMValByNamespace(vm, namespace));

        new Watcher(vm, namespace, function(value, oldValue) {
            update(!!value);
        });
    },
    for: function(node, vm, expression) {
        // for循环的必须单独写，目前只支持item in items形式
        const REF_LIST_FOR = /(\w+)\s+in\s+(\w+)/;
        const forMatch = expression.match(REF_LIST_FOR);
        const renderFn = this.renderFor;
        let template = node.outerHTML;

        if (!forMatch || !forMatch[2]) {
            // 跳过
            return;
        }
        // 模版去除v-for属性
        template = template.replace(/v-for="[^"]*"/, '');

        const items = this.getVMValByNamespace(vm, forMatch[2]);

        // 让这个更新DOM跟随数据更新的
        new Watcher(vm, forMatch[2], function(value, oldValue) {
            renderFn(vm, node, value, oldValue, forMatch[1], template);
        });

        renderFn(vm, node, items, undefined, forMatch[1], template);
    },
    renderFor: function renderFor(vm, node, list, oldList, itemStr, template) {
        let html = '';

        if (Array.isArray(list)) {
            html = directiveUtil.renderHtmlByList(vm, list, itemStr, template);
        }

        updater.forUpdater(node, html);
    },

    renderHtmlByList: function renderHtmlByList(vm, list, itemStr, template) {
        const textReg = /[{]{2}([^{}]*)[}]{2}/g;
        let htmlArr = [];

        list.forEach((item) => {
            htmlArr.push(template.replace(textReg, ($0, $1) => {
                // 去除空格
                $1 = $1.trim();

                // 默认去vm中找
                let value = this.getVMValByNamespace(vm, $1);

                if (!value) {
                    const itemName = $1.replace(itemStr + '.', '');

                    // 如果vm中没找到，去列表中的每一项中找
                    value = item[itemName] || '';
                }

                return value;
            }));
        });

        return htmlArr.join('');
    },
    // 处理事件
    handleEvent: function(node, vm, expression, directive) {
        // 事件监听，譬如v-on:click获取click
        const eventType = directive.split(':')[1];
        const fn = vm.$options.methods && vm.$options.methods[expression];

        if (eventType && fn) {
            // 冒泡事件模型即可
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    setVMValByNamespace: function(vm, namespace, newVal) {
        const namespaceArr = namespace.split('.');
        const len = namespaceArr.length;
        let parent = vm;

        for (let i = 0; i < len - 1; i++) {
            if (parent) {
                parent = parent[namespaceArr[i]];
            }

        }

        if (parent) {
            parent[namespaceArr[len - 1]] = newVal;
        }
    },
    getVMValByNamespace: function(vm, namespace) {
        const namespaceArr = namespace.split('.');
        // 这里要是vm而不是vm.$data，否则计算元素将无法获取
        let val = vm;

        namespaceArr && namespaceArr.forEach(function(key) {
            if (val) {
                val = val[key];
            }
        });

        return val;
    }

};

const updater = {
    // 文本
    textUpdater: function textUpdater(node, value) {
        // 相比innerText，textContent可以防止xss攻击，而且通常具有更好性能
        // 它会返回隐藏元素
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    // html
    htmlUpdater: function htmlUpdater(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    // css的class
    classUpdater: function classUpdater(node, value, oldValue) {
        let className = node.className;

        className = className.replace(oldValue, '').replace(/\s$/, '');

        const space = (className && String(value)) ? ' ' : '';

        node.className = className + space + value;
    },
    // model，输入节点值
    modelUpdater: function modelUpdater(node, value) {
        node.value = typeof value == 'undefined' ? '' : value;
    },
    // for循环
    forUpdater: function forUpdater(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    }
};