import { ref } from 'vue';
import * as d3 from 'd3';
import { debounce, throttle } from '@/tools/utils'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'

function snapToAngleWithDistanceThreshold(P, Q, threshold = 10, distance) {
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  
  if (dx === 0 && dy === 0) return { ...Q };
  
  const currentDistance = Math.sqrt(dx*dx + dy*dy);
  const targetAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  
  let bestTarget = null;
  let bestPerpDist = Infinity;
  
  for (let target of targetAngles) {
    const rad = target * Math.PI / 180;
    // 目标方向的单位向量
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);
    
    // Q 方向的单位向量
    const qx = dx / currentDistance;
    const qy = dy / currentDistance;
    
    // 点积：判断方向是否一致（> 0 表示同向）
    const dot = qx * ux + qy * uy;
    
    // 如果点积 <= 0，说明在反方向，跳过
    if (dot <= 0) continue;
    
    // 计算垂直距离
    // 垂直距离 = |叉积| = currentDistance * |sin(角度差)|
    const perpDist = Math.abs(qx * uy - qy * ux) * currentDistance;
    
    if (perpDist < bestPerpDist) {
      bestPerpDist = perpDist;
      bestTarget = target;
    }
  }
  
  if (bestTarget === null || bestPerpDist > threshold) {
    return { ...Q, isAlign: false };
  }
  
  // 吸附
  const snappedRadians = bestTarget * Math.PI / 180;
  const finalDistance = distance !== undefined ? distance : currentDistance;
  
  return {
    x: P.x + finalDistance * Math.cos(snappedRadians),
    y: P.y + finalDistance * Math.sin(snappedRadians),
    isAlign: true
  };
}

// 简单元素拖动
export function draggable(element, fn, setting = { initialPos: null, readOnly: false }) {
  const { initialPos, readOnly } = setting
  const posXAttr = element.attr('x') ? 'x' : 'cx'
  const posYAttr = element.attr('y') ? 'y' : 'cy'
  const position = initialPos || {
    x: element.attr(posXAttr) || 0,
    y: element.attr(posYAttr) || 0,
  }
  const dragStartOffset = {
    x: 0,
    y: 0,
  }
  const dragStartPos = {
    x: 0,
    y: 0,
  }
  element.call(d3.drag()
    .clickDistance(3) // 拖动距离太小视为点击事件
    .on('start', (e) => {
      dragStartOffset.x = Math.round(position.x - e.x)
      dragStartOffset.y = Math.round(position.y - e.y)
      dragStartPos.x = Math.round(e.x)
      dragStartPos.y = Math.round(e.y)
      element.style('cursor', 'move')
    })
    .on('drag', throttle((e) => {
      // 清除之前的对线
      const drawStore = useDrawStore()
      drawStore.svg.node.selectAll('.align-line').style('opacity', 0)

      const dragPos = {
        x: Math.round(e.x),
        y: Math.round(e.y),
      }

      const magnetic = (joint) => {
        const { x, y, isAlign } = snapToAngleWithDistanceThreshold(joint, dragPos)
        if (isAlign) {
          dragPos.x = x
          dragPos.y = y
          d3.select(`#${joint.id}_align_line`)
            .attr('x1', joint.x)
            .attr('y1', joint.y)
            .attr('x2', dragPos.x)
            .attr('y2', dragPos.y)
            .style('opacity', 1)
        }
      }

      if (storeToRefs(drawStore).alignMode.value) {
        if (setting.lastJoint) {
          magnetic(setting.lastJoint)
        }
        if (setting.nextJoint) {
          magnetic(setting.nextJoint)
        }
      }
      
      // 计算新位置
      const newX = dragPos.x + dragStartOffset.x;
      const newY = dragPos.y + dragStartOffset.y;
      
      // 更新元素位置
      if (!readOnly) {
        element.attr(posXAttr, newX)
          .attr(posYAttr, newY);
      }
      
      // 更新当前位置
      position.x = newX;
      position.y = newY;
      fn({
        x: newX,
        y: newY,
        dx: dragPos.x - dragStartPos.x,
        dy: dragPos.y - dragStartPos.y,
      })
      dragStartPos.x = dragPos.x
      dragStartPos.y = dragPos.y
    }, 30))
    .on('end', (e) => {
      const drawStore = useDrawStore()
      drawStore.svg.node.selectAll('.align-line').style('opacity', 0)
      element.style('cursor', 'default')
    })
  )

  const movePoistionBy = (dx, dy) => {
    position.x += dx
    position.y += dy
  }

  const movePositionTo = (x, y) => {
    position.x = x
    position.y = y
  }

  return {
    movePoistionBy,
    movePositionTo,
  }
}

export function sliceMove (element, fn, setting = { initialPos: null, readOnly: false }) {
  const { initialPos, readOnly } = setting
  const posXAttr = element.attr('x') ? 'x' : 'cx'
  const posYAttr = element.attr('y') ? 'y' : 'cy'
  const position = initialPos || {
    x: element.attr(posXAttr) || 0,
    y: element.attr(posYAttr) || 0,
  }
  draggable(element, (pos) => {
    fn(pos)
  }, {
    initialPos: position,
    readOnly,
  })
}

/**
 * 创建SVG元素移动控制器
 * @param {string} elementSelector SVG元素选择器
 * @param {Object} initialPosition 初始位置 {x: number, y: number}
 * @param {Object} options 移动配置选项
 * @returns 移动控制器实例
 */
export function createElementMover(
  elementSelector,
  initialPosition = { x: 0, y: 0 },
  options = {}
) {
  // 默认配置
  const defaultOptions = {
    draggable: true,
    animationDuration: 300,
    clickThreshold: 2, // 判定为点击的最大拖拽距离
    ...options
  };

  // 当前位置响应式变量
  const position = ref({ ...initialPosition });
  
  // SVG元素选择器
  let element;
  
  // 初始化元素位置
  const initializePosition = () => {
    element = d3.select(elementSelector);
    if (element.empty()) {
      console.warn(`未找到选择器为${elementSelector}的SVG元素`);
      return;
    }
    
    // 设置初始位置
    moveTo(initialPosition.x, initialPosition.y, 0);
  };
  
  // 启用拖拽功能
  const enableDragging = () => {
    if (!defaultOptions.draggable || element.empty()) return;
    
    let dragOffset = { x: 0, y: 0 };
    let dragStartPosition = { x: 0, y: 0 };
    
    // 创建D3拖拽行为
    const drag = d3.drag()
      .clickDistance(defaultOptions.clickThreshold)
      .on('start', (event) => {
        // 计算鼠标与元素的偏移量
        dragOffset = {
          x: event.x - position.value.x,
          y: event.y - position.value.y
        };
        dragStartPosition = {
          x: event.x,
          y: event.y
        };

        // 触发拖拽开始回调
        if (defaultOptions.onDragStart) {
          defaultOptions.onDragStart(element, position.value);
        }
        
        // 添加拖拽中样式
        element.style('cursor', 'grabbing')
               .style('opacity', '0.8');
      })
      .on('drag', (event) => {
        // 计算新位置
        let newX = event.x - dragOffset.x;
        let newY = event.y - dragOffset.y;
        const dx = event.x - dragStartPosition.x;
        const dy = event.y - dragStartPosition.y;
        
        // 应用边界限制
        if (defaultOptions.bounds) {
          if (defaultOptions.bounds.minX !== undefined) {
            newX = Math.max(newX, defaultOptions.bounds.minX);
          }
          if (defaultOptions.bounds.maxX !== undefined) {
            newX = Math.min(newX, defaultOptions.bounds.maxX);
          }
          if (defaultOptions.bounds.minY !== undefined) {
            newY = Math.max(newY, defaultOptions.bounds.minY);
          }
          if (defaultOptions.bounds.maxY !== undefined) {
            newY = Math.min(newY, defaultOptions.bounds.maxY);
          }
        }
        
        // 更新位置
        position.value = { x: newX, y: newY };
        
        // element.attr('transform', `translate(${dx}, ${dy})`);
        if (element.attr('id').includes('station')) {
          // 不直接移动，通过moveStationByOffset移动
        } else {
          element.attr(`${element.node().nodeName === 'circle' ? 'cx' : 'x'}`, newX)
          element.attr(`${element.node().nodeName === 'circle' ? 'cy' : 'y'}`, newY)
        }
        
        // 触发拖拽中回调
        if (defaultOptions.onDragging) {
          defaultOptions.onDragging(element, position.value, {dx, dy});
        }
      })
      .on('end', () => {
        // 触发拖拽结束回调
        if (defaultOptions.onDragEnd) {
          defaultOptions.onDragEnd(element, position.value);
        }
        
        // 恢复样式
        element.style('cursor', 'grab')
               .style('opacity', '1');
      });
      
    // 应用拖拽行为到元素
    element.call(drag);
    element.style('cursor', 'grab');
  };
  
  /**
   * 移动元素到指定位置
   * @param {number} x 目标X坐标
   * @param {number} y 目标Y坐标
   * @param {number} duration 动画持续时间(ms)，0表示无动画
   */
  const moveTo = (x, y, duration) => {
    if (element?.empty()) return;
    
    // 应用边界限制
    let targetX = x;
    let targetY = y;
    
    if (defaultOptions.bounds) {
      if (defaultOptions.bounds.minX !== undefined) {
        targetX = Math.max(targetX, defaultOptions.bounds.minX);
      }
      if (defaultOptions.bounds.maxX !== undefined) {
        targetX = Math.min(targetX, defaultOptions.bounds.maxX);
      }
      if (defaultOptions.bounds.minY !== undefined) {
        targetY = Math.max(targetY, defaultOptions.bounds.minY);
      }
      if (defaultOptions.bounds.maxY !== undefined) {
        targetY = Math.min(targetY, defaultOptions.bounds.maxY);
      }
    }
    
    const animDuration = duration ?? defaultOptions.animationDuration;
    
    // 是否使用动画
    if (animDuration > 0) {
      // 使用D3过渡动画
      element.transition()
        .duration(animDuration)
        .attr(`${element.node().nodeName === 'circle' ? 'cx' : 'x'}`, targetX)
        .attr(`${element.node().nodeName === 'circle' ? 'cy' : 'y'}`, targetY)
        .on('end', () => {
          position.value = { x: targetX, y: targetY };
        });
    } else {
      // 直接移动
      element.attr(`${element.node().nodeName === 'circle' ? 'cx' : 'x'}`, targetX)
        .attr(`${element.node().nodeName === 'circle' ? 'cy' : 'y'}`, targetY)
      position.value = { x: targetX, y: targetY };
    }
  };
  
  /**
   * 相对当前位置移动元素
   * @param {number} dx X方向偏移量
   * @param {number} dy Y方向偏移量
   * @param {number} duration 动画持续时间(ms)
   */
  const moveBy = (dx, dy, duration) => {
    moveTo(position.value.x + dx, position.value.y + dy, duration);
  };
  
  /**
   * 获取当前位置
   * @returns 当前位置 {x: number, y: number}
   */
  const getCurrentPosition = () => {
    return { ...position.value };
  };
  
  /**
   * 销毁移动控制器
   */
  const destroy = () => {
    if (element) {
      // 移除拖拽事件
      d3.select(elementSelector).on('.drag', null);
    }
  };
  
  // 初始化
  initializePosition();
  enableDragging();
  
  return {
    position,
    moveTo,
    moveBy,
    getCurrentPosition,
    destroy
  };
}

/**
 * 在Vue组件中使用的元素移动钩子
 * @param {string} elementSelector SVG元素选择器
 * @param {Object} initialPosition 初始位置 {x: number, y: number}
 * @param {Object} options 移动配置选项
 * @returns 移动控制器实例
 */
export function useElementMover(
  elementSelector,
  initialPosition = { x: 0, y: 0 },
  options = {}
) {
  const mover = createElementMover(elementSelector, initialPosition, options);
  
  // onUnmounted(() => {
  //   mover.destroy();
  // });
  
  return mover;
}
    