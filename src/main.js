import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
const app = createApp(App)

// 使用elementplus组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
app.use(ElementPlus, { locale: zhCn })

// 使用fontawesome图标库
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// 引入fontawesome图标库
// import { library } from '@fortawesome/fontawesome-svg-core'
// import { faTrain, faHeart, faPenFancy } from '@fortawesome/free-solid-svg-icons'
// import { faQq } from '@fortawesome/free-brands-svg-icons'
// import { faCopy } from '@fortawesome/free-regular-svg-icons'
// library.add(faTrain, faQq, faCopy, faHeart, faPenFancy)

app.component('FontAwesomeIcon', FontAwesomeIcon)



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
