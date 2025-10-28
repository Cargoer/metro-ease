<template>
  <div class="page">
    <div class="app-name">MetroEase</div>
    <div class="center">
      <div class="new entry-item">
        <span class="entry-title">新建</span>
        <div class="entry-btn" style="font-size: 40px;" @click="jumpToCanvas('new')">+</div>
      </div>
      <div class="gallery entry-item">
        <span class="entry-title">图库</span>
        <div class="gallery-list">
          <div
            v-for="gallery in galleries" 
            :key="gallery.name" 
            v-click-counter="'CLICK_' + gallery.name.toUpperCase()"
            class="entry-btn" 
            @click="jumpToCanvas(gallery.name)"
          >{{ gallery.title }}</div>
        </div>
      </div>
    </div>
    <p style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);">
      交流QQ群：837512598<br>
      现已引入mapbox底图，欢迎投稿你所绘制的地区轨交图
    </p>
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
  },
  {
    name: 'hongkong',
    title: '香港地铁'
  },
  {
    name: 'greatbay',
    title: '大湾区轨交'
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
  position: relative;

  .app-name {
    position: absolute;
    top: 30px;
    left: 50px;
    font-size: 60px;
    font-weight: 700;
    margin-bottom: 30px;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-image: linear-gradient(to bottom, #2177b8, #b0d5df);
  }
  .center {
    display: flex;
    justify-content: center;
    // align-items: center;
    flex-direction: column;
    gap: 30px;
    padding-left: 300px;

    .entry-item {
      display: flex;
      flex-direction: column;
      gap: 30px;
      align-items: flex-start;

      .entry-title {
        font-size: 24px;
        font-weight: 500;
      }
      .gallery-list {
        display: flex;
        max-width: 600px;
        flex-wrap: wrap;
        gap: 20px;
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

@media screen and (max-width: 500px) {
  .page {
    .app-name {
      font-size: 50px;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
    .center {
      padding-left: 20px;
      .new {
        display: none;
      }
    }
  }
}
</style>