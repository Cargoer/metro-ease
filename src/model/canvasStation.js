import * as d3 from "d3"
import * as fabric from 'fabric'
import { 
  getRectByPoints, 
  getDistance
} from '@/tools/svgRelated'
import { messageBoxInput } from '@/tools/interact'
import { draggable } from '@/tools/svgMover'
import { generateUniqueId } from '@/tools/utils'
import { addContextMenu } from '@/tools/utils'

import { ElMessage } from 'element-plus'

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
  constructor (root, settings) {
    console.log('车站开始初始化', settings)
    if (!drawStore) {
      initStore()
    }
    // 父元素
    this.root = root
    this.canvas = root.canvas
    this.id = settings.id || generateUniqueId('station')
    this.root.stationMap[this.id] = this

    this.style = {
      stroke: settings.style.stroke || '#000',
      strokeWidth: settings.style.strokeWidth || 3,
      fill: settings.style.fill || '#fff',
      radius: settings.style.radius || 8,
      // 渐显
      visibleWithTransition: settings.visibleWithTransition || false,
      hidden: settings.style.hidden || false,
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

    this.nameStyle = {
      fill: '#000',
      fontSize: settings.nameFontSize || 12
    }

    this.selectStyle = {
      borderColor: '#f53f3f',        // 选框红色
      borderDashArray: [5, 3],       // 虚线边框
      borderScaleFactor: 2,          // 边框加粗
      padding: 8,                    // 外留白8px
      cornerColor: '#fff',           // 控制点白色填充
      cornerStrokeColor: '#f53f3f',  // 控制点描边红
      cornerSize: 10,
      cornerStyle: 'circle',         // 圆形控制点
      transparentCorners: false,     // 实心圆点
      hasRotatingPoint: false,
    }
    
    // 形状控制
    this.points = settings.points || []
    // if (this.points.length && this.root.bgSetting.type === 'mapbox') {
    //   this.points.forEach(point => {
    //     if (point.latLng) {
    //       const posByLatLng = this.root.mapboxObj.project(point.latLng)
    //       point.x = Number(posByLatLng.x.toFixed(0))
    //       point.y = Number(posByLatLng.y.toFixed(0))
    //     }
    //     if (point.relatedLineId) {
    //       if (!this.root.lineMap[point.relatedLineId]) {
    //         delete point.relatedLineId
    //       }
    //     }
    //   })
    // }

    // 相关节点
    this.shape = null
    this.text = null

    // 历史操作
    this.history = []

    this.generateNode()
  }

  get displayStrokeColor () {
    if (this.points.length === 1) {
      if (this.points[0].relatedLineId) {
        return this.root.lineMap[this.points[0].relatedLineId]?.style.stroke
      }
      return this.style.stroke
    } else {
      return '#444'
    }
  }

  // 浓缩为对象
  compress () {
    const json = {
      id: this.id,
      name: this.name,
      namePos: this.namePos,
      nameFontSize: this.nameFontSize,
      englishName: this.englishName,
      englishNamePos: this.englishNamePos,
      points: this.points.map(point => {
        const pointObj = { ...point }
        if (this.root.bgSetting.type === 'mapbox') {
          // 转换为实际坐标
          const realPos = this.root.transformCoordsToReal(point.x, point.y)
          const latLng = this.root.mapboxObj.unproject([realPos.x, realPos.y])
          pointObj.latLng = {
            lat: Number(latLng.lat.toFixed(6)),
            lng: Number(latLng.lng.toFixed(6)),
          }
          delete pointObj.x
          delete pointObj.y
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
    } else {
      selectedElement.value = null
    }
  }

  get pathD () {
    return getCircleConvexHullPath(this.points, this.style.radius || 8)
  }

  generateNode () {
    console.log('车站节点创建', this.points)

    // 车站节点路径
    const d = getCircleConvexHullPath(this.points, this.style.radius || 8)
    console.log('车站节点路径', d)
    this.shape = new fabric.Path(d, {
      selectable: true,
      hasControls: true,
      hasBorders: true,
      id: this.id,
      // linkedId: this.id + '-name',
      fill: this.style.fill,
      stroke: this.style.stroke,
      strokeWidth: this.style.strokeWidth,
    })
    this.canvas.add(this.shape)

    // 名称文本
    if (!this.namePos) {
      const shapeCenter = this.shape.getCenterPoint()
      this.namePos = { left: shapeCenter.x + this.style.radius + 20, top: shapeCenter.y + 5 }
    }
    this.text = new fabric.IText(this.name, {
      selectable: true,
      hasControls: true,
      hasBorders: true,
      editable: true,
      id: this.id + '-name',
      // linkedId: this.id,
      ...this.namePos,
    })
    this.canvas.add(this.text)

    this.refreshStyle()
    this.addEventListener()
  }

  refreshStyle () {
    console.log('车站节点样式刷新', this.style)
    const d = getCircleConvexHullPath(this.points, this.style.radius || 8)
    
    this.shape.set({
      fill: this.style.fill,
      stroke: this.style.stroke,
      strokeWidth: this.style.strokeWidth,
    })
    this.shape.set('d', d)
    this.style.hidden ? this.hide() : this.show()

    this.text.set(this.nameStyle)

    this.canvas.requestRenderAll()
    this.history.push({
      type: 'refreshStyle',
      style: this.style,
      nameStyle: this.nameStyle,
    })
  }

  refreshName (name) {
    this.name = name || this.name 
    this.text.set('text', this.name)
    this.text.set(this.namePos)
    this.canvas.requestRenderAll()
  }

  hide () {
    this.style.hidden = true
    this.shape.set({'opacity': 0})
    this.text.set({'opacity': 0})
    this.canvas.renderAll()
  }

  show () {
    this.style.hidden = false
    this.shape.set({'opacity': 1})
    this.text.set({'opacity': 1})
    this.canvas.renderAll()
  }

  get center () {
    return this.shape.getCenterPoint()
  }

  connectPoints () {
    // 第一步，获取附近的所有点
    const distanceThreshold = this.style.radius * 3 || 30
    const nearbyStations = Object.values(this.root.stationMap).filter(station => station.id !== this.id && getDistance(this.center, station.center) <= distanceThreshold)

    if (nearbyStations.length === 0) {
      ElMessage.warning('没有附近可合并车站')
      return
    }

    // 第二步，创建交互临时元素
    nearbyStations.forEach(station => {
      const d = station.shape.node().getAttribute('d')
      this.parent.node.append('path')
        .attr('d', d)
        .attr('stroke', station.style.stroke)
        .attr('stroke-width', station.style.strokeWidth)
        .attr('fill', 'red')
        .attr("filter", "url(#d3-shadow)")   // 应用阴影滤镜
        .attr('class', 'nearby-station')
        .on('click', (e) => { // 点击事件
          e.stopPropagation()
          station.points.forEach(point => {
            this.appendPoint(point)
            if (point.relatedLineId) {
              const relatedLine = this.root.lineMap[point.relatedLineId]
              const relatedJoint = relatedLine.joints.find(joint => joint.relatedStationId === station.id)
              if (relatedJoint) {
                relatedJoint.relatedStationId = this.id
              }
            }
          })
          station.delete()
          this.parent.node.selectAll('.nearby-station').remove()
        })
    })
  }

  addEventListener () {
    let originalPoints = [...this.points]
    let originalNamePos = {...this.namePos}

    this.shape.on('selected', (e) => {
      this.setSelect(true)
      originalPoints = [...this.points]
      originalNamePos = {...this.namePos}
    })
    this.shape.on('deselected', (e) => {
      this.setSelect(false)
    })

    this.shape.on('moving', (opt) => {
      // 同步移动所有车站相关及关联元素
      const { transform } = opt
      const { original, target } = transform
      const dx = target.left - original.left
      const dy = target.top - original.top

      // 核心点的同步
      this.points.forEach((point, index) => {
        point.x = originalPoints[index].x + dx
        point.y = originalPoints[index].y + dy
        // todo 关联路线的点，需要更新路线的点位置
      })

      // 名称文本的同步
      this.namePos.left = originalNamePos.left + dx
      this.namePos.top = originalNamePos.top + dy
      this.refreshName()
    })

    this.text.on('editing:exited', (opt) => {
      this.refreshName(this.text.text)
    })
  }

  appendPoint (point) {
    if ( // 第一次和路线关联，只变颜色
      this.points.length === 1 && 
      !this.points[0].relatedLineId && 
      point.relatedLineId
    ) {
      this.points[0].relatedLineId = point.relatedLineId
      this.style.stroke = this.root.lineMap[point.relatedLineId].style.stroke
      if (this.shape) {
        this.shape.set('stroke', this.style.stroke)
        this.canvas.requestRenderAll()
      }
    } else {
      this.points.push(point)
      this.refreshStyle()
    }
  }

  modifyPoints (match, newPointInfo) {
    const index = this.points.findIndex(point => point[match.key] === match.value)
    if (index !== -1) {
      Object.assign(this.points[index], newPointInfo)
      this.refreshStyle()
    }
  }

  removePoints (match) {
    if (this.points.length === 1) {
      this.points[0].relatedLineId = null
      return
    }
    const index = this.points.findIndex(point => point[match.key] === match.value)
    if (index !== -1) {
      this.points.splice(index, 1)
      this.refreshStyle()
    }
  }

  sliceMove (dx, dy) {
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
    this.lines.forEach(line => line.relatedStationDelete(this.id))
    this.g.remove()
    delete this.parent.children[this.id]
    delete this.root.stationMap[this.id]
  }

  get lines () {
    return this.points.filter(joint => joint.relatedLineId).map(joint => this.root.lineMap[joint.relatedLineId])
  }
}


// 车站闭包结构
function convexHull(points) {
  // 先对points进行去重
  const uniquePoints = [...new Set(points.map(point => `${point.x},${point.y}`))]
  // 转换为点对象
  const pointsObj = uniquePoints.map(coord => {
    const [x, y] = coord.split(',');
    return { x: Number(x), y: Number(y) };
  });
  
  // 排序：x升序，x相同y升序
  const sorted = [...pointsObj].sort((a, b) => a.x - b.x || a.y - b.y);
  const n = sorted.length;
  if (n <= 1) return sorted;

  // 构建下凸包
  const lower = [];
  for (let i = 0; i < n; i++) {
    while (lower.length >= 2) {
      const a = lower[lower.length - 2];
      const b = lower[lower.length - 1];
      const c = sorted[i];
      // SVG中y向下，叉积≥0表示非左转（顺时针/共线），移除中间点
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross >= 0) lower.pop();
      else break;
    }
    lower.push(sorted[i]);
  }

  // 构建上凸包
  const upper = [];
  for (let i = n - 1; i >= 0; i--) {
    while (upper.length >= 2) {
      const a = upper[upper.length - 2];
      const b = upper[upper.length - 1];
      const c = sorted[i];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross >= 0) upper.pop();
      else break;
    }
    upper.push(sorted[i]);
  }

  // 合并并去重（移除首尾重复点）
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function getCircleConvexHullPath(circles, radius, node) {
  const n = circles.length;
  const EPS = 1e-9; // 数值精度阈值
  const r = Number(radius)
  
  // Step 1：预处理
  if (n === 0) return "";
  if (n === 1 || convexHull(circles).length === 1) {
    const { x, y } = circles[0];
    // 单圆路径：规避360°圆弧问题，添加微小偏移
    // return `M ${(x - r).toFixed(3)} ${y.toFixed(3)} A ${r.toFixed(3)} ${r.toFixed(3)} 0 1 0 ${(x - r + EPS).toFixed(3)} ${y.toFixed(3)} Z`;
    return `
      M ${(x - r).toFixed(3)} ${y.toFixed(3)} 
      A ${r.toFixed(3)} ${r.toFixed(3)} 0 1 0 ${(x + r).toFixed(3)} ${y.toFixed(3)} 
      A ${r.toFixed(3)} ${r.toFixed(3)} 0 1 0 ${(x - r).toFixed(3)} ${y.toFixed(3)} 
      Z`;
  }

  // Step 2：求圆心凸包（逆时针顺序）
  const hullCenters = convexHull(circles);
  const k = hullCenters.length; // 凸包顶点数

  // Step 3：计算所有切点对 (T_i, S_i)
  const tangents = [];
  for (let i = 0; i < k; i++) {
    const C_i = hullCenters[i];
    const C_j = hullCenters[(i + 1) % k]; // 闭合连接
    const dx = C_j.x - C_i.x;
    const dy = C_j.y - C_i.y;
    const L = Math.hypot(dx, dy); // 向量长度
    if (L < EPS) continue; // 圆心重合，跳过

    // 单位向量及垂直向量（逆时针旋转90°）
    const ux = dx / L;
    const uy = dy / L;
    const vx = -uy; // 垂直向量x
    const vy = ux;  // 垂直向量y

    // 计算切点
    const T = { x: C_i.x + r * vx, y: C_i.y + r * vy };
    const S = { x: C_j.x + r * vx, y: C_j.y + r * vy };
    tangents.push({ T, S });
  }

  // Step 4：计算每个凸包圆心的圆弧参数
  const arcs = [];
  for (let i = 0; i < k; i++) {
    const C_i = hullCenters[i];
    const S_prev = tangents[(i - 1 + k) % k].S; // 前一个切点
    const T_curr = tangents[i].T;               // 当前切点


    // 向量CP（S_prev - C_i）和CQ（T_curr - C_i）
    const CPx = S_prev.x - C_i.x;
    const CPy = S_prev.y - C_i.y;
    const CQx = T_curr.x - C_i.x;
    const CQy = T_curr.y - C_i.y;

    // 计算圆心角θ
    const dot = CPx * CQx + CPy * CQy;
    const cross = CPx * CQy - CPy * CQx;
    let theta = Math.atan2(cross, dot);
    if (theta < 0) theta += 2 * Math.PI; // 转为[0, 2π)

    // 圆弧参数
    const la = theta > Math.PI ? 1 : 0; // 大弧标记
    const sw = 0;                       // 逆时针旋转
    arcs.push({ la, sw, target: T_curr });
  }

  // Step 5：生成d属性字符串
  const firstT = tangents[0].T;
  let d = `M ${firstT.x.toFixed(3)} ${firstT.y.toFixed(3)}`;

  for (let i = 0; i < k; i++) {
    const { S } = tangents[i];
    const { la, sw, target } = arcs[(i + 1) % k];
    // 线段：当前点 → S_i
    d += ` L ${S.x.toFixed(3)} ${S.y.toFixed(3)}`;
    // 圆弧：S_i → target（T_i）
    d += ` A ${r.toFixed(3)} ${r.toFixed(3)} 0 0 ${sw} ${target.x.toFixed(3)} ${target.y.toFixed(3)}`;
  }

  // 闭合路径
  return d + " Z";
}