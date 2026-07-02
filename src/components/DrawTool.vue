<template>
  <div class="draw-tool-container">
    <Menu :menuItems="menuItems" />

    <el-upload
      ref="projectUpload"
      accept=".json"
      :show-file-list="false"
      :on-error="(err) => ElMessage.error(`导入JSON失败: ${err.message}`)"
      :on-change="handleJsonChange"
      action="#"
      :auto-upload="false"
    >
      <template #trigger>
        <button ref="projectUploadBtn" type="primary" class="icon-select" title="导入项目" style="display: none;">
          导入项目
        </button>
      </template>
    </el-upload>
    
    <div class="group" v-if="!drawRect">
      <div
        v-for="item in toolEnum" :key="item.value" class="icon-select"
        :title="item.label"
        :class="{ 'active': item.value === tool }"
        @click="updateTool(item.value)"
      >
        <svg v-if="item.svg" viewBox="0 0 24 24" :width="24" :height="24" v-html="item.svg"></svg>
        <span v-else>{{ item.label }}</span>
      </div>
    </div>

    <div class="group" v-if="tool === 'select' && !drawRect">
      <Checkbox v-model="alignMode" label="对齐模式" />
    </div>

    <div class="group" v-if="(tool.includes('line') || tool === 'edge') && !drawRect">
      <LineSetting :setting="lineSetting" />
    </div>

    <div class="group" v-else-if="tool === 'station' && !drawRect">
      <StationSetting />
    </div>

    <!-- <div class="group" v-else-if="tool === 'text'">
      <TextSetting />
    </div> -->

    <!-- 导入底图 -->
    <Dialog
      v-model:visible="importBgDialogVisible"
      title="导入底图"
      :with-button="false"
      width="500"
    >
      <BgSelect @submit="importBgDialogVisible = false" />
    </Dialog>

    <!-- 保存为图片 -->
    <Dialog
      v-model:visible="saveDialogVisible"
      title="保存为图片"
      :with-button="false"
      width="500"
    >
      <SaveAsImage @submit="saveDialogVisible = false" />
    </Dialog>

    <!-- 画布管理 -->
    <Dialog
      v-model:visible="canvasManageVisible"
      title="画布管理"
      width="500"
      :withButton="false"
    >
      <div class="fc" style="align-items: center; gap: 15px;">
        <div v-if="svg.canvasList.length === 0">
          <el-empty description="暂无画布" />
        </div>
        <div v-for="canvas in svg.canvasList" :key="canvas.id" class="fr" style="align-items: center; gap: 15px;">
          <Input v-model="canvas.name" placeholder="请输入画布名称" width="180px" />
          <Checkbox v-model="canvas.visible" label="可见" @change="(val) => canvas.setVisible(val)" />
          <Checkbox v-model="canvas.locked" label="锁定" @change="(val) => canvas.setLocked(val)" />
          <el-button type="danger" size="small" @click="canvas.delete()">删除</el-button>
        </div>
      </div>
    </Dialog>

    <!-- 车站样式管理 -->
    <Dialog
      v-model:visible="stationManageVisible"
      title="站点样式管理"
      width="500"
      :withButton="false"
    >
      <GeneralStationStyle @submit="stationManageVisible = false" />
    </Dialog>

    <!-- 统计 -->
    <Dialog
      v-model:visible="statVisible"
      :with-button="false"
      title="统计"
      width="500"
    >
      <Statistics />
    </Dialog>

    <!-- 名称猜站 -->
    <Dialog
      v-model:visible="guessStationVisible"
      :with-button="false"
      title="名称猜站"
      width="500"
    >
      <GuessStation />
    </Dialog>

    <!-- 快捷键 -->
    <Dialog
      v-model:visible="helpVisible"
      :with-button="false"
      title="快捷键👇"
      width="500"
    >
      <div class="fc" style="align-items: flex-start;">
        <h3>全局模式下</h3>
        <p>空格键+鼠标移动: 拖动画布</p>
        <p>1-6: 分别对应工具栏的6种工具</p>
        <h3>路径模式下</h3>
        <p>Enter: 结束路径绘制</p>
        <p>s: 同时绘制站点</p>
        <h3>选中模式下</h3>
        <p>delete: 删除选中的路径或站点</p>
        <p>可拖拽路径节点或右键菜单操作来调整路径</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { importJson, exportJsonByInstance } from '@/tools/dataRelated'
import { toolEnum } from '@/data/toolEnum'
import { ElMessage } from 'element-plus'
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'

import Menu from '@/ui/Menu.vue'
import BgSelect from '@/components/drawTool/BgSelect.vue'
import SaveAsImage from '@/components/drawTool/SaveAsImage.vue'
import GeneralStationStyle from '@/components/drawTool/GeneralStationStyle.vue'
import Statistics from '@/components/drawTool/Statistics.vue'
import GuessStation from '@/components/drawTool/GuessStation.vue'

const projectUploadBtn = ref(null)
const helpVisible = ref(false)
const importBgDialogVisible = ref(false)
const saveDialogVisible = ref(false)
const canvasManageVisible = ref(false)
const stationManageVisible = ref(false)
const statVisible = ref(false)
const guessStationVisible = ref(false)

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { tool, lineSetting, stationSetting, textSetting, bgType, mapboxSetting, bgSetting, drawRect, svg, selectedElement, alignMode } = storeToRefs(drawStore)

const menuItems = reactive([
  {
    text: '项目',
    showSubItems: false,
    func: (item) => {
      item.showSubItems = !item.showSubItems
    },
    subItems: [
      {
        text: '导入项目',
        func: () => {
          // 点击上传按钮
          projectUploadBtn.value.click()
        }
      },
      {
        text: '导出项目',
        func: () => {
          const drawPartG = svg.value.children['global_g'].children['draw_part']
          exportJsonByInstance(drawPartG, svg.value.bgSetting)  
        }
      },
      {
        text: '保存为图片',
        func: () => {
          saveDialogVisible.value = true
        }
      }
    ]
  },
  {
    text: '导入底图',
    func: () => {
      importBgDialogVisible.value = true
    }
  },
  {
    text: '画布',
    showSubItems: false,
    func: (item) => {
      item.showSubItems = !item.showSubItems
    },
    subItems: [
      {
        text: '添加画布',
        func: () => {
          drawRect.value = true
        }
      },
      {
        text: '管理画布',
        func: () => {
          canvasManageVisible.value = true
        }
      },
      {
        text: '清除所有元素',
        func: () => {
          clearCanvas()
        }
      }
    ]
  },
  {
    text: '样式',
    subItems: [
      {
        text: '统一修改车站样式',
        func: () => {
          stationManageVisible.value = true
        }
      },
      // {
      //   text: '统一修改路线样式',
      //   func: () => {
      //     tool.value = toolEnum.path
      //   }
      // }
    ]
  },
  {
    text: '统计',
    subItems: [
      {
        text: '统计站名',
        func: () => {
          statVisible.value = true
        }
      },
      // {
      //   text: '名称猜站',
      //   func: () => {
      //     guessStationVisible.value = true
      //   }
      // }
    ]
  },
  {
    text: '帮助',
    func: () => {
      helpVisible.value = true
    }
  }
])

const emits = defineEmits([ 
  'submitBackground', 
  'saveSvg', 
  'exportSvg',
  'importJson',
  'clearCanvas',
  'canvasManage',
])

function updateTool (toolValue) {
  tool.value = toolValue
}

async function handleJsonChange (file) {
  return new Promise((resolve, reject) => {
    // 创建FileReader实例
    const reader = new FileReader();
    
    // 读取文件完成后的回调
    reader.onload = (e) => {
      try {
        // 解析JSON数据
        const jsonData = JSON.parse(e.target.result);
        // 在这里可以处理你的JSON数据
        if (svg.value) {
          importJson(jsonData, svg.value.children['global_g'])
        }
        resolve(jsonData)
      } catch (error) {
        console.error('JSON解析错误:', error);
        reject(error)
      }
    };
    
    // 读取文件内容
    reader.readAsText(file.raw);
  })
}

function clearCanvas () {
  svg.value.children['global_g'].children['draw_part'].children['global_line_g'].node.selectAll('*').remove()
  svg.value.children['global_g'].children['draw_part'].children['global_line_g'].children = {}
  svg.value.children['global_g'].children['draw_part'].children['global_station_g'].node.selectAll('*').remove()
  svg.value.children['global_g'].children['draw_part'].children['global_station_g'].children = {}
  // 清除文本
  svg.value.children['global_g'].children['draw_part'].children['global_text_g'].node.selectAll('*').remove()
  svg.value.children['global_g'].children['draw_part'].children['global_text_g'].children = {}
  // 清除选中元素
  selectedElement.value = null
  // 背景图url设置为空
  // svg.loadBackground('')
}
</script>

<style lang="scss" scoped>
.icon-select {
  box-sizing: border-box;
  padding: 4px 8px;
  width: 40px;
  height: 32px;
  cursor: pointer;
  color: #fff;
  border-radius: 4px;

  &.active {
    background-color: #1772b4;
  }
}
.draw-tool-container {
  display: flex;
  // flex-direction: column;
  gap: 8px;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;

  .group {
    display: flex;
    flex-direction: row;
    background-color: #8de0ff;
    padding: 6px 8px;
    border-radius: 4px;
    gap: 8px;
    align-items: center;
  }

  .tool-set {
    display: flex;
    flex-direction: row;
    background-color: #8de0ff;
    padding: 6px 8px;
    border-radius: 4px;

    // .tool-item {
    //   box-sizing: border-box;
    //   padding: 4px 8px;
    //   width: 40px;
    //   height: 32px;
    //   cursor: pointer;
    //   color: #fff;
    //   border-radius: 4px;

    //   &.active {
    //     background-color: #1772b4;
    //   }
    // }
  }

  .style-set {
    // margin-top: 8px;
    display: flex;
    flex-direction: row;
    border: 1px solid #8de0ff;
    background-color: #fff;
    background-color: #8de0ff;
    padding: 6px 8px;
    border-radius: 4px;
    gap: 8px;
  }
}

:deep(.el-input-group__append) {
  padding: 0 8px;
  background: '#fff';
  color: #110a00;
}
:deep(.el-input-group__prepend) {
  padding: 0 8px;
  background: '#fff';
  color: #110a00;
}
</style>
