import { generateUniqueId } from '@/tools/utils'
import { draggable } from '@/tools/svgMover'
// d3
import * as d3 from 'd3'

export default class Rect {
  constructor(parent, startPoint, endPoint) {
    this.root = parent.root
    this.parent = parent
    this.id = 'rect-' + generateUniqueId()
    this.parent.children[this.id] = this
    this._name = '画布' + this.root.canvasList.length
    this.visible = true
    this.locked = false
    this.type = 'rect'
    this.startPoint = startPoint
    this.endPoint = endPoint || null
    this.node = this.parent.node.append('path').attr('id', this.id).attr('fill', 'none').attr('stroke', '#000000').attr('stroke-width', 2)
  }

  get width() {
    return Math.abs(this.endPoint.x - this.startPoint.x)
  }

  get height() {
    return Math.abs(this.endPoint.y - this.startPoint.y)
  }

  get pathD() {
    if (!this.endPoint) {
      return ''
    }
    return `
      M${this.startPoint.x},${this.startPoint.y}
      L${this.endPoint.x},${this.startPoint.y}
      L${this.endPoint.x},${this.endPoint.y}
      L${this.startPoint.x},${this.endPoint.y}
      Z
    `
  }

  set name(val) { this._name = val }
  get name() { return this._name }

  setVisible(val) {
    this.visible = val
    this.node.attr('display', val ? 'block' : 'none')
    // corner点也设置display属性
    d3.selectAll('.' + this.id + 'corner').attr('display', val ? 'block' : 'none')
  }

  setLocked(val) {
    this.locked = val
    this.setCornerEditable(!val)
  }

  setStartPoint(point) {
    this.startPoint = point
    this.display()
  }

  setEndPoint(point) {
    this.endPoint = point
    this.display()
  }

  setCornerEditable(editable) {
    if (editable) {
      // 给四个角添加可拖动的点
      d3.selectAll('.' + this.id + 'corner').remove()
      const startPointNode = this.parent.node.append('circle').attr('class', this.id + 'corner').attr('cx', this.startPoint.x).attr('cy', this.startPoint.y).attr('r', 5).attr('fill', '#000000').attr('stroke', 'none')
      const startYEndXNode = this.parent.node.append('circle').attr('class', this.id + 'corner').attr('cx', this.endPoint.x).attr('cy', this.startPoint.y).attr('r', 5).attr('fill', '#000000').attr('stroke', 'none')
      const startXEndYNode = this.parent.node.append('circle').attr('class', this.id + 'corner').attr('cx', this.startPoint.x).attr('cy', this.endPoint.y).attr('r', 5).attr('fill', '#000000').attr('stroke', 'none')
      const endPointNode = this.parent.node.append('circle').attr('class', this.id + 'corner').attr('cx', this.endPoint.x).attr('cy', this.endPoint.y).attr('r', 5).attr('fill', '#000000').attr('stroke', 'none')

      draggable(startPointNode, (pos) => {
        this.setStartPoint(pos)
        this.setCornerEditable(true)
      })
      draggable(startYEndXNode, (pos) => {
        this.startPoint.y = pos.y
        this.endPoint.x = pos.x
        this.display()
        this.setCornerEditable(true)
      })
      draggable(startXEndYNode, (pos) => {
        this.startPoint.x = pos.x
        this.endPoint.y = pos.y
        this.display()
        this.setCornerEditable(true)
      })
      draggable(endPointNode, (pos) => {
        this.setEndPoint(pos)
        this.setCornerEditable(true)
      })
    } else {
      d3.selectAll('.' + this.id + 'corner').remove()
    }
  }

  display() {
    this.node.attr('d', this.pathD)
  }

  delete() {
    this.node.remove()
    delete this.parent.children[this.id]
    // corner点也删除
    d3.selectAll('.' + this.id + 'corner').remove()
  }
}