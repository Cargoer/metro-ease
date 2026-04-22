<template>
  <div class="station-detail">
    <el-tabs
      v-model="activeName"
      type="card"
      class="demo-tabs"
    >
      <el-tab-pane label="样式" name="style">
        <el-form :model="props.station.style" class="demo-form-inline">
          <el-form-item label="边框颜色">
            <ColorPickerWithPreset v-model:color="props.station.style.stroke" title="边框颜色" @change="refreshTarget" />
          </el-form-item>
          <el-form-item label="填充颜色">
            <ColorPickerWithPreset v-model:color="props.station.style.fill" title="填充颜色" @change="refreshTarget" />
          </el-form-item>
          <el-form-item label="边框线宽">
            <el-input
              v-model="props.station.style.strokeWidth"
              type="number"
              style="width: 150px;"
              @blur="refreshTarget"
            />
          </el-form-item>
          <el-form-item label="半径">
            <el-input
              v-model="props.station.style.radius"
              type="number"
              style="width: 150px;"
              @blur="refreshTarget"
            />
          </el-form-item>
          <el-form-item label="车站名字体大小">
            <el-input
              v-model="props.station.nameFontSize"
              type="number"
              style="width: 150px;"
              @blur="refreshTarget"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="路线站台" name="line" v-if="props.station.lines.length" class="station-tab">
        <div
          v-for="line in props.station.lines"
          :key="line.id"
          class="station-item"
          style="margin-bottom: 8px;"
        >
          <div
            style="padding: 8px 10px; color: #fff; border-radius: 6px;"
            :style="{
              'background-color': line.style.stroke,
            }"
          >{{ line.name }}</div>
          <InfoDisplay :infoObj="props.station.info[line.id]" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="更多信息" name="info">
        <InfoDisplay :infoObj="props.station.info" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
import InfoDisplay from '@/components/InfoDisplay.vue'

import { getRoundCornerD } from '@/tools/svgRelated'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { selectedElement } = storeToRefs(drawStore)

const activeName = ref('style')

const props = defineProps({
  station: {
    type: Object,
    default: () => ({})
  },
})

const refreshTarget = () => {
  props.station.refreshStyle()
}

onMounted(() => {
  if (!props.station.info) props.station.info = {}
  for (const line of props.station.lines) {
    if (!props.station.info[line.id]) {
      props.station.info[line.id] = {}
    }
  }
})

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



</style>