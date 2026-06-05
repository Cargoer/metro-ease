<template>
  <div class="line-setting fr">
    <ColorPickerWithPreset v-model:color="stationSetting.stroke" title="边框颜色">
      <span>边</span>
    </ColorPickerWithPreset>

    <ColorPickerWithPreset v-model:color="stationSetting.fill" title="填充颜色">
      <span>填</span>
    </ColorPickerWithPreset>

    <Input 
      v-model="stationSetting.strokeWidth"
      type="number"
      label="边宽"
      labelInner
      width="80px"
    />
    <Input 
      v-model="stationSetting.radius"
      type="number"
      label="半径"
      labelInner
      width="80px"
    />
  </div>
</template>

<script setup>
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