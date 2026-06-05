<template>
  <div class="line-setting fr">
    <Checkbox label="延伸模式" v-model="props.setting.isExtendMode" />
    <template v-if="!props.setting.isExtendMode">
      <Select
        v-model="props.setting.usage"
        label="用途"
        labelInner
        width="80px"
        :options="[
          { label: '路线', value: 'line' },
          { label: '边界', value: 'edge' },
          { label: '自然', value: 'nature' },
        ]"
      />
      <ColorPickerWithPreset v-model:color="props.setting.stroke" title="边框颜色" @change="refreshTarget">
        <span>边</span>
      </ColorPickerWithPreset>

      <ColorPickerWithPreset v-model:color="props.setting.fill" title="填充颜色" @change="refreshTarget">
        <span>填</span>
      </ColorPickerWithPreset>

      <Input
        v-model="props.setting.strokeWidth"
        type="number"
        width="80px"
        label="线宽"
        labelInner
        @change="refreshTarget"
      />

      <Select
        v-model="props.setting.pattern"
        label="样式"
        labelInner
        width="80px"
        :options="[
          { label: '默认', value: 'default' },
          { label: '虚线', value: 'dashed' },
          { label: '快线', value: 'fastline' },
          { label: '铁路', value: 'railway' },
        ]"
      />

      <Input
        type="number"
        v-model="props.setting.roundCornerRadius"
        width="80px"
        label="圆角半径"
        labelInner
      />
    </template>
    <el-button type="primary" @click="presetStationNamesVisible = true">车站预填</el-button>
    <div class="preset-station-names-container" v-if="presetStationNamesVisible">
      <div class="preset-station-names fr">
        <div 
          v-for="name in lineStore.presetStationNames" 
          class="preset-station-name-item" 
          :key="name"
          :style="{ backgroundColor: props.setting.stroke, color: getContrastTextColor(props.setting.stroke) }"
        >
          <span>{{ name }}</span>
          <div @click="lineStore.removePresetStationName(name)">×</div>
        </div>
      </div>
      <el-input
        v-model="presetStationNamesStr"
        ref="presetStationNamesInput"
        placeholder="请预填车站名称，以空格为分隔，"
        style="width: 100%; border: none; outline: none;"
        @change="refreshTarget"
        @keyup.enter="handleEnter"
      >
      </el-input>
      <div style="font-size: 12px; color: #999;">注：按s绘制车站时会自动按顺序填入车站名</div>
    </div>
  </div>
</template>

<script setup>
// import ColorPickerWithPreset from '@/components/ColorPickerWithPreset.vue'
import { getRoundCornerD } from '@/tools/svgRelated'
import { computed, watch } from 'vue'
import { useDrawStore } from '@/store/drawStore'
import { useLineStore } from '@/store/lineStore'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
// 获取反差色
import { getContrastTextColor } from '@/tools/utils'

const drawStore = useDrawStore()
const lineStore = useLineStore()
const { drawLine } = storeToRefs(drawStore)

const props = defineProps(['setting', 'target'])

const isTransparent = computed(() => {
  return color => color === 'none' || color.includes('transparent') || (color.includes('rgba') && color.slice(-2) === '0)')
})

const presetStationNamesVisible = ref(false)
const presetStationNamesStr = ref('')
const presetStationNamesInput = ref(null)

function handleEnter () {
  presetStationNamesInput.value.blur()
  lineStore.setPresetStationNames(presetStationNamesStr.value)
  presetStationNamesStr.value = ''
}

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
  position: relative;

  .preset-station-names-container {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;
    background-color: #fff;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

    .preset-station-names {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .preset-station-name-item {
        padding: 4px 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 5px;
        user-select: none;
        font-size: 12px;
      }
    }
  }
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