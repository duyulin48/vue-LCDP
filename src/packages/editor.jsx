import { computed, defineComponent, inject, ref } from "vue";
import './editor.scss'
import EditorBlock from "./editor-block.jsx";
import deepcopy from "deepcopy";
import { useMenuDragger } from "./useMenuDragger";
import { useFocus } from "./useFocus";
import { useBlockDragger } from "./useBlockDragger";
import { useCommand } from "./useCommand";
import { $dialog } from "@/components/Dialog";
import { $dropdown, DropdownItem } from "@/components/Dropdown";
import EditorOperator from "./editorOperator.jsx";


export default defineComponent({
    props: {
        modelValue: { type: Object },
        formData:{type:Object}
    },
    emits: ['update:modelValue'],//要触发的事件
    setup(props, ctx) {
        //预览的时候，内容不能再操作了，可以点击输入内容，方便看效果
        const previewRef = ref(false)
        // 用计算属性定义data方便代码使用
        const data = computed({
            get() {
                return props.modelValue
            },
            //set(newValue) 它接收 newValue，然后使用 ctx.emit 发出一个名为 'update:modelValue' 的自定义事件，并传递 newValue 作为参数。
            set(newValue) {
                //深拷贝
                ctx.emit('update:modelValue', deepcopy(newValue))

            }
        })
        // 接收自定义组件的样式
        const containerStyles = computed(() => ({
            width: data.value.container.width + 'px',
            height: data.value.container.height + 'px'
        }))
        //接收config渲染参数
        const config = inject('config')
        //获取内容区的虚拟dom
        const containerRef = ref(null)
        //1.实现菜单的拖拽功能，将左侧菜单的拖拽事件功能封装为js函数useMenuDragger
        const { dragstart, dragend, } = useMenuDragger(containerRef, data)
        // 2.实现内容区的多个拖拽功能'
        let { blockMousedown, focusData, containerMousedown, lastSelectBlock, clearBlockFocus } = useFocus(previewRef, data, (e) => {
            //获取焦点后进行拖拽
            mousedown(e);
        });
        //实现内容区域组件拖拽
        let { mousedown, markLine } = useBlockDragger(focusData, lastSelectBlock, data)
        const { commands } = useCommand(data, focusData);
        //按钮组件
        let buttons = [
            { label: "撤销", icon: "icon-reply", handler: () => commands.undo() },
            { label: "重做", icon: "icon-redo", handler: () => commands.redo() },
            {
                label: "导出", icon: "icon-right-arrow-rect", handler: () => {
                    $dialog({
                        title: '导出json使用',
                        content: JSON.stringify(data.value),
                    })
                }
            },
            {
                label: "导入", icon: "icon-left-arrow-rect", handler: () => {
                    $dialog({
                        title: '导入json使用',
                        content: '123123',
                        footer: true,
                        onConfirm(text) {
                            data.value = JSON.parse(text)//这样更改无法保留历史记录
                            commands.updateContainer(JSON.parse(text));
                        }
                    })
                }
            },
            { label: "置顶", icon: "icon-arrow-to-top", handler: () => commands.placeTop() },
            { label: "置底", icon: "icon-arrow-to-bottom", handler: () => commands.placeButtom() },
            { label: "删除", icon: "icon-times", handler: () => commands.delete() },
            {
                label: () => previewRef.value ? '编辑' : '预览', icon: () => previewRef.value ? 'icon-terminal' : 'icon-eye', handler: () => {
                    previewRef.value = !previewRef.value;
                    clearBlockFocus();//切换到预览模式需要清空选中框
                }
            },
        ]

        const onContextMenuBlock = (e, block) => {
            e.preventDefault();
            $dropdown({
                el: e.target,//以哪个元素为基准
                content: () => {
                    return <>
                        <DropdownItem label="删除" icon="icon-times" onClick={() => commands.delete()} ></DropdownItem>
                        <DropdownItem label="置顶" icon="icon-arrow-to-top" onClick={() => commands.placeTop()} ></DropdownItem>
                        <DropdownItem label="置底" icon="icon-arrow-to-bottom" onClick={() => commands.placeButtom()} ></DropdownItem>
                        <DropdownItem label="查看" icon="icon-eye" onClick={() => {
                            $dialog({
                                title: '查看节点数据',
                                content: JSON.stringify(block)
                            })
                        }} ></DropdownItem>
                        <DropdownItem label="导入" icon="icon-left-arrow-rect" onClick={() => {
                            $dialog({
                                title: '导入节点数据',
                                content: '',
                                footer: true,
                                onConfirm(text) {
                                    text = JSON.parse(text);
                                    commands.updateBlock(text, block)

                                }
                            })
                        }} ></DropdownItem>
                    </>
                }
            })

        }


        return () => <div class="editor">
            <div class="editor-left">
                {/* 根据注册列表在左侧栏，渲染相应的内容  draggable属性可以实现h5的拖拽*/}
                {config.componentList.map(component => (
                    <div class="editor-left-item"
                        draggable
                        onDragstart={e => dragstart(e, component)}
                        onDragend={dragend}
                    >
                        <span>{component.label}</span>
                        <div>{component.preview()}</div>
                    </div>
                ))}
            </div>
            <div class="editor-top">
                {/* 菜单栏 */}
                {buttons.map((btn, index) => {
                    const icon = typeof btn.icon == 'function' ? btn.icon() : btn.icon
                    const label = typeof btn.label == 'function' ? btn.label() : btn.label
                    return <div class="editor-top-button" onClick={btn.handler}>
                        <i class={icon}></i>
                        <span>{label}</span>
                    </div>
                })}
            </div>
            <div class="editor-right">
                <EditorOperator block={lastSelectBlock.value} 
                data={data.value}
                updateContainer={commands.updateContainer}
                updateBlock={commands.updateBlock}
                ></EditorOperator>
            
            
            
             </div>
            <div className="editor-container">
                {/* 负责产生滚动条 */}
                <div className="editor-container-canvas">


                    {/* 产生内容区域 */}
                    <div className="editor-container-canvas_content"

                        style={containerStyles.value}
                        ref={containerRef}
                        onMousedown={containerMousedown}

                    >
                        {
                            //代码是在组件中使用data.value.blocks.map()方法遍历data.value.blocks数组，并返回一个新的数组。在遍历的过程中，对于每一个block元素，
                            //将渲染工作交给editorBlock组件
                            (data.value.blocks.map((block, index) => (
                                <EditorBlock
                                    class={block.focus ? 'editor-block-focus' : (previewRef.value ? 'editor-block-preview' : '')}
                                    block={block}
                                    onMousedown={(e) => blockMousedown(e, block, index)}
                                    onContextmenu={(e) => onContextMenuBlock(e, block)}
                                    formData={props.formData}
                                >
                                </EditorBlock>
                            )))
                        }
                        {/* 当 markLine 中 x 或 y 不为 null 时，渲染水平线和垂直线，并且根据 markLine.x 和 markLine.y 的值进行定位。 */}
                        {markLine.x !== null && <div class="line-x" style={{ left: markLine.x + 'px' }}></div>}
                        {markLine.y !== null && <div class="line-y" style={{ top: markLine.y + 'px' }}></div>}

                    </div>
                </div>
            </div>
        </div>
    }
})