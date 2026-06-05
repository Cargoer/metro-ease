import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
const app = createApp(App)

// 使用elementplus组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
app.use(ElementPlus, { locale: zhCn })

// 自动全局注册自定义ui组件
import ui from './ui/index.js'
app.use(ui)

// 使用pinia状态管理
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

// 使用路由
import router from './router/index.js'
app.use(router)

// 使用自定义指令
import clickCounter from './directives/buriedPoint.js'
app.directive('click-counter', clickCounter)

app.mount('#app')
