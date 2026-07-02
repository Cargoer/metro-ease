import * as fabric from 'fabric'

// 模型
import Line from './canvasLine.js'
import Station from './canvasStation.js'
import { Text } from './element.js'

import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
let drawStore = null

function initStore() {
  drawStore = storeToRefs(useDrawStore())
}

export default class FabricCanvas {
  constructor(containerId, options = {}) {
    const selectStyle = {
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
    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      ...selectStyle
    };

    // 初始化画布
    const containerDom = document.getElementById(containerId)
    this.canvas = new fabric.Canvas(containerDom, {
      width: options.width || window.innerWidth,
      height: options.height || window.innerHeight,
      backgroundColor: options.backgroundColor || '#ffffff',
      selection: true,
      selectionColor: 'rgba(100, 100, 255, 0.3)',
      selectionBorderColor: '#4a90d9',
      selectionLineWidth: 1,
      renderOnAddRemove: true,
      ...options
    });

    // 状态管理
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = options.maxHistory || 50;
    this.isDrawing = false;
    this.currentTool = 'select';
    this.startPoint = null;
    this.tempObject = null;
    // 缩放配置
    this.minZoom = options.minZoom || 0.1;
    this.maxZoom = options.maxZoom || 20;
    this.zoomSpeed = options.zoomSpeed || 0.001;

    // 配置
    this.fillColor = options.fillColor || '#4a90d9';
    this.strokeColor = options.strokeColor || '#333333';
    this.strokeWidth = options.strokeWidth || 2;
    this.fontSize = options.fontSize || 24;

    // 绑定事件
    this._bindEvents();

    // 初始化历史
    this._saveHistory();

    // 响应式
    if (options.responsive) {
      this._initResponsive();
    }

    // 存放分类对象
    this.stationMap = {}
    this.lineMap = {}

    if (!drawStore) {
      initStore()
    }

    // testPath(this.canvas)

    console.log('FabricCanvas 初始化完成');
  }

  // ============ 核心绘制方法 ============

  // 添加矩形
  addRect(x, y, width, height, options = {}) {
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: width,
      height: height,
      fill: options.fill || this.fillColor,
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    });
    this.canvas.add(rect);
    this.canvas.setActiveObject(rect);
    this._saveHistory();
    return rect;
  }

  // 添加圆形
  addCircle(x, y, radius, options = {}) {
    const circle = new fabric.Circle({
      left: x - radius,
      top: y - radius,
      radius: radius,
      fill: options.fill || this.fillColor,
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    });
    this.canvas.add(circle);
    this.canvas.setActiveObject(circle);
    this._saveHistory();
    return circle;
  }

  // 添加椭圆
  addEllipse(x, y, rx, ry, options = {}) {
    const ellipse = new fabric.Ellipse({
      left: x - rx,
      top: y - ry,
      rx: rx,
      ry: ry,
      fill: options.fill || this.fillColor,
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    });
    this.canvas.add(ellipse);
    this.canvas.setActiveObject(ellipse);
    this._saveHistory();
    return ellipse;
  }

  // 添加三角形
  addTriangle(x, y, width, height, options = {}) {
    const triangle = new fabric.Triangle({
      left: x,
      top: y,
      width: width,
      height: height,
      fill: options.fill || this.fillColor,
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    });
    this.canvas.add(triangle);
    this.canvas.setActiveObject(triangle);
    this._saveHistory();
    return triangle;
  }

  // 添加线条（自由绘制）
  addLine(points, options = {}) {
    const line = new fabric.Line(points, {
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    });
    this.canvas.add(line);
    this.canvas.setActiveObject(line);
    this._saveHistory();
    return line;
  }

  // 添加路径（自定义形状）
  addPath(path, options = {}) {
    const pathObj = new fabric.Path(path, {
      fill: options.fill || this.fillColor,
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    });
    this.canvas.add(pathObj);
    this.canvas.setActiveObject(pathObj);
    this._saveHistory();
    return pathObj;
  }

  // 添加文字
  addText(text, x, y, options = {}) {
    const textObj = new fabric.IText(text, {
      left: x,
      top: y,
      fontFamily: options.fontFamily || 'Arial',
      fontSize: options.fontSize || this.fontSize,
      fill: options.fill || this.strokeColor,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      editable: true,
      ...options
    });
    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    this._saveHistory();
    return textObj;
  }

  // 添加图片
  addImage(url, x, y, options = {}) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(url, (img) => {
        if (!img) {
          reject(new Error('图片加载失败'));
          return;
        }
        img.set({
          left: x || 0,
          top: y || 0,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          ...options
        });
        // 按比例缩放
        if (options.maxWidth) {
          const scale = options.maxWidth / img.width;
          img.scale(scale);
        }
        if (options.maxHeight) {
          const scale = options.maxHeight / img.height;
          img.scale(scale);
        }
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this._saveHistory();
        resolve(img);
      }, { crossOrigin: 'anonymous' });
    });
  }

  addStation(point) {
    const station = new Station(this, {
      points: [point],
      name: '车站名',
      style: drawStore.stationSetting.value
    });

    // const pathD = station.pathD
    // this.addPath(pathD)
    return station;
  }

  addJoint(point, options = {}) {
    const joint = new fabric.Circle({
      left: point.x,
      top: point.y,
      radius: 5,
      fill: options.fill || this.fillColor,
      stroke: options.stroke || this.strokeColor,
      strokeWidth: options.strokeWidth || this.strokeWidth,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      ...options
    })
    this._saveHistory();
    return joint;
  }

  // ============ 交互绘制（鼠标绘制） ============

  // 启用绘制模式
  enableDrawing(tool, options = {}) {
    this.currentTool = tool;
    this.isDrawing = true;
    this.canvas.selection = false;
    this.canvas.skipTargetFind = true;
    this.canvas.defaultCursor = 'crosshair';

    // 保存当前鼠标样式
    this._drawingOptions = options;

    // 移除之前的事件监听
    this.canvas.off('mouse:down', this._onMouseDown);
    this.canvas.off('mouse:move', this._onMouseMove);
    this.canvas.off('mouse:up', this._onMouseUp);

    // 绑定绘制事件
    this.canvas.on('mouse:down', this._onMouseDown.bind(this));
    this.canvas.on('mouse:move', this._onMouseMove.bind(this));
    this.canvas.on('mouse:up', this._onMouseUp.bind(this));
  }

  // 禁用绘制模式
  disableDrawing() {
    this.isDrawing = false;
    this.currentTool = 'select'
    this.canvas.selection = true;
    this.canvas.skipTargetFind = false;
    this.canvas.defaultCursor = 'default';

    this.canvas.off('mouse:down', this._onMouseDown);
    this.canvas.off('mouse:move', this._onMouseMove);
    this.canvas.off('mouse:up', this._onMouseUp);

    if (this.tempObject) {
      this.canvas.remove(this.tempObject);
      this.tempObject = null;
    }
  }

  // 鼠标事件处理
  _onMouseDown(opt) {
    console.log('鼠标按下', this.currentTool)
    const pointer = this.canvas.getScenePoint(opt.e);
    this.startPoint = { x: pointer.x, y: pointer.y };

    // 创建临时对象（根据当前工具）
    switch (this.currentTool) {
      case 'station':
        this.addStation(pointer);
        break;

      case 'rect':
        this.tempObject = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: this._drawingOptions.fill || this.fillColor,
          stroke: this._drawingOptions.stroke || this.strokeColor,
          strokeWidth: this._drawingOptions.strokeWidth || this.strokeWidth,
          selectable: false,
          hasControls: false,
          hasBorders: false,
          opacity: this._drawingOptions.opacity || 0.8
        });
        break;

      case 'circle':
        this.tempObject = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: this._drawingOptions.fill || this.fillColor,
          stroke: this._drawingOptions.stroke || this.strokeColor,
          strokeWidth: this._drawingOptions.strokeWidth || this.strokeWidth,
          selectable: false,
          hasControls: false,
          hasBorders: false,
          opacity: this._drawingOptions.opacity || 0.8
        });
        break;

      case 'ellipse':
        this.tempObject = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: this._drawingOptions.fill || this.fillColor,
          stroke: this._drawingOptions.stroke || this.strokeColor,
          strokeWidth: this._drawingOptions.strokeWidth || this.strokeWidth,
          selectable: false,
          hasControls: false,
          hasBorders: false,
          opacity: this._drawingOptions.opacity || 0.8
        });
        break;

      case 'line':
        this.tempObject = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: this._drawingOptions.stroke || this.strokeColor,
          strokeWidth: this._drawingOptions.strokeWidth || this.strokeWidth,
          selectable: false,
          hasControls: false,
          hasBorders: false
        });
        break;

      case 'triangle':
        this.tempObject = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: this._drawingOptions.fill || this.fillColor,
          stroke: this._drawingOptions.stroke || this.strokeColor,
          strokeWidth: this._drawingOptions.strokeWidth || this.strokeWidth,
          selectable: false,
          hasControls: false,
          hasBorders: false,
          opacity: this._drawingOptions.opacity || 0.8
        });
        break;

      default:
        break;
    }

    if (this.tempObject) {
      this.canvas.add(this.tempObject);
    }
  }

  _onMouseMove(opt) {
    // console.log('鼠标移动', this.currentTool)
    if (!this.tempObject || !this.startPoint) return;

    const pointer = this.canvas.getScenePoint(opt.e);
    const dx = pointer.x - this.startPoint.x;
    const dy = pointer.y - this.startPoint.y;

    // 更新临时对象
    switch (this.currentTool) {
      case 'rect':
        this.tempObject.set({
          left: dx > 0 ? this.startPoint.x : pointer.x,
          top: dy > 0 ? this.startPoint.y : pointer.y,
          width: Math.abs(dx),
          height: Math.abs(dy)
        });
        break;

      case 'circle':
        const radius = Math.sqrt(dx * dx + dy * dy);
        this.tempObject.set({
          left: this.startPoint.x - radius,
          top: this.startPoint.y - radius,
          radius: radius
        });
        break;

      case 'ellipse':
        this.tempObject.set({
          left: this.startPoint.x,
          top: this.startPoint.y,
          rx: Math.abs(dx),
          ry: Math.abs(dy)
        });
        break;

      case 'line':
        this.tempObject.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;

      case 'triangle':
        this.tempObject.set({
          left: dx > 0 ? this.startPoint.x : pointer.x,
          top: dy > 0 ? this.startPoint.y : pointer.y,
          width: Math.abs(dx),
          height: Math.abs(dy)
        });
        break;
    }

    this.canvas.renderAll();
  }

  _onMouseUp(opt) {
    console.log('鼠标松开', this.currentTool)
    if (this.tempObject) {
      // 如果尺寸太小，删除临时对象
      const obj = this.tempObject;
      const isTooSmall = (obj.width !== undefined && obj.width < 5) ||
        (obj.height !== undefined && obj.height < 5) ||
        (obj.radius !== undefined && obj.radius < 5);

      if (isTooSmall) {
        this.canvas.remove(obj);
      } else {
        // 转为可交互对象
        obj.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          opacity: 1
        });
        this.canvas.setActiveObject(obj);
        this._saveHistory();
      }

      this.tempObject = null;
      this.startPoint = null;
      this.canvas.renderAll();
    }
  }

  // ============ 选择与操作 ============

  // 选择对象
  selectObject(object) {
    if (typeof object === 'string') {
      // 通过 ID 查找
      const items = this.canvas.getObjects();
      const found = items.find(item => item.id === object);
      if (found) {
        this.canvas.setActiveObject(found);
        return found;
      }
      return null;
    }
    this.canvas.setActiveObject(object);
    return object;
  }

  // 取消选择
  deselectAll() {
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  // 删除选中对象
  deleteSelected() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this._saveHistory();
      return true;
    }
    return false;
  }

  // 删除所有对象
  deleteAll() {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.renderAll();
    this._saveHistory();
  }

  // 复制选中对象
  duplicateSelected() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned) => {
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20
        });
        this.canvas.add(cloned);
        this.canvas.setActiveObject(cloned);
        this._saveHistory();
      });
      return true;
    }
    return false;
  }

  // 分组
  groupObjects() {
    const objects = this.canvas.getActiveObjects();
    if (objects.length > 1) {
      const group = new fabric.Group(objects, {
        selectable: true,
        hasControls: true
      });
      this.canvas.remove(...objects);
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
      this._saveHistory();
      return group;
    }
    return null;
  }

  // 取消分组
  ungroupObjects() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.type === 'group') {
      const items = activeObject.getObjects();
      activeObject.destroy();
      this.canvas.remove(activeObject);
      items.forEach(item => {
        this.canvas.add(item);
      });
      this._saveHistory();
      return items;
    }
    return null;
  }

  // ============ 撤销/重做 ============

  // 保存历史
  _saveHistory() {
    return false
    const json = this.canvas.toJSON(['id', 'name']);
    // 删除后面的历史（如果有）
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(json);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  // 撤销
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this._loadHistory(this.history[this.historyIndex]);
      return true;
    }
    return false;
  }

  // 重做
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this._loadHistory(this.history[this.historyIndex]);
      return true;
    }
    return false;
  }

  _loadHistory(json) {
    this.canvas.clear();
    this.canvas.loadFromJSON(json, () => {
      this.canvas.renderAll();
    });
  }

  // ============ 画布操作 ============

  // 缩放
  zoom(zoomLevel, point = null) {
    if (point) {
      this.canvas.zoomToPoint(point, zoomLevel);
    } else {
      this.canvas.setZoom(zoomLevel);
    }
    this.canvas.renderAll();
    return this.canvas.getZoom();
  }

  // 放大
  zoomIn(factor = 1.1) {
    const currentZoom = this.canvas.getZoom();
    return this.zoom(Math.min(currentZoom * factor, 20));
  }

  // 缩小
  zoomOut(factor = 0.9) {
    const currentZoom = this.canvas.getZoom();
    return this.zoom(Math.max(currentZoom * factor, 0.01));
  }

  // 适应画布
  fitToCanvas() {
    const objects = this.canvas.getObjects();
    if (objects.length === 0) return;

    const group = new fabric.Group(objects);
    const boundingRect = group.getBoundingRect();
    group.destroy();

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const scaleX = (canvasWidth * 0.9) / boundingRect.width;
    const scaleY = (canvasHeight * 0.9) / boundingRect.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (boundingRect.left + boundingRect.width / 2);
    const centerY = (boundingRect.top + boundingRect.height / 2);

    this.canvas.zoomToPoint(
      { x: canvasWidth / 2, y: canvasHeight / 2 },
      scale
    );
    this.canvas.relativePan(
      new fabric.Point(
        canvasWidth / 2 - centerX * scale,
        canvasHeight / 2 - centerY * scale
      )
    );
    this.canvas.renderAll();
  }

  // 平移
  pan(deltaX, deltaY) {
    this.canvas.relativePan(new fabric.Point(deltaX, deltaY));
    this.canvas.renderAll();
  }

  // 重置视图
  resetView() {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.canvas.renderAll();
  }

  // ============ 导出与导入 ============

  // 导出为 JSON
  toJSON() {
    return this.canvas.toJSON(['id', 'name']);
  }

  // 从 JSON 加载
  fromJSON(json) {
    return new Promise((resolve) => {
      this.canvas.clear();
      this.canvas.loadFromJSON(json, () => {
        this.canvas.renderAll();
        this._saveHistory();
        resolve();
      });
    });
  }

  // 导出为图片
  toImage(format = 'png', quality = 1) {
    return this.canvas.toDataURL({
      format: format,
      quality: quality,
      multiplier: 1
    });
  }

  // 导出为 SVG
  toSVG() {
    return this.canvas.toSVG();
  }

  // 下载图片
  downloadImage(filename = 'canvas.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.toImage();
    link.click();
  }

  // ============ 事件系统 ============

  _bindEvents() {
    // 缩放和平移
    this.canvas.on('mouse:wheel', (opt) => {
      const e = opt.e;
      const delta = e.deltaY;
      const pointer = this.canvas.getScenePoint(e);

      // 计算新的缩放值
      let zoom = this.canvas.getZoom();
      const zoomFactor = 1 - delta * this.zoomSpeed;
      zoom = zoom * zoomFactor;

      // 限制缩放范围
      zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);

      // 以鼠标位置为中心缩放
      this.zoom(zoom, pointer);
    });
    this.canvas.on('pan', (e) => {
      this._emit('pan', e);
    });

    // 对象选择事件
    this.canvas.on('selection:created', (e) => {
      this._handleSelection(e.selected || []);
    });
    this.canvas.on('selection:updated', (e) => {
      this._emit('select', e.selected);
    });
    this.canvas.on('selection:cleared', () => {
      this._emit('deselect');
    });

    // 对象修改事件
    this.canvas.on('object:modified', () => {
      this._saveHistory();
      this._emit('modified');
    });

    // 对象添加事件
    this.canvas.on('object:added', () => {
      this._emit('added');
    });

    // 对象删除事件
    this.canvas.on('object:removed', () => {
      this._saveHistory();
      this._emit('removed');
    });
  }

  _emit(event, data) {
    if (this.callbacks && this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }

  // 注册事件回调
  on(event, callback) {
    if (!this.callbacks) this.callbacks = {};
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
    return this;
  }

  // 移除事件回调
  off(event, callback) {
    if (!this.callbacks || !this.callbacks[event]) return;
    if (callback) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) this.callbacks[event].splice(index, 1);
    } else {
      this.callbacks[event] = [];
    }
    return this;
  }

  _findObjectById(id) {
    return this.canvas.getObjects().find(obj => obj.id === id);
  }

  safeSelectMulti(objects) {
    const valid = objects.filter(o => o && o.selectable && o.evented);
    // 修复 onSelect is not a function
    valid.forEach(obj => {
      if (typeof obj.onSelect !== 'function') {
        obj.onSelect = undefined;
      }
    });
    // 7.x 官方标准多选API
    this.canvas.setActiveObjects(valid);
    this.canvas.requestRenderAll();
  }

  _handleSelection(selectedObjects) {
    if (!selectedObjects || selectedObjects.length === 0) return;

    selectedObjects.forEach(obj => {
      obj.setControlsVisibility({
        mt: false,
        mr: false,
        mb: false,
        ml: false,
        mtr: false
      });
    });

    // 收集所有需要选中的元素（原始选中 + 关联元素）
    const allToSelect = new Set(selectedObjects);

    selectedObjects.forEach(obj => {
      // 方式1：通过自定义属性关联
      if (obj.linkedId) {
        const linked = this._findObjectById(obj.linkedId);
        if (linked) allToSelect.add(linked);
      }
    });

    // 如果选中的元素和关联元素不同，更新选区
    const currentSelected = new Set(this.canvas.getActiveObjects());
    const needUpdate = [...allToSelect].some(obj => !currentSelected.has(obj));

    if (needUpdate && allToSelect.size > 0) {
      const selection = new fabric.ActiveSelection([...allToSelect], {
        canvas: this.canvas
      });
      selection.setControlsVisibility({
        mt: false, mr: false, mb: false, ml: false, mtr: false
      });
      this.canvas.setActiveObject(selection);
      // selection.setupCursor();
      this.canvas._target = selection; // 手动填充画布命中目标缓存
      this.canvas.requestRenderAll();
      // this.safeSelectMulti([...allToSelect]);
    }
  }

  // ============ 响应式 ============

  _initResponsive() {
    const resizeObserver = new ResizeObserver(() => {
      this._handleResize();
    });
    resizeObserver.observe(this.canvas.wrapperEl);
  }

  _handleResize() {
    const container = this.canvas.wrapperEl;
    const rect = container.getBoundingClientRect();
    // 可以在这里实现自适应逻辑
  }

  // ============ 工具方法 ============

  // 获取所有对象
  getObjects() {
    return this.canvas.getObjects();
  }

  // 获取选中对象
  getActiveObject() {
    return this.canvas.getActiveObject();
  }

  // 获取选中对象列表
  getActiveObjects() {
    return this.canvas.getActiveObjects();
  }

  // 获取画布尺寸
  getSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  // 设置画布尺寸
  setSize(width, height) {
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.canvas.renderAll();
  }

  // 设置背景色
  setBackgroundColor(color) {
    this.canvas.backgroundColor = color;
    this.canvas.renderAll();
    this._saveHistory();
  }

  // 清空画布
  clear() {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.renderAll();
    this._saveHistory();
  }

  // 销毁
  destroy() {
    this.canvas.dispose();
    this.history = [];
    this.historyIndex = -1;
  }

  // fastKey 快捷键支持
  _bindFastKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        this.undo()
      } else if (e.ctrlKey && e.key === 'y') {
        this.redo()
      } else if (e.key === 'Delete') {
        this.deleteSelected()
      } else if (e.key === 'g') {
        this.groupObjects()
      }
    });
  }
}

