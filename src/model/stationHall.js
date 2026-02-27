import { draggable } from '@/tools/svgMover'


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

function getCircleConvexHullPath(circles, r, node) {
  const n = circles.length;
  const EPS = 1e-9; // 数值精度阈值
  
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


// 站厅类
export default class StationHall {
  constructor (parent, points, style = {}) {
    this.parent = parent
    this.points = points || []
    this.style = style
    // console.log(this.parent.g)
    this.path = this.parent.shapeG.append('path')
      .attr('d', '')

    // 渐显，初始设置透明度为0（用于动态演示）
    if (this.style.visibleWithTransition) {
      this.path.style('opacity', 0)
    }
    
    this.refresh()
    this.addEventListener()
  }

  addPoint (point) {
    this.points.push(point)
    this.refresh()
  }

  moveBy (dx, dy) {
    this.points.forEach(point => {
      point.x += dx
      point.y += dy
      if (point.relatedLine) {
        point.relatedLine.moveJoint({
          key: 'relatedStation',
          value: this.parent,
        }, { x: point.x, y: point.y}, true)
      }
    })
    this.refresh()
    
  }

  addEventListener () {
    // 添加点击事件
    this.path.on('click', (e) => {
      e.from = {
        ele: 'station',
        eleObj: this.parent,
      }
    })
    // 添加拖动
    draggable(this.path, ({x, y, dx, dy}) => {
      this.moveBy(dx, dy)
    })
  }

  // 刷新站厅的形状（根据圆心凸包）
  refresh () {
    const d = getCircleConvexHullPath(this.points, this.style.radius || 8)
    
    this.path
      .attr('d', d)
      .attr('stroke', this.points.length > 1 ? '#444': this.style.stroke || 'black')
      .attr('stroke-width', this.style.strokeWidth || 2)
      .attr('fill', this.style.fill || '#FFF')
    // 渐显，设置透明度为1（用于动态演示）
    if (this.style.visibleWithTransition) {
      this.path.transition().duration(200).style('opacity', 1)
    }
  }
}