<template>
  <div class="line-setting fr">
    <ColorPickerWithPreset v-model:color="props.setting.stroke" title="边框颜色" @change="refreshTarget">
      <svg viewBox="0 0 10 10" :width="10" :height="10">
        <path d="M2,2 L2,8 L8,8 L8,2 Z" :stroke="props.setting.stroke" stroke-width="2" fill="none" />
      </svg>
    </ColorPickerWithPreset>

    <ColorPickerWithPreset v-model:color="props.setting.fill" title="填充颜色" @change="refreshTarget">
      <svg viewBox="0 0 10 10" :width="10" :height="10">
        <path d="M2,2 L2,8 L8,8 L8,2 Z" stroke="none" stroke-width="2" :fill="props.setting.fill" />
      </svg>
    </ColorPickerWithPreset>

    <el-input
      v-if="!isTransparent(props.setting.stroke)"
      v-model="props.setting.strokeWidth"
      type="number"
      style="width: 150px;"
      @change="refreshTarget"
    >
      <template #prepend>线宽</template>
    </el-input>

    <el-select
      v-model="props.setting.pattern"
      placeholder="请选择路线样式"
      style="width: 150px;"
    >
      <el-option label="默认" value="default" />
      <el-option label="虚线" value="dashed" />
      <el-option label="快线" value="fastline" />
      <el-option label="铁路" value="railway" />
      <template #prefix>样式</template>
    </el-select>

    <div
      class="icon-select" :class="{ 'active': props.setting.isRoundCorner }" 
      @click="props.setting.isRoundCorner = !props.setting.isRoundCorner"
    >
      <svg viewBox="0 0 24 24" :width="24" :height="24">
        <path :d="`M4,4 ${getRoundCornerD({x: 4, y: 4}, {x: 4, y: 20}, {x: 20, y: 20}, props.setting.roundCornerRadius)} L20,20`" stroke="#fff" stroke-width="2" fill="none" />
      </svg>
    </div>
    <el-input
      v-if="props.setting.isRoundCorner"
      type="number"
      v-model="props.setting.roundCornerRadius"
      style="width: 150px;"
    >
      <template #prepend>圆角半径</template>
    </el-input>
  </div>
</template>

<script setup>
import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
import { getRoundCornerD } from '@/tools/svgRelated'
import { computed, watch } from 'vue'

const props = defineProps(['setting', 'target'])

const isTransparent = computed(() => {
  return color => color === 'none' || color.includes('transparent') || (color.includes('rgba') && color.slice(-2) === '0)')
})

watch(() => props.setting.stroke, (val) => {
  if (isTransparent.value(val)) {
    props.setting.strokeWidth = 0
  }
})

const toggleDashed = () => {
  props.setting.isDashed = !props.setting.isDashed
  refreshTarget()
}

function refreshTarget () {
  if (props.target) {
    props.target.refreshStyle()
    props.target.refreshSelect()
  }
}

</script>

<style lang="scss" scoped>
.line-setting {
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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