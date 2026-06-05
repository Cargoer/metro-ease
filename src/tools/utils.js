import * as d3 from 'd3'

// 防抖工具函数
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    // 清除上一次的定时器
    if (timer) clearTimeout(timer);
    // 重新计时
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * 生成唯一ID（时间戳+随机数）
 * @param {string} prefix - ID前缀（可选）
 * @returns {string} 唯一ID
 */
export function generateUniqueId(prefix = '') {
  // 时间戳（毫秒级，确保有序性）
  const timestamp = Date.now().toString(36); // 转为36进制缩短长度
  // 随机数（避免同一毫秒内重复）
  const random = Math.random().toString(36).slice(-6); // 取后6位
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function addContextMenu(node, options) {
  node.on('contextmenu', (event) => {
    event.preventDefault()
    const [x, y] = d3.pointer(event)
    const menuContainer = d3.select('#svg-container').append('div')
      .attr('class', 'context-menu fc')
      .style('position', 'absolute')
      .style('left', `${event.x}px`)
      .style('top', `${event.y}px`)
      .style('background-color', 'rgba(255, 255, 255, 0.9)')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('padding', '8px 6px')
      .style('box-shadow', '0 2px 4px rgba(0, 0, 0, 0.1)')
      .style('align-items', 'flex-start')
      .style('gap', '4px')
    
    options.forEach((option, index) => {
      menuContainer.append('div')
        .attr('class', 'context-menu-item')
        .text(option.title)
        .style('text-align', 'left')
        .style('background-color', 'rgba(176,213,223, 0.9)')
        .style('border-radius', '2px')
        .style('color', '#001219')
        .style('padding', '4px 10px')
        .style('cursor', 'pointer')
        .on('click', () =>{ 
          option.action({
            ...event,
            x,
            y
          }) 
          menuContainer.remove()
        })
    })
  })
}

/**
 * 根据背景色自动计算最佳文字颜色（黑/白）
 * @param {string} color - 背景色（支持 hex / rgb / rgba 格式）
 * @returns {string} 'black' 或 'white'
 */
export function getContrastTextColor(color) {
  if (color === 'none' || !color) return 'black'
  // 1. 移除所有空格
  color = color.trim().replace(/\s+/g, '');

  let r, g, b;

  // 2. 处理 HEX 格式（#fff / #ffffff）→ 替换 substr 为 slice
  if (color.startsWith('#')) {
    color = color.slice(1);
    // 3位 hex 转 6位
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    // ✅ 替换废弃 substr → 使用 slice
    r = parseInt(color.slice(0, 2), 16);
    g = parseInt(color.slice(2, 4), 16);
    b = parseInt(color.slice(4, 6), 16);
  }
  // 3. 处理 RGB / RGBA 格式
  else if (color.startsWith('rgb')) {
    const values = color.match(/\d+/g).map(Number);
    r = values[0];
    g = values[1];
    b = values[2];
  }
  // 非法颜色默认返回白色
  else {
    return 'white';
  }

  // 4. 标准亮度公式
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 5. 判断颜色
  // return brightness > 128 ? 'black' : 'white';
  return brightness > 160 ? 'black' : 'white';
}