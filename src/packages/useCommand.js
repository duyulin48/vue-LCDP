import deepcopy from "deepcopy";
import { events } from "./events";
import { onUnmounted } from "vue";


export function useCommand(data, focusData) {
    const state = {//前进后退需要指针
        current: -1,//前进后退的索引值
        queue: [],//存放所用的操作命令
        commands: {},//制作命令和执行功能的一个映射表
        commandArray: [],//存放所有的命令
        destroyArray: []//销毁函数
    }
    const registry = (command) => {
        state.commandArray.push(command);
        state.commands[command.name] = (...args) => {//命令名字对应执行函数
            const { redo, undo } = command.excute(...args);
            redo()
            if (!command.pushQueue) {//不需要的直接放入队列中跳过即可
                return
            }
            let { queue, current } = state
            if (queue.length > 0) {
                queue = queue.slice(0, current + 1)//可能再放置过程中有撤销操作，所以根据最新的current计算
                state.queue = queue
            }
            queue.push({ redo, undo });//保存指令的前进和后退
            state.current = current + 1
        }

    }

    //注册我们需要的命令
    registry({
        name: 'redo',
        keyboard: 'ctrl+y',
        excute() {
            return {
                redo() {
                    let item = state.queue[state.current + 1];//找到当前的上一步
                    if (item) {
                        item.redo && item.redo();
                        state.current++;
                    }
                }
            }

        }
    })
    registry({
        name: 'undo',
        keyboard: 'ctrl+z',
        excute() {
            return {
                redo() {
                    if (state.current == -1) return//没有可以撤销的了
                    let item = state.queue[state.current];
                    if (item) {
                        item.undo && item.undo();
                        state.current--;
                    }

                }
            }

        }
    })
    registry({//如果希望将操作放到队列中可以增加一个属性标识，将操作放入队列之中
        name: 'drag',
        pushQueue: true,
        init() {//初始化操作默认就会执行
            this.before = null
            //监控拖拽开始事件，保存状态
            const start = () => { this.before = deepcopy(data.value.blocks) }
            //拖拽之后需要触发相应指令
            const end = () => { state.commands.drag() }
            events.on('start', start)
            events.on('end', end)
            return () => {
                events.off('start', start)
                events.off('end', end)
            }
        },
        excute() {
            let before = this.before;
            let after = data.value.blocks//之后的状态
            return {
                redo() {//默认一松手就把，当前事情直接做了，并且存入redo
                    data.value = { ...data.value, blocks: after }
                },
                undo() {//前一步的，存入undo
                    data.value = { ...data.value, blocks: before }
                }
            }
        }
    });
    //带有历史记录常用的模式，导入功能附带历史记录
    registry({
        name: 'updateContainer',//更新整个容器
        pushQueue: true,
        excute(newValue) {
            let state = {
                before: data.value,//当前的值
                after: newValue//新值
            }
            return {
                redo: () => {
                    data.value = state.after
                },
                undo: () => {
                    data.value = state.before
                },
            }
        }
    })
    registry({
        name: 'updateBlock',//更新单个组件
        pushQueue: true,
        excute(newBlock, oldBlock) {
            let state = {
                before: data.value.blocks,
                after: (() => {
                    let blocks = [...data.value.blocks];//拷贝一份用于新的block
                    const index = data.value.blocks.indexOf(oldBlock)//找老的，需要通过老的查找
                    if (index > -1) {
                        blocks.splice(index, 1, newBlock)
                    }
                    return blocks
                })()//新值
            }
            return {
                redo: () => {
                    data.value = { ...data.value, blocks: state.after }
                },
                undo: () => {
                    data.value = { ...data.value, blocks: state.before }
                },
            }
        }
    })



    registry({
        name: 'placeTop',//置顶操作
        pushQueue: true,
        excute() {
            let before = deepcopy(data.value.blocks)//当前的值
            let after = (//置顶就是在所有的block中找最大的
                () => {
                    let { focus, unfocused } = focusData.value;
                    let maxZIndex = unfocused.reduce((prev, block) => {
                        return Math.max(prev, block.zIndex)
                    }, -Infinity);
                    focus.forEach(block => block.zIndex = maxZIndex + 1)//让当前选中的比最大的+1即可
                    return data.value.blocks
                }
            )()//新值

            return {
                undo: () => {
                    data.value = { ...data.value, blocks: before }
                },
                redo: () => {
                    data.value = { ...data.value, blocks: after }
                },
            }
        }
    })

    registry({
        name: 'placeButtom',//置底操作
        pushQueue: true,
        excute() {
            let before = deepcopy(data.value.blocks)//当前的值
            let after = (//置顶就是在所有的block中找最大的
                () => {
                    let { focus, unfocused } = focusData.value;
                    let minZIndex = unfocused.reduce((prev, block) => {
                        return Math.min(prev, block.zIndex)
                    }, Infinity) - 1;
                    if (minZIndex < 0) {//不能直接减一,最低为零，小于零时让其他的zindex+1，自己赋值为零
                        const dur = Math.abs(minZIndex)
                        minZIndex = 0
                        unfocused.forEach(block => block.zIndex += dur)
                    }
                    focus.forEach(block => block.zIndex = minZIndex)
                    return data.value.blocks
                }
            )()//新值

            return {
                undo: () => {
                    data.value = { ...data.value, blocks: before }
                },
                redo: () => {
                    data.value = { ...data.value, blocks: after }
                },
            }
        }
    })

    registry({
        name: 'delete',//删除操作
        pushQueue: true,
        excute() {
            let state = {
                before: deepcopy(data.value.blocks),//当前的值
                after: focusData.value.unfocused //选中的值都删除了，留下的都是没选中的
            }
            return {
                redo: () => {
                    data.value = { ...data.value, blocks: state.after }
                },
                undo: () => {
                    data.value = { ...data.value, blocks: state.before }
                },
            }
        }
    })





    //快捷键
    const keyboardEvent = (() => {
        const keyCodes = {
            90: 'z', 89: 'y'
        }
        const onKeydown = (e) => {
            const { ctrlkey, keyCode } = e;//ctrl+z  /  ctrl+y
            let keyString = [];
            if (ctrlkey) keyString.push('ctrl')
            keyString.push(keyCodes[keyCode])
            keyString = keyString.join('+');

            state.commandArray.forEach(({ keyboard, name }) => {
                if (!keyboard) return;//没有键盘事件
                if (keyboard === keyString) {
                    state.commands[name]();
                    e.preventDefault();
                }
            })

        }
        const init = () => {//初始化事件
            window.addEventListener('keydown', onKeydown)
            return () => {//销毁事件
                window.removeEventListener('keydown', onKeydown)
            }
        }
        return init
    })()


        ; (() => {
            //监听键盘事件
            state.destroyArray.push(keyboardEvent())
            state.commandArray.forEach(command => command.init && state.destroyArray.push(command.init()))
        })();

    onUnmounted(() => {//清理绑定的事件
        state.destroyArray.forEach(fn => fn && fn());
    })
    return state;
}