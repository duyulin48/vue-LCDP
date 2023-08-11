import { computed, defineComponent, inject, onMounted, ref } from "vue";
import Blockresize from './block-resize'


export default defineComponent({
    props: {
        block: { type: Object },
        formData:{type:Object}


    },
    setup(props) {
        const blockStyles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            zIndex: `${props.block.zIndex}`


        }))
        const config = inject('config')


        const blockRef = ref(null);
        //利用生命周期钩子获取dom元素
        onMounted(() => {
            let { offsetWidth, offsetHeight } = blockRef.value;

            if (props.block.alignCenter) {//实现渲染居中功能，说明是拖拽松手的时候才开始渲染，
                props.block.left = props.block.left - offsetWidth / 2;
                props.block.top = props.block.top - offsetHeight / 2;
                props.block.alignCenter = false;//让渲染后的结果才能居中
            }
            props.block.width = offsetWidth;
            props.block.height = offsetHeight;


        })

        return () => {
            //通过block的key属性直接获取对应的组件,有用到闭包
            const component = config.componentMap[props.block.key]
            //获取render函数
            const RenderComponent = component.render({

                size:props.block.hasResize ? {width:props.block.width,height:props.block.height}:{},
                props:props.block.props,
                model:Object.keys(component.model || {}).reduce((prev,modelName)=>{
                    let propName =props.block.model[modelName]
                    prev[modelName]={
                        modelValue:props.formData[propName],
                        "onUpdate:modelValue" :v=> props.formData[propName]=v
                    }
                    return prev
                },{})
            });
            const {width,height} =component.resize || {} 
            return <div class="editor-block" style={blockStyles.value} ref={blockRef}>
                {RenderComponent}
                {/* 传递block的目的是为了修改当前block的宽高，component中存放了是修改高度还是宽度 */}
                {props.block.focus &&(width||height)&&<Blockresize
                block={props.block}
                component={component}
                ></Blockresize>}
            </div>
        }
    }
})