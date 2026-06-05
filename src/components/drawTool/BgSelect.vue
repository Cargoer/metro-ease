<template>
  <Column 
    align="flex-start"
    formed
    :labelWidth="labelWidth"
  >
    <Select
      v-model="bgSetting.type"
      placeholder="请选择底图类型"
      :width="inputCompWidth"
      label="底图类型"
      :options="[
        { label: '网络图片', value: 'url' },
        { label: '本地图片', value: 'local' },
        { label: 'Mapbox', value: 'mapbox' },
      ]"
    />

    <template v-if="bgSetting.type === 'url'">
      <Input v-model="bgSetting.url" label="底图URL" :width="inputCompWidth" placeholder="请输入图片网络链接" required />
      <el-button type="primary" @click="submitBackground" style="align-self: flex-end;">确定</el-button>
    </template>

    <Row v-else-if="bgSetting.type === 'local'" label="上传底图">
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
    </Row>

    <template v-else-if="bgSetting.type === 'mapbox'">
      <Input label="城市" v-model="mapboxCity" :width="inputCompWidth" placeholder="城市名称（非必填）" @blur="handleCityBlur" />
      <Row label="中心经纬度">
        <Input type="number" v-model.number="bgSetting.center[0]" :width="inputCompWidth / 2.1" placeholder="经度" />
        <Input type="number" v-model.number="bgSetting.center[1]" :width="inputCompWidth / 2.1" placeholder="纬度" />
      </Row>
      <Input type="number" label="缩放级别" v-model.number="bgSetting.zoom" :width="inputCompWidth" placeholder="请输入Mapbox缩放级别" />
      <Input 
        v-model="bgSetting.style" 
        label="样式URL" 
        :width="inputCompWidth + 50" 
        placeholder="请输入Mapbox样式URL" 
      />
      <el-button type="primary" @click="submitBackground" style="align-self: flex-end;">确定</el-button>
    </template>
  </Column>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
const emit = defineEmits(['submit'])

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { bgSetting, svg } = storeToRefs(drawStore)

const inputCompWidth = 250
const labelWidth = '85px'

function handleFileChange(file, fileList) {
  bgSetting.value.url = URL.createObjectURL(file.raw)
  submitBackground()
}

const mapboxCity = ref('')
function handleCityBlur () {
  if (mapboxCity.value) {
    const id = import.meta.env.VITE_APP_APIHZ_ID
    const key = import.meta.env.VITE_APP_APIHZ_KEY
    fetch(`https://cn.apihz.cn/api/other/jwjuhe.php?address=${mapboxCity.value}&id=${id}&key=${key}`)
    .then(res => res.json())
    .then(data => {
      bgSetting.value.center = [data.lng, data.lat]
    })
  }
}

function submitBackground() {
  svg.value.loadBackground(bgSetting.value)
  emit('submit')
}
</script>

<style lang="scss" scoped>

</style>
