<template>
  <div style="position: relative;">
    <el-popover :visible="colorPickerVisible" placement="bottom" :width="600" trigger="click">
      <template #reference>
        <div
          style="width: 24px; height: 24px; border-radius: 4px; cursor: pointer;"
          :style="{ 'background-color': props.color }" 
          :class="{ 'transparent-grid': props.color === 'none' || props.color?.includes('transparent') || (props.color?.includes('rgba') && props.color.slice(-2) === '0)') }"
          @click="colorPickerVisible = true"
        ></div>
      </template>
      <div class="fr" style="gap: 20px;">
        <el-color-picker-panel v-model="colorVal" show-alpha :predefine="usedColors" />
        <div class="fc" style="gap: 8px;">
          <p>部分城市轨道交通线路颜色预设</p>
          <el-select v-model="selectedCityForColor" placeholder="请选择城市" style="width: 150px;">
            <el-option v-for="item in Object.keys(cityMetroColor)" :key="item" :label="item" :value="item" />
          </el-select>
          <div class="fr" style="gap: 8px; width: 200px; flex-wrap: wrap;">
            <div
              v-for="(item, index) in Object.keys(cityMetroColor[selectedCityForColor])" :key="index"
              class="color-preview"
              style="width: 24px; height: 24px; border-radius: 4px; color: '#fff';"
              :style="{ 'background-color': cityMetroColor[selectedCityForColor][item] }"
              :title="item"
              @click="updateColor(cityMetroColor[selectedCityForColor][item])"
            >{{ item.match(/\d+/)?.[0] || item[0] }}</div>
          </div>
        </div>
        <el-button type="primary" @click="colorPickerVisible = false" style="position: absolute; bottom: 10px; right: 10px;">确定</el-button>
      </div>
    </el-popover>
    <div class="label fr">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import cityMetroColor from '@/data/cityMetroColor'

import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { colorPicking, usedColors } = storeToRefs(drawStore)

const props = defineProps([ 'color' ])
const emits = defineEmits([ 'update:color', 'change' ])

const colorPickerVisible = ref(false)
const selectedCityForColor = ref('深圳')

watch(colorPickerVisible, (val) => {
  colorPicking.value = val
})

const isTransparent = computed(() => {
  return color => color === 'none' || color.includes('transparent') || (color.includes('rgba') && color.slice(-2) === '0)')
})

const colorVal = computed({
  get () {
    return props.color
  },
  set (val) {
    console.log('colorPickerWithPreset set color:', val)
    if (isTransparent.value(val)) {
      emits('update:color', 'none')
    } else {
      if (!usedColors.value.includes(val)) {
        usedColors.value.push(val)
      }
      emits('update:color', val)
      emits('change', val)
    }
  }
})

function updateColor (color) {
  emits('update:color', color)
  emits('change', color)
}
</script>

<style lang="scss" scoped>
.color-preview {
  color: #fff;
  text-align: center;
  line-height: 24px;
  user-select: none;
  cursor: pointer;
}

.label {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-6px, -6px);
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: rgba(200, 200, 240, 0.5);
  justify-content: center;
  align-items: center;

  // svg {
  //   width: 100%;
  //   height: 100%;
  // }
}
.transparent-grid {
  background-image: 
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
    linear-gradient(-45deg, #FFFFFF 75%, #e0e0e0 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}
</style>
