import * as d3 from "d3"
import { 
  getRectByPoints, 
} from '@/tools/svgRelated'
import { messageBoxInput } from '@/tools/interact'
import { draggable } from '@/tools/svgMover'
import { generateUniqueId } from '@/tools/utils'

import StationHall from './stationHall.js'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from "pinia"
let drawStore = null
let pressedKeys = null
let selectedElement = null
let tool = null

function initStore () {
  drawStore = useDrawStore()
  pressedKeys = storeToRefs(drawStore).pressedKeys
  selectedElement = storeToRefs(drawStore).selectedElement
  tool = storeToRefs(drawStore).tool
}

export default class Station {
  constructor (parent, settings) {
    if (!drawStore) {
      initStore()
    }
    // 父元素
    this.parent = parent
    this.id = settings.id || generateUniqueId('station')
    parent.children[this.id] = this
    this.root = parent.root || null

    this.style = {
      stroke: settings.style.stroke || '#000',
      strokeWidth: settings.style.strokeWidth || 3,
      fill: settings.style.fill || '#fff',
      radius: settings.style.radius || 8,
      // 渐显
      visibleWithTransition: settings.visibleWithTransition || false,
    }
    // 更多信息
    this.info = settings.info || {}

    // 车站名称
    this.name = settings.name || '车站名'
    this.namePos = settings.namePos
    if (settings.nameLatLng && this.root.bgSetting.type === 'mapbox') {
      this.namePos = this.root.mapboxObj.project(settings.nameLatLng)
    }
    this.englishName = 'engName'
    this.englishNamePos = settings.englishNamePos
    this.nameMover = null
    
    // 形状控制
    this.points = settings.points || []
    if (this.points.length && this.root.bgSetting.type === 'mapbox') {
      this.points.forEach(point => {
        if (point.latLng) {
          const posByLatLng = this.root.mapboxObj.project(point.latLng)
          point.x = posByLatLng.x
          point.y = posByLatLng.y
        } 
      })
    }

    this.mover = null

    // 相关节点
    this.g = this.parent.node.append("g")
    this.shapeG = this.g.append('g')
    this.halls = []
    this.text = this.g.append("text")
      .text(this.name)
      .attr('style', 'user-select: none;')
      .on('dblclick', async (e) => {
        e.stopPropagation()
        const name = await messageBoxInput('更改车站名称', '输入更改后的车站名称后点击确认', this.name)
        this.modifyName(name)
      })
    this.selectedIndicator = null

    setTimeout(() => {
      this.points.forEach(point => {
        if (point.relatedLineId) {
          point.relatedLine = this.root.findById(point.relatedLineId)
        }
      })
      this.generateNode()
    }, 100)
  }

  findById (id) {
    return this.id === id ? this : null
  }

  // 浓缩为对象
  compress () {
    const json = {
      id: this.id,
      name: this.name,
      namePos: this.namePos,
      englishName: this.englishName,
      englishNamePos: this.englishNamePos,
      points: this.points.map(point => {
        const pointObj = {
          ...point,
          relatedLine: null,
          relatedLineId: point.relatedLine?.id || '',
        }
        if (this.root.bgSetting.type === 'mapbox') {
          // 转换为实际坐标
          const realPos = this.root.transformCoordsToReal(point.x, point.y)
          pointObj.latLng = this.root.mapboxObj.unproject([realPos.x, realPos.y])
        }
        return pointObj
      }),
      style: this.style,
      info: this.info,
    }
    if (this.namePos && this.root.bgSetting.type === 'mapbox') {
      // 转换为实际坐标
      const realPos = this.root.transformCoordsToReal(this.namePos.x, this.namePos.y)
      json.nameLatLng = this.root.mapboxObj.unproject([realPos.x, realPos.y])
    }
    return json
  }

  setSelect (isSelected) {
    if (isSelected) {
      if (selectedElement.value) {
        selectedElement.value.setSelect(false)
      }
      selectedElement.value = this
      const { x, y, width, height } = this.shapeG.node().getBBox()
      this.selectedIndicator = this.g.append('rect')
        .attr('x', x - 2)
        .attr('y', y - 2)
        .attr('width', width + 4)
        .attr('height', height + 4)
        .attr('stroke', '#f34718')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
    } else {
      selectedElement.value = null
      this.selectedIndicator.remove()
      this.selectedIndicator = null
    }
  }

  generateNode () { 
    if (this.points.length) { // 有位置信息时才生成形状
      this.generateShape()
      // if (!this.namePos) {
      //   const { x, y, width, height } = this.shape.node().getBBox()
      //   this.text.attr('x', x + width).attr('y', y + height)
      //   this.namePos = { x: x + width + 5, y: y + height }
      // }
      this.text.attr('x', this.namePos.x).attr('y', this.namePos.y)
    }

    this.addEventListener()
  }

  generateShape () {
    const pointsGroupByHallId = this.points.reduce((acc, point) => {
      if (point.hallId) {
        acc[point.hallId] = acc[point.hallId] || []
        acc[point.hallId].push(point)
      } else {
        acc['default'].push(point)
      }
      return acc
    }, {'default': []})
    
    Object.keys(pointsGroupByHallId).forEach(hallId => {
      const points = pointsGroupByHallId[hallId]
      this.halls.push(new StationHall(this, points, this.style))
    })
  }

  addEventListener () {
    this.nameMover = draggable(this.text, (pos) => {
      this.namePos = pos
    })
  }

  appendPoint (point) {
    if (this.points.length === 1 && !this.points[0].relatedLine && point.relatedLine) {
      this.points[0].relatedLine = point.relatedLine
      this.style.stroke = point.relatedLine.style.stroke
    } else {
      this.points.push(point)
      this.generateShape()
    }
  }

  modifyPoints (match, newPointInfo) {
    if (!this.halls.length) {
      this.generateShape()
    } else {
      const relatedHall = this.halls.find(hall => hall.points.some(point => point[match.key]?.id === match.value.id))
      if (relatedHall) {
        const point = relatedHall.points.find(point => point[match.key]?.id === match.value.id)
        Object.assign(point, newPointInfo)
        relatedHall.refresh()
      }
    }
  }

  removePoints (match) {
    if (this.points.length === 1) {
      this.points[0].relatedLine = null
      return
    }
    const index = this.points.findIndex(point => point[match.key]?.id === match.value.id)
    if (index !== -1) {
      this.points.splice(index, 1)
      this.generateShape()
    }
  }

  modifyName (name) {
    this.name = name
    this.text.text(name)
  }

  moveBy (dx, dy) {
    this.halls.forEach(hall => {
      hall.moveBy(dx, dy)
    })
    this.namePos = {
      x: this.namePos.x + dx,
      y: this.namePos.y + dy,
    }
    this.text
      .attr('x', this.namePos.x)
      .attr('y', this.namePos.y)
    if (this.nameMover) {
      this.nameMover.movePositionTo(this.namePos.x, this.namePos.y)
    }
  }

  delete () {
    if (selectedElement.value === this) {
      this.setSelect(false)
    }
    this.g.remove()
    delete this.parent.children[this.id]
  }

  get lines () {
    return this.points.filter(joint => joint.relatedLine).map(joint => joint.relatedLine)
  }

  refreshStyle () {
    this.halls.forEach(hall => {
      hall.refresh()
    })
  }
}
