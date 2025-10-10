import moment from "moment"
import * as d3 from "d3"
// createBorderFilter
import { 
  createBorderFilter, 
  getRectByPoints, 
  getRoundCornerD,
  get135ConnectionD,
  get90ConnectionD,
} from '@/tools/svgRelated'
import { messageBoxInput } from '@/tools/interact'
import { reactive, ref } from "vue"
import { draggable } from '@/tools/svgMover'
import { generateUniqueId } from '@/tools/utils'

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
    }
    // 更多信息
    this.info = settings.info || {}

    // 车站名称
    this.name = settings.name || '车站名'
    this.namePos = settings.namePos
    this.englishName = 'engName'
    this.englishNamePos = settings.englishNamePos
    this.settings = settings
    this.nameMover = null

    // 形状控制
    this.points = settings.points || []
    this.mover = null

    // 相关节点
    this.g = null
    this.shapeG = null
    this.shape = null
    this.text = null
    this.selectedIndicator = null

    setTimeout(() => {
      this.points.forEach(point => {
        if (point.relatedLineId) {
          point.relatedLine = this.root.findById(point.relatedLineId)
        }
      })
      this.generateNode()
      console.log('Station constructor points:', this.points)
    }, 100)
  }

  findById (id) {
    return this.id === id ? this : null
  }

  // 浓缩为对象
  compress () {
    return {
      id: this.id,
      name: this.name,
      namePos: this.namePos,
      englishName: this.englishName,
      englishNamePos: this.englishNamePos,
      points: this.points.map(point => ({
        ...point,
        relatedLine: null,
        relatedLineId: point.relatedLine?.id || '',
      })),
      style: this.style,
      // stroke: this.style.stroke,
      // strokeWidth: this.style.strokeWidth,
      // radius: this.style.radius,
      // fill: this.style.fill,
      info: this.info,
    }
  }

  setSelect (isSelected) {
    if (isSelected) {
      if (selectedElement.value) {
        selectedElement.value.setSelect(false)
      }
      selectedElement.value = this
      console.log('setSelect:', this)
      this.selectedIndicator = this.g.append('rect')
        .attr('x', this.shape.node().getBBox().x - 2)
        .attr('y', this.shape.node().getBBox().y - 2)
        .attr('width', this.shape.node().getBBox().width + 4)
        .attr('height', this.shape.node().getBBox().height + 4)
        .attr('stroke', '#f34718')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
      console.log('selectedIndicator:', this.selectedIndicator)
    } else {
      selectedElement.value = null
      this.selectedIndicator.remove()
      this.selectedIndicator = null
    }
  }

  generateNode () {
    // let sharedGenerateId = generateUniqueId()
    // if (!this.id) {
    //   this.id = `station_${sharedGenerateId}`
    //   this.parent.children[this.id] = this
    // } else {
    //   sharedGenerateId = this.id.split('_').slice(-1)[0]
    // }
    this.g = this.parent.node.append("g")
    this.shapeG = this.g.append("g")
    this.shape = this.shapeG.append("rect")
      .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth).attr('fill', this.style.fill)
      .attr('rx', this.style.radius).attr('ry', this.style.radius)
    this.text = this.g.append("text")
      .text(this.name)
      .attr('style', 'user-select: none;')
      .on('dblclick', async (e) => {
        e.stopPropagation()
        const name = await messageBoxInput('更改车站名称', '输入更改后的车站名称后点击确认', this.name)
        this.modifyName(name)
      })
    
    if (this.points.length) { // 有位置信息时才生成形状
      this.generateShape()
      const { x, y, width, height } = this.shape.node().getBBox()
      this.text.attr('x', this.namePos ? this.namePos.x : x + width).attr('y', this.namePos ? this.namePos.y : y + height)
    }

    this.addEventListener()
  }

  generateShape () {
    this.shape.attr('stroke', this.points.length > 1 ? '#444' : this.style.stroke)
    const { x, y, width, height, rotateAngle, rotateCenter } = getRectByPoints(this.points, this.style.radius)
    this.shape.attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
    if (rotateAngle) {
      // this.shapeG.attr('transform', `rotate(${rotateAngle}, ${rotateCenter.x}, ${rotateCenter.y})`)
      this.shape.attr('transform', `rotate(${rotateAngle}, ${rotateCenter.x}, ${rotateCenter.y})`)
    }
  }

  addEventListener () {
    this.shape
      .on('click', (e) => { // 点击事件
        e.from = {
          ele: 'station',
          eleObj: this,
        }
      // })
      // .on('mousedown', (e) => { // 鼠标按下事件
        if (tool.value === 'select') {
          this.setSelect(true)
        }
        // e.stopPropagation()
      })

    this.mover = draggable(this.shape, (pos) => {
      this.move(pos)
    }, {
      initialPos: {
        x: this.points[0].x,
        y: this.points[0].y,
      },
      readOnly: true,
    })
    
    this.nameMover = draggable(this.text, (pos) => {
      this.namePos = pos
    })
  }

  appendPoint (point) {
    if (this.points.length === 1 && !this.points[0].relatedLine) {
      this.points[0].relatedLine = point.relatedLine
      this.style.stroke = point.relatedLine.style.stroke
      if (this.shape) {
        this.shape.attr('stroke', this.style.stroke)
      }
    } else {
      this.points.push(point)
      this.generateShape()
    }
  }

  modifyPoints (match, newPointInfo) {
    const index = this.points.findIndex(point => point[match.key]?.id === match.value.id)
    if (index !== -1) {
      Object.assign(this.points[index], newPointInfo)
      console.log('[modifyPoints]', this.points)
      this.generateShape()
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
      console.log('[removePoints]', this.points)
      this.generateShape()
    }
  }

  modifyName (name) {
    this.name = name
    this.text.text(name)
  }

  move (newPoint1Pos) {
    const { x: point1X, y: point1Y } = this.points[0]
    this.points.forEach(point => {
      point.x = newPoint1Pos.x + (point.x - point1X)
      point.y = newPoint1Pos.y + (point.y - point1Y)
      if (point.relatedLine) {
        point.relatedLine.moveJoint({
          key: 'relatedStation',
          value: this,
        }, { x: point.x, y: point.y}, true)
      }
    })
    this.namePos = {
      x: newPoint1Pos.x + (this.text.attr('x') - point1X),
      y: newPoint1Pos.y + (this.text.attr('y') - point1Y),
    }
    this.text
      .attr('x', this.namePos.x)
      .attr('y', this.namePos.y)
    if (this.nameMover) {
      this.nameMover.movePositionTo(this.namePos.x, this.namePos.y)
    }
    this.generateShape()
  }

  sliceMove (dx, dy) {
    console.log('[station] sliceMove:', dx, dy)
    this.move({
      x: this.points[0].x + dx,
      y: this.points[0].y + dy,
    })
    this.selectedIndicator
      .attr('x', Number(this.selectedIndicator.attr('x')) + dx)
      .attr('y', Number(this.selectedIndicator.attr('y')) + dy)
    
    if (this.mover) {
      this.mover.movePoistionBy(dx, dy)
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
    this.shape
      .attr('stroke', this.style.stroke)
      .attr('stroke-width', this.style.strokeWidth)
      .attr('fill', this.style.fill)
      .attr('rx', this.style.radius)
      .attr('ry', this.style.radius)
    this.generateShape()
  }
}
