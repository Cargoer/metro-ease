<template>
  <div class="line-setting fr">
    <ColorPickerWithPreset v-model:color="textSetting.textColor" title="文本颜色">
      <svg viewBox="0 0 10 10" :width="10" :height="10">
        <text x="2" y="10" font-size="12" :fill="textSetting.textColor">A</text>
      </svg>
    </ColorPickerWithPreset>

    <el-input
      v-model="textSetting.fontSize"
      type="number"
      style="width: 150px;"
    >
      <template #prepend>字号</template>
    </el-input>

    <!-- 背景色 -->
    <div
      class="icon-select" :class="{ 'active': textSetting.withBg }" 
      @click="textSetting.withBg = !textSetting.withBg"
    >
      <svg viewBox="0 0 24 24" :width="24" :height="24">
        <rect x="0" y="1" width="24" height="22" rx="4" ry="4" stroke="none" stroke-width="2" fill="#345" />
        <text x="6" y="17" font-size="16" fill="#fff">A</text>
      </svg>
    </div>

    <ColorPickerWithPreset v-if="textSetting.withBg" v-model:color="textSetting.bgColor" title="背景颜色">
      <svg viewBox="0 0 14 14" :width="14" :height="14">
        <rect x="1" y="1" width="12" height="12" stroke="none" rx="2" ry="2" stroke-width="2" :fill="textSetting.bgColor" />
        <text x="3" y="11" font-size="11" :fill="textSetting.textColor">A</text>
      </svg>
    </ColorPickerWithPreset>

    <!-- 边框颜色 -->
    <div
      class="icon-select" :class="{ 'active': textSetting.withBorder }" 
      @click="textSetting.withBorder = !textSetting.withBorder"
    >
      <svg viewBox="0 0 24 24" :width="24" :height="24">
        <rect x="0" y="1" width="24" height="22" rx="4" ry="4" stroke="#345" stroke-width="2" fill="none" />
        <text x="6" y="17" font-size="16" fill="#fff">A</text>
      </svg>
    </div>

    <ColorPickerWithPreset v-if="textSetting.withBorder" v-model:color="textSetting.borderColor" title="边框颜色">
      <svg viewBox="0 0 10 10" :width="10" :height="10">
        <rect x="1" y="1" width="9" height="9" :stroke="textSetting.borderColor" rx="2" ry="2" stroke-width="1" fill="none" />
        <text x="3" y="8" font-size="8" :fill="textSetting.textColor">A</text>
      </svg>
    </ColorPickerWithPreset>

    <el-input
      v-if="textSetting.withbg || textSetting.withBorder"
      v-model="textSetting.padding"
      style="width: 150px;"
    >
      <template #prepend>边距</template>
    </el-input>

    <el-input
      v-if="textSetting.withBg || textSetting.withBorder"
      v-model="textSetting.borderRadius"
      style="width: 150px;"
    >
      <template #prepend>圆角</template>
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
const { textSetting } = storeToRefs(drawStore)


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