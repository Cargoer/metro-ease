<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 计算属性：直接从路由配置中提取需要缓存的组件name
const keepAliveComponents = computed(() => {
  // 过滤出所有meta.keepAlive为true的路由对应的组件name
  return router.getRoutes()
    .filter(route => route.meta?.keepAlive)
    .map(route => route.name)
    .filter(Boolean) // 排除没有name的路由
})

</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="keepAliveComponents">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style lang="scss" scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

@media screen and (max-width: 500px) {
  .about {
    top: calc(100vh - 50px);
    // bottom: 5px;
    right: 5px;
    gap: 4px;
    .about-item {
      padding: 4px 6px;
      font-size: 14px;
    }
  }
}
</style>
