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
  const usedColors = ref([])

  const saveWithBgImage = ref(false)
  
  // 路径相关
  const drawLine = ref(null)
  const lineSetting = ref({
    strokeWidth: 10,
    stroke: '#000000',
    fill: 'none',
    isDashed: false,
    dashArray: '15 20',
    isRoundCorner: true,
    roundCornerRadius: 10,
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
  // const toolSetting = ref({
  //   // 通用字段
  //   tool: 'text',
  //   fillColor: 'none',
  //   color: 'black',
  //   width: 10,

  //   // 导入导出相关
  //   saveWithBgImage: false,

  //   // 线相关字段
  //   isDashed: false,
  //   dashArray: '15 20',
  //   isRoundCorner: true,
  //   roundCornerRadius: 10,
  //   preset: [],

  //   // 圆相关
  //   radius: 5,

  //   // 矩形相关
  //   rectWidth: 10,
  //   rectHeight: 10,
  //   angle: 0,
  //   cornerRadius: 0,
  // })

  const colorPicking = ref(false)

  // const selectedElementId = ref(null)
  const selectedElement = ref(null)
  // const elementMovingStart = ref({ x: -1, y: -1 })
  const pressedKeys = ref({})
  const mousePosition = ref({ x: -1, y: -1 }) // 鼠标移动事件中，鼠标的实时位置
  const zoomInfo = ref({ k: 1, x: 0, y: 0 })
  // const svgStructure = { // 以drawPartG为根节点
  //   name: '',
  //   author: '',
  //   children: {}
  // }
  // const nodeStructure = computed(() => {
  //   return chain => {
  //     const chains = chain ? chain.split('-') : []
  //     let pObj = svgStructure
  //     for (const chain of chains) {
  //       pObj = pObj.children[chain]
  //     }
  //     return pObj
  //   }
  // })

  // function modifyPathJoint (lineId, match, newJointInfo) {
  //   const lineNode = d3.select(`#${lineId}`)
  //   console.log('lineId', lineId)
  //   const lineStructure = nodeStructure.value(lineNode.attr('chain'))
  //   let newPathD = ''
  //   lineStructure.joints.forEach((joint, index) => {
  //     joint.index = index
  //     console.log(match, newJointInfo)
  //     if (joint[match.key] === match.value) {
  //       for (const key in newJointInfo) {
  //         joint[key] = newJointInfo[key]
  //       }
  //     }
  //     if (joint.type === 'start') {
  //       newPathD += `M${joint.x},${joint.y}`
  //     } else if (joint.type === 'roundJoint') {
  //       newPathD += getRoundCornerD(
  //         lineStructure.joints[index - 1],
  //         joint,
  //         lineStructure.joints[index + 1],
  //         joint.r,
  //       )
  //     } else {
  //       newPathD += ` L${joint.x},${joint.y}`
  //     }
  //   })
  //   lineStructure.d = newPathD
  //   lineNode.attr('d', newPathD)
  // }

  // function modifyStationPoints (stationId, match, newPointInfo) {
  //   console.log('modifyStationPoints', stationId, match, newPointInfo)
  //   const stationNode = d3.select(`#${stationId}`)
  //   const stationStructure = nodeStructure.value(stationNode.attr('chain'))
  //   console.log('stationStructure', stationStructure)
  //   stationStructure.points.forEach((point, index) => {
  //     point.index = index
  //     if (point[match.key] === match.value) {
  //       for (const key in newPointInfo) {
  //         point[key] = newPointInfo[key]
  //       }
  //     }
  //   })
  //   const { x, y, width, height, rotateAngle, rotateCenter } = getRectByPoints(stationStructure.points)
  //   stationNode.attr('x', x)
  //   stationNode.attr('y', y)
  //   stationNode.attr('width', width)
  //   stationNode.attr('height', height)
  //   if (rotateAngle) {
  //     const pId = stationNode.attr('chain').split('-').slice(-2)[0]
  //     const pNode = d3.select(`#${pId}`)
  //     pNode.attr('transform', `rotate(${rotateAngle}, ${rotateCenter.x}, ${rotateCenter.y})`)
  //   }
  // }

  // function exportSvg () {
  //   exportJson(svgStructure)
  // }

  
  // function appendSvgStructure (pChain, data) {
  //   let pObj = nodeStructure.value(pChain)
  //   pObj.children[data.id] = data
  //   console.log('[appendSvgStructure]', svgStructure)
  // }

  // function modifySvgStructure (chain, modifiedData) {
  //   let pObj = nodeStructure.value(chain)
  //   Object.assign(pObj, modifiedData)
  //   console.log('[modifySvgStructure]', svgStructure)
  // }

  // function moveStationByOffset (stationId, offset) {
  //   console.log('moveStationByOffset', stationId, offset)
  //   const stationNode = d3.select(`#${stationId}`)
  //   const stationStructure = nodeStructure.value(stationNode.attr('chain'))
  //   console.log('【stationStructure】', stationStructure)
  //   stationStructure.points.forEach(point => {
  //     point.x += Number(offset.dx)
  //     point.y += Number(offset.dy)
  //     modifyPathJoint(point.relatedLineId, { key: 'relatedStationId', value: stationId }, { x: point.x, y: point.y })
  //   })
  //   const { x, y, width, height, rotateAngle, rotateCenter } = getRectByPoints(stationStructure.points)
  //   stationNode.attr('x', x)
  //   stationNode.attr('y', y)
  //   stationNode.attr('width', width)
  //   stationNode.attr('height', height)
  //   if (rotateAngle) {
  //     const pId = stationNode.attr('chain').split('-').slice(-2)[0]
  //     const pNode = d3.select(`#${pId}`)
  //     pNode.attr('transform', `rotate(${rotateAngle}, ${rotateCenter.x}, ${rotateCenter.y})`)
  //   }
  // }

  // ********* 事件处理函数 start *********
  // let selectIndicator = null
  // let lineIndicator = null
  // // |- 元素点击事件
  // function handleElementClick (event, d) {
  //   const target = d3.select(event.target)
  //   const structure = nodeStructure.value(target.attr('chain'))
  //   console.log('handleElementClick!', target)

  //   const childMessage = {
  //     id: target.attr('id'),
  //     type: target.node().nodeName,
  //   }
    
  //   if (structure.note === 'station') {
  //     childMessage.type = structure.note
  //     childMessage.x = structure.points[0].x
  //     childMessage.y = structure.points[0].y
  //   }

  //   event.childMessage = childMessage
  // }

  // // 计算变换后的边界
  // function getTransformedBBox(element) {
  //   const bbox = element.getBBox();
  //   const ctm = element.getScreenCTM(); // 获取当前变换矩阵
    
  //   // 边界框的四个角点
  //   const points = [
  //     {x: bbox.x, y: bbox.y},
  //     {x: bbox.x + bbox.width, y: bbox.y},
  //     {x: bbox.x + bbox.width, y: bbox.y + bbox.height},
  //     {x: bbox.x, y: bbox.y + bbox.height}
  //   ];
    
  //   // 应用变换矩阵计算每个点的新坐标
  //   const transformedPoints = points.map(p => {
  //     return {
  //       x: p.x * ctm.a + p.y * ctm.c + ctm.e,
  //       y: p.x * ctm.b + p.y * ctm.d + ctm.f
  //     };
  //   });
    
  //   // 计算变换后的边界范围
  //   const xs = transformedPoints.map(p => p.x);
  //   const ys = transformedPoints.map(p => p.y);
  //   return {
  //     x: Math.min(...xs),
  //     y: Math.min(...ys),
  //     width: Math.max(...xs) - Math.min(...xs),
  //     height: Math.max(...ys) - Math.min(...ys)
  //   };
  // }
  // // |- 元素双击事件
  // async function handleElementDoubleClick (event, d) {
  //   const target = d3.select(event.target)
  //   if (target.node().nodeName === 'text') {
  //     const newName = await messageBoxInput('更改车站名称', '输入更改后的车站名称后点击确认', target.text())
  //     console.log('newName', newName)
  //     if (newName) {
  //       target.text(newName)
  //       modifySvgStructure(target.attr('chain'), { text: newName, })
  //     }
  //   }
  // }
  // // |- 元素鼠标按下事件，本质上是选中
  // function handleElementMousedown (event, d) {
  //   if (tool.value !== 'select') {
  //     return
  //   }
  //   const target = d3.select(event.target)
  //   if (selectedElementId.value !== target.attr('id')) {
  //     removeSelection()
  //   }
  //   selectedElementId.value = target.attr('id')
  //   if (target.node().nodeName !== 'path' && !selectIndicator) {
  //     selectIndicator = d3.select('#global_g').append('rect')
  //       .attr('fill', 'none')
  //       .attr('stroke', 'red')
  //       .attr('stroke-width', 2)
  //       .attr('id', 'select_indicator')
  //     elementMovingStart.value.x = Number(target.attr('cx') || target.attr('x'))
  //     elementMovingStart.value.y = Number(target.attr('cy') || target.attr('y'))
  //     selectedElementId.value = target.attr('id')
  //     const { x, y, width, height } = getTransformedBBox(target.node())
  //     selectIndicator.attr('x', x)
  //       .attr('y', y)
  //       .attr('width', width)
  //       .attr('height', height)
  //   }

  //   if (target.node().nodeName === 'path' && !lineIndicator) {
  //     target.attr('filter', 'url(#pathSelectedFilter)')
  //     nodeStructure.value(target.attr('chain')).joints.forEach((joint, index) => {
  //       if (joint.combinedStationId) {
  //         return
  //       }
  //       d3.select(`#station`).append('circle')
  //         .attr('cx', joint.x)
  //         .attr('cy', joint.y)
  //         .attr('r', joint.relatedStationId ? 6 : target.attr('stroke-width'))
  //         .attr('fill', target.attr('stroke'))
  //         .attr('class', 'select_line_joint')
  //         .attr('id', `select_line_joint_${index}`)
  //       useElementMover(
  //         `#select_line_joint_${index}`,
  //         {
  //           x: joint.x,
  //           y: joint.y,
  //         },
  //         {
  //           onDragStart: (element, position) => {
  //             console.log('onDragStart', element, position)
  //           },
  //           onDragging: (element, position) => {
  //             console.log('onDragging', element, position)
  //             modifyPathJoint(target.attr('id'), { key: 'index', value: index }, position)
  //             if (joint.relatedStationId) {
  //               modifyStationPoints(joint.relatedStationId, { key: 'relatedLineId', value: target.attr('id') }, position)
  //             }
  //           },
  //           onDragEnd: (element, position) => {
  //             console.log('onDragEnd', element, position)
  //           },
  //         }
  //       )
  //     })
  //   }
    

  //   // 这里后续扩展为属性值的回显
  //   if (['path', 'circle'].includes(target.node().nodeName)) {
  //     toolSetting.value.color = target.attr('stroke')
  //   }

    
  // }
  // // |- 取消选择
  // function removeSelection () {
  //   d3.select(`#${selectedElementId.value}`).attr('filter', null)
  //   selectedElementId.value = null
  //   elementMovingStart.value = { x: -1, y: -1 }
  //   if (selectIndicator) {
  //     selectIndicator.remove()
  //     selectIndicator = null
  //   }
  //   if (lineIndicator) {
  //     lineIndicator.remove()
  //     lineIndicator = null
  //   }
  //   d3.selectAll('.select_line_joint').remove()
  // }
  // ********* 事件处理函数 end *********

  // function appendSvgNode (pNode, type, attrObj) {
  //   if (attrObj.id && attrObj.id.includes('-')) {
  //     attrObj.id = attrObj.id.replaceAll('-', '_')
  //   }
  //   const pChain = pNode.attr('chain')
  //   const newGeneratedId = attrObj.id || `${type}_${moment().valueOf()}`
  //   const newNode = pNode.append(type)
  //     .attr('id', newGeneratedId)
  //     .attr('chain', `${pChain ? `${pChain}-` : ''}${newGeneratedId}`)
  //   for (const [key, value] of Object.entries(attrObj)) {
  //     if (typeof value === 'object') continue
  //     newNode.attr(key, value)
  //   }
  //   if (type === 'text') {
  //     newNode.text(attrObj.text)
  //   }
  //   if (type !== 'g') {
  //     newNode.on('click', handleElementClick)
  //     newNode.on('dblclick', handleElementDoubleClick)
  //     newNode.on('mousedown', handleElementMousedown)
  //     if (type !== 'path') {
  //       useElementMover(
  //         `#${newGeneratedId}`,
  //         {
  //           x: Number(attrObj.x || attrObj.cx || 0),
  //           y: Number(attrObj.y || attrObj.cy || 0),
  //         },
  //         {
  //           onDragStart: (element, position) => {
  //             console.log('onDragStart', element, position)
  //           },
  //           onDragging: (element, position, offset) => {
  //             console.log('onDragging', element, position)
  //             if (element.attr('id').includes('station')) {
  //               moveStationByOffset(element.attr('id'), offset)
  //             }
  //           },
  //           onDragEnd: (element, position) => {
  //             console.log('onDragEnd', element, position)
  //           },
  //         }
  //       )
  //     }
  //   }
  //   appendSvgStructure(pChain, {
  //     id: newGeneratedId,
  //     type,
  //     children: {},
  //     ...attrObj,
  //   })
  //   return newNode
  // }

  // function modifySvgNode (node, attrObj) {
  //   for (const [key, value] of Object.entries(attrObj)) {
  //     node.attr(key, value)
  //   }
  //   modifySvgStructure(node.attr('chain'), attrObj)
  // }

  // function removeSelectedSvgNode () {
  //   if (!selectedElementId.value) return
  //   const node = d3.select(`#${selectedElementId.value}`)
  //   node.remove()
  //   selectedElementId.value = null
  //   const nodeStruct = nodeStructure.value(node.attr('chain'))
  //   if (nodeStruct) {
  //     nodeStruct.removed = true
  //   }
  // }

  // function appendSvgNodeByJson (pNode, children) {
  //   if (!children) return
  //   for (const [id, eleData] of Object.entries(children)) {
  //     if (eleData.removed) continue
  //     let eleNode = pNode.select(`#${id}`)
  //     if (!eleNode.node()) {
  //       eleNode = appendSvgNode(pNode, eleData.type, eleData)
  //     }
  //     appendSvgNodeByJson(eleNode, eleData.children)
  //   }
  // }
  
  return {
    // toolSetting,
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
    // selectedElementId,
    // elementMovingStart,
    // svgStructure,
    // nodeStructure,
    // appendSvgNode,
    // modifySvgNode,
    // removeSelectedSvgNode,
    // removeSelection,
    // exportSvg,
    // modifyPathJoint,
    // appendSvgNodeByJson,
    // handleElementClick,
    // handleElementMousedown,
    // handleElementDoubleClick,
    // getTransformedBBox,
  }
})