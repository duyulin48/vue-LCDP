import { provide,inject, computed, createVNode, defineComponent, onBeforeUnmount, onMounted, reactive, ref, render } from "vue";

export const DropdownItem = defineComponent({
    props: {
        label: String,
        icon: String
    },
    setup(props) {
        let { label, icon } = props
        let hide= inject('hide')
        return () => <div class="dropdown-item" onClick={hide}>
            <i class={icon}></i>
            <span>{label}</span>
        </div>
    }
})

const DropdownComponent = defineComponent({
    props: {
        option: { type: Object },

    },
    setup(props, ctx) {
        const state = reactive({
            option: props.option,
            isShow: false,
            top: 0,
            left: 0
        })
        ctx.expose({
            showDropdown(option) {
                state.option = option;
                state.isShow = true;
                let { top, left, height } = option.el.getBoundingClientRect();
                state.top = top + height
                state.left = left
            }
        });

        provide('hide',() => state.isShow=false)
        const classes = computed(() => [
            'dropdown',
            {
                'dropdown-isShow': state.isShow
            }
        ])

        const styles = computed(() => ({
            top: state.top + 'px',
            left: state.left + 'px'

        }))

        const el = ref(null)
        const onMousedownDocment = (e) => {
            if (!el.value.contains(e.target)) {//如果点击的时drop内部，什么都不做
                state.isShow = false;//点击外部隐藏下拉菜单栏
            }
        }
        onMounted(() => {
            //事件的传递行为是先捕获，再冒泡
            document.body.addEventListener('mousedown', onMousedownDocment, true)
        })
        onBeforeUnmount(() => {
            document.body.removeEventListener('mousedown', onMousedownDocment)
        })

        return () => {
            return <div class={classes.value} style={styles.value} ref={el}>
                {state.option.content()}
            </div>

        }

    }
})

let vm;
export function $dropdown(option) {
    //手动挂载组件   
    if (!vm) {
        let el = document.createElement('div')
        vm = createVNode(DropdownComponent , { option })//创建虚拟节点
        document.body.appendChild((render(vm, el), el))  //渲染成真是节点扔到页面中     
    }
    //将组件渲染到这个el元素上
    let { showDropdown } = vm.component.exposed
    showDropdown(option)//其他说明组件已经有了，只需要显示出来即可
}
