<template>
  <div class="line-setting fr">
    <ColorPickerWithPreset v-model:color="stationSetting.stroke" title="边框颜色">
      <svg viewBox="0 0 10 10" :width="10" :height="10">
        <path d="M2,2 L2,8 L8,8 L8,2 Z" :stroke="stationSetting.stroke" stroke-width="2" fill="none" />
      </svg>
    </ColorPickerWithPreset>

    <ColorPickerWithPreset v-model:color="stationSetting.fill" title="填充颜色">
      <svg viewBox="0 0 10 10" :width="10" :height="10">
        <path d="M2,2 L2,8 L8,8 L8,2 Z" stroke="none" stroke-width="2" :fill="stationSetting.fill" />
      </svg>
    </ColorPickerWithPreset>

    <el-input
      v-if="!isTransparent(stationSetting.stroke)"
      v-model="stationSetting.strokeWidth"
      type="number"
      style="width: 150px;"
    >
      <template #prepend>边宽</template>
    </el-input>

    <el-input
      v-model="stationSetting.radius"
      type="number"
      style="width: 150px;"
    >
      <template #prepend>半径</template>
    </el-input>
  </div>
</template>

<script setup>
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
const drawStore = useDrawStore()
const { stationSetting } = storeToRefs(drawStore)

const isTransparent = computed(() => {
  return color => color === 'none' || color.includes('transparent') || (color.includes('rgba') && color.slice(-2) === '0)')
})

watch(() => stationSetting.value.stroke, (val) => {
  if (isTransparent.value(val)) {
    stationSetting.value.strokeWidth = 0
  }
})

</script>

<style lang="scss" scoped>
.line-setting {
  gap: 10px;
  align-items: center;
}
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