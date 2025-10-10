import moment from "moment"
import * as d3 from "d3"
// createBorderFilter
import { 
  createBorderFilter, 
  getRectByPoints, 
  getRoundCornerD,
  get135ConnectionD,
  get90ConnectionD,
} from '@/tools/svgRelated'
import { messageBoxInput } from '@/tools/interact'
import { reactive, readonly, ref } from "vue"
import { draggable } from '@/tools/svgMover'
import { generateUniqueId } from '@/tools/utils'
// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from "pinia"
let drawStore = null
let pressedKeys = null
let zoomInfo = null
let selectedElement = null

function initStore () {
  drawStore = useDrawStore()
  pressedKeys = storeToRefs(drawStore).pressedKeys
  zoomInfo = storeToRefs(drawStore).zoomInfo
  selectedElement = storeToRefs(drawStore).selectedElement
}

export class Svg {
  constructor (containerId, width, height) {
    if (!drawStore) {
      initStore()
    }
    this.node = null
    this.containerId = containerId
    this.basicCellSize = 10
    this.children = {}
    this.root = this
    this.bgUrl = ''
    this.canvas = null
    // this.initMainG()
    this.refreshCanvas(width, height)
  }

  findById (id) {
    if (this.children[id]) return this.children[id]
    for (const [_, child] of Object.entries(this.children)) {
      const found = child.findById(id)
      if (found) return found
    }
    return null
  }

  // 初始化主要图层
  initMainG () {
    const globalG = new Group(this, { id: 'global_g' }) // 全局图层
    const backgroundG = new Group(globalG, { id: 'background' }) // 背景图层
    // backgroundG.node.append('image')
    //   .attr('id', 'background-image')
    //   .attr('x', 0)
    //   .attr('y', 0)
    new Group(globalG, { id: 'grid' }) // 网格图层（参考，不导出）
    const drawPartG = new Group(globalG, { id: 'draw_part' }) // 绘制图层
    new Group(drawPartG, { id: 'global_line_g' }) // 绘制线路图层
    new Group(drawPartG, { id: 'global_station_g' }) // 绘制站点图层
  }

  // 刷新画布（一般是由于长宽发生变化才刷新）
  refreshCanvas (width, height) {
    const canvasWidth = width || window.innerWidth
    const canvasHeight = height || window.innerHeight

    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      // this.canvas.style.zIndex = 0
      // this.canvas.style.position = 'absolute'
      // this.canvas.style.pointerEvents = 'none'
      const canvasDiv = document.createElement('div')
      canvasDiv.style.position = 'absolute'
      canvasDiv.style.zIndex = 0
      this.canvas.style.pointerEvents = 'none'
      canvasDiv.appendChild(this.canvas)
      document.getElementById('canvas-container').appendChild(canvasDiv)
    }
    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight

    if (!this.node) 
      this.node = d3.select(`#${this.containerId}`).append('svg')
      .style('z-index', 1)
      // .style('position', 'absolute')
      .style('pointer-events', 'all')
    this.node.attr('width', canvasWidth).attr('height', canvasHeight)

    // 创建滤镜（path选中时使用）
    if (!this.node.select('defs').size()) {
      const defs = this.node.append('defs')
      createBorderFilter(defs, { // 白边滤镜
        id: 'pathSelectedFilter',
        color: '#ffffff',
        width: 5,
        expand: 20
      })
    }

    if (!this.children['global_g']) {
      this.initMainG()
    }

    // 绘制网格线
    const gridG = this.children['global_g'].children['grid']
    gridG.node.selectAll('*').remove()
    for (let i = 0; i < canvasWidth / 0.5; i += this.basicCellSize) {
      gridG.node.append('line')
        .attr('x1', i)
        .attr('y1', 0)
        .attr('x2', i)
        .attr('y2', canvasHeight / 0.5)
        .attr('stroke', i % 100 === 0 ? '#ccc' : '#eee')
    }

    for (let i = 0; i < canvasHeight / 0.5; i += this.basicCellSize) {   
      gridG.node.append('line')  
        .attr('x1', 0)
        .attr('y1', i)
        .attr('x2', canvasWidth / 0.5)
        .attr('y2', i)
        .attr('stroke', i % 100 === 0 ? '#ccc' : '#eee')
    }

    this.setZoom()
  }

  // 设置平移缩放
  setZoom (minScale = 0.3, maxScale = 3, filter) {
    console.log('[setZoom] ', pressedKeys.value)
    const zoom = d3.zoom()
      .scaleExtent([minScale, maxScale])
      // .translateExtent([[0, 0], [canvasWidth / minScale, canvasHeight / minScale]]) // 防止超出边界
      .on('zoom', (event) => {
        zoomInfo.value = event.transform
        this.children['global_g'].node.attr('transform', event.transform)

        // const scale = event.transform.k
        // const img = this.children['global_g'].children['background'].children['background-image'].node
        // if (scale > 2 && img.attr("data-resolution") !== "high") {
        //   img.attr("data-resolution", "high");
        // } else if (scale <= 2 && img.attr("data-resolution") !== "low") {
        //   img.attr("data-resolution", "low");
        // }

        this.drawCanvasBg()
      })
      .filter((e) => {
        // 如果是双击事件，不应用zoom行为
        if (e.type === 'dblclick') return false
        // 若pressedKey为空格键，才允许平移画布
        if (e.type === 'mousedown' && pressedKeys.value[' '] !== true) return false
        return true
      })

    // 应用缩放和平移功能
    this.node.call(zoom)
  }

  transformCoords (x, y) {
    const { k, x: tx, y: ty } = zoomInfo.value || {}
    return {
      x: Math.round((x - tx) / k),
      y: Math.round((y - ty) / k)
    }
  }

  addEventListeners (funcObj) {
    this.node.on('click', (e) => {
      const [x, y] = d3.pointer(e, this.node.node());
      const pos = this.transformCoords(x, y)
      funcObj.click(e, pos)
    })
    this.node.on('mousemove', (e) => {
      const [x, y] = d3.pointer(e, this.node.node());
      const pos = this.transformCoords(x, y)
      funcObj.mousemove(e, pos)
    })
    this.node.on('mousedown', funcObj.mousedown)
    this.node.on('mouseup', funcObj.mouseup)
  }

  loadBackground (url) {
    this.bgUrl = url
    // const backgroundImage = d3.select('#background-image')
    // backgroundImage
    //   .attr('xlink:href', url)
    //   .on('load', () => {
    //     const { width, height } = backgroundImage.node().getBBox()
    //     this.refreshCanvas(width, height)
    //   })

    // 加载原始图像并准备瓦片
    return new Promise((resolve) => {
      this.bgImage = new Image();
      // 替换为你的底图URL
      this.bgImage.src = url; 
      this.bgImage.onload = () => {
        const { width, height } = this.bgImage
        this.refreshCanvas(width, height)
        this.drawCanvasBg()
        resolve()
      }
    });
  }

  async drawCanvasBg () {
    if (!this.bgImage) await this.loadBackground();
  
    const ctx = this.canvas.getContext('2d');
    const { width, height } = this.canvas;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 保存当前状态
    ctx.save();
    
    // 应用变换 - 注意Canvas变换顺序与SVG相反
    ctx.translate(zoomInfo.value.x, zoomInfo.value.y);
    ctx.scale(zoomInfo.value.k, zoomInfo.value.k);
    
    // 绘制底图
    ctx.drawImage(
      this.bgImage, 
      0, 0, 
      this.bgImage.width, 
      this.bgImage.height
    );
    
    // 恢复状态
    ctx.restore();
  }
}

export class Group {
  constructor (parent, settings) {
    console.log(parent)
    const newGenerateId = settings.id || generateUniqueId('g')
    this.parent = parent
    this.node = parent.node.append("g").attr("id", newGenerateId)
    this.children = {}
    this.root = parent.root || null
    parent.children[newGenerateId] = this
  }

  compress () {
    return {
      id: this.node.attr('id'),
    }
  }

  findById (id) {
    let result = null
    
    // if (this.children[id]) {
    //   console.log('in my children')
    //   result = this.children[id]
    // }
    // else {
      for (const [_, child] of Object.entries(this.children)) {
        const found = child.findById(id)
        if (found) {
          result = found
          break
        }
      }
    // }
    console.log('= Group findById id:', id, this.node.attr('id'), this.children, result)
    console.log('\n')
    return result
  }
}

export class Text {
  constructor (parent, settings) {
    this.id = settings.id || generateUniqueId('text')
    this.parent = parent
    parent.children[this.id] = this
    this.content = settings.content || '双击编辑文本'
    this.pos = settings.pos || { x: 0, y: 0 }

    // this.settings = {
    //   pos: settings.pos || { x: 0, y: 0 },
    //   // textColor: settings.textColor || '#000000',
    //   // fontSize: settings.fontSize || 20,
    //   // withBg: settings.withBg || false,
    //   // bgColor: settings.bgColor || 'none',
    //   // withBorder: settings.withBorder || false,
    //   // borderColor: settings.borderColor || 'none',
    //   // padding: settings.padding || '10 8',
    //   // borderRadius: settings.borderRadius || 10,
    //   content: settings.content || '双击编辑文本',
    // }

    this.style = {
      textColor: settings.style.textColor,
      fontSize: settings.style.fontSize,
      withBg: settings.style.withBg,
      withBorder: settings.style.withBorder,
      borderColor: settings.style.borderColor,
      padding: settings.style.padding,
      borderRadius: settings.style.borderRadius,
    }

    // this.text = settings.text || '双击编辑文本'
    // this.color = settings.color || '#000000'
    // this.bgColor = settings.bgColor || 'none'
    // this.borderRadius = settings.borderRadius || 10
    
    this.g = parent.node.append("g").attr("id", `${this.id}_g`)
    this.bgNode = this.g.append("rect").attr("id", `${this.id}_bg`)
    this.node = this.g.append("text").attr("id", this.id)
    this.node
      .on('dblclick', async (e) => {
        e.stopPropagation()
        const content = await messageBoxInput('输入文本', '', this.content)
        this.modifyContent(content)
      })
      .on('click', (e) => {
        e.stopPropagation()
        this.setSelect(true)
      })
    this.display()
  }
  compress () {
    return {
      id: this.id,
      pos: this.pos,
      content: this.content,
      style: this.style,
    }
  }

  modifyContent (content) {
    this.content = content
    this.display()
  }

  refreshSelect () {
    this.g.select(`#${this.id}_select`).remove()
    this.g.append('rect')
      .attr('id', `${this.id}_select`)
      .attr('x', this.g.node().getBBox().x - 2)
      .attr('y', this.g.node().getBBox().y - 2)
      .attr('width', this.g.node().getBBox().width + 4)
      .attr('height', this.g.node().getBBox().height + 4)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
  }

  setSelect (isSelect) {
    if (isSelect) {
      if (selectedElement.value) {
        selectedElement.value.setSelect(false)
      }
      selectedElement.value = this
      this.refreshSelect()
    } else {
      this.g.select(`#${this.id}_select`).remove()
    }
  }

  delete () {
    if (selectedElement.value === this) {
      this.setSelect(false)
    }
    this.g.remove()    
    delete this.parent.children[this.id]
  }

  display () {
    this.node.text(this.content)
    this.node
      .attr('font-size', this.style.fontSize)
      .attr('fill', this.style.textColor)
      .attr('x', this.pos.x)
      .attr('y', this.pos.y)
      .style('user-select', 'none')

    draggable(this.node, (pos) => {
      this.pos = pos
      this.display()
    }, {
      readonly: true
    })
    
    const { x, y, width, height } = this.node.node().getBBox()
    this.bgNode
      .attr('rx', this.style.borderRadius)
      .attr('ry', this.style.borderRadius)
      .attr('fill', this.style.withBg ? this.style.bgColor : 'none')
      .attr('stroke', this.style.withBorder ? this.style.borderColor : 'none')
      .attr('stroke-width', this.style.withBorder ? 2 : 0)
      .attr('width', width + Number(this.style.padding.split(' ')[1]) * 2)
      .attr('height', height + Number(this.style.padding.split(' ')[0]) * 2)
      .attr('x', x - Number(this.style.padding.split(' ')[1]))
      .attr('y', y - Number(this.style.padding.split(' ')[0]))

    if (selectedElement.value === this) {
      this.refreshSelect()
    }
  }
}
