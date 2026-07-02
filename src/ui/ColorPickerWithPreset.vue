<template>
  <div class="my-color-picker-container">
    <!-- 前置标签 -->
    <Label v-if="props.label" :width="props.labelWidth">{{ props.label }}</Label>
    <el-popover :visible="colorPickerVisible" placement="bottom" :width="600" trigger="click">
      <template #reference>
        <div
          style="width: 32px; height: 32px; border-radius: 4px; cursor: pointer; border: 2px solid #1772b4;"
          :style="{ 'background-color': props.color }" 
          :class="{ 'transparent-grid': props.color === 'none' || props.color?.includes('transparent') || (props.color?.includes('rgba') && props.color.slice(-2) === '0)') }"
          @click="colorPickerVisible = true"
        >
          <div class="label fr" :id="labelId" ref="labelRef">
            <slot></slot>
          </div>
        </div>
      </template>
      <div class="fr" style="gap: 20px;">
        <el-color-picker-panel v-model="colorVal" show-alpha :predefine="usedColors" />
        <div class="fc" style="gap: 8px; padding-bottom: 40px;">
          <div class="fr" style="gap: 8px; width: 200px; flex-wrap: wrap;">
            <div class="color-preview none" :class="{'selected': curSelectedColor === 'none'}" @click="curSelectedColor = 'none'"></div>
            <div class="color-preview water" style="background-color: #9BE2FA;" :class="{'selected': curSelectedColor === '#9BE2FA'}" @click="curSelectedColor = '#9BE2FA'">
              <span>水</span>
            </div>
            <div class="color-preview grass" style="background-color: #C3F1D7;" :class="{'selected': curSelectedColor === '#C3F1D7'}" @click="curSelectedColor = '#C3F1D7'">
              <span>绿</span>
            </div>
          </div>
          <p>部分城市轨道交通线路颜色预设</p>
          <el-select v-model="selectedCityForColor" placeholder="请选择城市" style="width: 150px;" filterable>
            <el-option v-for="item in Object.keys(cityMetroColor)" :key="item" :label="item" :value="item" />
          </el-select>
          <div class="fr" style="gap: 8px; width: 200px; flex-wrap: wrap;">
            <div
              v-for="(item, index) in Object.keys(cityMetroColor[selectedCityForColor])" :key="index"
              class="color-preview"
              :class="{'selected': curSelectedColor === cityMetroColor[selectedCityForColor][item]}"
              :style="{ 'background-color': cityMetroColor[selectedCityForColor][item] }"
              :title="item"
              @click="curSelectedColor = cityMetroColor[selectedCityForColor][item]"
            >
              <span :style="{ 'color': getContrastTextColor(cityMetroColor[selectedCityForColor][item]) }">{{ item.match(/\d+/)?.[0] || item[0] }}</span>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="updateColor" style="position: absolute; bottom: 10px; right: 10px;">确定</el-button>
      </div>
    </el-popover>
    
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue"
import cityMetroColor from '@/data/cityMetroColor'
import { getContrastTextColor, generateUniqueId } from '@/tools/utils'
const labelId = generateUniqueId()

import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { colorPicking, usedColors } = storeToRefs(drawStore)

const props = defineProps({
  color: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  labelWidth: {
    type: String,
    default: null
  }
})
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
    curSelectedColor.value = val
  }
})

// 定义 ref
const labelRef = ref(null)

function updateLabelColor (color) {
  const textColor = getContrastTextColor(color)
  // document.querySelector(`#${labelId}`).style.color = textColor
  labelRef.value.style.color = textColor
}

const curSelectedColor = ref(props.color)
function updateColor () {
  const emitColor = isTransparent.value(curSelectedColor.value) ? 'none' : curSelectedColor.value
  if (emitColor !== 'none') {
    usedColors.value.push(emitColor)
  }
  emits('update:color', emitColor)
  emits('change', emitColor)
  // 更新 label 文字颜色
  updateLabelColor(emitColor)
  colorPickerVisible.value = false
}

onMounted(() => {
  updateLabelColor(props.color)
})
</script>

<style lang="scss" scoped>
.my-color-picker-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  // margin-bottom: var(--form-gap);

  .my-color-picker-label {
    white-space: nowrap;
    color: #1772b4;
    font-weight: 500;
    font-size: 14px;
  }
}

.color-preview {
  box-sizing: border-box;
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  cursor: pointer;

  &.selected {
    border: 2px solid #000;
  }

  &.none {
    border: 3px solid #aaa;

    &.selected {
      border-color: #000;
    }

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      width: 140%;
      height: 3px;
      border-radius: 4px;
      background: #aaa;
    }
  }
}

.label {
  position: absolute;
  left: 2px;
  top: 2px;
  // transform: translate(-6px, -6px);
  width: 14px;
  height: 14px;
  border-radius: 4px;
  // background: rgba(200, 200, 240, 0.5);
  justify-content: center;
  align-items: center;
  user-select: none;
  cursor: pointer;

  font-size: 10px;
  color: #fff;

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
