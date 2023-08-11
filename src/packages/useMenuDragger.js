import { events } from "./events";

export function useMenuDragger(containerRef,data){

    let currentComponent = null;
        

    //e代表event事件
    const dragenter = (e) => {
        e.dataTransfer.dropEffect = 'move'//h5拖动图标
    }
    const dragover = (e) => {
        e.preventDefault();
    }

    const dragleave = (e) => {
        e.dataTransfer.dropEffect = 'none'
    }
    const drop = (e) => {
        //
        let blocks = data.value.blocks//内部原有的组件
        //代码使用展开运算符(...)来复制原来data.value对象的属性，然后通过修改blocks属性来添加一个新的组件对象
        data.value = {
            ...data.value, blocks: [
                ...blocks,
                {
                    top: e.offsetY,
                    left: e.offsetX,
                    zIndex: 1,
                    key: currentComponent.key,
                    alignCenter:true,//希望松手的时候可以实现居中
                    props:{},
                    model:{},
                }
            ]
        }
        currentComponent = null;
    }


    //拖动相关事件监听设置
    const dragstart = (e, component) => {
        //dragenter，进入元素中，添加一个移动的标识
        //dragover，在目标元素经过，必须要阻止默认行为，否则不能出发drop
        //dragleave,离开元素时，需要添加一个禁用标识
        //drop,松手的时候，根据拖拽的组件，添加一个组件
        containerRef.value.addEventListener('dragenter', dragenter)
        containerRef.value.addEventListener('dragover', dragover)
        containerRef.value.addEventListener('dragleave', dragleave)
        containerRef.value.addEventListener('drop', drop)
        currentComponent = component
        events.emit('start');//事件发布start
    }
    // 包含了一系列的 removeEventListener() 方法调用，用于移除 containerRef 元素上的拖拽事件监听器
    const dragend =(e)=>{
        containerRef.value.removeEventListener('dragenter', dragenter)
        containerRef.value.removeEventListener('dragover', dragover)
        containerRef.value.removeEventListener('dragleave', dragleave)
        containerRef.value.removeEventListener('drop', drop)
        events.emit('end');//事件发布end
    }


return{
    dragstart,
    dragend
}


}