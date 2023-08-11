//列表区可以显示所有的物料
//key对应的组件映射关系

import { ElButton, ElInput } from "element-plus";

function createEditorConfig() {
    const componentList = [];//存放组件列表
    const componentMap = {}//存放组件映射关系
    return {
        componentList,
        componentMap,
        register: (component) => {
            componentList.push(component);
            componentMap[component.key] = component
        }
    }
}

export let registerConfig = createEditorConfig();
const createInputProp =(label) =>({type:'input',label})//工厂函数
const createColorProp =(label) =>({type:'color',label})//工厂函数
const createSelectProp =(label,options) =>({type:'select',label,options})//工厂函数

console.log(registerConfig);
registerConfig.register({
    label: '文本',
    preview: () => '预览文本',
    render: ({props}) => <span style={{color:props.color,fontSize:props.size}} >{props.text ||'渲染文本'}</span>,
    key: 'text',
    props:{
        text:createInputProp('文本内容'),
        color:createColorProp('字体颜色'),
        size:createSelectProp('字体大小',[
            {label:'14px',value:'14px'},
            {label:'16px',value:'16px'},
            {label:'20px',value:'20px'},
        ])
    }

})
registerConfig.register({
    label: '按钮',
    resize:{//改变按钮的宽高
        width:true,
        height:true
    },
    preview: () => <ElButton>预览按钮</ElButton>,
    render: ({props,size}) => <ElButton  style={{height:size.height+'px',width:size.width+'px'}} type={props.type} size={props.size}>{props.text || '渲染按钮'}</ElButton>,
    key: 'button',
    props:{
        text:createInputProp('按钮内容'),
        type:createSelectProp('按钮类型',[
            {label:'基础',value:'primary'},
            {label:'成功',value:'success'},
            {label:'警告',value:'warning'},
            {label:'危险',value:'danger'},
            {label:'文本',value:'text'},
        ]),
        size:createSelectProp('按钮尺寸',[
            {label:'默认',value:'default'},
            {label:'大',value:'large'},
            {label:'小',value:'small'},
        ])
    }

})
registerConfig.register({
    label: '输入框',
    resize:{//改变输入框的横向大小
        width:true,
    },
    preview: () => <ElInput placeholder="预览输入框"></ElInput>,
    render: ({model,size}) => <ElInput placeholder="渲染输入框"{...model.default} style={{width:size.width+'px'}}></ElInput>,
    key: 'input',
    model:{//default:username
        default:'绑定字段'
    }
})