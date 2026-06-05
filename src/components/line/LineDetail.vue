<template>
  <div class="line-style-detail">
    <el-tabs
      v-model="activeName"
      type="card"
      class="demo-tabs"
    >
      <el-tab-pane label="样式" name="style">
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <ColorPickerWithPreset 
            v-model:color="props.line.style.stroke" 
            label="路径颜色"
            title="边框颜色" @change="refreshTarget" 
          />
          <ColorPickerWithPreset 
            v-model:color="props.line.style.fill" 
            label="填充颜色"
            title="填充颜色" @change="refreshTarget" 
          />
          <Input
            v-model="props.line.style.strokeWidth"
            type="number"
            label="路径线宽"
            :width="inputAndSelectWidth"
            @blur="refreshTarget"
          />
          <Select
            v-model="props.line.style.pattern"
            placeholder="请选择路线样式"
            :width="inputAndSelectWidth"
            label="路线样式"
            @change="refreshTarget"
            :options="[
              { label: '默认', value: 'default' },
              { label: '虚线', value: 'dashed' },
              { label: '快线', value: 'fastline' },
              { label: '铁路', value: 'railway' },
            ]"
          />
          <div
            v-if="['dashed', 'railway', 'fastline'].includes(props.line.style.pattern)" 
            style="border-left: 2px solid #1772b4; border-radius: 4px; padding-left: 10px; margin-bottom: 10px;"
          >
            <Input
              v-if="['dashed', 'railway'].includes(props.line.style.pattern)"
              v-model="props.line.style.dashArray"
              label="虚线间隔"
              :width="inputAndSelectWidth"
              @blur="refreshTarget"
            />
            <Input
              v-if="['fastline', 'railway'].includes(props.line.style.pattern)"
              v-model="props.line.style.innerStrokePercent"
              label="内线占比"
              :width="inputAndSelectWidth"
              @blur="refreshTarget"
            />
          </div>

          <Input
            v-model="props.line.style.roundCornerRadius"
            label="圆角半径"
            :width="inputAndSelectWidth"
            type="number"
            @blur="refreshTarget"
          />
        </div>
        
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
              v-for="line in station.lines.filter(line => line?.id !== props.line.id)" 
              :key="line?.id + 't'"
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
        <InfoDisplay :infoObj="props.line.info" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InfoDisplay from '@/components/InfoDisplay.vue'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { selectedElement } = storeToRefs(drawStore)

const activeName = ref('style')
const inputAndSelectWidth = '150px'

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