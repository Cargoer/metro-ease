<template>
  <div class="page">
    <div class="center">
      <div class="new entry-item">
        <span class="entry-title">新建</span>
        <div class="entry-btn" style="font-size: 40px;" @click="jumpToCanvas('new')">+</div>
      </div>
      <div class="gallery entry-item">
        <span class="entry-title">图库</span>
        <div v-for="gallery in galleries" :key="gallery.name" class="entry-btn" @click="jumpToCanvas(gallery.name)">{{ gallery.title }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

// 获取路由实例和当前路由对象
const router = useRouter()
const route = useRoute()

const galleries = [
  {
    name: 'shenzhen',
    title: '深圳地铁'
  },
  {
    name: 'guangzhou',
    title: '广州地铁'
  }
]

function jumpToCanvas(galleryName) {
  router.push({ name: 'draw', params: { name: galleryName } })
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  justify-content: center;
  // align-items: center;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #d0dfe6;
  .center {
    display: flex;
    justify-content: center;
    // align-items: center;
    flex-direction: column;
    gap: 30px;
    padding-left: 300px;

    .entry-item {
      display: flex;
      gap: 30px;
      align-items: center;

      .entry-title {
        font-size: 24px;
        font-weight: 500;
      }
      .entry-btn {
        width: 140px;
        height: 100px;
        background-color: #fff;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 20px;
        cursor: pointer;

        &:hover {
          background-color: #f0f0f0;
        }
      }
    }
  }
}
</style>