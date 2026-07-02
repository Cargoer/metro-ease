<template>
  <!-- 添加一个颜色选择器 -->
  <div class="fc">
    <DrawTool />
    
    <!-- 画布逻辑 -->
    <div id="draw-container">
      <div id="canvas-container" style="position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none;"></div>
      <div id="mapbox-container" style="position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none;"></div>
      <canvas id="svg-container" style="position: absolute; top: 0; left: 0; z-index: 2; pointer-events: all;"></canvas>
      <div class="zoom-info fr">
        <div class="zoom-info-item">{{ zoomInfo.k.toFixed(2) }} ×</div>
        <!-- <div class="zoom-info-item">
          ({{ zoomInfo.x.toFixed(2) }}, {{ zoomInfo.y.toFixed(2) }})
        </div> -->
      </div>
    </div>
    <ElementDetailPanel v-model:visible="elementDetailPanelVisible" />
    <!-- <el-button type="primary" class="dynamic-demo-btn" @click="handleDynamicClick">动态演示测试</el-button> -->
    <!-- <el-button type="primary" class="dynamic-demo-btn" @click="handleZoomIn">放大2倍</el-button> -->
    <RewardAndContact />
    <!-- <Search @search="handleSearch" /> -->
    <!-- <ScaleBar /> -->
  </div>
  
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed, onUpdated, toRaw } from 'vue'
import DrawTool from '@/components/DrawTool.vue'
import ElementDetailPanel from '@/components/ElementDetailPanel.vue'
import RewardAndContact from '@/components/RewardAndContact.vue'
import Search from './components/Search.vue'
import ScaleBar from './components/ScaleBar.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import * as d3 from 'd3'

import StationHall from '@/model/stationHall.js'


// 获取路由实例和当前路由对象
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
const router = useRouter()
const route = useRoute()

import metroIconSvgCode from '@/assets/metroIconSvgCode.js'
import { 
  exportJson, 
  importJson, 
  exportJsonByInstance
} from '@/tools/dataRelated.js'
import { 
  getRoundCornerD, 
  saveSvgWithBg, 
  downloadSvgAsImage,
  createBorderFilter, 
  get135ConnectionD, 
  get90ConnectionD,
  getDistance,
} from '@/tools/svgRelated.js'

import { Text } from '@/model/element.js'
import Station from '@/model/station.js'
import Line from '@/model/line.js'
import Rect from '@/model/rect.js'
import FabricCanvas from '@/model/fabricCanvas.js'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { useLineStore } from '@/store/lineStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const lineStore = useLineStore()
const { 
  tool, 
  drawLine,
  lineSetting,
  stationSetting,
  textSetting,
  colorPicking,
  pressedKeys, 
  mousePosition, 
  selectedElement,
  zoomInfo,
  saveWithBgImage,
  drawRect
} = storeToRefs(drawStore)


// 如果tool切换为其他工具，则extendMode设为false
watch(() => tool.value, (newVal) => {
  if (!fabricCanvas) return
  if (newVal === 'select') {
    fabricCanvas.disableDrawing()
  } else {
    fabricCanvas.enableDrawing(newVal)
  }
})

const elementDetailPanelVisible = ref(false)

watch(() => selectedElement.value, (newVal) => {
  if (newVal) {
    elementDetailPanelVisible.value = true
  } else {
    elementDetailPanelVisible.value = false
  }
})


const mapType = { 'line135': 'from135', 'line90': 'from90' }


// 处理页面关闭事件
const handleBeforeUnload = (e) => {
    // 标准浏览器会显示默认提示
    e.preventDefault();
    // Chrome需要设置returnValue
    e.returnValue = '';
    // 返回的字符串在现代浏览器中可能不会显示，但需要保留
    return '请确保绘图导出本地，否则会丢失，确定要离开吗？';
};


onBeforeRouteLeave((to, from, next) => {
  const confirmLeave = window.confirm('请确保绘图导出本地，否则会丢失，确定要离开吗？')
  if (confirmLeave) {
    next() // 确认离开
    clearCanvas()
  } else {
    next(false) // 取消离开
  }
})


let fabricCanvas = null
onMounted(async () => {  
  fabricCanvas = new FabricCanvas('svg-container')
  const name = route.params.name || 'new'
  if (name !== 'new') {
    const module = await import(`@/data/gallery/${name}.js`);
    handleImportJson(module.default);
    document.title = `${name}`
    locateTarget()
  } else {
    document.title = '新建'
  }

  window.addEventListener('keydown', (e) => {
    // 如果在输入元素中，则不处理快捷键
    const isInputElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
    if (isInputElement) return

    // 预设常用快捷键
    const presetToolKeys = { '1': 'select', '2': 'line', '3': 'line135', '4': 'line90', '5': 'text', '6': 'station' }

    pressedKeys.value[e.key] = true
    
    if (e.key === ' ') {
      // svg.node.attr('cursor', 'grab')
    } else if (e.key === 'Enter') {
      drawLine.value && drawLine.value.removePreview()
      drawLine.value = null
    } else if (e.key === 'Delete') {
      if (selectedElement.value) {
        selectedElement.value.delete()
      }
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (selectedElement.value && selectedElement.value.sliceMove) {
        selectedElement.value.sliceMove(
          e.key === 'ArrowRight' ? 2 : e.key === 'ArrowLeft' ? -2 : 0,
          e.key === 'ArrowDown' ? 2 : e.key === 'ArrowUp' ? -2 : 0,
        )
      }
    } else if (presetToolKeys[e.key]) {
      tool.value = presetToolKeys[e.key]
    } else if (e.key === 'q') {
      // 所有线转换为标准线
      Object.values(svg.children['global_g'].children['draw_part'].children['global_line_g'].children).forEach(line => line.toStandard())
    } else if (e.key === 'p') {
      // 所有线转换为135线
      console.log('动态演示')
      handleDynamicClick()
    }
  })
  window.addEventListener('keyup', (e) => {
    pressedKeys.value[e.key] = false
    // svg.node.attr('cursor', 'default')
  })
  window.addEventListener('resize', () => {
    // svg.refreshCanvas()
  })
  window.addEventListener('beforeunload', handleBeforeUnload);
})
</script>



<style lang="scss" scoped>
.fc {
  display: flex;
  flex-direction: column;
}

.read-the-docs {
  color: #888;
}
#draw-container {
  /* border: 1px solid #000; */
  overflow: hidden;
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  z-index: 1;
}
#color-selector {
  position: fixed;
  top: 10px;
  left: 10px;
}
.fr {
  display: flex;
}
.zoom-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  gap: 6px;
  flex-direction: column;
  align-items: flex-end;
  z-index: 20;

  .zoom-info-item {
    padding: 6px 8px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
  }
}

.dynamic-demo-btn {
  position: absolute;
  bottom: 80px;
  left: 20px;
  z-index: 20;
}

#mapbox-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  width: 100vw;
  height: 100vh;
}
.filter-container {
  align-items: center;
  gap: 10px;
  position: absolute;
  top: 60px;
  right: 10px;
  z-index: 20;
  justify-content: flex-start;
  .filter-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>