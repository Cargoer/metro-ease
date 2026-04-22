// 绘制路线逻辑

const mapType = { 'line135': 'from135', 'line90': 'from90' }
const drawLine = null

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { 
  drawLine,
  lineSetting,
  colorPicking,
  pressedKeys, 
  extendMode,
} = storeToRefs(drawStore)

function drawLine() {
  
}

function startDrawing (event, pos) {
  if (extendMode.value) return // 延伸模式已经存在既有路线了
  
  // 绘制新的路线

}

function handleClick (event, pos) {
  // 延伸模式下点击非端点不产生绘制
  if (extendMode.value && !drawLine.value) return

  // 延伸模式下点击端点不需要初始化，使用既有路线
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

}

function shiftToDrawLine(svg) {
  // 清除所有鼠标事件
  svg.addEventListener({
    'click': handleClick,
  })
  drawLine()
}