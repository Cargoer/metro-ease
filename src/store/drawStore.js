import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import moment from 'moment'
import { messageBoxInput } from '@/tools/interact'
import { exportJson } from '@/tools/dataRelated'
import { getRoundCornerD, getRectByPoints } from '@/tools/svgRelated'
import * as d3 from 'd3'
import { useElementMover } from '@/tools/svgMover'
import { id } from 'element-plus/es/locales.mjs'

export const useDrawStore = defineStore('draw', () => {
  const tool = ref('select')
  const extendMode = ref(false)
  const drawRect = ref(null)
  const usedColors = ref([])

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
  const drawLine = ref(null)
  const lineSetting = ref({
    strokeWidth: 10,
    stroke: '#000000',
    fill: 'none',
    pattern: 'default',
    dashArray: '20 20',
    innerStrokePercent: 0.8,
    isRoundCorner: true,
    roundCornerRadius: 30,
  })

  // 车站相关
  const stationSetting = ref({
    fill: '#FFFFFF',
    stroke: '#000000',
    strokeWidth: 3,
    radius: 8,
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
  
  return {
    // toolSetting,
    drawLine,
    lineSetting,
    stationSetting,
    textSetting,
    tool,
    extendMode,
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
  }
})