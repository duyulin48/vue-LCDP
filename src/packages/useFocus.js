import { computed, ref } from "vue";


export function useFocus(previewRef,data, callback) {//获取那些元素被选中了



    const selectIndex =ref(-1)//刚开始表示没有任何一个被选中
    const lastSelectBlock=computed(() => data.value.blocks[selectIndex.value])//做辅助线需要最后一个组件



    const focusData = computed(() => {
        let focus = [];
        let unfocused = [];
        data.value.blocks.forEach(block => (block.focus ? focus : unfocused).push(block))
        return {
            focus, unfocused
        }
    })


    // 清空其他人的focus
    const clearBlockFocus = () => {
        data.value.blocks.forEach(block => block.focus = false);
    }
     //点击容器让选中的失去焦点
    const containerMousedown = () => {
        if (previewRef.value) return
        clearBlockFocus();
        selectIndex.value=-1;
    }
    const blockMousedown = (e, block,index) => {
        if (previewRef.value) return
        e.preventDefault();//使用 e.preventDefault() 阻止默认的鼠标按下事件，以防止发生不必要的行为。
        e.stopPropagation();  //使用 e.stopPropagation() 阻止事件冒泡，以防止事件传递到其他元素上。

        //block上我们定义一个属性focus，获取焦点后就将focus变为true,同时添加红色虚线边框样式
        if (e.shiftKey) {
            if (focusData.value.focus.length<=1) {//当只有一个节点被选中，摁住shift也不会切换focus状态
                block.focus=true
            } else {
               //按住shift实现多选
            block.focus = !block.focus  
            }
          
        } else {
            if (!block.focus) {
                clearBlockFocus()
                block.focus = true//先要清空其他人的focus，再将自己赋值true
            } //当自己已经是选中状态时，再次点击还是选中状态
        }
        selectIndex.value=index;
        callback(e)
    }


    return {
        blockMousedown,
        focusData,
        containerMousedown,
        lastSelectBlock,
        clearBlockFocus 
   
    }
}