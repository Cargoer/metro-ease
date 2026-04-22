import { ElMessage, ElMessageBox } from 'element-plus'
// d3
import * as d3 from 'd3'

function getCornerEdge (point, pointC, r) {
  const dx = point.x - pointC.x
  const dy = point.y - pointC.y
  const unitX = dx ? dx / Math.abs(dx) : 0
  const unitY = dy ? dy / Math.abs(dy) : 0
  const c = Math.sqrt(dx * dx + dy * dy)
  const realR = Math.min(r, c / 2)
  let angle = Math.atan2(Math.abs(dy), Math.abs(dx))
  const x3 = Math.round(pointC.x + realR * Math.cos(angle) * unitX)
  const y3 = Math.round(pointC.y + realR * Math.sin(angle) * unitY)
  return `${x3},${y3}`
}

/**
 * 计算圆角的信息
 * @param {number} x1 控制点x坐标
 * @param {number} y1 控制点y坐标
 * @param {number} x2 对应方向的拐点x坐标
 * @param {number} y2 对应方向的拐点y坐标
 * @param {number} r 圆角半径
 * @returns {object} 圆角信息
 */
export function getRoundCornerD (point1, pointC, point2, r) {
  const edge1 = getCornerEdge(point1, pointC, r)
  const edge2 = getCornerEdge(point2, pointC, r)
  return `L${edge1} C${pointC.x},${pointC.y} ${pointC.x},${pointC.y} ${edge2}`
}

export function get135ConnectionD (point1, point2, r, leanFirst = true) {
  const turnPoint = {}

  try {
    const width = Math.abs(point2.x - point1.x)
    const height = Math.abs(point2.y - point1.y)

    if (width === 0 || height === 0 || width === height) { // 不需要拐点
      return `L${point2.x},${point2.y}`
    }

    const xVector = (point2.x - point1.x) / Math.abs(point2.x - point1.x)
    const yVector = (point2.y - point1.y) / Math.abs(point2.y - point1.y)
    

    const l = Math.min(width, height)
    if (leanFirst) {
      turnPoint.x = point1.x + l * xVector
      turnPoint.y = point1.y + l * yVector
    } else {
      turnPoint.x = point2.x - l * xVector
      turnPoint.y = point2.y - l * yVector
    }
  } catch (error) {
    console.log('get135ConnectionD error:', error)
  }
  

  return {
    d: `${getRoundCornerD(point1, turnPoint, point2, r)} L${point2.x},${point2.y}`,
    turnPoint,
  }
}

export function get90ConnectionD (point1, point2, r, yFirst = true) {
  const width = Math.abs(point2.x - point1.x)
  const height = Math.abs(point2.y - point1.y)

  if (width === 0 || height === 0) { // 不需要拐点
    return `L${point2.x},${point2.y}`
  }

  const turnPoint = {}

  if (yFirst) {
    turnPoint.x = point1.x
    turnPoint.y = point2.y
  } else {
    turnPoint.x = point2.x
    turnPoint.y = point1.y
  }

  return {
    d: `${getRoundCornerD(point1, turnPoint, point2, r)} L${point2.x},${point2.y}`,
    turnPoint,
  }
}

export function generatePathD (joints) {
  let pathD = ''
  joints.forEach((joint, index) => {
    if (joint.type === 'start') {
      pathD += `M${joint.x},${joint.y}`
    } else if (joint.type === 'roundJoint' && index > 0 && index < joints.length - 1) { // 为圆角点且不是最后一个
      const lastJoint = joints[index - 1]
      const nextJoint = joints[index + 1]
      pathD += ` L${getRoundCornerD(lastJoint, joint, nextJoint, joint.roundCornerRadius)}`
    }
  })
}

export function getDistance (point1, point2) {
  const dx = point1.x - point2.x
  const dy = point1.y - point2.y
  return Math.sqrt(dx * dx + dy * dy)
}

// 计算点到线段的距离
function getDistanceToLine (point, linePoint1, linePoint2) {
  const { x, y } = point
  const { x: x1, y: y1 } = linePoint1
  const { x: x2, y: y2 } = linePoint2
  if (x1 === x2 && y1 === y2) {
    return getDistance(point, linePoint1)
  }
  const A = y2 - y1
  const B = x1 - x2
  const C = x2 * y1 - x1 * y2
  return Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B)
}

function getAngle (point1, point2) {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.atan2(dy, dx) * 180 / Math.PI
}

function getTriangleLongestSide (point1, point2, point3) {
  const sideArr = [
    [point1, point2, getDistance(point1, point2), point3],
    [point2, point3, getDistance(point2, point3), point1],
    [point3, point1, getDistance(point3, point1), point2]
  ]
  const sortedSideArr = sideArr.sort((x, y) => x[2] - y[2])
  return sortedSideArr[2]
}

export function getRectByPoints (points, r = 10) {
  if (points.length < 2) {
    const { x, y } = points[0]
    return { x: x - r, y: y - r, width: r * 2, height: r * 2 }
  }
  if (points.length === 2) {
    const { x, y } = points[0]
    return { 
      x: x - r, y: y - r, 
      width: getDistance(points[0], points[1]) + r * 2, height: r * 2, 
      rotateAngle: getAngle(points[0], points[1]),
      rotateCenter: points[0]
    }
  }
  if (points.length === 3) {
    const longestSide = getTriangleLongestSide(points[0], points[1], points[2])
    const result = getRectByPoints([longestSide[0], longestSide[1]])
    const newHeight = getDistanceToLine(longestSide[3], longestSide[0], longestSide[1])
    result.height += newHeight
    const anotherPointAngle = getAngle(longestSide[0], longestSide[3])
    if ((result.rotateAngle < 0 && (result.rotateAngle > anotherPointAngle || anotherPointAngle > result.rotateAngle + 180)) || 
        (result.rotateAngle > 0 && (result.rotateAngle < anotherPointAngle && anotherPointAngle < result.rotateAngle - 180))) {
      result.y -= newHeight
    }
    return result
  }

  // 更多点的情况直接获取包围的矩形
  const minX = d3.min(points, d => d.x)
  const minY = d3.min(points, d => d.y)
  const maxX = d3.max(points, d => d.x)
  const maxY = d3.max(points, d => d.y)
  return { x: minX - r, y: minY - r, width: maxX - minX + r * 2, height: maxY - minY + r * 2 }
}


// 保存svg
export function saveSvg(drawPartG, format = 'image/png', quality = 0.92) {
  // 获取元素的边界框，确定需要保存的区域
  const { x, y, width, height } = drawPartG.node().getBBox();
  const padding = 100
  
  // 创建新的SVG元素
  const svgToSave = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgToSave.setAttribute('width', width + padding * 2);
  svgToSave.setAttribute('height', height + padding * 2);
  svgToSave.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`);
  
  
  // 添加背景矩形（这是新增的背景层）
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('x', x - padding);
  background.setAttribute('y', y - padding);
  background.setAttribute('width', width + padding * 2);
  background.setAttribute('height', height + padding * 2);
  background.setAttribute('fill', 'white'); // 设置背景色
  svgToSave.appendChild(background); // 先添加背景，确保它在最底层
  
  // 克隆目标元素并添加到新SVG
  const clonedElement = drawPartG.node().cloneNode(true);
  
  svgToSave.appendChild(clonedElement);


  // 创建SVG字符串
  const svgString = new XMLSerializer().serializeToString(svgToSave);
  
  // 创建Blob对象
  const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  
  // 创建图像对象
  const img = new Image();
  img.onload = function() {
    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = svgToSave.viewBox.baseVal.width;
    canvas.height = svgToSave.viewBox.baseVal.height;
    
    // 绘制图像到Canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // 输入保存名称
    ElMessageBox.prompt('输入你想保存为的图片名称', '保存为图片', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputValue: '我的地铁图',
      // 通过正则校验输入内容不为空
      inputPattern: /\S+/,
      inputErrorMessage: '请输入名称',
    })
      .then(({ value }) => {
        // 创建下载链接
        const link = document.createElement('a');
        link.download = value + '.' + format.split('/')[1];
        link.href = canvas.toDataURL(format, quality);
        link.click();
        // 提示用户导出成功
        ElMessage.success('导出图片成功');
        // 清理资源
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // 清理资源
        ElMessage.error('导出图片失败');
        URL.revokeObjectURL(url);
      })
  };
  
  img.src = url;
}

export async function downloadSvgAsImage(svgElement, filename = 'image') {
  // 1. 获取原始 SVG 的尺寸（假设已设置 width 和 height 属性）
  const svgWidth = svgElement.getAttribute('width');
  const svgHeight = svgElement.getAttribute('height');
  
  // 2. 创建带白色背景的外层 SVG 容器
  const wrapperSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrapperSvg.setAttribute('width', svgWidth);
  wrapperSvg.setAttribute('height', svgHeight);
  wrapperSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // 添加白色背景矩形（铺满整个容器）
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', 'white'); // 白色背景
  wrapperSvg.appendChild(background);
  
  // 3. 将原始 SVG 内容复制到容器中（确保层级在背景之上）
  const clonedSvg = svgElement.cloneNode(true);
  wrapperSvg.appendChild(clonedSvg);
  
  // 4. 将处理后的 SVG 转换为字符串
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(wrapperSvg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  // 5. 将 SVG 转换为图片（如 PNG）并下载
  const img = new Image();
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = parseInt(svgWidth);
    canvas.height = parseInt(svgHeight);
    const ctx = canvas.getContext('2d');
    
    // 绘制白色背景（双重保障，避免 SVG 转换时背景丢失）
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制 SVG 内容
    ctx.drawImage(img, 0, 0);
    
    // 触发下载
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    
    URL.revokeObjectURL(svgUrl);
  };
  img.src = svgUrl;
}

export async function saveSvgWithBg(
  drawPartG, 
  { 
    bgType = 'none', 
    bgUrl = '', 
    watermarkText = '', 
    imageName = '我的地铁图', 
    format = 'image/png', 
    quality = 0.95, 
    watermarkPosition = 'bottom-left', 
    padding = 100,
    canvasEdge = null 
  }
) {
  // 获取元素的边界框，确定需要保存的区域
  const { x, y, width, height } = canvasEdge ? canvasEdge.node.node().getBBox() : drawPartG.node().getBBox();
  
  // 创建新的SVG元素
  const svgToSave = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgToSave.setAttribute('width', width + padding * 2);
  svgToSave.setAttribute('height', height + padding * 2);
  svgToSave.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`);
  
  // 添加底图相应的部分
  const background = document.createElementNS('http://www.w3.org/2000/svg', bgUrl ? 'image' : 'rect');
  background.setAttribute('x', x - padding);
  background.setAttribute('y', y - padding);
  background.setAttribute('width', width + padding * 2);
  background.setAttribute('height', height + padding * 2);
  background.setAttribute('fill', bgType || 'white'); // 设置背景色
  if (bgType === 'bgImg' && bgUrl) {
    await new Promise((resolve, reject) => {
      // 创建新图片对象加载图片
      const image = new Image();
      // 允许跨域加载
      image.crossOrigin = 'anonymous';
      
      image.onload = function() {
        // 创建canvas转换图片为dataURL
        const canvas = document.createElement('canvas');
        canvas.width = width + padding * 2;
        canvas.height = height + padding * 2;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, -x + padding, -y + padding);
        
        // 将图片替换为dataURL
        background.setAttribute('href', canvas.toDataURL('image/png'));
        // 浏览器打开新标签页展示图片
        // 移除可能存在的xlink:href属性
        background.removeAttribute('xlink:href');
        resolve()
      };
      image.onerror = (e) => {
        reject()
      };

      image.src = bgUrl
    })

  }
  svgToSave.appendChild(background); // 先添加背景，确保它在最底层
  
  // 克隆目标元素并处理其中的image标签
  const clonedElement = drawPartG.node().cloneNode(true);

  console.log('canvasEdge', canvasEdge)

  if (canvasEdge) {
    // SVG 命名空间
    const svgNS = "http://www.w3.org/2000/svg";

    // const canvasEdgeBBox = canvasEdge.node.node().getBBox();
    // svgToSave.setAttribute('viewBox', `${canvasEdgeBBox.x - padding} ${canvasEdgeBBox.y - padding} ${canvasEdgeBBox.width + padding * 2} ${canvasEdgeBBox.height + padding * 2}`);

    // 3. 创建裁剪路径
    const defs = document.createElementNS(svgNS, "defs");
    const clipPath = document.createElementNS(svgNS, "clipPath");
    clipPath.id = canvasEdge.id;

    clipPath.appendChild(canvasEdge.node.node().cloneNode(true));
    defs.appendChild(clipPath);
    svgToSave.appendChild(defs);

    clonedElement.setAttribute("clip-path", `url(#${canvasEdge.id})`);
  }

  svgToSave.appendChild(clonedElement);

  if (watermarkText) {
    // 添加文字水印
    const watermark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    
    // 计算水印位置（右下角）
    let watermarkX = x + width - padding / 2;
    let watermarkY = y + height - padding / 2;
    if (watermarkPosition === 'top-left') {
      watermarkX = x + padding / 2;
      watermarkY = y + padding / 2;
    } else if (watermarkPosition === 'top-right') {
      watermarkX = x + width - padding / 2;
      watermarkY = y + padding / 2;
    } else if (watermarkPosition === 'bottom-right') {
      watermarkX = x + width - padding / 2;
      watermarkY = y + height - padding / 2;
    } else if (watermarkPosition === 'bottom-left') {
      watermarkX = x + padding / 2;
      watermarkY = y + height - padding / 2;
    }
    
    // 设置水印属性
    watermark.setAttribute('x', watermarkX);
    watermark.setAttribute('y', watermarkY);
    watermark.setAttribute('fill', 'rgba(0, 0, 0, 0.1)'); // 半透明灰色
    watermark.setAttribute('font-size', `${Math.min(Math.floor(height / 20), Math.floor(width * 0.8 / watermarkText.length))}`);
    watermark.setAttribute('text-anchor', watermarkPosition.includes('right') ? 'end' : 'start'); // 右对齐
    watermark.setAttribute('dominant-baseline', 'bottom'); // 底部对齐
    watermark.textContent = watermarkText;
    
    svgToSave.appendChild(watermark);
  }
  
  // 创建SVG字符串
  const svgString = new XMLSerializer().serializeToString(svgToSave);
  
  // 创建Blob对象
  const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  
  // 创建图像对象
  const img = new Image();
  img.onload = function() {
    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = svgToSave.viewBox.baseVal.width;
    canvas.height = svgToSave.viewBox.baseVal.height;
    
    // 绘制图像到Canvas
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(img, 0, 0);

    const link = document.createElement('a');
    link.download = imageName + '.' + format.split('/')[1];
    link.href = canvas.toDataURL(format, quality);
    link.click();
    ElMessage.success('导出图片成功');
    // 清理资源
    URL.revokeObjectURL(url);
  };

  img.onerror = function(e) {
    console.error('图片加载失败', e);
    URL.revokeObjectURL(url);
  }
  
  img.src = url;
}

export function createBorderFilter(defs, params) {
  // 参数默认值
  const {
      id = `pathSelectedFilter`,
      color = "#ffffff",
      width = 5,
      expand = 20
  } = params || {};
  
  // 移除旧滤镜
  defs.select(`filter#${id}`).remove();
  
  // 创建新滤镜
  const filter = defs.append("filter")
      .attr("id", id)
      .attr("x", `-${expand}%`)
      .attr("y", `-${expand}%`)
      .attr("width", `${100 + 2 * expand}%`)
      .attr("height", `${100 + 2 * expand}%`);
  
  // 1. 创建外边框（白边）
  filter.append("feOffset")
      .attr("in", "SourceAlpha")
      .attr("result", "offset")
      .attr("dx", 10)
      .attr("dy", 10);
  filter.append("feMorphology")
      .attr("in", "SourceAlpha")
      .attr("result", "expanded")
      .attr("operator", "dilate")
      .attr("radius", width);
  
  filter.append("feFlood")
      .attr("flood-color", color)
      .attr("result", "colorFill");
  
  filter.append("feComposite")
      .attr("in", "colorFill")
      .attr("in2", "expanded")
      .attr("operator", "in")
      .attr("result", "outerBorder");
  
  filter.append("feGaussianBlur")
      .attr("in", "offset")
      .attr("result", "blur")
      .attr("stdDeviation", 2);
  filter.append("feComposite")
      .attr("in", "colorFill")
      .attr("in2", "blur")
      .attr("operator", "in")
      .attr("result", "colorBlur");
  
  // 2. 为原始图形创建"收缩"效果，用于显示原始边框
  // filter.append("feMorphology")
  //     .attr("in", "SourceAlpha")
  //     .attr("result", "shrunk")
  //     .attr("operator", "erode")
  //     .attr("radius", 2); // 收缩原始边框的一半
  
  // filter.append("feComposite")
  //     .attr("in", "SourceGraphic")
  //     .attr("in2", "shrunk")
  //     .attr("operator", "in")
  //     .attr("result", "innerShape");
  
  // 3. 合并外边框和原始形状（保留原始边框）
  // filter.append("feMerge")
  //     .append("feMergeNode").attr("in", "outerBorder")  // 外边框
  //     .append("feMergeNode").attr("in", "innerShape");  // 内部形状（含原始边框）
  
  filter.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "outerBorder")
      .attr("operator", "over");

  return id;
}
