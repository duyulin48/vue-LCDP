import { defineComponent } from "vue";


export default defineComponent({
    props: {
        block: { type: Object },
        component: { type: Object }
    },


    setup(props) {
        const { width, height } = props.component.resize || {}
        let data = {}
        const onmousemove = (e) => {
            let { clientX, clientY } = e;
            let { startX, startY, startWidth, startHeight, startLeft, startRight, direction } = data;

            let durX = clientX - startX;
            let durY = clientY - startY;
            if (direction.horizontal =='center') {//如果拖拽的时中间的点，x轴不变
                clientX=startX
            }
            if (direction.vertical=='center') {//只改横向，纵向不发生改变
                clientY=startY
            }

            const width = startWidth + durX
            const height = startHeight + durY  

            props.block.width=width;
            props.block.height=height;//拖拽时，改变宽高
            props.block.hasResize =true//声明一个新字段

        }
        const onmouseup = () => {
            document.body.removeEventListener('mousemove', onmousemove)
            document.body.removeEventListener('mouseup', onmouseup)
        }


        const onmousedown = (e, direction) => {
            e.stopPropagation();//阻止默认行为
            data = {
                startX: e.clientX,
                startY: e.clientY,
                startWidth: props.block.width,
                startHeight: props.block.height,
                startLeft: props.block.left,
                startRight: props.block.right,
                direction
            }
            document.body.addEventListener('mousemove', onmousemove)
            document.body.addEventListener('mouseup', onmouseup)

        }
        return () => <>
            {
                width && <>
                    <div class="block-resize block-resize-left"
                        onMousedown={e => onmousedown(e, { horizontal: 'start', vertical: 'center' })}></div>
                    <div class="block-resize block-resize-right"
                        onMousedown={e => onmousedown(e, { horizontal: 'end', vertical: 'center' })}></div>
                </>
            }
            {
                height && <>
                    <div class="block-resize block-resize-top"
                        onMousedown={e => onmousedown(e, { horizontal: 'center', vertical: 'start' })}></div>
                    <div class="block-resize block-resize-bottom"
                        onMousedown={e => onmousedown(e, { horizontal: 'center', vertical: 'end' })}></div>
                </>
            }
            {
                width && height && <>
                    <div class="block-resize block-resize-top-left"
                        onMousedown={e => onmousedown(e, { horizontal: 'start', vertical: 'start' })}></div>
                    <div class="block-resize block-resize-top-right"
                        onMousedown={e => onmousedown(e, { horizontal: 'end', vertical: 'start' })}></div>
                    <div class="block-resize block-resize-bottom-left"
                        onMousedown={e => onmousedown(e, { horizontal: 'start', vertical: 'end' })}></div>
                    <div class="block-resize block-resize-bottom-right"
                        onMousedown={e => onmousedown(e, { horizontal: 'end', vertical: 'end' })}></div>
                </>
            }



        </>

    }
})