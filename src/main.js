import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'



const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')


// 1.先构造一些假数据，能实现根据位置渲染内容
// 2.配置组件对应的映射关系