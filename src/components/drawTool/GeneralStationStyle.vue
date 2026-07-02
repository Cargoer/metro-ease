<template>
  <Column align="flex-start" formed :labelWidth="labelWidth">
    <Row>
      <Input
        type="number"
        v-model="stationUnitedStyle.presetLineStrokeWidth"
        placeholder="请输入边框宽度"
        :width="inputCompWidth"
        label="预设路径线宽"
      />
      <div style="font-size: 12px; color: #999;">此项仅作预览，不影响实际绘制</div>
    </Row>
    <Input
      type="number"
      v-model="stationUnitedStyle.strokeWidth"
      placeholder="请输入边框宽度"
      :width="inputCompWidth"
      label="边框宽度"
    />
    <Row>
      <Select
        v-model="stationUnitedStyle.radiusType"
        placeholder="请选择半径类型"
        :width="inputCompWidth"
        label="半径"
        :options="[
          { label: '固定数值', value: 'fixed' },
          { label: '路线线宽百分比', value: 'percent' },
        ]"
      />
      <Input
        v-if="stationUnitedStyle.radiusType === 'fixed'"
        type="number"
        v-model="stationUnitedStyle.radius"
        placeholder="请输入半径数值"
        :width="inputCompWidth"
      />
      <Slider
        v-if="stationUnitedStyle.radiusType === 'percent'"
        v-model="stationUnitedStyle.radiusPercent"
        :min="0.5"
        :max="2"
        :step="0.1"
        :width="inputCompWidth"
      />
    </Row>
    <Row>
      <Select
        v-model="stationUnitedStyle.strokeType"
        placeholder="请选择边框类型"
        :width="inputCompWidth"
        label="边框颜色"
        :options="[
          { label: '固定颜色', value: 'fixed' },
          { label: '跟随路线', value: 'followLine' },
        ]"
      />
      <ColorPickerWithPreset
        v-if="stationUnitedStyle.strokeType === 'fixed'"
        v-model:color="stationUnitedStyle.stroke"
      />
    </Row>
    <Row>
      <Select
        v-model="stationUnitedStyle.fillType"
        placeholder="请选择填充类型"
        :width="inputCompWidth"
        label="填充颜色"
        :options="[
          { label: '固定颜色', value: 'fixed' },
          { label: '跟随路线', value: 'followLine' },
        ]"
      />
      <ColorPickerWithPreset
        v-if="stationUnitedStyle.fillType === 'fixed'"
        v-model:color="stationUnitedStyle.fill"
      />
    </Row>
    <Input
      type="number"
      v-model="stationUnitedStyle.fontSize"
      placeholder="请输入字体大小数值"
      :width="inputCompWidth"
      label="字体大小"
    />

    <div class="preview">
      <div class="center" :style="lineStyle"></div>
      <div class="center" :style="stationStyle"></div>
      <div class="center" style="transform: translate(-50%, 50%);" :style="textStyle">车公庙</div>
    </div>

    <el-button type="primary" @click="submit" style="align-self: flex-end;">确定</el-button>
  </Column>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
const emit = defineEmits(['submit'])

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { svg, stationUnitedStyle } = storeToRefs(drawStore)

const inputCompWidth = 180
const labelWidth = '100px'

// const stationUnitedStyle = ref({
//   presetLineStrokeWidth: 10,
//   strokeWidth: 2,
//   strokeType: 'followLine',
//   stroke: '#FFF',
//   fillType: 'fixed',
//   fill: '#FFF',
//   radiusType: 'fixed',
//   radius: 10,
//   radiusPercent: 1.7,
//   fontSize: 12,
// })

const lineStyle = computed(() => ({
  width: '100px',
  height: stationUnitedStyle.value.presetLineStrokeWidth + 'px',
  backgroundColor: '#01AF55',
}))

const actualRadius = computed(() => {
  if (stationUnitedStyle.value.radiusType === 'fixed') {
    return stationUnitedStyle.value.radius
  }
  return stationUnitedStyle.value.presetLineStrokeWidth * stationUnitedStyle.value.radiusPercent
})
const stationStyle = computed(() => ({
  boxSizing: 'border-box',
  width: actualRadius.value * 2 + 'px',
  height: actualRadius.value * 2 + 'px',
  borderRadius: actualRadius.value + 'px',
  border: stationUnitedStyle.value.strokeWidth + 'px solid ' + (stationUnitedStyle.value.strokeType === 'fixed' ? stationUnitedStyle.value.stroke : '#01AF55'),
  backgroundColor: stationUnitedStyle.value.fillType === 'fixed' ? stationUnitedStyle.value.fill : '#01AF55',
}))
const textStyle = computed(() => ({
  fontSize: stationUnitedStyle.value.fontSize + 'px',
}))

function submit() {
  Object.values(svg.value.stationMap).forEach(station => {
    station.style.strokeWidth = stationUnitedStyle.value.strokeWidth
    station.style.radius = 
      stationUnitedStyle.value.radiusType === 'fixed' ? 
      stationUnitedStyle.value.radius : 
      station.lines[0].style.strokeWidth * stationUnitedStyle.value.radiusPercent
    station.nameFontSize = stationUnitedStyle.value.fontSize
    if (station.lines.length === 1) {
      station.style.stroke = stationUnitedStyle.value.strokeType === 'fixed' ? stationUnitedStyle.value.stroke : station.lines[0].style.stroke
      station.style.fill = stationUnitedStyle.value.fillType === 'fixed' ? stationUnitedStyle.value.fill : station.lines[0].style.stroke
    }
    station.refreshStyle()
  })
  emit('submit')
}
</script>

<style lang="scss" scoped>
.preview {
  position: relative;
  width: 100px;
  height: 100px;
  margin-left: 20px;

  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  #station-simulator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
