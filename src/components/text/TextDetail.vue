<template>
  <div class="text-style-detail">
    <el-tabs
      v-model="activeName"
      type="card"
      class="demo-tabs"
    >
      <el-tab-pane label="样式" name="style">
        <el-form :model="props.text.style" class="demo-form-inline">
          <el-form-item label="文本颜色">
            <ColorPickerWithPreset v-model:color="props.text.style.textColor" title="文本颜色" @change="refreshTarget" />
          </el-form-item>
          <el-form-item label="字号">
            <el-input
              v-model="props.text.style.fontSize"
              type="number"
              style="width: 150px;"
              @blur="refreshTarget"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox
              v-model="props.text.style.withBg"
              @change="refreshTarget"
              style="margin-right: 10px;"
            >
              设置背景
            </el-checkbox>
            <ColorPickerWithPreset v-if="props.text.style.withBg" v-model:color="props.text.style.bgColor" title="填充颜色" @change="refreshTarget" />
          </el-form-item>
          <el-form-item>
            <el-checkbox
              v-model="props.text.style.withBorder"
              @change="refreshTarget"
              style="margin-right: 10px;"
            >
              设置边框
            </el-checkbox>
            <ColorPickerWithPreset v-if="props.text.style.withBorder" v-model:color="props.text.style.borderColor" title="边框颜色" @change="refreshTarget" />
          </el-form-item>

          <template  v-if="props.text.style.withBg || props.text.style.withBorder">
            <el-form-item label="边距">
              <el-input
                v-model="props.text.style.padding"
                style="width: 150px;"
                @blur="refreshTarget"
              />
            </el-form-item>
            
            <el-form-item label="圆角">
              <el-input
                v-model="props.text.style.borderRadius"
                style="width: 150px;"
                @blur="refreshTarget"
              />
            </el-form-item>
          </template>

          <el-form-item label="文本内容">
            <el-input
              v-model="props.text.content"
              type="textarea"
              :rows="2"
              style="width: 250px;"
              @change="(val) => {props.text.modifyContent(val)}"
            />
          </el-form-item>
        </el-form>
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
  text: {
    type: Object,
    default: () => ({})
  },
})

const refreshTarget = () => {
  props.text.display()
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