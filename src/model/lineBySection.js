import * as d3 from "d3"
import { addContextMenu } from '@/tools/utils'

import {  
  getRoundCornerD,
  get135ConnectionD,
  get90ConnectionD,
  getDistance,
} from '@/tools/svgRelated'
import { draggable } from '@/tools/svgMover'
import { generateUniqueId } from '@/tools/utils'
// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from "pinia"
import Station from '@/model/station'
let drawStore = null
let selectedElement = null
let tool = null
let drawLine = null

function initStore () {
  drawStore = useDrawStore()
  selectedElement = storeToRefs(drawStore).selectedElement
  tool = storeToRefs(drawStore).tool
  drawLine = storeToRefs(drawStore).drawLine
}

class Section {
  constructor (settings) {
    this.id = settings.id || generateUniqueId('section')
    this.line = settings.line || null
    this.startJoint = settings.startJoint || null
    this.endJoint = settings.endJoint || null
    this.style = settings.style || {}
  }

  
}

export default class Line {
  constructor (parent, settings) {
    if (!drawStore) {
      initStore()
    }

    this.parent = parent
    this.id = settings.id || generateUniqueId('line')
    this.name = settings.name || this.id
    this.root = parent.root || null
    parent.children[this.id] = this

    this.style = {
      stroke: settings.style.stroke || '#000',
      strokeWidth: settings.style.strokeWidth || 10,
      fill: settings.style.fill || 'none',
      // isDashed: settings.style.isDashed || false,
      pattern: settings.style.pattern || 'default',
      dashArray: settings.style.dashArray || '20 20',
      innerStrokePercent: settings.style.pattern === 'railway' ? 0.8 : 0.3,
      isRoundCorner: settings.style.isRoundCorner || false,
      roundCornerRadius: settings.style.roundCornerRadius || 10,
      isClosed: settings.style.isClosed || false,
      // 渐显
      visibleWithOffset: settings.visibleWithOffset || false,
    }

    this.d = ''
    this.joints = settings.joints || []
    if (this.root.bgSetting.type === 'mapbox') {
      this.joints.forEach(joint => {
        if (joint.latLng) {
          const posByLatLng = this.root.mapboxObj.project(joint.latLng)
          joint.x = posByLatLng.x
          joint.y = posByLatLng.y
        } 
      })
    }
    
    this.addJointMode = 'push'
    this.g = this.parent.node.append("g").attr('id', `${this.id}_g`)
    this.sections = []
    this.initSections()
    this.selectG = this.g.append('g').attr('id', `${this.id}_select_g`)
    this.previewNode = null
  }

  initSections () {
    let sectionObj = null
    for (let i = 0; i < this.joints.length - 1; i++) {
      if (!sectionObj) {
        sectionObj = {
          id: `${this.id}_section_${i}`,
          line: this,
          startJoint: this.joints[i],
          endJoint: this.joints[i + 1],
          style: this.style,
        }
      }
      this.sections.push({
        id: `${this.id}_section_${i}`,
        line: this,
        startJoint: this.joints[i],
        endJoint: this.joints[i + 1],
        style: this.style,
      })
    }
  }

  // 浓缩为对象
  compress () {
    return {
      id: this.id,
      name: this.name,
      joints: this.joints.map(joint => {
        const jointObj = {
          ...joint,
          relatedStationId: joint.relatedStation?.id || '',
        }
        if (this.root.bgSetting.type === 'mapbox') {
          // 转换为实际坐标
          const realPos = this.root.transformCoordsToReal(jointObj.x, jointObj.y)
          jointObj.latLng = this.root.mapboxObj.unproject([realPos.x, realPos.y])
          delete jointObj.x
          delete jointObj.y
        }
        return jointObj
      }),
      style: this.style
    }
  }

  generateNode () {
    this.refreshStyle()

    this.addEventListeners()

    if (this.joints.length > 1) {
      this.generateD(this.joints)
    }
  }

  refreshStyle (styleObj) {
    if (styleObj) {
      for (let [key, value] of Object.entries(styleObj)) {
        this.basicPath.attr(key, value)
      }
    } else {
      this.basicPath
        .attr('stroke', this.style.stroke)
        .attr('stroke-width', this.style.strokeWidth)
        .attr('fill', this.style.fill)

      switch (this.style.pattern) {
        case 'dashed':
          this.basicPath.attr('stroke-dasharray', this.style.dashArray)
          this.basicPath.attr('stroke-dashoffset', '0')
          break
        case 'railway':
          this.additionalPath
            .attr('stroke', '#fff')
            .attr('stroke-width', Math.round(this.style.strokeWidth * this.style.innerStrokePercent))
            .attr('stroke-dasharray', this.style.dashArray)
            .attr('stroke-dashoffset', '0')
          break
        case 'fastline':
          this.additionalPath
            .attr('stroke', '#fff')
            .attr('stroke-width', Math.round(this.style.strokeWidth * this.style.innerStrokePercent))
            .attr('stroke-dasharray', '')
          break
        default:
          this.basicPath.attr('stroke-dasharray', '')
          this.additionalPath
            .attr('stroke-dasharray', '')
            .attr('stroke', 'none')
          break
      }
    }
    
  }

  preview (newJoints) {
    const previewJoints = [ ...this.joints ]
    previewJoints[this.addJointMode](newJoints)
    const d = this.generateD(previewJoints, true)
    if (!this.previewNode) {
      this.previewNode = this.parent.node.append("path").attr('id', `${this.id}_preview`)
        .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth).attr('fill', this.style.fill)
      
      if (this.style.isDashed) {
        this.previewNode.attr('stroke-dasharray', this.style.dashArray)
        this.previewNode.attr('stroke-dashoffset', '0')
      }
    }
    this.previewNode.attr('d', d)
  }

  removePreview () {
    if (this.previewNode) {
      this.previewNode.remove()
      this.previewNode = null
    }
  }

  addEndPointNode (joint, index) {
    this.parent.parent.node.append('circle')
      .attr('cx', joint.x).attr('cy', joint.y)
      .attr('r', this.style.strokeWidth / 2)
      .attr('fill', 'red')
      .attr('id', `${this.id}_${index === 0 ? 'start' : 'end'}`)
      .style('opacity', 0)
      .on('mouseenter', (e) => {
        
        if (tool.value.includes('line') && !drawLine.value) {
          d3.select(e.target).transition().duration(200).attr('r', this.style.strokeWidth / 2 + 2).attr('fill', this.style.stroke).style('opacity', 1)
        } else {
          d3.select(e.target).attr('fill', 'none')
        }
      })
      .on('mouseout', (e) => {
        if (tool.value.includes('line') && !drawLine.value) {
          d3.select(e.target).transition().duration(200).attr('r', this.style.strokeWidth / 2).style('opacity', 0)
        }
      })
      .on('click', (e) => {
        if (tool.value.includes('line') && !drawLine.value) {
          drawLine.value = this
          drawLine.value.addJointMode = index === 0 ? 'unshift' : 'push'
          e.extend = true
        }
      })
  }

  isCloseToEndPoint (pos) {
    const start = this.joints[0]
    const end = this.joints[this.joints.length - 1]
    if (this.addJointMode === 'unshift') {
      return getDistance(pos, start) < this.style.strokeWidth / 2
    }
    return getDistance(pos, end) < this.style.strokeWidth / 2
  }

  generateD (joints, readOnly = false) {
    if (joints.length < 2) return

    if (!readOnly && !this.style.isClosed) {
      this.parent.parent.node.select(`#${this.id}_start`).remove()
      this.parent.parent.node.select(`#${this.id}_end`).remove()
      // if (tool.value.includes('line')) { // 绘制路径模式下添加首尾延伸感应点
        // this.addEndPointNode(joints[0], 0)
        // this.addEndPointNode(joints[joints.length - 1], joints.length - 1)
      // }
    }

    let d = ''
    joints.forEach((joint, index) => {
      if (index === 0) {
        d += `M${joint.x},${joint.y}`
      } else if (joint.type === 'round') {
        // 如果是最后一个直接相连
        if (index === joints.length - 1) {
          d += `L${joint.x},${joint.y}`
        } else {
          d += getRoundCornerD(
            joints[index - 1],
            joint,
            joints[index + 1],
            joint.r,
          )
        }
      } else if (joint.type === 'from135') {
        d += get135ConnectionD(
          joints[index - 1],
          joint,
          joint.r,
          joint.flag,
        )
      } else if (joint.type === 'from90') {
        d += get90ConnectionD(
          joints[index - 1],
          joint,
          joint.r,
          joint.flag,
        )
      } else {
        d += `L${joint.x},${joint.y}`
      }
    })
    if (this.style.isClosed) d += 'Z'
    if (!readOnly) {
      this.d = d
      this.basicPath.attr('d', d)
      this.additionalPath.attr('d', d)

      const pathLength = this.basicPath.node().getTotalLength()

      // 渐显
      if (this.style.visibleWithOffset) {
        this.basicPath.attr('stroke-dasharray', pathLength)
        this.additionalPath.attr('stroke-dasharray', pathLength)
        this.basicPath.attr('stroke-dashoffset', pathLength)
        this.additionalPath.attr('stroke-dashoffset', pathLength)
      }

      if (this.previewNode) { // 已绘制，清除预览
        this.previewNode.remove()
        this.previewNode = null
      }
    } else {
      return d
    }
  }

  addStationInLine (joint) {
    joint.relatedStation = new Station(this.root.children['global_g'].children['draw_part'].children['global_station_g'], {
      points: [
        {
          x: joint.x,
          y: joint.y,
          relatedLine: this,
        }
      ],
      style: { stroke: this.style.stroke, }
    })
  }

  closeLine () {
    if (this.joints.length > 2) {
      this.style.isClosed = true
      this.parent.node.selectAll('#path-closed-indicator').remove()
      this.parent.parent.node.select(`#${this.id}_start`).remove()
      this.parent.parent.node.select(`#${this.id}_end`).remove()
      this.generateD(this.joints)
    }
  }

  jointEditable (joint, index) {
    const drawGNode = this.parent.parent.node
    const jointNode = drawGNode.append('circle')
      .attr('cx', joint.x).attr('cy', joint.y)
      .attr('r', joint.relatedStation ? 6 : this.style.strokeWidth)
      .attr('fill', this.style.stroke)
      .attr('class', 'selected_line_joint')
    
    const jointContextMenuOptions = [
      {
        title: '删除该节点',
        action: () => {
          this.removeJoint(joint)
          this.refreshSelect()
        }
      },
      {
        title: '在该节点添加站点',
        action: (event) => {
          this.addStationInLine(joint)
          d3.select(event.target).attr('r', 6)
        }
      }
    ]
    addContextMenu(jointNode, jointContextMenuOptions)
    
    draggable(jointNode, (pos) => {
      joint.x = pos.x
      joint.y = pos.y
      if (joint.relatedStation) {
        joint.relatedStation.modifyPoints({
          key: 'relatedLine',
          value: this
        }, pos)
      }
      this.generateD(this.joints)
      this.refreshSelect()
    })
  }

  sectionEditable (joint, index) {
    const prevJoint = {
      ...this.joints[index - 1],
    }
    const sectionNode = this.parent.node.append('path')
      .attr('d', this.generateD([prevJoint, joint], true))
      .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth).attr('fill', this.style.fill)
      .attr('class', 'selected_line_section')
      .on('mouseover', (e) => {
        if (['from135', 'from90'].includes(joint.type)) {
          const dx = joint.x - prevJoint.x
          const dy = joint.y - prevJoint.y
          if (dx === 0 || dy === 0) return
          let cursorType = 'nwse-resize'
          if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) cursorType = 'nesw-resize'
          e.target.style.cursor = cursorType
        }
      })
      .on('mouseout', (e) => {
        e.target.style.cursor = 'default'
      })
      .on('click', (e) => { 
        e.stopPropagation()
        // 点击切换拐向
        if (['from135', 'from90'].includes(joint.type)) {
          joint.flag = !joint.flag
          this.generateD(this.joints)
          // this.setSelect(false)
          d3.select(e.target).attr('d', this.generateD([prevJoint, joint], true))
          this.refreshSelect()
        }
      })
      
    const sectionContextMenuOptions = [
      {
        title: '更改为直线连接',
        action: () => {
          joint.type = 'joint'
          this.generateD(this.joints)
          this.refreshSelect()
        }
      },
      {
        title: '更改为135°折线段连接',
        action: () => {
          joint.type = 'from135'
          joint.r = 10
          joint.flag = true
          // this.joints[index - 1].type = 'joint'
          this.generateD(this.joints)
          this.refreshSelect()
        }
      },
      {
        title: '更改为90°折线段连接',
        action: () => {
          joint.type = 'from90'
          joint.r = 10
          joint.flag = true
          // this.joints[index - 1].type = 'joint'
          this.generateD(this.joints)
          this.refreshSelect()
        }
      },
      {
        title: '在此处新增节点',
        action: (event) => {
          this.addJoint({
            ...joint,
            x: event.x,
            y: event.y,
            relatedStation: null,
            relatedStationId: ''
          }, index)
          this.refreshSelect()
        }
      },
      {
        title: '在此处新增站点',
        action: (event) => {
          const newJoint = {
            ...joint,
            x: event.x,
            y: event.y,
          }
          this.addStationInLine(newJoint)
          this.addJoint(newJoint, index)
          this.refreshSelect()
        }
      }
    ]
    addContextMenu(sectionNode, sectionContextMenuOptions)
  }

  refreshSelect () {
    this.parent.parent.node.selectAll('.selected_line_joint').remove()
    this.parent.node.selectAll('.selected_line_section').remove()
    this.parent.node.selectAll('.selected_line_indicator').remove()
    
    const d = this.generateD(this.joints, true)
    this.parent.node.append('path')
      .attr('d', d)
      .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth * 2)
      .attr('fill', this.style.fill)
      .attr('class', 'selected_line_indicator')
      .style('opacity', 0.4)
      .attr('stroke-dasharray', this.style.isDashed ? this.style.dashArray : '')
    
    this.joints.forEach((joint, index) => {
      this.jointEditable(joint, index)

      // 待优化
      if (index > 0) {
        this.sectionEditable(joint, index)
      }
    })
  }


  setSelect (isSelected) {
    if (isSelected) {
      selectedElement.value = this
      this.refreshSelect()
    } else {
      selectedElement.value = null
      // 移除选中线的指示线
      this.parent.parent.node.selectAll('.selected_line_indicator').remove()
      this.parent.parent.node.selectAll('.selected_line_joint').remove()
      this.parent.node.selectAll('.selected_line_section').remove()
    }
  }

  addEventListeners () {
    this.basicPath
      .on('click', (e) => {
        if (tool.value === 'select') { // 选中该路径
          e.stopPropagation()
          if (selectedElement.value) {
            selectedElement.value.setSelect(false)
          }
          this.setSelect(true)
        }
      })

    this.additionalPath
      .on('click', (e) => {
        if (tool.value === 'select') { // 选中该路径
          e.stopPropagation()
          if (selectedElement.value) {
            selectedElement.value.setSelect(false)
          }
          this.setSelect(true)
        }
      })
  }

  addJoint (joint, index = null) {
    if (index === null) {
      this.joints[this.addJointMode](joint)
    } else {
      this.joints.splice(index, 0, joint)
    }
    this.generateD(this.joints)
  }

  removeJoint (joint) {
    const index = this.joints.findIndex(item => item === joint)
    if (index !== -1) {
      this.joints.splice(index, 1)
      this.generateD(this.joints)
      if (joint.relatedStation) {
        joint.relatedStation.removePoints({
          key: 'relatedLine',
          value: this
        })
      }
    }
  }

  moveJoint (match, newPos, fromStation = false) {
    const joint = this.joints.find(item => item[match.key]?.id === match.value.id)
    if (joint) {
      joint.x = newPos.x
      joint.y = newPos.y
      if (joint.relatedStation && !fromStation) {
        joint.relatedStation.modifyPoints({
          key: 'relatedLine',
          value: this
        }, {
          x: newPos.x,
          y: newPos.y,
        })
      }
      this.generateD(this.joints)
    }
  }

  delete () {
    if (selectedElement.value === this) {
      this.setSelect(false)
    }
    this.basicPath.remove()
    this.additionalPath.remove()

    this.joints.forEach(joint => {
      if (joint.relatedStation) {
        joint.relatedStation.removePoints({
          key: 'relatedLine',
          value: this
        })
      }
    })
    delete this.parent.children[this.id]
  }

  get stations () {
    return this.joints.filter(joint => joint.relatedStation).map(joint => joint.relatedStation)
  }

  toStandard () {
    const newJoints = this.joints.filter(joint => !!joint.relatedStation).map(joint => ({
      ...joint,
      type: 'from135'
    }))
    this.joints = newJoints
    this.generateD(this.joints)
  }

  modifyName (name) {
    this.name = name
  }

  
}