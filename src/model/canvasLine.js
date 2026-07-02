import * as d3 from "d3"
import { addContextMenu } from '@/tools/utils'

import {  
  getRoundCornerD,
  get135ConnectionD,
  get90ConnectionD,
  getLean90ConnectionD,
  getDistance,
} from '@/tools/svgRelated'
import { draggable } from '@/tools/svgMover'
import { generateUniqueId, getContrastTextColor } from '@/tools/utils'
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

export default class Line {
  constructor (root, settings) {
    if (!drawStore) {
      initStore()
    }

    this.id = settings.id || generateUniqueId('line')
    this.name = settings.name || this.id
    this.root = root
    root.lineMap[this.id] = this

    this.style = {
      stroke: settings.style.stroke || '#000',
      strokeWidth: settings.style.strokeWidth || 10,
      fill: settings.style.fill || 'none',
      pattern: settings.style.pattern || 'default',
      dashArray: settings.style.dashArray || '20 20',
      innerStrokePercent: settings.style.pattern === 'railway' ? 0.8 : 0.3,
      roundCornerRadius: settings.style.roundCornerRadius || 10,
      isClosed: settings.style.isClosed || false,
      // 渐显
      visibleWithOffset: settings.visibleWithOffset || false,
    }
    this.info = {
      '编组': '',
      '最高时速': '',
      '运营时间': '',
    }

    this.joints = settings.joints || []
    this.jointIdCounter = 0
    this.joints.forEach((joint, index) => {
      joint.id = `${this.id}_joint_${index}`
      this.jointIdCounter++

      // if (this.root.bgSetting.type === 'mapbox') {
      //   if (joint.latLng) {
      //     const posByLatLng = this.root.mapboxObj.project(joint.latLng)
      //     joint.x = Number(posByLatLng.x.toFixed(0))
      //     joint.y = Number(posByLatLng.y.toFixed(0))
      //   } 
      // }
      if (!joint.tag) {
        joint.tag = 'normal'
      }
    })

    this.addJointMode = 'push'
    this.g = this.parent.node.append("g").attr('id', `${this.id}_g`)
    this.paths = []
    this.selectG = this.g.append('g').attr('id', `${this.id}_select_g`)
    this.previewNode = null

    // 存量环线数据处理
    if (settings.style.isClosed) {
      // 若最后一个节点和第一个节点位置不一致，添加一个节点使环线闭合
      if (this.joints[this.joints.length - 1].x !== this.joints[0].x || this.joints[this.joints.length - 1].y !== this.joints[0].y) {
        this.joints.push(this.joints[0])
      }
    }

    // 渲染路径
    if (this.sections.length > 0) {
      this.refreshDom(true)
    }
  }

  // 浓缩为对象
  compress () {
    return {
      id: this.id,
      name: this.name,
      joints: this.joints.map(joint => {
        const jointObj = { ...joint }
        if (this.root.bgSetting.type === 'mapbox') {
          // 转换为实际坐标
          const realPos = this.root.transformCoordsToReal(jointObj.x, jointObj.y)
          const latLng = this.root.mapboxObj.unproject([realPos.x, realPos.y])
          jointObj.latLng = {
            lat: Number(latLng.lat.toFixed(6)),
            lng: Number(latLng.lng.toFixed(6)),
          }
          delete jointObj.x
          delete jointObj.y
          delete jointObj.id
        }
        return jointObj
      }),
      style: this.style,
      info: this.info
    }
  }

  clearDomArr (arr) {
    arr.forEach((v, index) => {
      v.basicPath.remove()
      v.additionalPath.remove()
    })
    arr = []
  }

  // 刷新DOM，包含样式
  refreshDom (withNumberChange = false) {
    this.clearDomArr(this.paths)    
    for (let i = 0; i < this.sections.length; i++) {
      const sectionD = this.getPathD(this.sections[i].joints, true)
      const basicPath = this.g.append("path").attr('id', `${this.id}_basic_${i}`)
        .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth).attr('fill', this.style.fill)
        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
        .attr('d', sectionD).attr('pointer-events', 'visibleStroke')
      this.bindToSelect(basicPath)
      
      const additionalPath = this.g.append("path").attr('id', `${this.id}_additional_${i}`)
        .attr('stroke', 'none').attr('stroke-width', Math.round(this.style.strokeWidth * this.style.innerStrokePercent)).attr('fill', 'none')
        // .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
        .attr('d', sectionD).attr('pointer-events', 'visibleStroke')
      this.bindToSelect(additionalPath)

      this.paths.push({ basicPath, additionalPath, tag: this.sections[i].tag })
    }
    this.refreshStyle()
    if (this.previewNode) { // 已绘制，清除预览
      this.previewNode.remove()
      this.previewNode = null
    }
  }

  // 仅刷新样式，不刷新DOM
  refreshStyle () {
    for (let i = 0; i < this.paths.length; i++) {
      if (this.paths[i].tag === 'hidden') {
        this.paths[i].basicPath.attr('stroke', 'none')
        this.paths[i].basicPath.attr('fill', 'none')
        this.paths[i].additionalPath.attr('fill', 'none')
        this.paths[i].additionalPath.attr('stroke', 'none')
        continue
      } else if (this.paths[i].tag === 'gray') {
        this.paths[i].basicPath.attr('stroke', '#bbb')
        this.paths[i].basicPath.attr('fill', 'none')
        this.paths[i].additionalPath.attr('stroke', 'none')
        continue
      }
      this.paths[i].basicPath
        .attr('stroke', this.style.stroke)
        .attr('stroke-width', this.style.strokeWidth)
        .attr('fill', this.style.fill)

      switch (this.style.pattern) {
        case 'dashed':
          this.paths[i].basicPath.attr('stroke-dasharray', this.style.dashArray)
          this.paths[i].basicPath.attr('stroke-dashoffset', '0')
          break
        case 'railway':
          this.paths[i].additionalPath
            .attr('stroke', '#fff')
            .attr('stroke-width', Math.round(this.style.strokeWidth * this.style.innerStrokePercent))
            .attr('stroke-dasharray', this.style.dashArray)
            .attr('stroke-dashoffset', '0')
          break
        case 'fastline':
          this.paths[i].additionalPath
            .attr('stroke', '#fff')
            .attr('stroke-width', Math.round(this.style.strokeWidth * this.style.innerStrokePercent))
            .attr('stroke-dasharray', '')
          break
        default:
          this.paths[i].basicPath.attr('stroke-dasharray', '')
          this.paths[i].additionalPath
            .attr('stroke-dasharray', '')
            .attr('stroke', 'none')
          break
      }
    }
    
  }

  preview (newJoints) {
    const previewJoints = [ ...this.joints ]
    previewJoints[this.addJointMode](newJoints)
    const d = this.getPathD(previewJoints)
    if (!this.previewNode) {
      this.previewNode = this.parent.node.append("path").attr('id', `${this.id}_preview`)
        .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth).attr('fill', this.style.fill)
        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
      
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
    // 处理绘制的特殊情况
    // 1 仅绘制一个点
    if (this.joints.length === 1) {
      this.delete()
      return
    }
    // 2 仅绘制2个点，且是闭合的
    if (this.joints.length === 2 && this.style.isClosed) {
      this.delete()
      return
    }

    this.refreshDom()
  }

  setExtendNode () {
    if (this.isClosed) return
    for (let index of [0, this.joints.length - 1]) {
      const joint = this.joints[index]
      this.parent.parent.node.append('circle')
        .attr('cx', joint.x).attr('cy', joint.y)
        .attr('r', this.style.strokeWidth / 2)
        .attr('fill', 'red')
        .attr('class', `extend-node`)
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
          d3.selectAll('.extend-node').remove()
          if (tool.value.includes('line') && !drawLine.value) {
            drawLine.value = this
            drawLine.value.addJointMode = index === 0 ? 'unshift' : 'push'
            e.extend = true
          }
        })
    }
  }

  // isCloseToEndPoint (pos) {
  //   const start = this.joints[0]
  //   const end = this.joints[this.joints.length - 1]
  //   if (this.addJointMode === 'unshift') {
  //     return getDistance(pos, start) < this.style.strokeWidth / 2
  //   }
  //   return getDistance(pos, end) < this.style.strokeWidth / 2
  // }

  get sections () {
    const arr = []
    let curJoints = []
    let curMode = 'normal'
    this.joints.forEach((joint, index) => {
      curJoints.push(joint)
      if (!this.joints[index + 1]) {
        arr.push({
          joints: curJoints,
          tag: curMode
        })
        curJoints = [joint]
      } else if ((this.joints[index + 1].tag || 'normal') !== curMode) {
        arr.push({
          joints: curJoints,
          tag: curMode
        })
        curMode = this.joints[index + 1]?.tag || 'normal'
        curJoints = [joint]
      }
    })
    return arr
  }

  getPathD (joints, isSection = false) {
    if (joints.length < 2) return

    let d = ''
    const trueJoints = []
    joints.forEach((joint, index) => {
      if (index === 0) {
        d += `M${joint.x},${joint.y}`
        trueJoints.push(joint)
      } else if (joint.type === 'from135') {
        const { d, turnPoint } = get135ConnectionD(
          joints[index - 1],
          joint,
          joint.r,
          joint.flag,
        )
        if (turnPoint) trueJoints.push(turnPoint)
        trueJoints.push(joint)
        // d += d
      } else if (joint.type === 'from90') {
        const { d, turnPoint } = get90ConnectionD(
          joints[index - 1],
          joint,
          joint.r,
          joint.flag,
        )
        if (turnPoint) trueJoints.push(turnPoint)
        trueJoints.push(joint)
        // d += d
      } else if (joint.type === 'fromLean90') {
        const { d, turnPoint } = getLean90ConnectionD(
          joints[index - 1],
          joint,
          joint.flag,
        )
        if (turnPoint) trueJoints.push(turnPoint)
        trueJoints.push(joint)
        // d += d
      } else {
        // d += `L${joint.x},${joint.y}`
        trueJoints.push(joint)
      }
    })
    let trueD = ''
    trueJoints.forEach((joint, index) => {
      if (!joint) return
      if (index === 0) {
        trueD += `M${joint.x},${joint.y}`
      } else if (index === trueJoints.length - 1 || joint?.relatedStationId) {
        trueD += `L${joint.x},${joint.y}`
      } else {
        trueD += getRoundCornerD(
          trueJoints[index - 1],
          joint,
          trueJoints[index + 1],
          this.style.roundCornerRadius,
        )
      }
    })
    if (this.style.isClosed && !isSection) trueD += 'Z'
    return trueD
  }

  addStationInLine (joint) {
    const newStation = new Station(this.root.children['global_g'].children['draw_part'].children['global_station_g'], {
      points: [
        {
          x: joint.x,
          y: joint.y,
          relatedLineId: this.id,
        }
      ],
      style: { stroke: this.style.stroke, }
    })
    joint.relatedStationId = newStation.id
  }

  closeLine (isClosed = true) {
    if (isClosed) {
      if (this.joints.length > 2) {
        this.style.isClosed = true
        this.removePreview()
        this.addJoint({ 
          ...(this.addJointMode === 'push' ? this.joints[0] : this.joints[this.joints.length - 1]), 
        })
        this.parent.node.selectAll('#path-closed-indicator').remove()
        this.parent.parent.node.select(`#${this.id}_start`).remove()
        this.parent.parent.node.select(`#${this.id}_end`).remove()
      }
    } else {
      this.style.isClosed = false
      this.removeJoint(this.joints[this.joints.length - 1])
    }
  }

  jointEditable (joint, index) {
    const drawGNode = this.parent.parent.node
    const jointNode = drawGNode.append('circle')
      .attr('cx', joint.x).attr('cy', joint.y)
      .attr('r', joint.relatedStationId ? 6 : this.style.strokeWidth)
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
    if (this.style.isClosed && index === this.joints.length - 1) {
      drawGNode.append('text')
        .attr('x', joint.x).attr('y', joint.y)
        .attr('fill', getContrastTextColor(this.style.stroke))
        .attr('class', 'cancel_close')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('user-select', 'none')
        .attr('pointer-events', 'none')
        .text('×')
      jointContextMenuOptions.push({
        title: '取消成环',
        action: () => {
          this.closeLine(false)
          d3.select('.cancel_close').remove()
          this.refreshSelect()
        }
      })
    }
    addContextMenu(jointNode, jointContextMenuOptions)
    
    draggable(jointNode, (pos) => {
      joint.x = pos.x
      joint.y = pos.y
      if (joint.relatedStationId) {
        const station = this.root.stationMap[joint.relatedStationId]
        station.modifyPoints({
          key: 'relatedLineId',
          value: this.id
        }, pos)
      }
      if (index === this.joints.length - 1 && this.style.isClosed) {
        this.joints[0].x = joint.x
        this.joints[0].y = joint.y
      } else if (index === 0 && this.style.isClosed) {
        this.joints[this.joints.length - 1].x = joint.x
        this.joints[this.joints.length - 1].y = joint.y
      }
      this.refreshDom()
      this.refreshSelect()
    }, {
      lastJoint: index > 0 ? this.joints[index - 1] : null,
      nextJoint: index < this.joints.length - 1 ? this.joints[index + 1] : null,
    })
  }

  sectionEditable (joint, index) {
    const prevJoint = {
      ...this.joints[index - 1],
    }
    const sectionNode = this.parent.node.append('path')
      .attr('d', this.getPathD([prevJoint, joint], true))
      .attr('stroke', this.style.stroke).attr('stroke-width', this.style.strokeWidth).attr('fill', this.style.fill)
      .attr('class', 'selected_line_section')
      .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
      .on('mouseover', (e) => {
        if (['from135', 'from90', 'fromLean90'].includes(joint.type)) {
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
        if (['from135', 'from90', 'fromLean90'].includes(joint.type)) {
          joint.flag = !joint.flag
          this.refreshDom()
          // this.setSelect(false)
          d3.select(e.target).attr('d', this.getPathD([prevJoint, joint], true))
          this.refreshSelect()
        }
      })
     
    const sectionContextMenuOptions = [
      {
        title: '更改为直线连接',
        action: () => {
          joint.type = 'joint'
          this.refreshDom()
          this.refreshSelect()
        }
      },
      {
        title: '更改为135°折线段连接',
        action: () => {
          joint.type = 'from135'
          joint.flag = true
          // this.joints[index - 1].type = 'joint'
          this.refreshDom()
          this.refreshSelect()
        }
      },
      {
        title: '更改为90°折线段连接',
        action: () => {
          joint.type = 'from90'
          joint.flag = true
          this.refreshDom()
          this.refreshSelect()
        }
      },
      {
        title: '更改为斜90°折线段连接',
        action: () => {
          joint.type = 'fromLean90'
          joint.flag = true
          this.refreshDom()
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
      },
      {
        title: '删除路线 (delete)',
        action: () => {
          this.delete()
        }
      },
    ]
    const toTag = (tag) => {
      const mapTag = {
        hidden: '隐藏',
        gray: '置灰',
        normal: '恢复',
      }
      return {
        title: `${mapTag[tag]}此段`,
        action: () => {
          // 找到上一个有关联车站的joint
          let prevStationJointIdx = index - 1
          while (prevStationJointIdx >= 0 && !this.joints[prevStationJointIdx].relatedStationId) {
            prevStationJointIdx--
          }
          let nextStationJointIdx = index
          while (nextStationJointIdx < this.joints.length && !this.joints[nextStationJointIdx].relatedStationId) {
            nextStationJointIdx++
          }
          // 若前一段也置灰或隐藏，夹在中间的车站隐藏
          if (['hidden', 'gray'].includes(this.joints[prevStationJointIdx].tag)) {
            this.root.stationMap[this.joints[prevStationJointIdx].relatedStationId].hide()
          }
          if (['hidden', 'gray'].includes(this.joints[Math.min(nextStationJointIdx + 1, this.joints.length - 1)].tag)) {
            this.root.stationMap[this.joints[nextStationJointIdx].relatedStationId].hide()
          }
          // 遍历所有有关联车站的joint，设置tag
          for (let i = prevStationJointIdx + 1; i <= nextStationJointIdx; i++) {
            this.joints[i].tag = tag
          }
          this.refreshDom()
          this.refreshSelect()
        }
      }
    }
    switch (joint.tag) {
      case 'hidden':
        sectionContextMenuOptions.push(toTag('normal'))
        sectionContextMenuOptions.push(toTag('gray'))
        sectionNode.style('opacity', 0.2)
        break
      case 'gray':
        sectionContextMenuOptions.push(toTag('normal'))
        sectionContextMenuOptions.push(toTag('hidden'))
        sectionNode.attr('stroke', '#bbb')
        break
      case 'normal':
        sectionContextMenuOptions.push(toTag('hidden'))
        sectionContextMenuOptions.push(toTag('gray'))
        break
      default:
        break
    }
    addContextMenu(sectionNode, sectionContextMenuOptions)
  }

  refreshSelect () {
    this.parent.parent.node.selectAll('.selected_line_joint').remove()
    this.parent.node.selectAll('.selected_line_section').remove()
    this.parent.node.selectAll('.selected_line_indicator').remove()
    this.parent.parent.node.selectAll('.cancel_close').remove()
    
    const d = this.getPathD(this.joints)
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
      this.refreshDom()
      selectedElement.value = null
      // 移除选中线的指示线
      this.parent.parent.node.selectAll('.selected_line_indicator').remove()
      this.parent.parent.node.selectAll('.selected_line_joint').remove()
      this.parent.node.selectAll('.selected_line_section').remove()
      this.parent.parent.node.selectAll('.cancel_close').remove()
    }
  }

  addJoint (joint, index = null) {
    const lastJoint = this.addJointMode === 'push' ?  this.joints[this.joints.length - 1] : this.joints[0]
    // 若新增节点位置与上一个节点一样，不重复添加
    if (joint.x === lastJoint.x && joint.y === lastJoint.y) {
      return
    }
    if (!joint.tag) joint.tag = 'normal'
    joint.id = `${this.id}_joint_${this.jointIdCounter++}`
    this.parent.parent.node.append('line')
      .attr('id', `${joint.id}_align_line`)
      .attr('class', 'align-line')
      .attr('stroke', 'red')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-linecap', 'round')
      .style('opacity', 0)
    if (index === null) {
      this.joints[this.addJointMode](joint)
    } else {
      this.joints.splice(index, 0, joint)
    }
    if (!this.previewNode) {
      this.refreshDom(true)
    }
  }

  removeJoint (joint) {
    const index = this.joints.findIndex(item => item === joint)
    if (index !== -1) {
      this.joints.splice(index, 1)
      this.refreshDom(true)
      if (joint.relatedStationId) {
        const station = this.root.stationMap[joint.relatedStationId]
        station.removePoints({
          key: 'relatedLineId',
          value: this.id
        })
      }
    }
  }

  moveJoint (match, newPos, fromStation = false) {
    const joint = this.joints.find(item => item[match.key] === match.value.id)
    if (joint) {
      joint.x = newPos.x
      joint.y = newPos.y
      if (joint.relatedStationId && !fromStation) {
        const station = this.root.stationMap[joint.relatedStationId]
        station.modifyPoints({
          key: 'relatedLineId',
          value: this
        }, {
          x: newPos.x,
          y: newPos.y,
        })
      }
      this.refreshDom()
    }
  }

  relatedStationDelete (stationId) {
    const joint = this.joints.find(item => item.relatedStationId === stationId)
    if (joint) {
      delete joint.relatedStationId
    }
  }

  delete (withTransition = false) {
    if (selectedElement.value === this) {
      this.setSelect(false)
    }
    if (withTransition) {
      this.basicPath.transition().duration(500).style('opacity', 0).on('end', () => {
        this.basicPath.remove()
      })
      this.additionalPath.transition().duration(500).attr('d', 'M0,0L0,0').on('end', () => {
        this.additionalPath.remove()
      })
    } else {
      this.paths.forEach(path => {
        path.basicPath.remove()
        path.additionalPath.remove()
      })
    }

    this.joints.forEach(joint => {
      if (joint.relatedStationId) {
        const station = this.root.stationMap[joint.relatedStationId]
        if (station.points.length === 1) {
          station.delete()
        } else {
          station.removePoints({
            key: 'relatedLineId',
            value: this.id
          })
        }
      }
    })
    delete this.parent.children[this.id]
  }

  get stations () {
    return this.joints.filter(joint => joint.relatedStationId).map(joint => this.root.stationMap[joint.relatedStationId])
  }

  toStandard () {
    const newJoints = this.joints.filter(joint => !!joint.relatedStationId).map(joint => ({
      ...joint,
      type: 'from135'
    }))
    this.joints = newJoints
    this.refreshDom()
    this.stations.forEach(station => station.addEventListener())
  }

  modifyName (name) {
    this.name = name
  }
}

