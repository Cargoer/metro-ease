<template>
  <div class="search-container">
    <Input 
      v-model="searchText" 
      placeholder="搜索车站或路线" 
      width="250px"
      @change="handleMatch"
    />
    <FontAwesomeIcon :icon="faMagnifyingGlass" class="search-icon" />

    <div class="matches">
      <div v-for="item in matches" :key="item.id" class="match-item" @click="handleSearch(item)">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emit = defineEmits(['search'])
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import * as d3 from 'd3'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { svg } = storeToRefs(drawStore)

const searchText = ref('')
const matches = ref([])

function handleMatch() {
  matches.value = []
  if (searchText.value) {
    const stations = Object.values(svg.value.stationMap)
    const lines = Object.values(svg.value.lineMap)
    matches.value = [...stations, ...lines].filter(item => item.name.includes(searchText.value))
  }
}

function locateTarget (target, margin = 0) {  // 先找到边
  const node = target || svg.children['global_g'].children['draw_part'].node.node()
  if (!node) return
  const { x, y, width, height } = node.getBBox()

  const k = Math.min( window.innerWidth / (width + margin), window.innerHeight / (height + margin))
  const dx = (-x - width / 2) * k  + window.innerWidth / 2
  const dy = (-y - height / 2) * k  + window.innerHeight / 2
  svg.tempZoomCenter = { 
    x: (x + width / 2) + ((-x - width / 2)  + window.innerWidth / 2) / (1 - k), 
    y: (y + height / 2) + ((-y - height / 2)  + window.innerHeight / 2) / (1 - k)
  }

  const testTranslate = d3.zoomTransform(svg.value.node.node()).translate(dx, dy).scale(k)
  svg.value.node.call(svg.value.zoom.transform, testTranslate)
}

async function elementCenter (target) {
  return new Promise((resolve, reject) => {
    // 获取目标元素的位置

    const targetPos = target.node().getBBox()
    const targetCenter = { x: targetPos.x + targetPos.width / 2, y: targetPos.y + targetPos.height / 2 }
    
    // 获取SVG视窗的中心
    const containerWidth = window.innerWidth//+container.clientWidth;
    const containerHeight = window.innerHeight//+container.clientHeight;
    const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };

    // 计算需要的缩放比例（保持当前平移）
    const margin = 200
    const calcKWidth = targetPos.width < 1500 ? 1500 : targetPos.width + margin
    const calcKHeight = targetPos.height < 1500 ? 1500 : targetPos.height + margin
    let k = Math.min((containerWidth / calcKWidth), (containerHeight / calcKHeight))

    // 1. 获取初始变换和目标变换
    const currentTransform = d3.zoomTransform(svg.value.node.node());
    const currentZoomInfo = svg.value.formerZoomInfo
    const scaleRatio = k / currentZoomInfo.k
    // 计算需要的平移量（保持当前缩放）
    const tx = (containerCenter.x - targetCenter.x * scaleRatio) / k
    const ty = (containerCenter.y - targetCenter.y * scaleRatio) / k
    const containerCenterPosInCurrent = currentTransform.apply([containerCenter.x, containerCenter.y])
    const targetCenterPosInCurrent = currentTransform.apply([targetCenter.x, targetCenter.y])
    const targetTransform = currentTransform
      .translate(containerCenterPosInCurrent[0] - targetCenterPosInCurrent[0], containerCenterPosInCurrent[1] - targetCenterPosInCurrent[1]) // 目标平移
      .scale(scaleRatio) // 目标缩放
      // .translate(containerCenter.x - targetCenter.x * k, containerCenter.y - targetCenter.y * k) // 目标平移  
      
    const regularTransform = d3.zoomIdentity
      .translate(containerCenter.x - targetCenter.x * k, containerCenter.y - targetCenter.y * k) // 目标平移
      .scale(k) // 目标缩放
      
    svg.value.node.transition()
      // .duration(moveObj.time)
      // .ease(d3.easeLinear)
      .call(svg.value.zoom.transform, regularTransform)
      .on('end', () => {
        resolve()
      })
  })
}

async function handleSearch(item) {
  searchText.value = ''
  matches.value = []
  item.setSelect(true)
  const { x, y, width, height } = item.g.node().getBBox()
  const realPos = svg.value.transformCoordsToReal(x + width / 2, y + height / 2)
  const latLng = svg.value.mapboxObj.unproject([realPos.x, realPos.y])
  await elementCenter(item.g)

  const currentTransform = d3.zoomTransform(svg.value.node.node());
  

  svg.value.mapboxObj.jumpTo({
    center: [latLng.lng, latLng.lat],
    zoom: svg.value.bgSetting.zoom + Math.log2(currentTransform.k)
  })
  // if (item.id.includes('station')) {
  //   emit('search', { item, margin: 500 })
  // } else if (item.id.includes('line')) {
  //   emit('search', { item, margin: 100 })
  // }
}
</script>

<style lang="scss" scoped>
.search-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 50;

  .search-icon {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    cursor: pointer;
  }

  .matches {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;
    background-color: #fff;
    border-radius: 4px;
    // padding: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;

    .match-item {
      cursor: pointer;
      text-align: left;
      width: 100%;
      padding: 5px 10px;
      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
}
</style>
