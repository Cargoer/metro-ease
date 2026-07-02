<template>
  <!-- 添加一个颜色选择器 -->
  <div class="fc">
    <DrawTool />
    
    <!-- 画布逻辑 -->
    <div id="draw-container">
      <div id="canvas-container" style="position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none;"></div>
      <div id="mapbox-container" style="position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none;"></div>
      <div id="svg-container" style="position: absolute; top: 0; left: 0; z-index: 2; pointer-events: all;"></div>
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
    <ScaleBar v-if="drawStore.svg?.bgSetting?.type === 'mapbox'" />
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

import { Svg, Text } from '@/model/element.js'
import Station from '@/model/station.js'
import Line from '@/model/line.js'
import Rect from '@/model/rect.js'

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

// 同时监听extendMode和drawLine，当extendMode为true且drawLine为null时，设置所有线的延伸节点
watch(() => [lineSetting.value.isExtendMode, drawLine.value], (newVal) => {
  if (newVal[0] && !newVal[1]) {
    Object.values(svg.lineMap).forEach(line => {
      line.setExtendNode()
    })
  } else {
    d3.selectAll('.extend-node').remove()
  }
})

// 如果tool切换为其他工具，则extendMode设为false
watch(() => tool.value, (newVal) => {
  if (newVal !== 'line' && newVal !== 'edge') {
    d3.selectAll('.extend-node').remove()
    lineSetting.value.isExtendMode = false
  }
})

import dynamicData from '@/data/dynamic/guangzhou.js'
import { dynamicDisplay, elementCenter } from '@/tools/dynamic.js'

function handleDynamicClick () {
  dynamicDisplay(svg, dynamicData)
}

// const bgHref = computed(() => {
//   return backgroundG.select('image').attr('xlink:href')
// })

const elementDetailPanelVisible = ref(false)
const canvasManageVisible = ref(false)
const styleManageVisible = ref(false)

const imageName = ref('')

watch(() => selectedElement.value, (newVal) => {
  if (newVal) {
    elementDetailPanelVisible.value = true
  } else {
    elementDetailPanelVisible.value = false
  }
})

// function handleExportSvg () {
//   const drawPartG = svg.children['global_g'].children['draw_part']
//   exportJsonByInstance(drawPartG, svg.bgSetting)
// }

function handleImportJson (data) {
  if (!svg) return
  importJson(data, svg.children['global_g'])
}

function handleUploadBackground (url) {
  if (!url || !svg) return
  svg.loadBackground(url)
}

const mapType = { 'line135': 'from135', 'line90': 'from90' }
function handleSvgClick (event, pos) {
  if (colorPicking.value) {
    return
  }

  if (drawRect.value) {
    return
  }

  if (tool.value === 'select') {
    if (selectedElement.value && !event.from) {
      selectedElement.value.setSelect(false)
    }
    d3.select('.context-menu').remove()
    return
  }

  if (tool.value === 'station') {
    const stationG = svg.children['global_g'].children['draw_part'].children['global_station_g']
    const newStation = new Station(stationG, {
      points: [pos],
      style: stationSetting.value
    })
    drawStore.addToHistory({
      type: 'add',
      target: newStation,
    })
    return
  }

  if (tool.value === 'text') {
    const textG = svg.children['global_g'].children['draw_part'].children['global_text_g']
    const newText = new Text(textG, {
      pos,
      style: textSetting.value,
    })
    drawStore.addToHistory({
      type: 'add',
      target: newText,
    })
    return
  }

  // 绘制路径
  if (tool.value.includes('line') || tool.value === 'edge') {
    drawLineJoint(event, pos, pressedKeys.value.s)
  }
}

function addStationWhileDrawLine (pos) {
  const stationNames = lineStore.presetStationNames.shift()
  const stationG = svg.children['global_g'].children['draw_part'].children['global_station_g']
  const jointRelatedStation = new Station(stationG, {
    points: [pos],
    name: stationNames || '车站名',
    style: stationSetting.value
  })
  return jointRelatedStation
}

function snapToAngleSimple(P, Q) {
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  
  // 如果点重合，直接返回
  if (dx === 0 && dy === 0) return { ...Q };
  
  // 计算角度（度数）
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  angle = ((angle % 360) + 360) % 360;
  
  // 核心技巧：将角度四舍五入到最近的 45° 倍数
  // 这样 0°, 45°, 90°, 135°, 180°... 都会被吸附
  const snappedAngle = Math.round(angle / 45) * 45;
  const snappedRadians = snappedAngle * Math.PI / 180;
  
  // 保持原距离
  const distance = Math.sqrt(dx*dx + dy*dy);
  
  return {
    x: Number((P.x + distance * Math.cos(snappedRadians)).toFixed(2)),
    y: Number((P.y + distance * Math.sin(snappedRadians)).toFixed(2))
  };
}

function drawLineJoint(event, pos, withNewStation = false) {
  let realPos = getRealPos(pos)

  if (event.extend) return

  if (lineSetting.value.isExtendMode && !drawLine.value) return

  // 连接到已存在的站点或新增站点，记录相关站点
  let jointRelatedStation = null
  if (lineSetting.value.usage === 'line') {
    if (event.from && event.from.ele === 'station') {
      realPos.x = event.from.eleObj.points[0].x
      realPos.y = event.from.eleObj.points[0].y
      jointRelatedStation = event.from.eleObj
      if (jointRelatedStation.name === lineStore.presetStationNames[0]) {
        lineStore.presetStationNames.shift()
      }
    }
    else if (withNewStation) {
      jointRelatedStation = addStationWhileDrawLine(realPos)
    }
  }

  // 开始绘制路径
  if (!drawLine.value) {
    const pG = svg.children['global_g'].children['draw_part'].children[`global_${lineSetting.value.usage}_g`]
    const curJointInfo = {
      ...realPos,
      type: 'start',
    }
    if (jointRelatedStation) {
      curJointInfo.relatedStationId = jointRelatedStation.id
    }
    drawLine.value = new Line(pG, {
      joints: [curJointInfo],
      style: lineSetting.value
    })
  } else {
    const curJointInfo = {
      ...realPos, 
      type: mapType[tool.value] || 'joint', 
      flag: !pressedKeys.value.Shift,
    }
    if (jointRelatedStation) {
      curJointInfo.relatedStationId = jointRelatedStation.id
    }
    drawLine.value.addJoint(curJointInfo)
  }

  if (jointRelatedStation) {
    jointRelatedStation.appendPoint({
      ...realPos,
      relatedLineId: drawLine.value.id
    })
    jointRelatedStation.addEventListener()
  }

  drawStore.addToHistory({
    type: 'add',
    target: drawLine.value,
    withNewStation,
  })
}

import { getContrastTextColor } from '@/tools/utils'
const getRealPos = (pos) => {
  if (pressedKeys.value.Shift && drawLine.value) {
    const lastJoint = drawLine.value.joints[drawLine.value.joints.length - 1]
    return snapToAngleSimple(lastJoint, pos)
  }
  return pos
}
watch(() => [mousePosition.value, pressedKeys.value.Shift], (newPos) => {
  if (drawLine.value) {
    const makeItCircleJoint =
      drawLine.value.addJointMode === 'push' ? 
      drawLine.value.joints[0] :
      drawLine.value.joints[drawLine.value.joints.length - 1]
    if (drawLine.value.joints.length > 2 && getDistance(mousePosition.value, makeItCircleJoint) < 5) {
      drawLine.value.parent.node.append('circle')
        .attr('cx', makeItCircleJoint.x)
        .attr('cy', makeItCircleJoint.y)
        .attr('r', ((drawLine.value.style.strokeWidth / 2) * 1.2) || 5)
        .attr('fill', drawLine.value.style.strokeWidth ? drawLine.value.style.stroke : drawLine.value.style.fill)
        .attr('stroke', getContrastTextColor(drawLine.value.style.stroke))
        .attr('stroke-width', 2)
        .attr('id', 'path-closed-indicator')
        .on('click', (e) => {
          drawLine.value.closeLine()
          drawLine.value = null
          e.stopPropagation()
          return
        })
    } else {
      drawLine.value.parent.node.select(`#path-closed-indicator`).remove()
    }
    drawLine.value.preview({ 
      ...getRealPos(mousePosition.value), 
      type: mapType[tool.value] || 'joint', 
      flag: !pressedKeys.value.Shift,
    })
  }
})

// 处理页面关闭事件
const handleBeforeUnload = (e) => {
    // 标准浏览器会显示默认提示
    e.preventDefault();
    // Chrome需要设置returnValue
    e.returnValue = '';
    // 返回的字符串在现代浏览器中可能不会显示，但需要保留
    return '请确保绘图导出本地，否则会丢失，确定要离开吗？';
};



const keepOnly = ref('')
function filterElements () {
  const keepElementNames = keepOnly.value.split(',').map(type => type.trim())
  if (keepElementNames.length === 0) return
  // 过滤元素
  const lineG = svg.children['global_g'].children['draw_part'].children['global_line_g'].children
  const stationG = svg.children['global_g'].children['draw_part'].children['global_station_g'].children

  Object.entries(stationG).forEach(([id, station]) => {
    if (station.points.every(point => !keepElementNames.includes(point?.relatedLine?.name))) {
      station.delete()
    }

  })
  Object.entries(lineG).forEach(([id, line]) => {
    if (!keepElementNames.includes(line.name)) {
      line.delete()
    }
  })
}

const edgeList = ref([])
const selectEdge = ref('')
function updateEdgeList () {
  const edgeG = svg.children['global_g'].children['draw_part'].children['global_edge_g'].children
  edgeList.value = Object.values(edgeG)
}
function createAndApplyClipPath () {
  const ele = edgeList.value.find(edge => edge.name === selectEdge.value)
  if (!ele) return
  // 判断clipPath标签是否已经存在
  let clipPath = svg.node.select(`#clip-${ele.name}`)
  if (clipPath.empty()) {
    clipPath = svg.node.append('clipPath')
      .attr('id', `clip-${ele.name}`)
    clipPath.append('path')
      .attr('d', ele.basicPath.attr('d'))
      .attr('fill', 'red')
      .attr('opacity', 0.5)
  }
  
  const globalG = svg.children['global_g'].children['draw_part']
  globalG.node
    .attr('clip-path', `url(#clip-${ele.name})`)
}
function cancelClipPath (ele) {
  const globalG = svg.children['global_g'].children['draw_part']
  globalG.node
    .attr('clip-path', '')
}

onBeforeRouteLeave((to, from, next) => {
  const confirmLeave = window.confirm('请确保绘图导出本地，否则会丢失，确定要离开吗？')
  if (confirmLeave) {
    next() // 确认离开
    clearCanvas()
  } else {
    next(false) // 取消离开
  }
})

function loadGalleryJson (json) {
  clearCanvas()
  importJson(json)
}

function handleZoomIn () {
  const stationChildren = svg.children['global_g'].children['draw_part'].children['global_station_g'].children
  const lineChildren = svg.children['global_g'].children['draw_part'].children['global_line_g'].children
  const target = Object.values(stationChildren).find(station => station.name === 'target')
  const targetLine = Object.values(lineChildren).find(line => line.name === 'targetLine')
  const globalG = svg.children['global_g'].children['draw_part']
  if (!target) return
  // const currentTransform = d3.zoomTransform(svg.node.node())
  // const testTranslate = currentTransform.translate(200, 0)
  // svg.node.call(svg.zoom.transform, testTranslate)
  elementCenter(svg, {
    time: 500,
    target: target.shape,
    //showAll: true
    next: {
      time: 1000,
      target: targetLine.basicPath,
      showAll: true,
      next: {
        time: 2000,
        target: globalG.node,
        showAll: true,
      }
    }
  })
}

function initSvg() {
  svg = reactive(new Svg('svg-container'))
  // isMapbox.value = svg.bgSetting.type === 'mapbox'
  drawStore.initSvg(svg)
  svg.addEventListeners({
    click: handleSvgClick,
    contextmenu: (e, pos) => {
      if (tool.value.includes('line') || tool.value === 'edge') {
        drawLineJoint(e, pos, true)
      }
    },
    mousemove: (event, pos) => {
      mousePosition.value = pos
      if (drawingRect.value) {
        drawingRect.value.setEndPoint(pos)
      }
    },
    mousedown: (event, pos) => {
      if (drawRect.value) {
        drawingRect.value = new Rect(svg.children['global_g'].children['global_rect_g'], pos)
        return
      }
    },
    mouseup: (event, pos) => {
      if (drawingRect.value) {
        drawingRect.value.setCornerEditable(true)
        ElMessageBox.prompt('', '输入画布名称', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputValue: drawingRect.value.name,
          // 通过正则校验输入内容不为空
          inputPattern: /\S+/,
          inputErrorMessage: '请输入画布名称',
        })
          .then(({ value }) => {
            // 创建下载链接
            drawingRect.value.name = value
          })
          .catch((e) => {
            console.log('取消输入', e)
          })
          .finally(() => {
            drawingRect.value = null
            drawRect.value = false
          })
      }
    },
  })
}

function handleSearch ({ item, margin = 0 }) {
  locateTarget(item.g.node(), margin)
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

  const testTranslate = d3.zoomTransform(svg.node.node()).translate(dx, dy).scale(k)
  svg.node.call(svg.zoom.transform, testTranslate)
}

let svg = reactive(null)
let name = ''
let drawingRect = ref(null)
onMounted(async () => {  
  watch(svg, (newVal) => {
    if (newVal) {
      console.log(newVal.bgSetting.type)
    }
  }, {deep: true})
  initSvg()
  name = route.params.name || 'new'
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
      svg.node.attr('cursor', 'grab')
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
    } else if (e.key === 'z' && e.ctrlKey) { // ctrl+z
      drawStore.undo()
    }
  })
  window.addEventListener('keyup', (e) => {
    pressedKeys.value[e.key] = false
    svg.node.attr('cursor', 'default')
  })
  window.addEventListener('resize', () => {
    svg.refreshCanvas()
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