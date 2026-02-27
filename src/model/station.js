import * as d3 from "d3"
import { 
  getRectByPoints, 
} from '@/tools/svgRelated'
import { messageBoxInput } from '@/tools/interact'
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
    console.log('Station', settings.name)
    if (!drawStore) {
      initStore()
    }
    // 父元素
    this.parent = parent
    this.id = settings.id || generateUniqueId('station')
    parent.children[this.id] = this
    this.root = parent.root || null
    this.root.stationMap[this.id] = this

    this.style = {
      stroke: settings.style.stroke || '#000',
      strokeWidth: settings.style.strokeWidth || 3,
      fill: settings.style.fill || '#fff',
      radius: settings.style.radius || 8,
      // 渐显
      visibleWithTransition: settings.visibleWithTransition || false,
    }
    this.nameStyle = {
      fontSize: settings.nameStyle?.fontSize || 12,
    }
    // 更多信息
    this.info = settings.info || {}

    // 车站名称
    this.name = settings.name || '车站名'
    this.namePos = settings.namePos
    this.nameFontSize = settings.nameFontSize || 12
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
    this.g = null
    this.shapeG = null
    this.shape = null
    this.text = null
    this.selectedIndicator = null

    this.generateNode()
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
      this.selectedIndicator = this.g.append('rect')
        .attr('x', this.shape.node().getBBox().x - 2)
        .attr('y', this.shape.node().getBBox().y - 2)
        .attr('width', this.shape.node().getBBox().width + 4)
        .attr('height', this.shape.node().getBBox().height + 4)
        .attr('stroke', '#f34718')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
    } else {
      selectedElement.value = null
      this.selectedIndicator.remove()
      this.selectedIndicator = null
    }
  }

  refreshStyle () {
    const d = getCircleConvexHullPath(this.points, this.style.radius || 8)
    console.log('d', d)
    if (!this.shape) this.shape = this.g.append("path")
    this.shape
      .attr('stroke', this.points.length > 1 ? '#444' : this.style.stroke)
      .attr('stroke-width', this.style.strokeWidth)
      .attr('fill', this.style.fill)
      .attr('d', d)

    // 渐显，用于动态演示
    if (this.style.visibleWithTransition) {
      this.shape
        .style('opacity', 0)
        .transition()
        .duration(200)
        .ease(d3.easeLinear) // 设置为匀速
        .style('opacity', 1)
      this.text
        .style('opacity', 0)
        .transition()
        .duration(200)
        .ease(d3.easeLinear) // 设置为匀速
        .style('opacity', 1)
    }

    this.refreshName()
  }

  refreshName (name) {
    if (!this.text) {
      this.text = this.g.append("text")
        .text(this.name)
        .attr('font-size', this.nameFontSize)
        // .attr('fill', this.style.stroke)
        .attr('style', 'user-select: none;')
        .on('dblclick', async (e) => {
          e.stopPropagation()
          const name = await messageBoxInput('更改车站名称', '输入更改后的车站名称后点击确认', this.name)
          this.modifyName(name)
        })
    }
    this.name = name || this.name 
    this.text.text(this.name || this.name)
    if (!this.namePos) {
      const { x, y, width, height } = this.shape.node().getBBox()
      this.namePos = { x: x + width + 5, y: y + height }
    }
    this.text.attr('x', this.namePos.x).attr('y', this.namePos.y).attr('font-size', this.nameFontSize)
  }

  generateNode () {
    this.g = this.parent.node.append("g")
    this.refreshStyle()
    // this.refreshName()
    this.addEventListener()
  }

  addEventListener () {
    this.shape
      .on('click', (e) => { // 点击事件
        e.from = {
          ele: 'station',
          eleObj: this,
        }
        if (tool.value === 'select') {
          this.setSelect(true)
        }
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
    if (this.points.length === 1 && !this.points[0].relatedLineId && point.relatedLineId) {
      this.points[0].relatedLineId = point.relatedLineId
      this.style.stroke = this.root.lineMap[point.relatedLineId].style.stroke
      if (this.shape) {
        this.shape.attr('stroke', this.style.stroke)
      }
    } else {
      this.points.push(point)
      this.refreshStyle()
    }
  }

  modifyPoints (match, newPointInfo) {
    console.log('modifyPoints', match, newPointInfo)
    const index = this.points.findIndex(point => point[match.key] === match.value.id)
    console.log('index', index)
    if (index !== -1) {
      Object.assign(this.points[index], newPointInfo)
      this.refreshStyle()
    }
  }

  removePoints (match) {
    // if (this.points.length === 1) {
    //   this.points[0].relatedLine = null
    //   return
    // }
    const index = this.points.findIndex(point => point[match.key]?.id === match.value.id)
    if (index !== -1) {
      this.points.splice(index, 1)
      this.refreshStyle()
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
      if (point.relatedLineId && this.root.lineMap[point.relatedLineId]) {
        this.root.lineMap[point.relatedLineId].moveJoint({
          key: 'relatedStationId',
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
    this.refreshStyle()
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
    this.g.remove()
    delete this.parent.children[this.id]
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