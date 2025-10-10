// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/index/index.vue'),
    meta: { title: 'MetroEase - 易地铁' }
  },
  {
    path: '/:name',
    name: 'draw',
    component: () => import('../views/draw/index.vue'),
    meta: { title: 'MetroEase - 易地铁' }
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

// 根据路由动态修改标题
router.beforeEach((to, from, next) => {
  const title = to.meta.title || 'MetroEase - 易地铁' // 从路由 meta 中获取标题
  document.title = title // 设置标题
  next()
})

export default router