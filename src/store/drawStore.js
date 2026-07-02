import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import moment from 'moment'
import { messageBoxInput } from '@/tools/interact'
import { exportJson } from '@/tools/dataRelated'
import { getRoundCornerD, getRectByPoints } from '@/tools/svgRelated'
import * as d3 from 'd3'
import { useElementMover } from '@/tools/svgMover'
import { id } from 'element-plus/es/locales.mjs'
import Line from '@/model/line.js'
import Station from '@/model/station.js'
import { Text } from '@/model/element.js'
import { ElMessage } from 'element-plus'

export const useDrawStore = defineStore('draw', () => {
  const tool = ref('select')
  const drawRect = ref(null)
  const usedColors = ref([])
  const svg = ref(null)

  const saveWithBgImage = ref(false)
  const bgType = ref('')
  const mapboxSetting = ref({
    style: '',
    center: [113.316, 23.1762],
    zoom: 12.59,
  })
  const bgSetting = ref({
    type: '',
    url: '',
    style: 'mapbox://styles/cargoer/ckz6wrijt001n15os1cgx7ypp',
    center: [121.391, 31.2513],
    zoom: 12.59,
  })
  
  // 路径相关
  const alignMode = ref(false)
  const drawLine = ref(null)
  const lineSetting = ref({
    isExtendMode: false,
    usage: 'line',
    strokeWidth: 10,
    stroke: '#000000',
    fill: 'none',
    pattern: 'default',
    dashArray: '20 20',
    innerStrokePercent: 0.8,
    roundCornerRadius: 30,
  })

  // 车站相关
  const stationSetting = ref({
    fill: '#FFFFFF',
    stroke: '#000000',
    strokeWidth: 3,
    radius: 8,
    hidden: false,
  })

  const stationUnitedStyle = ref({
    presetLineStrokeWidth: 10,
    strokeWidth: 2,
    strokeType: 'followLine',
    stroke: '#FFF',
    fillType: 'fixed',
    fill: '#FFF',
    radiusType: 'fixed',
    radius: 8,
    radiusPercent: 0.8,
    fontSize: 12,
    hidden: false,
  })

  // 文本相关
  const textSetting = ref({
    textColor: '#000000',
    fontSize: 20,
    withBg: false,
    bgColor: 'none',
    withBorder: false,
    borderColor: 'none',
    padding: '10 8',
    borderRadius: 10,
    // fontFamily: 'Arial, sans-serif',
  })

  const colorPicking = ref(false)

  // const selectedElementId = ref(null)
  const selectedElement = ref(null)
  // const elementMovingStart = ref({ x: -1, y: -1 })
  const pressedKeys = ref({})
  const mousePosition = ref({ x: -1, y: -1 }) // 鼠标移动事件中，鼠标的实时位置
  const zoomInfo = ref({ k: 1, x: 0, y: 0 })

  /**
   * 操作历史记录
   * 1. 添加类
   * 1-1 路径节点
   * 1-2 车站
   * 1-3 同时包含节点和站点
   * 1-4 文本
   * 2. 删除类
   * 2-1 路径节点
   * 2-2 车站
   * 2-3 整条路线（还分路线上是否有关联车站）
   * 2-4 文本
   * 3. 移动类
   * 3-1 节点移动
   * 3-2 站点移动
   * 3-3 文本移动
   */
  const history = ref([])

  function initSvg(val) {
    svg.value = val
  }

  function addToHistory(val) {
    history.value.push(val)
  }

  function undo() {
    if (history.value.length === 0) {
      ElMessage.error('没有操作历史记录了')
      return
    }
    const last = history.value.pop()
    if (last.type === 'add') {
      if (last.target instanceof Line) {
        const lastJoint =
          last.target.addJointMode === 'push' ?
          last.target.joints[last.target.joints.length - 1] :
          last.target.joints[0]
        last.target.removeJoint(lastJoint, true)
        if (last.withNewStation) {
          svg.value.stationMap[lastJoint.relatedStationId].delete()
        }
      } else if (last.target instanceof Station) {
        last.target.delete(true)
      } else if (last.target instanceof Text) {
        last.target.delete(true)
      }
    } else if (last.type === 'delete') {
      const lineG = svg.value.children['global_g'].children['draw_part'].children['global_line_g']
      const stationG = svg.value.children['global_g'].children['draw_part'].children['global_station_g']
      const textG = svg.value.children['global_g'].children['draw_part'].children['global_text_g']
      switch (last.element) {
        case 'line':
          new Line(lineG, last.snapshot)
          last.relatedStations.forEach(item => {
            if (item.operation === 'delete') {
              new Station(stationG, item.snapshot)
            } else if (item.operation === 'unrelated') {
              svg.value.stationMap[item.relatedJoint.relatedStationId].appendPoint(item.relatedJoint)
            }
          })
          break
        case 'station':
          new Station(stationG, last.snapshot)
          last.relatedLines.forEach(item => {
            svg.value.lineMap[item.lineId].joints[item.jointIndex].relatedStationId = item.relatedStationId
          })
          break
        case 'text':
          new Text(textG, last.snapshot)
          break
        case 'joint':
          const line = svg.value.lineMap[last.lineId]
          line.addJoint(last.snapshot, last.jointIndex)
          line.refreshSelect()
          if (last.relatedStationId) {
            const station = svg.value.stationMap[last.relatedStationId]
            station.appendPoint({
              x: last.snapshot.x,
              y: last.snapshot.y,
              relatedLineId: last.lineId,
            })
          }
          break
        default:
          break
      }
    } else if (last.type === 'move') {
      last.target.attr(last.svgElement)
    }
  }
  
  return {
    // toolSetting,
    alignMode,
    drawLine,
    lineSetting,
    stationSetting,
    textSetting,
    tool,
    usedColors,
    colorPicking,
    zoomInfo,
    selectedElement,
    mousePosition,
    pressedKeys,
    saveWithBgImage,
    drawRect,

    bgType,
    mapboxSetting,
    bgSetting,
    svg,
    initSvg,
    stationUnitedStyle,
    history,
    addToHistory,
    undo,
  }
})