<template>
  <Column 
    align="flex-start"
    formed
    :labelWidth="labelWidth"
  >
    <Select
      v-model="saveSetting.format"
      label="图片格式"
      placeholder="请选择图片格式"
      :width="inputCompWidth"
      :options="[
        { label: 'png', value: 'png' },
        { label: 'svg', value: 'svg' }
      ]"
    />
    <Input
      v-model="saveSetting.imageName"
      label="图片名称"
      placeholder="请输入图片名称"
      :width="inputCompWidth"
    />
    <Select
      v-model="saveSetting.bgType"
      label="背景"
      placeholder="请选择背景"
      :width="inputCompWidth"
      :options="[
        { label: '透明', value: 'none' },
        { label: '白色', value: 'white' },
        { label: '使用底图', value: 'bgImg', show: svg && svg.bgSetting.type === 'local' }
      ]"
    />
    <Select
      v-model="canvasEdgeId"
      label="使用画布"
      placeholder="请选择画布边缘"
      :width="inputCompWidth"
      :options="[
        { label: '不使用', value: 'no' },
        ...svg.canvasList.map((canvas) => ({ label: canvas.name, value: canvas.id }))
      ]"
    />
    <Input
      v-model="saveSetting.padding"
      label="图片内边距"
      placeholder="请输入图片内边距"
      :width="inputCompWidth"
    />
    <Input
      v-model="saveSetting.watermarkText"
      label="水印文字"
      placeholder="需要的话请输入水印文字"
      :width="inputCompWidth"
    />
    <Select
      v-model="saveSetting.watermarkPosition"
      v-if="saveSetting.watermarkText"
      label="水印位置"
      placeholder="请选择水印位置"
      :width="inputCompWidth"
      :options="[
        { label: '左下角', value: 'bottom-left' },
        { label: '右下角', value: 'bottom-right' },
        { label: '左上角', value: 'top-left' },
        { label: '右上角', value: 'top-right' }
      ]"
    />
    <el-button type="primary" @click="submit" style="align-self: flex-end;">确定</el-button>
  </Column>
</template>

<script setup>
import { ref, defineEmits, reactive } from 'vue'
import { ElMessage } from 'element-plus'
const emit = defineEmits(['submit'])

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { svg } = storeToRefs(drawStore)

const inputCompWidth = 250
const labelWidth = '85px'

import { 
  saveSvgWithBg, 
} from '@/tools/svgRelated.js'
const canvasEdgeId = ref('no')
const saveSetting = reactive({
  format: 'png',
  imageName: '',
  watermarkText: '',
  watermarkPosition: 'bottom-left',
  bgType: 'white',
  bgUrl: '',
  padding: 100,
  canvasEdge: null,
})

function submit() {
  if (!saveSetting.imageName) {
    ElMessage.error('请输入图片名称')
    return
  }
  if (saveSetting.bgType === 'bgImg') {
    saveSetting.bgUrl = svg.value.bgSetting.url
  }
  if (canvasEdgeId.value !== 'no') {
    saveSetting.canvasEdge = svg.value.canvasList.find(canvas => canvas.id === canvasEdgeId.value)
  } else {
    saveSetting.canvasEdge = null
  }
  const drawPartG = svg.value.children['global_g'].children['draw_part'].node
  saveSvgWithBg(drawPartG, saveSetting)
  emit('submit')
}
</script>

<style lang="scss" scoped>

</style>
