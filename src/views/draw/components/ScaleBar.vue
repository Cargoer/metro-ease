<template>   
  <!-- 自定义比例尺 -->
  <div v-if="mapReady && props.showScale" class="custom-scale" :style="scaleStyle">
    <div class="scale-bar" :style="{ width: scaleBarWidth }"></div>
    <div class="scale-text">{{ scaleText }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, watch, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { svg } = storeToRefs(drawStore)

// 接收父组件传递的 props
const props = defineProps({
  // 比例尺最大宽度（像素）
  scaleMaxWidth: {
    type: Number,
    default: 150
  },
  // 是否显示自定义比例尺
  showScale: {
    type: Boolean,
    default: true
  },
})

// 响应式状态
const mapReady = ref(false)
const scaleInfo = reactive({
  pixelLength: 100,
  distance: 0,
  metersPerPixel: 0
})

// 地球半径（米）
const EARTH_RADIUS = 6378137

// 计算在当前缩放级别和纬度下，1像素代表多少米
const getMetersPerPixel = (latitude, zoomLevel) => {
  // 赤道上每像素代表的米数
  const metersPerPixelEquator = (EARTH_RADIUS * 2 * Math.PI) / (256 * Math.pow(2, zoomLevel))
  // 根据纬度修正（墨卡托投影）
  const metersPerPixel = metersPerPixelEquator * Math.cos(latitude * Math.PI / 180)
  return metersPerPixel
}

// 格式化距离显示
const formatDistance = (meters) => {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(1) + ' km'
  } else if (meters >= 1) {
    return Math.round(meters) + ' m'
  } else {
    return (meters * 100).toFixed(0) + ' cm'
  }
}

// 计算合适的比例尺长度（使显示数字比较整）
const getNiceScaleLength = (metersPerPixel) => {
  // 目标实际距离
  let targetDistance = metersPerPixel * props.scaleMaxWidth
  
  // 找一个比较整的数值（1, 2, 5, 10, 20, 50, 100, 200, 500...）
  const magnitude = Math.pow(10, Math.floor(Math.log10(targetDistance)))
  let niceDistance
  
  if (targetDistance / magnitude < 2) {
    niceDistance = magnitude
  } else if (targetDistance / magnitude < 5) {
    niceDistance = 2 * magnitude
  } else {
    niceDistance = 5 * magnitude
  }
  
  // 计算对应的像素长度
  const pixelLength = niceDistance / metersPerPixel
  
  return {
    distance: niceDistance,
    pixelLength: Math.min(pixelLength, props.scaleMaxWidth)
  }
}

// 更新自定义比例尺
const updateCustomScale = () => {
  if (!svg.value.mapboxObj || !mapReady.value) return
  
  // 获取当前地图中心点的纬度和缩放级别
  const center = svg.value.mapboxObj.getCenter()
  const latitude = center.lat
  const zoom = svg.value.mapboxObj.getZoom()
  
  // 计算每像素代表的米数
  const metersPerPixel = getMetersPerPixel(latitude, zoom)
  
  // 计算一个"整"的比例尺长度
  const { distance, pixelLength } = getNiceScaleLength(metersPerPixel)
  
  scaleInfo.pixelLength = pixelLength
  scaleInfo.distance = distance
  scaleInfo.metersPerPixel = metersPerPixel
}

// 比例尺样式（可响应式调整）
const scaleStyle = computed(() => ({
  position: 'absolute',
  bottom: '20px',
  left: '20px',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  zIndex: 10,
  pointerEvents: 'none',
  backdropFilter: 'blur(5px)'
}))

const scaleBarWidth = computed(() => scaleInfo.pixelLength + 'px')
const scaleText = computed(() => formatDistance(scaleInfo.distance))

// 初始化地图
const initMap = () => {
  svg.value.mapboxObj.on('load', () => {
    mapReady.value = true
    updateCustomScale()
  })
  
  // 地图移动/缩放时更新比例尺
  svg.value.mapboxObj.on('move', () => {
    updateCustomScale()
  })
  
  // 缩放结束时可做额外处理
  svg.value.mapboxObj.on('moveend', () => {
    updateCustomScale()
  })
}

// 监听窗口大小变化
const handleResize = () => {
  if (svg.value.mapboxObj) {
    svg.value.mapboxObj.resize()
    updateCustomScale()
  }
}

onMounted(() => {
  // initMap()
  // nextTick(() => {
  //   initMap()
  // })
  const initMapInverval = setInterval(() => {
    if (svg.value.mapboxObj) {
      initMap()
      clearInterval(initMapInverval)
    }
  }, 200)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.svg.value.mapboxObj-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.svg.value.mapboxObj {
  width: 100%;
  height: 100%;
}

/* 自定义比例尺样式（scoped 下需要穿透或放在全局） */
.custom-scale {
  transition: opacity 0.2s ease;
}

.scale-bar {
  height: 3px;
  background-color: white;
  margin-bottom: 4px;
  transition: width 0.2s ease;
}

.scale-text {
  text-align: center;
  font-size: 11px;
}
</style>