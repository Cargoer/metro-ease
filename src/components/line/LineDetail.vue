<template>
  <div class="line-style-detail">
    <el-tabs
      v-model="activeName"
      type="card"
      class="demo-tabs"
    >
      <el-tab-pane label="样式" name="style">
        <el-form :model="props.line.style" class="demo-form-inline">
          <el-form-item label="路径颜色">
            <ColorPickerWithPreset v-model:color="props.line.style.stroke" title="边框颜色" @change="refreshTarget" />
          </el-form-item>
          <el-form-item label="填充颜色">
            <ColorPickerWithPreset v-model:color="props.line.style.fill" title="填充颜色" @change="refreshTarget" />
          </el-form-item>
          <el-form-item label="路径线宽">
            <el-input
              v-model="props.line.style.strokeWidth"
              type="number"
              style="width: 150px;"
              @blur="refreshTarget"
            />
          </el-form-item>
          <el-form-item label="虚线" class="fr" style="gap: 10px;">
            <div
              class="icon-select" :class="{ 'active': props.line.style.isDashed }" 
              @click="props.line.style.isDashed = !props.line.style.isDashed"
            >
              <svg viewBox="0 0 24 24" :width="24" :height="24">
                <path id="dash-btn-icon" d="M2,2 L22,22" stroke="#8de0ff" stroke-width="2" fill="none" stroke-dasharray="4,3" />
              </svg>
            </div>
            <el-input
              v-if="props.line.style.isDashed"
              v-model="props.line.style.dashArray"
              style="width: 150px;"
              placeholder="例: 10 20"
              @blur="refreshTarget"
            >
              <template #prepend>虚线间隔</template>
            </el-input>
          </el-form-item>
          <el-form-item label="圆角">
            <div
              class="icon-select" :class="{ 'active': props.line.style.isRoundCorner }" 
              @click="props.line.style.isRoundCorner = !props.line.style.isRoundCorner"
            >
              <svg viewBox="0 0 24 24" :width="24" :height="24">
                <path :d="`M4,4 ${getRoundCornerD({x: 4, y: 4}, {x: 4, y: 20}, {x: 20, y: 20}, props.line.style.roundCornerRadius || 10)} L20,20`" stroke="#8de0ff" stroke-width="2" fill="none" />
              </svg>
            </div>
            <el-input
              v-if="props.line.style.isRoundCorner"
              type="number"
              v-model="props.line.style.roundCornerRadius"
              style="width: 150px;"
              @blur="refreshTarget"
            >
              <template #prepend>圆角半径</template>
            </el-input>
          </el-form-item>

        </el-form>
      </el-tab-pane>
      <el-tab-pane label="站点" name="stations" v-if="props.line.stations.length" class="station-tab">
        <div
          v-for="station in props.line.stations"
          :key="station.id"
          class="station-item"
          :style="{
            'background-color': props.line.style.stroke,
            'color': '#fff',
          }"
        >
          <span>{{ station.name }}</span>
          <div class="transfers fr" v-if="station.lines.length">
            <div 
              v-for="line in station.lines.filter(line => line.id !== props.line.id)" 
              :key="line.id + 't'"
              class="transfer-indicator"
              style="width: 10px; height: 10px; border-radius: 50%; gap: 8px;"
              :style="{
                'background-color': line.style.stroke,
              }"
            ></div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="更多信息" name="info">

      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'

import { getRoundCornerD } from '@/tools/svgRelated'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { selectedElement } = storeToRefs(drawStore)

const activeName = ref('style')

const props = defineProps({
  line: {
    type: Object,
    default: () => ({})
  },
})

const refreshTarget = () => {
  props.line.refreshStyle()
  props.line.refreshSelect()
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

.station-tab {
  display: grid;
  position: relative;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;

  .station-item {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    width: 100%;
    padding: 12px 12px;
    box-sizing: border-box;
    user-select: none;

    .transfers {
      position: absolute;
      gap: 2px;
      top: 8px;
      right: 8px;
      transform: translateY(-50%);
    }
  }
}



</style>