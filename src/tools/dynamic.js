import { Group } from '@/model/element.js'
import Station from '@/model/station.js'
import Line from '@/model/line.js'
// d3
import * as d3 from 'd3'
import moment from 'moment'

function elementCenter (svg, moveObj, resolve) {
  // 获取目标元素的位置
  const target = moveObj.target
  const targetPos = target.node().getBBox()
  const targetCenter = { x: targetPos.x + targetPos.width / 2, y: targetPos.y + targetPos.height / 2 }
  
  // 获取SVG视窗的中心
  const containerWidth = window.innerWidth//+container.clientWidth;
  const containerHeight = window.innerHeight//+container.clientHeight;
  const containerCenter = { x: containerWidth / 2, y: containerHeight / 2 };

  // 计算需要的缩放比例（保持当前平移）
  const k = containerWidth / (1000)

  // 关键计算：同时考虑缩放和平移，保持元素在中心
  // 公式推导：新位置 = 容器中心 - (目标位置 * 新缩放)
  const newX = containerCenter.x - targetCenter.x * k;
  const newY = containerCenter.y - targetCenter.y * k;
  
  // 应用平移变换（保持当前缩放级别）
  svg.node.transition()
    .duration(moveObj.time) // 平滑过渡时间
    .ease(d3.easeLinear) // 设置为匀速
    .call(
      svg.zoom.transform,
      d3.zoomIdentity
        .translate(newX, newY)
        .scale(k) // 保持当前缩放比例
    )
    .on('end', () => {
      if (moveObj.next) {
        elementCenter(svg, moveObj.next, resolve)
      } else {
        resolve && resolve()
      }
    })
}

export async function dynamicDisplay (svg, data) {
  const getPathLength = (line, joints) => {
    const pathData = line.generateD(joints, true)
    const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempPath.setAttribute("d", pathData);  // 设置路径数据
    return tempPath.getTotalLength();
  }

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const setOriginVisible = (visible) => {
    svg.children['global_g'].children['draw_part'].node.selectAll('*').style('opacity', visible ? 1 : 0)
    d3.select('.draw-tool-container').selectAll('*').style('opacity', visible ? 1 : 0)
    d3.select('.about').selectAll('*').style('opacity', visible ? 1 : 0)
    d3.select('.zoom-info').selectAll('*').style('opacity', visible ? 1 : 0)
    // 隐藏网格
    d3.select('#grid').selectAll('*').style('opacity', visible ? 1 : 0)
  }

  const calcDaysOfDateRange = (startDate, endDate) => {
    const start = moment(startDate)
    const end = moment(endDate)
    return end.diff(start, 'days')
  }
  
  // 增加演示图层
  const demoG = new Group(svg.children['global_g'], { id: 'demo_g' })
  const demoLineG = new Group(demoG, { id: 'demo_line_g' })
  const demoStationG = new Group(demoG, { id: 'demo_station_g' })
  // 演示描述
  const descriptionDiv = d3.select('#app').append('div')
    .attr('id', 'discription')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('left', 0)
    .style('background-color', 'rgba(255, 255, 255, 1)')
    .style('padding', '10px 12px')
    .style('border-radius', '5px')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)')
    .style('font-size', '24px')
    .style('z-index', '50')
    .style('overflow', 'hidden')
    .style('white-space', 'nowrap')
    .style('box-sizing', 'content-box')
    // .style('display', 'none')
  const dateContainer = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('top', '50%')
    .style('left', 0)
    .style('z-index', '50')
    .classed('fc', true)
    .style('align-items', 'flex-start')
  const yearDiv = dateContainer.append('div')
    .attr('id', 'year')
    .style('background-color', 'rgba(255, 255, 255, 1)')
    .style('padding', '10px 12px')
    .style('border-radius', '5px 5px 5px 0')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)')
    .style('font-size', '32px')
    .style('font-weight', '700')
  const dateDiv = dateContainer.append('div')
    .attr('id', 'date')
    .style('background-color', 'rgba(255, 255, 255, 1)')
    .style('padding', '10px 12px')
    .style('border-radius', '0 5px 5px 5px')
    .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)')
    .style('font-size', '20px')
  // 时间轴
  const timeAxis = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('bottom', '20px')
    .style('left', '50%')
    .style('transform', 'translateX(-50%)')
    .style('z-index', '50')
    .style('width', '90vw')
    .style('height', '6px')
    .style('background-color', 'rgba(255, 255, 255, 0.8)')
  const timeProgress = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('bottom', '20px')
    .style('left', `${window.innerWidth * 0.05}px`)
    // .style('transform', 'translateX(-50%)')
    .style('z-index', '50')
    .style('width', 0)
    .style('height', '6px')
    .style('background-color', '#126bae')
  
  const timeItems = Object.groupBy(data, d => d.date)
  const totalDays = calcDaysOfDateRange(Object.keys(timeItems)[0], Object.keys(timeItems)[Object.keys(timeItems).length - 1])
  for (const keyDate of ['2005-01-01', '2010-01-01', '2015-01-01', '2020-01-01', '2025-01-01']) {
    const daysFromStart = calcDaysOfDateRange(Object.keys(timeItems)[0], keyDate)
    const percent = daysFromStart / totalDays
    const posX = percent * timeAxis.node().clientWidth
    d3.select('#app').append('div')
      .text(keyDate.split('-')[0])
      .style('position', 'absolute')
      .style('bottom', '23px')
      .style('left', `${window.innerWidth * 0.05 + posX}px`)
      .style('transform', 'translate(-50%, 50%)')
      .style('z-index', '50')
      // .style('width', 'auto')
      .style('padding', '4px 6px')
      // .style('height', '16px')
      // .style('line-height', '16px')
      .style('border-radius', '5px')
      .style('font-size', '10px')
      .style('background-color', 'rgba(255, 255, 255, 1)')
      .style('color', '#3170a7')
  }
  const dateRelatedDisplay = d3.select('#app').append('div')
    .style('position', 'absolute')
    .style('bottom', '30px')
    .style('left', `${window.innerWidth * 0.05}px`)
    .style('transform', 'translateX(-50%)')
    .style('z-index', '50')
    .classed('fc', true)
    .style('align-items', 'center')
  const dateRelatedDiv = dateRelatedDisplay.append('div')
    .style('padding', '8px 10px')
    .style('background-color', 'rgba(255, 255, 255, 0.8)')
    .style('border-radius', '5px')
    .classed('fr', true)
    .style('gap', '8px')
  const dateRelatedIndicator = dateRelatedDisplay.append('div')
    .style('width', '4px')
    .style('height', '10px')
    .style('background-color', 'rgba(255, 255, 255, 0.8)')
  // 原图设置透明度
  setOriginVisible(false)
  const lineChildren = svg.children['global_g'].children['draw_part'].children['global_line_g'].children
  for (const [index, item] of data.entries()) { 
    // await new Promise(resolve => {
    console.log(`演示${index + 1}：${item.description}`)
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
      const lineLabelText = dateItem.description.match(/\d+/)?.[0] || dateItem.name
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

    if (item.type === 'line') {
      const line = Object.values(lineChildren).find(line => line.name === item.name)
      const sectionStationInfo = []
      const displayPromise = []
      const joints = []
      
      const indexOfFirstStation = line.joints.findIndex(joint => joint.relatedStation && joint.relatedStation.name === item.section[0])
      const indexOfLastStation = line.joints.findIndex(joint => joint.relatedStation && joint.relatedStation.name === item.section[item.section.length - 1])
      const direction = indexOfFirstStation < indexOfLastStation ? 1 : -1

      for (let i = indexOfFirstStation; i !== indexOfLastStation + direction; i += direction) {
        joints.push(line.joints[i])
        if (line.joints[i].relatedStation) {
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
            }
          }
          // 未绘制该站点，正常绘制
          else {
            sectionStationInfo.push({
              point: line.joints[i],
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
              const station = new Station(demoStationG, {
                id: stationInfo.id,
                name: item.givenName?.[stationInfo.name] || stationInfo.name,
                namePos: stationInfo.namePos,
                style: stationInfo.style,
                points: [{ ...stationInfo.point, relatedLine: demoLine }],
                visibleWithTransition: true,
              })
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
          }, stationInfo.lengthToStation * 5)
        }))
        if (stationInfo.curNode) {
          const obj = {
            time: index === 0 ? 750 : (stationInfo.lengthToStation - sectionStationInfo[index - 1].lengthToStation) * 5,
            target: stationInfo.curNode,
          }
          curMove.next = obj
          curMove = curMove.next
        }
      }
      displayPromise.push(new Promise(resolve => {
        elementCenter(svg, moveObj.next, resolve)
      }))
      const time = Math.floor(sectionLength) * 5
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
        elementCenter(svg, { time: 200, target: tempCenter }, resolve)
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
    }
    await sleep(750)
    // })
  }
}