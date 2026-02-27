import { Group } from '@/model/element.js'
import Station from '@/model/station.js'
import Line from '@/model/line.js'
// d3
import * as d3 from 'd3'
import moment from 'moment'

export function elementCenterByCss (svg, moveObj, resolve) {
  // 获取目标元素的位置
  const target = moveObj.target
  const targetPos = target.node().getBBox()
  const targetCenter = { x: targetPos.x + targetPos.width / 2, y: targetPos.y + targetPos.height / 2 }
  console.log(`targetCenter: ${targetCenter.x}, ${targetCenter.y}`)
  svg.node.append('rect')
    .attr('x', targetPos.x)
    .attr('y', targetPos.y)
    .attr('width', targetPos.width)
    .attr('height', targetPos.height)
    .attr('stroke', 'red')
    .attr('stroke-width', 2)
    .attr('fill', 'none')
  
  // 获取SVG视窗的中心
  const containerWidth = window.innerWidth//+container.clientWidth;
  const containerHeight = window.innerHeight//+container.clientHeight;
  const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };
  console.log(`containerCenter: ${containerCenter.x}, ${containerCenter.y}`)

  // 计算需要的缩放比例（保持当前平移）
  let k = (containerWidth / (1500)).toFixed(2)
  if (moveObj.showAll) {
    const { x, y, width, height } = targetPos
    const kx = (containerWidth / (width + 200)).toFixed(2)
    const ky = (containerHeight / (height + 200)).toFixed(2)
    k = Math.min(kx, ky)
  }
  console.log(`k: ${k}, formerZoomInfo.k: ${svg.formerZoomInfo.k}`)
  const scaleRatio = k / svg.formerZoomInfo.k

  // 计算缩放中心比例
  const { x, y, width, height } = svg.children['global_g'].node.node().getBBox()
  const scaleCenterX = Math.round((targetCenter.x - x) / width * 100)
  const scaleCenterY = Math.round((targetCenter.y - y) / height * 100)

  // 计算需要的平移量（保持当前缩放）
  const dx = (containerCenter.x - targetCenter.x)
  const dy = (containerCenter.y - targetCenter.y)

  console.log(`translate(${dx}, ${dy}) scale(${scaleRatio})\n-----`)
  svg.children['global_g'].node
    .transition()
    .duration(moveObj.time)
    .ease(d3.easeLinear)
    .style('transform-origin', `${scaleCenterX}% ${scaleCenterY}%`)
    .attr(
      'transform', `scale(${scaleRatio}) translate(${dx}, ${dy})`
    )
    .on('end', () => {
      svg.formerZoomInfo.k = k
      if (moveObj.next) {
        elementCenter(svg, moveObj.next, resolve)
      } else {
        resolve && resolve()
      }
    })
}

export function elementCenter (svg, moveObj, resolve) {
  // 获取目标元素的位置
  const target = moveObj.target
  const targetPos = target.node().getBBox()
  const targetCenter = { x: targetPos.x + targetPos.width / 2, y: targetPos.y + targetPos.height / 2 }
  console.log(`targetCenter: ${targetCenter.x}, ${targetCenter.y}`)
  
  // 获取SVG视窗的中心
  const containerWidth = window.innerWidth//+container.clientWidth;
  const containerHeight = window.innerHeight//+container.clientHeight;
  const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };
  console.log(`containerCenter: ${containerCenter.x}, ${containerCenter.y}`)

  // 计算需要的缩放比例（保持当前平移）
  let k = (containerWidth / (1500))
  if (moveObj.showAll) {
    const { x, y, width, height } = targetPos
    const kx = (containerWidth / (width + 200))
    const ky = (containerHeight / (height + 200))
    k = Math.min(kx, ky)
  }

  // 1. 获取初始变换和目标变换
  const currentTransform = d3.zoomTransform(svg.node.node());
  const currentZoomInfo = svg.formerZoomInfo
  const scaleRatio = k / currentZoomInfo.k
  // 计算需要的平移量（保持当前缩放）
  const tx = (containerCenter.x - targetCenter.x * scaleRatio) / k
  const ty = (containerCenter.y - targetCenter.y * scaleRatio) / k
  const containerCenterPosInCurrent = currentTransform.apply([containerCenter.x, containerCenter.y])
  const targetCenterPosInCurrent = currentTransform.apply([targetCenter.x, targetCenter.y])
  const targetTransform = currentTransform
    .translate(containerCenterPosInCurrent[0] - targetCenterPosInCurrent[0], containerCenterPosInCurrent[1] - targetCenterPosInCurrent[1]) // 目标平移
    .scale(scaleRatio) // 目标缩放
    // .translate(containerCenter.x - targetCenter.x * k, containerCenter.y - targetCenter.y * k) // 目标平移  
    
  const regularTransform = d3.zoomIdentity
    .translate(containerCenter.x - targetCenter.x * k, containerCenter.y - targetCenter.y * k) // 目标平移
    .scale(k) // 目标缩放
    
  if (svg.mapboxObj) {
    svg.updateMapboxByD3({
      transform: {
        x: targetCenter.x / currentZoomInfo.k,
        y: targetCenter.y / currentZoomInfo.k,
        k: k
      }
    }, moveObj.time)
  }
  svg.node.transition()
    .duration(moveObj.time)
    .ease(d3.easeLinear)
    .call(svg.zoom.transform, regularTransform)
    .on('end', () => {
      if (moveObj.next) {
        elementCenter(svg, moveObj.next, resolve)
      } else {
        resolve && resolve()
      }
    })
}

export function elementCenter2 (svg, moveObj, resolve) {
  // 获取目标元素的位置
  const target = moveObj.target
  const targetPos = target.node().getBBox()
  const targetCenter = { x: targetPos.x + targetPos.width / 2, y: targetPos.y + targetPos.height / 2 }
  // targetCenter绘制circle
  svg.node.append('circle')
    .attr('cx', targetCenter.x)
    .attr('cy', targetCenter.y)
    .attr('r', 5)
    .attr('fill', 'green')
  
  // 获取SVG视窗的中心
  const containerWidth = window.innerWidth//+container.clientWidth;
  const containerHeight = window.innerHeight//+container.clientHeight;
  const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };
  // containerCenter绘制circle
  svg.node.append('circle')
    .attr('cx', containerCenter.x)
    .attr('cy', containerCenter.y)
    .attr('r', 5)
    .attr('fill', 'red')

  // 计算需要的缩放比例（保持当前平移）
  let k = (containerWidth / (1500)).toFixed(2)
  if (moveObj.showAll) {
    const { x, y, width, height } = targetPos
    const kx = (containerWidth / (width + 200)).toFixed(2)
    const ky = (containerHeight / (height + 200)).toFixed(2)
    k = Math.min(kx, ky)
  }

  // 获取当前画布的 zoom 状态（关键：用于转换坐标）
  const zoom = svg.formerZoomInfo//d3.zoomTransform(svg.node);
  const scaleRatio = (k / zoom.k).toFixed(2)
  console.log(`scaleRatio: ${k} / ${zoom.k} = ${scaleRatio}`)

  if (Math.abs(scaleRatio - 1) < Number.EPSILON) { // 无需缩放，直接平移
    console.log(`无需缩放，直接平移`)
    svg.node.transition()
      .duration(moveObj.time) // 平滑过渡时间
      .ease(d3.easeLinear) // 设置为匀速
      .call(svg.zoom.translateTo, targetCenter.x, targetCenter.y, [containerCenter.x, containerCenter.y])
      .on('end', () => {
        if (moveObj.next) {
          elementCenter(svg, moveObj.next, resolve)
        } else {
          resolve && resolve()
        }
      })
  }

  else { // 需缩放，利用缩放实现顺带位移  ·——>·---->·
    console.log(`需缩放，利用缩放实现顺带位移`)
    // 计算缩放中心，使得以该中心缩放后目标正好在视窗中心
    let scaleCenter = []
    if (k / zoom.k >= 1) {
      scaleCenter = [
        containerCenter.x - (containerCenter.x - targetCenter.x) * k / zoom.k,
        containerCenter.y - (containerCenter.y - targetCenter.y) * k / zoom.k
      ]
    } else {
      scaleCenter = [
        containerCenter.x + (containerCenter.x - targetCenter.x) * k / (zoom.k - k),
        containerCenter.y + (containerCenter.y - targetCenter.y) * k / (zoom.k - k)
      ]
    }

    // 以元素中心缩放同时平移
    const operationPromises = []
    operationPromises.push(
      new Promise((resolve, reject) => {
        svg.node.transition()
          .duration(moveObj.time) // 平滑过渡时间
          .ease(d3.easeLinear) // 设置为匀速
          .call(svg.zoom.translateTo, targetCenter.x, targetCenter.y, [containerCenter.x, containerCenter.y])
          .on('end', () => {
            resolve()
          })
      })
    )
    operationPromises.push(
      new Promise((resolve, reject) => {
        svg.node.transition()
          .duration(moveObj.time) // 平滑过渡时间
          .ease(d3.easeLinear) // 设置为匀速
          .call(svg.zoom.scaleTo, k, [targetCenter.x, targetCenter.y])
          .on('end', () => {
            resolve()
          })
      })
    )
    Promise.all(operationPromises).then(() => {
      if (moveObj.next) {
        elementCenter(svg, moveObj.next, resolve)
      } else {
        resolve && resolve()
      }
    })
  }
}

function setInformationVisible (visible) {
  return new Promise((resolve, reject) => {
    d3.selectAll('.info').transition().duration(500).style('opacity', visible ? 1 : 0)
      .on('end', () => {
        resolve()
      })
  })
}

function getPathLength (line, joints) {
  const pathData = line.generateD(joints, true)
  const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tempPath.setAttribute("d", pathData);  // 设置路径数据
  return tempPath.getTotalLength();
}

function setOriginVisible (svg, visible) {
  svg.children['global_g'].children['draw_part'].node.selectAll('*').style('opacity', visible ? 1 : 0)
  d3.select('.draw-tool-container').selectAll('*').style('opacity', visible ? 1 : 0)
  d3.select('.about').selectAll('*').style('opacity', visible ? 1 : 0)
  // d3.select('.zoom-info').selectAll('*').style('opacity', visible ? 1 : 0)
  // 隐藏网格
  d3.select('#grid').selectAll('*').style('opacity', visible ? 1 : 0)
  // if (svg.mapboxObj) {
  //   d3.select('#mapbox-container').style('opacity', visible ? 1 : 0)
  // }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calcDaysOfDateRange (startDate, endDate) {
  const start = moment(startDate)
  const end = moment(endDate)
  return end.diff(start, 'days')
}

// 信息展示相关
let descriptionDiv = null
let yearDiv = null
let dateDiv = null
let timeItems = null
let timeAxis = null
let timeProgress = null
let totalDays = 0
let dateRelatedDisplay = null
let dateRelatedDiv = null
function initInformation (data) {
  // 演示描述
  descriptionDiv = d3.select('#app').append('div')
    .attr('id', 'discription')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('left', 0)
    .style('background-color', 'rgba(255, 255, 255, 1)')
    .style('padding', '10px 12px')
    .style('border-radius', '5px')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)')
    .style('font-size', '24px')
    .style('font-weight', '700')
    .style('z-index', '50')
    .style('overflow', 'hidden')
    .style('white-space', 'nowrap')
    .style('box-sizing', 'content-box')
  const dateContainer = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('top', '50%')
    .style('left', 0)
    .style('z-index', '50')
    .classed('fc', true)
    .classed('info', true)
    .style('align-items', 'flex-start')
  yearDiv = dateContainer.append('div')
    .attr('id', 'year')
    .style('background-color', 'rgba(255, 255, 255, 1)')
    .style('padding', '10px 12px')
    .style('border-radius', '5px 5px 5px 0')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)')
    .style('font-size', '48px')
    .style('font-weight', '700')
    .classed('info', true)
  dateDiv = dateContainer.append('div')
    .attr('id', 'date')
    .style('background-color', 'rgba(255, 255, 255, 1)')
    .style('padding', '10px 12px')
    .style('border-radius', '0 5px 5px 5px')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)')
    .style('font-size', '32px')
    .classed('info', true)
  // 时间轴
  timeAxis = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('bottom', '18px')
    .style('left', '50%')
    .style('transform', 'translateX(-50%)')
    .style('z-index', '50')
    .style('width', '90vw')
    .style('height', '10px')
    .style('background-color', 'rgba(255, 255, 255, 0.8)')
    .style('border', '2px solid #140505')
    .style('border-radius', '5px')
    .classed('info', true)
  timeProgress = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('bottom', '20px')
    .style('left', `${window.innerWidth * 0.05}px`)
    .style('z-index', '50')
    .style('width', 0)
    .style('height', '10px')
    .style('background-color', '#126bae')
    .classed('info', true)
  
  timeItems = Object.groupBy(data, d => d.date)
  totalDays = calcDaysOfDateRange(Object.keys(timeItems)[0], Object.keys(timeItems)[Object.keys(timeItems).length - 1])
  for (let keyYear = Math.ceil(+Object.keys(timeItems)[0].split('-')[0] / 5) * 5; keyYear <= +Object.keys(timeItems)[Object.keys(timeItems).length - 1].split('-')[0]; keyYear += 5) {
    const keyDate = `${keyYear}-01-01`
    const daysFromStart = calcDaysOfDateRange(Object.keys(timeItems)[0], keyDate)
    const percent = daysFromStart / totalDays
    const posX = percent * timeAxis.node().clientWidth
    d3.select('#app').append('div')
      .style('height', '10px')
      .text(keyDate.split('-')[0])
      .style('position', 'absolute')
      .style('bottom', '20px')
      .style('left', `${window.innerWidth * 0.05 + posX}px`)
      .style('z-index', '50')
      .style('padding-left', '4px')
      .style('border-left', '2px solid #140505')
      .style('font-size', '10px')
      .style('color', '#140505')
      .style('line-height', '10px')
      .classed('info', true)
  }
  dateRelatedDisplay = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('bottom', '30px')
    .style('left', `${window.innerWidth * 0.05}px`)
    .style('transform', 'translateX(-50%)')
    .style('z-index', '50')
    .classed('fc', true)
    .style('align-items', 'center')
    .style('gap', 0)
    .classed('info', true)
  dateRelatedDiv = dateRelatedDisplay.append('div')
    .style('padding', '8px 10px')
    .style('background-color', 'rgba(255, 255, 255, 0.8)')
    .style('border-radius', '5px')
    .style('border', '2px solid #140505')
    .style('max-width', `${window.innerWidth * 0.1}px`)
    .classed('fr', true)
    .style('flex-wrap', 'wrap')
    .style('gap', '8px')
  const dateRelatedIndicator = dateRelatedDisplay.append('div')
    .text('↓')
    .style('font-size', '24px')
    .style('color', '#140505')
  
  return { dateRelatedDisplay, dateRelatedDiv, dateRelatedIndicator }
}

function updateInformation (item, lineChildren) {
  descriptionDiv.text(item.description)
  yearDiv.text(item.date.split('-')[0])
  dateDiv.text(item.date.split('-')[1] + '-' + item.date.split('-')[2])

  // 计算时间轴位置
  const daysFromStart = calcDaysOfDateRange(Object.keys(timeItems)[0], item.date)
  const percent = daysFromStart / totalDays
  const posX = percent * timeAxis.node().clientWidth
  dateRelatedDiv.selectAll('div').remove()
  const lineLabelTexts = []
  for (let dateItem of timeItems[item.date]) {
    if (dateItem.type === 'showAll') continue
    let lineLabelText = dateItem.description.match(/\d+/)?.[0] || dateItem.name || '*'
    if (lineLabelText === '广佛线') lineLabelText = 'GF'
    if (lineLabelTexts.includes(lineLabelText)) continue
    lineLabelTexts.push(lineLabelText)
    dateRelatedDiv.append('div')
      // 匹配name中的数字
      .text(lineLabelText + `${dateItem.description.includes('支') ? 'B' : ''}`)
      .style('font-size', '14px')
      .style('padding', '6px 8px')
      .style('background-color', Object.values(lineChildren).find(line => line.name === dateItem.name)?.style?.stroke || '#4a4035')
      .style('border-radius', '5px')
      .style('color', 'white')
  }
  dateRelatedDisplay.transition().duration(500)
    .style('left', `${window.innerWidth * 0.05 + posX}px`)
  timeProgress.transition().duration(500)
    .style('width', `${posX}px`)
}

export async function dynamicDisplay (svg, data, speed = 0.7) {
  // 增加演示图层
  const demoG = new Group(svg.children['global_g'], { id: 'demo_g' })
  const demoLineG = new Group(demoG, { id: 'demo_line_g' })
  const demoStationG = new Group(demoG, { id: 'demo_station_g' })
  
  // 原图设置透明度
  setOriginVisible(svg, false)
  initInformation(data)
  const lineChildren = svg.children['global_g'].children['draw_part'].children['global_line_g'].children
  for (const [index, item] of data.entries()) { 
    // await new Promise(resolve => {
    console.log(`演示${index + 1}：${item.description}`)
    updateInformation(item, lineChildren)

    if (item.type === 'line') {
      const line = Object.values(lineChildren).find(line => line.name === item.name)

      const sectionStationInfo = []
      const displayPromise = []
      const joints = []
      
      const indexOfFirstStation = line.joints.findIndex(joint => joint.relatedStation && joint.relatedStation.name === item.section[0])
      const indexOfLastStation = line.joints.findIndex(joint => joint.relatedStation && joint.relatedStation.name === item.section[item.section.length - 1])
      const direction = indexOfFirstStation < indexOfLastStation ? 1 : -1

      for (let i = indexOfFirstStation; i !== indexOfLastStation + direction; i += direction) {
        joints.push({ ...line.joints[i], latLng: null })
        if (line.joints[i].relatedStation) {
          joints[joints.length - 1].relatedStationId = `demo_station_${line.joints[i].relatedStation.name}`
          if (item.mode && item.mode === 'ignoreMiddle' && ![indexOfFirstStation, indexOfLastStation].includes(i)) continue
          const station = demoStationG.children[`demo_station_${line.joints[i].relatedStation.name}`]
          const lengthToStation = getPathLength(line, joints)
          // 已绘制该站点，转换成换乘站
          if (station) {
            if (!station.points.some(point => { return point.relatedLine && point.relatedLine.name === item.name})) {
              sectionStationInfo.push({
                transfer: true,
                lengthToStation,
                point: line.joints[i],
                id: `demo_station_${line.joints[i].relatedStation.name}`,
                curNode: station.shape,
              })
            } else {
              sectionStationInfo.push({
                exist: true,
                lengthToStation,
                curNode: station.shape,
              })
            }
          }
          // 未绘制该站点，正常绘制
          else {
            let points = [{ ...line.joints[i], latLng: null }]
            if (item.with && Object.keys(item.with).includes(line.joints[i].relatedStation.name)) {
              const stationChildren = svg.children['global_g'].children['draw_part'].children['global_station_g'].children
              const stationChild = Object.values(stationChildren).find(stationChild => stationChild.name === line.joints[i].relatedStation.name)
              for (const addtionalLine of item.with[line.joints[i].relatedStation.name]) {
                points.push({ ...stationChild.points.find(point => point.relatedLine.name === addtionalLine), latLng: null })
              }
              // points = points.filter(point => item.with[line.joints[i].relatedStation.name].includes(point.relatedLine.name))
            }
            sectionStationInfo.push({
              points,
              lengthToStation,
              style: {
                ...line.joints[i].relatedStation.style,
                stroke: item.givenColor || line.style.stroke, // 跟随线路颜色
              },
              name: line.joints[i].relatedStation.name,
              namePos: line.joints[i].relatedStation.namePos,
              id: `demo_station_${line.joints[i].relatedStation.name}`,
              unavailable: item.except?.includes(line.joints[i].relatedStation.name),
              curNode: line.joints[i].relatedStation.shape,
            })
          }
        }
      }

      // 路径演示准备
      const demoLine = new Line(demoLineG, {
        style: {
          ...line.style,
          stroke: item.givenColor || line.style.stroke,
        },
        joints,
        visibleWithOffset: true,
        name: item.name,
      })
      await sleep(200)
      const sectionLength = demoLine.basicPath.node().getTotalLength()

      // 开始演示
      const moveObj = {}
      let curMove = moveObj
      for (const [index, stationInfo] of sectionStationInfo.entries()) {
        if (!stationInfo.exist && !stationInfo.unavailable) {
           displayPromise.push(new Promise(resolve => {
            setTimeout(async () => {
              await sleep(700)
              if (stationInfo.transfer) {
                const station = demoStationG.children[stationInfo.id]
                station.appendPoint({ ...stationInfo.point, relatedLine: demoLine })
                station.shape.attr('class', '')
                station.g.attr('style', null)
                station.g.attr('color', null)
              } else {
                stationInfo.points[0].relatedLine = demoLine
                const station = new Station(demoStationG, {
                  id: stationInfo.id,
                  name: item.givenName?.[stationInfo.name] || stationInfo.name,
                  namePos: stationInfo.namePos,
                  style: stationInfo.style,
                  points: stationInfo.points,
                  visibleWithTransition: true,
                })
                const joint = joints.find(joint => joint.relatedStationId === stationInfo.id)
                joint.relatedStation = station
                await sleep(200)
                station.shape.attr('class', `station_of_${item.name}`)
                if (stationInfo.unavailable) {
                  station.g.style('stroke', `#ccc`)
                  station.g.style('color', `#ccc`)
                } else {
                  station.g.attr('style', null)
                }
              }
              resolve()
            }, Math.floor(stationInfo.lengthToStation * 5 / speed))
          }))
        }
        if (stationInfo.curNode) {
          const obj = {
            time: index === 0 ? 750 : (stationInfo.lengthToStation - sectionStationInfo[index - 1].lengthToStation) * 5 / speed,
            target: stationInfo.curNode,
          }
          // console.log(`${index}-${stationInfo.name}, time: ${obj.time}, target: ${obj.target.node()}`)
          curMove.next = obj
          curMove = curMove.next
        }
      }
      console.log('moveObj', moveObj.next)
      displayPromise.push(new Promise(resolve => {
        elementCenter(svg, moveObj.next, resolve)
      }))
      const time = Math.floor(sectionLength) * 5 / speed
      displayPromise.push(new Promise(async resolve => {
        await sleep(800)
        demoLine.basicPath.transition()
          .duration(time)
          .ease(d3.easeLinear) // 设置为匀速
          .attr("stroke-dashoffset", 0)
          .on("end", resolve)
      }))
      await Promise.all(displayPromise)
      console.log('演示完成', index)
    } else if (item.type === 'changeColor') {
      const lines = Object.values(demoLineG.children).filter(line => line.name === item.name)
      const sectionsCenter = lines.reduce((acc, line) => {
        const sectionCenter = {
          x: line.basicPath.node().getBBox().x + line.basicPath.node().getBBox().width / 2,
          y: line.basicPath.node().getBBox().y + line.basicPath.node().getBBox().height / 2,
        }
        if (acc) {
          acc.x = (acc.x + sectionCenter.x) / 2
          acc.y = (acc.y + sectionCenter.y) / 2
        } else {
          acc = sectionCenter
        }
        return acc
      }, null)
      const tempCenter = svg.node.append('circle')
        .attr('cx', sectionsCenter.x)
        .attr('cy', sectionsCenter.y)
        .attr('r', 5)
        .style('fill', 'none')
      await new Promise(resolve => {
        elementCenter(svg, { time: 500, target: tempCenter }, resolve)
      })
      const turnColorPromise = []
      for (const line of lines) {
        turnColorPromise.push(new Promise(resolve => {
          line.basicPath.transition()
            .duration(800)
            .ease(d3.easeLinear) // 设置为匀速
            .style('stroke', item.color)
          .on("end", resolve)
          d3.selectAll(`.station_of_${item.name}`).transition()
            .duration(800)
            .ease(d3.easeLinear) // 设置为匀速
            .attr('stroke', item.color)
        }))
      }
      await Promise.all(turnColorPromise)
    } else if (item.type === 'changeName') {
      // 根据item.name找到目标元素
      const station = Object.values(demoStationG.children).find(station => station.name === item.name)
      await new Promise(resolve => {
        elementCenter(svg, { time: 200, target: station.shape }, resolve)
      })
      await new Promise(resolve => {
        station.text.transition()
          .duration(500)
          .ease(d3.easeLinear) // 设置为匀速
          .style('opacity', 0)
          .text(item.newName)
          .transition()
          .duration(500)
          .ease(d3.easeLinear) // 设置为匀速
          .style('opacity', 1)
          .on("end", resolve)
      })
      // station.modifyName(item.newName)
    } else if (item.type === 'showAll') {
      Promise.all([
        setInformationVisible(false),
        new Promise(resolve => {
          // showAll(svg, demoG.node, resolve)
          elementCenter(svg, { time: 800, target: demoG.node, showAll: true }, resolve)
        })
      ])
      await sleep(2500)
      await new Promise(resolve => {
        d3.select('#canvas-container').transition()
          .duration(800)
          .ease(d3.easeLinear) // 设置为匀速
          .style('opacity', 0)
          .on("end", resolve)
      })
      await sleep(2500)
      // 如果不是最后一个，才显示信息
      d3.select('#canvas-container').transition()
          .duration(800)
          .ease(d3.easeLinear) // 设置为匀速
          .style('opacity', 1)
      if (index < data.length - 1) {
        setInformationVisible(true)
      }
    } else if (item.type === 'abandon') {
      const lines = Object.values(demoLineG.children).filter(line => line.name === item.name)
      const abandonLinesG = svg.node.append('g')
      // 把lines逐个复制到abandonLinesG
      lines.forEach(line => {
        abandonLinesG.append('path')
          .attr('d', line.basicPath.attr('d'))
          .attr('stroke', line.basicPath.attr('stroke'))
          .attr('stroke-width', line.basicPath.attr('stroke-width'))
          .attr('fill', 'none')
      })
      await new Promise(resolve => {
        elementCenter(svg, { time: 500, target: abandonLinesG, showAll: true }, resolve)
      })
      for (const line of lines) {
        line.delete(true)
      }
    } else if (item.type === 'station') {
      // 找到目标元素
      const station = Object.values(demoStationG.children).find(station => station.name === item.name)
      const stationChildren = svg.children['global_g'].children['draw_part'].children['global_station_g'].children
      const stationChild = Object.values(stationChildren).find(stationChild => stationChild.name === item.name)
      let points = stationChild.points
      if (item.with) {
        points = stationChild.points.filter(point => item.with.includes(point.relatedLine.name))
      }
      if (!station) {
        if (stationChild) {
          await new Promise(resolve => {
            elementCenter(svg, { time: 500, target: stationChild.shape }, resolve)
          })
          new Station(demoStationG, {
            id: `demo_station_${stationChild.name}`,
            name: stationChild.name,
            namePos: stationChild.namePos,
            style: stationChild.style,
            points: points,
            visibleWithTransition: true,
          })
        }
      } else {
        await new Promise(resolve => {
          elementCenter(svg, { time: 200, target: station.shape }, resolve)
        })
        await new Promise(resolve => {
          for (const point of points) {
            station.appendPoint({ ...point, latLng: null })
          }
          resolve()
        })
      }
    } else if (item.type === 'lineSub') {
      const line = Object.values(demoLineG.children).find(line => line.name === item.name)
      const indexOfFirstStation = line.joints.findIndex(joint => joint.relatedStation && joint.relatedStation.name === item.section[0])
      const indexOfLastStation = line.joints.findIndex(joint => joint.relatedStation && joint.relatedStation.name === item.section[item.section.length - 1])
      const subJoints = []
      const direction = indexOfFirstStation < indexOfLastStation ? 1 : -1

      for (let i = indexOfFirstStation; i !== indexOfLastStation + direction; i += direction) {
        subJoints.push(line.joints[i])
        console.log(line.joints[i])
        if (line.joints[i]?.relatedStation && i !== indexOfLastStation) {
          // TODO 待优化
          await new Promise(resolve => {
            elementCenter(svg, { time: 200, target: line.joints[i].relatedStation.shape }, resolve)
          })
          line.joints[i].relatedStation.delete()
        }
      }
      
      const subLength = getPathLength(line, subJoints)
      await new Promise(resolve => {
        line.basicPath.transition()
        .duration(subLength * 5 / speed)
        .ease(d3.easeLinear) // 设置为匀速
        .attr('stroke-dashoffset', `${subLength}`)
        .on("end", resolve)
      })
    }
    await sleep(750)
    // })
  }
}