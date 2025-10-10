<template>
  <!-- 添加一个颜色选择器 -->
  <div class="fc">
    <DrawTool
      class="draw-tool" 
      @uploadBackground="handleUploadBackground" 
      @saveSvg="saveDialogVisible = true"
      @exportSvg="handleExportSvg"
      @importJson="handleImportJson($event)"
    />
    <!-- 画布逻辑 -->
    <div id="draw-container">
      <div id="canvas-container" style="position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none;"></div>
      <div id="svg-container" style="position: absolute; top: 0; left: 0; z-index: 2; pointer-events: all;"></div>
      <div class="zoom-info fr">
        <div class="zoom-info-item">{{ zoomInfo.k.toFixed(2) }} ×</div>
      </div>
    </div>
    <ElementDetailPanel v-model:visible="elementDetailPanelVisible" />
    <Dialog
      v-model:visible="saveDialogVisible"
      title="保存为图片"
      width="500"
      @confirm="handleSaveSvgWithBg"
    >
      <div class="fc" style="align-items: center; gap: 15px;">
        <p>当前默认保存为png格式图片</p>
        <el-checkbox v-model="saveWithBgImage" label="带底图保存" size="large" />
        <el-input v-model="watermarkText" placeholder="请输入水印文字" style="width: 200px;" />
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
  saveWithBgImage
} = storeToRefs(drawStore)

const bgHref = computed(() => {
  return backgroundG.select('image').attr('xlink:href')
})

const elementDetailPanelVisible = ref(false)
const saveDialogVisible = ref(false)

watch(() => selectedElement.value, (newVal) => {
  console.log('[watch] selectedElement.value:', newVal)
  if (newVal) {
    elementDetailPanelVisible.value = true
  } else {
    elementDetailPanelVisible.value = false
  }
})

function handleExportSvg () {
  const drawPartG = svg.children['global_g'].children['draw_part']
  exportJsonByInstance(drawPartG, svg.bgUrl)
}

function handleImportJson (data) {
  if (!svg) return
  importJson(data, svg.children['global_g'])
}

function handleUploadBackground (url) {
  if (!url || !svg) return
  svg.loadBackground(url)
}

const watermarkText = ref('')
function handleSaveSvgWithBg () {
  const drawPartG = svg.children['global_g'].children['draw_part'].node
  saveSvgWithBg(drawPartG, saveWithBgImage.value ? svg.bgUrl : null, watermarkText.value)
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
    const textG = svg.children['global_g'].children['draw_part']
    new Text(textG, {
      pos,
      style: textSetting.value
    })
    return
  }

  // 绘制路径
  if (tool.value.includes('line')) {
    let realPos = { ...pos }

    if (event.extend) return

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

    // 开始绘制路径
    if (!drawLine.value) {
      const lineG = svg.children['global_g'].children['draw_part'].children['global_line_g']
      const curJointInfo = {
        ...realPos,
        type: 'start',
      }
      if (jointRelatedStation) {
        curJointInfo.relatedStation = jointRelatedStation
      }
      console.log('[handleSvgClick line] lineSetting:', lineSetting.value)
      drawLine.value = new Line(lineG, {
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
        curJointInfo.relatedStation = jointRelatedStation
      }
      drawLine.value.addJoint(curJointInfo)
    }

    if (jointRelatedStation) {
      jointRelatedStation.appendPoint({
        ...realPos,
        relatedLine: drawLine.value
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
  svg.children['global_g'].children['draw_part'].children['global_line_g'].node.remove()
  svg.children['global_g'].children['draw_part'].children['global_line_g'].children = {}
  svg.children['global_g'].children['draw_part'].children['global_station_g'].node.remove()
  svg.children['global_g'].children['draw_part'].children['global_station_g'].children = {}
  // 清除文本
  svg.children['global_g'].children['draw_part'].children['global_text_g'].node.remove()
  svg.children['global_g'].children['draw_part'].children['global_text_g'].children = {}
  // 清除选中元素
  selectedElement.value = null
  // 背景图url设置为空
  // svg.loadBackground('')
}

// onBeforeRouteEnter((to, from, next) => {
//   console.log('to', to)
//   // clearCanvas()
//   next()
// })

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
    console.log('I am working')
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
onUpdated(() => {
  console.log('onUpdated')
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

</style>