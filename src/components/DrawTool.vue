<template>
  <div class="draw-tool-container">
    <div class="group">
      <el-button type="primary" @click="importBgDialogVisible = true">导入底图</el-button>
      <el-button type="primary" @click="emits('clearCanvas')">清除画布</el-button>

      <el-button type="primary" class="icon-select" @click="emits('saveSvg')" title="保存为图片">
        <svg viewBox="0 0 24 24" :width="24" :height="24">
          <path d="M5,3 L14,3 L19,8 L19,21 L5,21 Z" fill="none" stroke="#fff" stroke-width="2" />
          <path d="M9,21 L9,13 L15,13 L15,21" fill="none" stroke="#fff" stroke-width="2" />
        </svg>
      </el-button>
      <el-button type="primary" class="icon-select" @click="emits('exportSvg')" title="导出项目">
        <svg viewBox="0 0 24 24" :width="24" :height="24">
          <path d="M9,2 L2,2 L2,22 L22,22 L22,15" fill="none" stroke="#fff" stroke-width="2" />
          <path d="M15,2 L22,2 L22,9" fill="none" stroke="#fff" stroke-width="2" />
          <path d="M9,15 L22,2" fill="none" stroke="#fff" stroke-width="2" />
        </svg>
      </el-button>
      
      <el-upload
        ref="bgImageUpload"
        accept=".json"
        :show-file-list="false"
        :on-success="handleJsonImport"
        :on-error="handleJsonImportError"
        :on-change="handleJsonChange"
        action="#"
        :auto-upload="false"
      >
        <template #trigger>
          <el-button type="primary" class="icon-select" title="导入项目">
            <svg viewBox="0 0 24 24" :width="24" :height="24">
              <path d="M9,2 L2,2 L2,22 L22,22 L22,15" fill="none" stroke="#fff" stroke-width="2" />
              <path d="M9,7 L9,15 L17,15" fill="none" stroke="#fff" stroke-width="2" />
              <path d="M9,15 L22,2" fill="none" stroke="#fff" stroke-width="2" />
            </svg>
          </el-button>
        </template>
      </el-upload>
    </div>
    
    <div class="group">
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

    <div class="group" v-if="tool.includes('line')">
      <LineSetting :setting="lineSetting" />
    </div>

    <div class="group" v-else-if="tool === 'station'">
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
        <el-form-item label="底图URL">
          <el-input v-model="inputBgUrl" placeholder="请输入图片网络链接" />
          <el-button type="primary" @click="submitInputBgUrl" style="margin-top: 8px;">确定</el-button>
        </el-form-item>
        <el-divider content-position="left">或</el-divider>
        <el-form-item label="上传底图">
          <el-upload
            ref="bgImageUpload"
            :show-file-list="false"
            :on-success="handleBgImageSuccess"
            :on-error="handleBgImageError"
            :on-change="handleFileChange"
            action="#"
            :auto-upload="false"
          >
            <template #trigger>
              <el-button type="primary">上传底图</el-button>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getRoundCornerD } from '@/tools/svgRelated'
import { toolEnum } from '@/data/toolEnum'
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'
import Dialog from '@/components/Dialog.vue'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { tool, lineSetting, stationSetting, textSetting } = storeToRefs(drawStore)

const importBgDialogVisible = ref(false)
const inputBgUrl = ref('')

const linePatterns = [
  {
    label: '虚线',
    value: 'dashed',
    svg: '<path d="M2,2 L22,22" stroke="#fff" stroke-width="2" fill="none" stroke-dasharray="4,3" />'
  },
  {
    label: '铁路',
    value: 'railway',
    svg: '\
      <path d="M2,2 L22,22" stroke="#fff" stroke-width="2" fill="none" stroke-dasharray="4,3" />\
      <defs>\
        <linearGradient id="railwayGradient" x1="0" y1="0" x2="1" y2="1">\
          <stop offset="0%" stop-color="#EED01D" />\
          <stop offset="100%" stop-color="#005DA4" />\
        </linearGradient>\
      </defs>\
    '
  }
]

// const props = defineProps([ 'toolSetting' ])
const emits = defineEmits([ 
  // 'update:toolSetting', 
  'uploadBackground', 
  'saveSvg', 
  'exportSvg',
  'importJson',
  'clearCanvas',
])

function updateTool (toolValue) {
  tool.value = toolValue
}

function handleBgImageSuccess (res, file) {
  console.log('上传底图成功', res)
  emits('uploadBackground', URL.createObjectURL(file.raw))
}

function handleFileChange(file, fileList) {
  console.log('文件已选择:', file, '文件列表:', fileList)
  emits('uploadBackground', URL.createObjectURL(file.raw))
  importBgDialogVisible.value = false
  // this.$refs.bgImageUpload.submit()
}

function submitInputBgUrl () {
  emits('uploadBackground', inputBgUrl.value)
  importBgDialogVisible.value = false
}

function handleBgImageError (err, file) {
  console.error('上传底图失败:', err, '文件信息:', file)
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
        console.log('解析后的JSON数据:', jsonData);
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
