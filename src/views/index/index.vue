<template>
  <div class="page">
    <div class="hero">
      <div class="branding">
        <div class="logo">
          <i class="fas fa-train"></i> MetroEase
        </div>
        <div class="tagline">
          <i class="fab fa-qq" style="color: #12a0e0;"></i>
          <span>QQ交流群：837512598</span>
          <i class="far fa-copy" @click="copyQQGroup" style="cursor: pointer;"></i>
        </div>
      </div>
      <RewardAndContact :isHead="true" />
    </div>
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
            :key="gallery" 
            class="entry-btn" 
            @click="jumpToCanvas(gallery)"
          >
            {{ gallery }}
          </div>
        </div>
      </div>
    </div>
    <footer>
      <i class="fas fa-train"></i> MetroEase · 绘制你心中的轨交蓝图 | 欢迎投稿 & Mapbox 地图引擎
    </footer>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import RewardAndContact from '@/components/RewardAndContact.vue'
import { ElMessage } from 'element-plus'

const baseUrl = import.meta.env.BASE_URL

// 获取路由实例和当前路由对象
const router = useRouter()
const route = useRoute()

const galleries = [
  '粤港澳',
  '沪苏',
  '成都',
  '福州',
  '厦门',
  '南昌',
  '兰州',
]

async function copyQQGroup() {
  const qqGroup = '837512598'
  await navigator.clipboard.writeText(qqGroup).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
  .catch(() => {
    ElMessage.error('复制失败')
  })
}

function jumpToCanvas(galleryName) {
  // router.push({ name: 'draw', params: { name: galleryName } })
  const { href } = router.resolve({
    name: 'draw',
    params: { name: galleryName }
  })
  // 新标签页打开
  window.open(href, '_blank')
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  // justify-content: center;
  // align-items: center;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #d0dfe6;
  position: relative;
  padding: 30px 30px 50px;

  .hero {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    // margin-bottom: 2.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 1.25rem;

    .branding {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.75rem;

      .logo {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #1F4E6E, #2C7DA0);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        position: relative;

        i {
          background: none;
          background-clip: unset;
          -webkit-background-clip: unset;
          color: #2C7DA0;
          font-size: 1.9rem;
          margin-right: 0.2rem;
        }
      }

      .tagline {
        font-size: 0.9rem;
        font-weight: 500;
        color: #5b7f95;
        background: rgba(44, 125, 160, 0.08);
        padding: 0.25rem 0.75rem;
        border-radius: 40px;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
    }

    .action-links {
      display: flex;
      gap: 1.2rem;
    }
  }
  .center {
    flex: 1;
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
        max-width: 1200px;
        flex-wrap: wrap;
        gap: 20px;
      }
      .entry-btn {
        width: 140px;
        height: 100px;
        background-size: cover;
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
      
      .entry-item {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;

        .entry-title {
          font-size: 24px;
          font-weight: 500;
        }
        &.new {
          display: none;
        }
        .gallery-list {
          display: flex;
          max-width: 1200px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .entry-btn {
          width: 110px;
          height: 70px;
          background-color: #fff;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 18px;
        }
      }
    }
  }
}

footer {
  margin-top: 3rem;
  text-align: center;
  font-size: 0.75rem;
  color: #87a2b5;
  border-top: 1px solid rgba(0,0,0,0.05);
  padding-top: 2rem;
}
</style>