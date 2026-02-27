<template>
  <!-- 添加一个颜色选择器 -->
  <div class="fc">
    <DrawTool
      class="draw-tool" 
      @submitBackground="(v) => svg.loadBackground(v)" 
      @saveSvg="saveDialogVisible = true"
      @exportSvg="handleExportSvg"
      @importJson="handleImportJson($event)"
      @clearCanvas="clearCanvas"
    />
    <!-- <div class="fc filter-container">
      <div class="fr filter-item">
        <span>只保留:</span>
        <el-input v-model="keepOnly" placeholder="输入元素类型，多个类型用逗号分隔" style="width: 200px;" />
        <el-button type="primary" @click="filterElements">确认</el-button>
      </div>
      <div class="fr filter-item">
        <span>只显示区域:</span>
        <el-select v-model="selectEdge" placeholder="选择区域" style="width: 150px;" @focus="updateEdgeList" @change="createAndApplyClipPath">
          <el-option v-for="edge in edgeList" :key="edge.id" :label="edge.name" :value="edge.name" />
        </el-select>
        <el-button type="primary" @click="createAndApplyClipPath">确认</el-button>
        <el-button type="primary" @click="cancelClipPath">还原</el-button>
      </div>
    </div> -->
    
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
    <Dialog
      v-model:visible="saveDialogVisible"
      title="保存为图片"
      width="500"
      @confirm="handleSaveSvgWithBg"
    >
      <div class="fc" style="align-items: center; gap: 15px;">
        <p>当前默认保存为png格式图片</p>
        <!-- <el-checkbox v-model="saveWithBgImage" label="带底图保存" size="large" /> -->
        <el-form :model="saveSetting" label-width="auto" label-position="right">
          <el-form-item label="图片名称" prop="imageName" required>
            <el-input v-model="saveSetting.imageName" placeholder="请输入图片名称" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="背景" prop="bgType">
            <el-select v-model="saveSetting.bgType" placeholder="请选择背景" style="width: 200px;">
              <el-option label="透明" value="none" />
              <el-option label="白色" value="white" />
              <el-option label="使用底图" value="bgImg" v-if="svg && svg.bgSetting.type === 'local'" />
            </el-select>
          </el-form-item>
          <el-form-item label="水印文字">
            <el-input v-model="saveSetting.watermarkText" placeholder="需要的话请输入水印文字" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="水印位置" v-if="saveSetting.watermarkText">
            <el-select v-model="saveSetting.watermarkPosition" placeholder="请选择水印位置" style="width: 200px;">
              <el-option label="左下角" value="bottom-left" />
              <el-option label="右下角" value="bottom-right" />
              <el-option label="左上角" value="top-left" />
              <el-option label="右上角" value="top-right" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </Dialog>
  </div>
  
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed, onUpdated } from 'vue'
import DrawTool from '@/components/DrawTool.vue'
import Dialog from '@/components/Dialog.vue'
import ElementDetailPanel from '@/components/ElementDetailPanel.vue'

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

import { Svg, Text } from '@/model/element.js'
import Station from '@/model/station.js'
import Line from '@/model/line.js'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
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
  extendMode
} = storeToRefs(drawStore)

// 同时监听extendMode和drawLine，当extendMode为true且drawLine为null时，设置所有线的延伸节点
watch(() => [extendMode.value, drawLine.value], (newVal) => {
  console.log(`[watch] extendMode`, extendMode.value, `drawLine`, drawLine.value)
  if (newVal[0] && !newVal[1]) {
    console.log(`setExtendNode`)
    Object.values(svg.lineMap).forEach(line => {
      line.setExtendNode()
    })
  } else if (!newVal[0]) {
    d3.selectAll('.extend-node').remove()
  }
})

// 如果tool切换为其他工具，则extendMode设为false
watch(() => tool.value, (newVal) => {
  if (newVal !== 'line' && newVal !== 'edge') {
    d3.selectAll('.extend-node').remove()
    extendMode.value = false
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
const saveDialogVisible = ref(false)
const imageName = ref('')

watch(() => selectedElement.value, (newVal) => {
  if (newVal) {
    elementDetailPanelVisible.value = true
  } else {
    elementDetailPanelVisible.value = false
  }
})

function handleExportSvg () {
  const drawPartG = svg.children['global_g'].children['draw_part']
  exportJsonByInstance(drawPartG, svg.bgSetting)
}

function handleImportJson (data) {
  if (!svg) return
  importJson(data, svg.children['global_g'])

  // TODO: 缩放地图到合适大小
  // const { width, height } = svg.children['global_g'].children['draw_part'].node.node().getBBox()
  // console.log(width, height)
  // if (width < window.innerWidth) return
  // const scale = window.innerWidth / width
  // svg.modifyZoom(scale)
}

function handleUploadBackground (url) {
  if (!url || !svg) return
  svg.loadBackground(url)
}

const saveSetting = reactive({
  imageName: '',
  watermarkText: '',
  watermarkPosition: 'bottom-left',
  bgType: 'white',
  bgUrl: ''
})
function handleSaveSvgWithBg () {
  if (!saveSetting.imageName) {
    ElMessage.error('请输入图片名称')
    return
  }
  if (saveSetting.bgType === 'bgImg') {
    saveSetting.bgUrl = svg.bgSetting.url
  }
  const drawPartG = svg.children['global_g'].children['draw_part'].node
  saveSvgWithBg(drawPartG, saveSetting)
  // downloadSvgAsImage(svg.node.node())
}

const mapType = { 'line135': 'from135', 'line90': 'from90' }
function handleSvgClick (event, pos) {
  if (colorPicking.value) {
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
    new Station(stationG, {
      points: [pos],
      style: stationSetting.value
    })
    return
  }

  if (tool.value === 'text') {
    const textG = svg.children['global_g'].children['draw_part'].children['global_text_g']
    new Text(textG, {
      pos,
      style: textSetting.value,
    })
    return
  }

  // 绘制路径
  if (tool.value.includes('line') || tool.value === 'edge') {
    let realPos = { ...pos }

    if (event.extend) return

    if (extendMode.value && !drawLine.value) return

    // 闭合路径
    if (drawLine.value && !event.extend && getDistance(realPos, drawLine.value.joints[0]) < 5) {
      drawLine.value.closeLine()
      if (pressedKeys.value.s && !drawLine.value.joints[0].relatedStation) {
        drawLine.value.addStationInLine(drawLine.value.joints[0])
      }
      drawLine.value = null
      return
    }

    // 连接到已存在的站点或新增站点，记录相关站点
    let jointRelatedStation = null
    if (tool.value.includes('line')) {
      if (event.from && event.from.ele === 'station') {
        realPos.x = event.from.eleObj.points[0].x
        realPos.y = event.from.eleObj.points[0].y
        jointRelatedStation = event.from.eleObj
      }
      if (pressedKeys.value.s) {
        const stationG = svg.children['global_g'].children['draw_part'].children['global_station_g']
        jointRelatedStation = new Station(stationG, {
          points: [pos],
          style: stationSetting.value
        })
      }
    }

    // 开始绘制路径
    if (!drawLine.value) {
      const lineG = svg.children['global_g'].children['draw_part'].children['global_line_g']
      const edgeG = svg.children['global_g'].children['draw_part'].children['global_edge_g']
      const curJointInfo = {
        ...realPos,
        type: 'start',
      }
      if (jointRelatedStation) {
        curJointInfo.relatedStationId = jointRelatedStation.id
      }
      drawLine.value = new Line(tool.value.includes('line') ? lineG : edgeG, {
        joints: [curJointInfo],
        style: lineSetting.value
      })
    } else {
      const curJointInfo = {
        ...realPos, 
        type: mapType[tool.value] || (lineSetting.value.isRoundCorner ? 'round' : 'joint'), 
        flag: !pressedKeys.value.Shift,
        r: lineSetting.value.isRoundCorner ? lineSetting.value.roundCornerRadius : 0,
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
    }
  }
}

watch(() => [mousePosition.value, pressedKeys.value.Shift], (newPos) => {
  if (drawLine.value) {
    if (getDistance(mousePosition.value, drawLine.value.joints[0]) < 5) {
      drawLine.value.parent.node.append('circle')
        .attr('cx', drawLine.value.joints[0].x)
        .attr('cy', drawLine.value.joints[0].y)
        .attr('r', drawLine.value.strokeWidth || 5)
        .attr('fill', drawLine.value.strokeWidth ? drawLine.value.stroke : drawLine.value.fill)
        .attr('id', 'path-closed-indicator')
    } else {
      drawLine.value.parent.node.select(`#path-closed-indicator`).remove()
    }
    drawLine.value.preview({ 
      ...mousePosition.value, 
      type: mapType[tool.value] || (lineSetting.value.isRoundCorner ? 'round' : 'joint'), 
      flag: !pressedKeys.value.Shift,
      r: lineSetting.value.isRoundCorner ? lineSetting.value.roundCornerRadius : 0,
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

function clearCanvas () {
  svg.children['global_g'].children['draw_part'].children['global_line_g'].node.selectAll('*').remove()
  svg.children['global_g'].children['draw_part'].children['global_line_g'].children = {}
  svg.children['global_g'].children['draw_part'].children['global_station_g'].node.selectAll('*').remove()
  svg.children['global_g'].children['draw_part'].children['global_station_g'].children = {}
  // 清除文本
  svg.children['global_g'].children['draw_part'].children['global_text_g'].node.selectAll('*').remove()
  svg.children['global_g'].children['draw_part'].children['global_text_g'].children = {}
  // 清除选中元素
  selectedElement.value = null
  // 背景图url设置为空
  // svg.loadBackground('')
}

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

let svg = null
let name = ''
onMounted(async () => {  
  svg = reactive(new Svg('svg-container'))
  svg.addEventListeners({
    click: handleSvgClick,
    mousemove: (event, pos) => {
      mousePosition.value = pos
    },
  })

  name = route.params.name || 'new'
  if (name !== 'new') {
    const module = await import(`@/data/gallery/${name}.js`);
    handleImportJson(module.default);
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
      drawLine.value.removePreview()
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

.draw-tool {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
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