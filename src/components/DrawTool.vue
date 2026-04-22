<template>
  <div class="draw-tool-container">
    <Menu :menuItems="menuItems" />

    <el-upload
      ref="projectUpload"
      accept=".json"
      :show-file-list="false"
      :on-success="handleJsonImport"
      :on-error="handleJsonImportError"
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

    <div class="group" v-if="(tool.includes('line') || tool === 'edge') && !drawRect">
      <LineSetting :setting="lineSetting" />
    </div>

    <div class="group" v-else-if="tool === 'station' && !drawRect">
      <StationSetting />
    </div>

    <!-- <div class="group" v-else-if="tool === 'text'">
      <TextSetting />
    </div> -->

    <Dialog
      v-model:visible="importBgDialogVisible"
      title="导入底图"
      :with-button="false"
      width="500"
    >
      <el-form ref="importBgForm" label-width="100px">
        <el-form-item label="底图类型">
          <el-select v-model="bgSetting.type" placeholder="请选择底图类型">
            <el-option label="网络图片" value="url" />
            <el-option label="本地图片" value="local" />
            <el-option label="Mapbox" value="mapbox" />
          </el-select>
        </el-form-item>
        <template v-if="bgSetting.type === 'url'">
          <el-form-item  label="底图URL">
            <el-input v-model="bgSetting.url" placeholder="请输入图片网络链接" required />
            <el-button type="primary" @click="submitBackground" style="margin-top: 8px;">确定</el-button>
          </el-form-item>
        </template>
        <template v-else-if="bgSetting.type === 'local'">
          <el-form-item label="上传底图">
            <el-upload
              ref="bgImageUpload"
              :show-file-list="false"
              :on-change="handleFileChange"
              action="#"
              :auto-upload="false"
            >
              <template #trigger>
                <el-button type="primary">上传底图</el-button>
              </template>
            </el-upload>
          </el-form-item>
        </template>
        <template v-else-if="bgSetting.type === 'mapbox'">
          <el-form-item label="中心经纬度" >
            <el-input type="number" v-model.number="bgSetting.center[0]" placeholder="经度" style="width: 100px; display: inline-block; margin-right: 8px;" />
            <el-input type="number" v-model.number="bgSetting.center[1]" placeholder="纬度" style="width: 100px; display: inline-block;" />
          </el-form-item>
          <el-form-item label="缩放级别">
            <el-input type="number" v-model.number="bgSetting.zoom" placeholder="请输入Mapbox缩放级别" />
          </el-form-item>
          <el-form-item label="样式URL">
            <el-input v-model="bgSetting.style" placeholder="请输入Mapbox样式URL" />
          </el-form-item>
          <el-button type="primary" @click="submitBackground" style="margin-top: 8px;">确定</el-button>
        </template>
      </el-form>
    </Dialog>

    <Dialog
      v-model:visible="helpVisible"
      :with-button="false"
      title="快捷键👇"
      width="500"
    >
      <div class="fc" style="align-items: flex-start;">
        <h2>全局模式下</h2>
        <p>空格键+鼠标移动: 拖动画布</p>
        <p>1-6: 分别对应工具栏的6种工具</p>
        <h2>路径模式下</h2>
        <p>Enter: 结束路径绘制</p>
        <p>s: 同时绘制站点</p>
        <h2>其他</h2>
        <p>选中路径后可调整对应节点，也可以右击路径进行操作</p>
        <p>双击文本可编辑</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { getRoundCornerD } from '@/tools/svgRelated'
import { toolEnum } from '@/data/toolEnum'
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'
import Dialog from '@/components/Dialog.vue'

import Menu from '@/ui/Menu.vue'

const projectUploadBtn = ref(null)
const helpVisible = ref(false)



// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { tool, lineSetting, stationSetting, textSetting, bgType, mapboxSetting, bgSetting, drawRect } = storeToRefs(drawStore)

const menuItems = reactive([
  {
    text: '项目',
    showSubItems: false,
    func: (item) => {
      console.log(item)
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
          emits('exportSvg')
        }
      },
      {
        text: '保存为图片',
        func: () => {
          emits('saveSvg')
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
          emits('canvasManage')
        }
      },
      {
        text: '清除所有元素',
        func: () => {
          emits('clearCanvas')
        }
      }
    ]
  },
  {
    text: '帮助',
    func: () => {
      helpVisible.value = true
    }
  }
])

const importBgDialogVisible = ref(false)

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

function handleFileChange(file, fileList) {
  bgSetting.value.url = URL.createObjectURL(file.raw)
  submitBackground()
}

function submitBackground () {
  emits('submitBackground', bgSetting.value)
  importBgDialogVisible.value = false
}

function handleJsonImport (res, file) {
  console.log('导入JSON成功', res)
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
        // this.processJsonData(jsonData);
        emits('importJson', jsonData)
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

function handleJsonImportError (err, file) {
  console.error('导入JSON失败:', err, '文件信息:', file)
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
