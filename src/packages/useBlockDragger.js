import { reactive } from "vue"
import { events } from "./events"


export function useBlockDragger(focusData, lastSelectBlock, data) {
    let dragState = {//定义了一个dragState对象，记录了拖拽的起始位置
        startX: 0,
        startY: 0,
        dragging:false//默认不在拖拽
    }
    let markLine = reactive({//markline辅助线是一个响应式数据，xy更新会导致视图更新
        x: null,
        y: null
    })

    //mousedown函数是鼠标按 下事件的处理函数，它会记录鼠标按下时的初始位置和被选中元素的初始位置，并添加mousemove和mouseup事件监听
    const mousedown = (e) => {
        const { width: BWidth, height: BHeight } = lastSelectBlock.value//拖拽最后的元素

        dragState = {
            startX: e.clientX,
            startY: e.clientY,//记录每一个被选中位置
            startLeft: lastSelectBlock.value.left,//b点拖拽前的位置
            startTop: lastSelectBlock.value.top,
            dragging:false,
            startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
            lines: (() => {

                const { unfocused } = focusData.value//获取其他没有选中的组件并以他们的位置做辅助线
                let lines = { x: [], y: [] };//计算横线的位置，横线放到y数组，竖线放到x数组
                [...unfocused, {
                    top: 0,
                    left: 0,
                    width: data.value.container.width,
                    height: data.value.container.height//同时传入整个容器的宽高，做相对容器的辅助线
                }].forEach((block) => {
                    const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block;
                    lines.y.push({ showTop: ATop, top: ATop });//当此元素拖拽到与A元素的top一致时，显示辅助线，辅助线位置为ATOP
                    lines.y.push({ showTop: ATop, top: ATop - BHeight });//顶对底
                    lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - BHeight / 2 }); //中对中
                    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight });//底对顶
                    lines.y.push({ showTop: ATop + AHeight, top: ATop - BHeight });//底对底

                    lines.x.push({ showLeft: ALeft, left: ALeft })//左对左
                    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth })//右对左
                    lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - BWidth / 2 })//中对中
                    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth })//右对右
                    lines.x.push({ showLeft: ALeft, left: ALeft - BWidth })//左对右
                })
                return lines
            })()
        }
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
    }

    const mousemove = (e) => {//mousemove函数是鼠标移动事件的处理函数，它根据鼠标移动的距离更新被选中元素的位置，实现拖拽效果
        let { clientX: moveX, clientY: moveY } = e;
        if (!dragState.dragging) {
            dragState.dragging=true;
            events.emit('start')//触发事件就会记住拖拽前的位置
        }
        //计算当前元素最新的left和top,线里面找，找到显示线
        //鼠标移动后-鼠标移动前+left就好
        let left = moveX - dragState.startX + dragState.startLeft;
        let top = moveY - dragState.startY + dragState.startTop;
        //先计算横线  距离参照物还有5px时，显示这根线
        let y = null
        let x = null
        for (let i = 0; i < dragState.lines.y.length; i++) {
            const { top: t, showTop: s } = dragState.lines.y[i]//获取每一根线
            if (Math.abs(t - top) < 5) {//如果小于5说明接近了
                y = s//线要实现的位置
                moveY = dragState.startY - dragState.startTop + t//容器距离顶部的距离+目标的高度=最新的moveY

                //实现快速贴近

                break;//找到一根线就跳出循环
            }

        }

        for (let i = 0; i < dragState.lines.x.length; i++) {
            const { left: l, showLeft: s } = dragState.lines.x[i]//获取每一根线
            if (Math.abs(l - left) < 5) {//如果小于5说明接近了
                x = s//线要实现的位置

                moveX = dragState.startX - dragState.startLeft + l//容器距离顶部的距离+目标的高度=最新的movex
                //实现快速贴近

                break;//找到一根线就跳出循环
            }

        }
        markLine.x = x;
        markLine.y = y;

        let durX = moveX - dragState.startX;//拖拽之前和之后的距离
        let durY = moveY - dragState.startY;
        focusData.value.focus.forEach((block, idx) => {
            block.top = dragState.startPos[idx].top + durY
            block.left = dragState.startPos[idx].left + durX
        })
    }


    const mouseup = (e) => {//mouseup函数是鼠标松开事件的处理函数，它移除mousemove和mouseup事件监听，结束拖拽操作
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        markLine.x = null;
        markLine.y = null;
        if (dragState.dragging) {//如果只是点击就不会触发
            events.emit('end')
        }
    }

    return {
        mousedown,
        markLine
    }
}