<template>
  <div class="text-style-detail">
    <el-tabs
      v-model="activeName"
      type="card"
      class="demo-tabs"
    >
      <el-tab-pane label="样式" name="style">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <ColorPickerWithPreset 
            v-model:color="props.text.style.textColor" 
            label="文本颜色" 
            @change="refreshTarget" 
          />
          <Input 
            v-model="props.text.style.fontSize"
            type="number"
            label="字号"
            width="150px"
            @blur="refreshTarget"
          />
          <Input 
            v-model="props.text.style.lineHeight"
            type="number"
            label="行高"
            width="150px"
            @blur="refreshTarget"
          />
          <Row>
            <Checkbox v-model="props.text.style.withBg" label="背景" @change="refreshTarget" />
            <ColorPickerWithPreset v-if="props.text.style.withBg" v-model:color="props.text.style.bgColor" title="填充颜色" @change="refreshTarget" />
          </Row>
          <Row>
            <Checkbox v-model="props.text.style.withBorder" label="边框" @change="refreshTarget" />
            <ColorPickerWithPreset v-if="props.text.style.withBorder" v-model:color="props.text.style.borderColor" title="边框颜色" @change="refreshTarget" />
          </Row>
          <template v-if="props.text.style.withBg || props.text.style.withBorder">
            <Input 
              v-model="props.text.style.padding"
              label="边距"
              width="150px"
              @blur="refreshTarget"
            />
            <Input 
              v-model="props.text.style.borderRadius"
              label="圆角"
              width="150px"
              @blur="refreshTarget"
            />
          </template>
          <Input 
            v-model="props.text.content"
            type="textarea"
            label="文本内容"
            width="230px"
            @blur="refreshTarget"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'

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