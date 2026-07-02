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
      <el-tab-pane label="站点" name="stations" v-if="props.line.stations.length" class="station-tab fc">
        <div
          v-for="(station, index) in props.line.stations"
          :key="station.id"
          class="station-show fc"
        >
          <div v-if="index > 0" class="connection-part fr">
            <div 
              class="connection-line"
              :style="{
                'background-color': props.line.style.stroke,
                'color': getContrastTextColor(props.line.style.stroke),
              }"
            ></div>
            <div class="operation">
              <el-button type="primary" @click="setConnection(index, 'gray')">置灰</el-button>
              <el-button type="primary" @click="setConnection(index, 'hidden')">隐藏</el-button>
            </div>
          </div>
          <Row>
            <div 
              class="fc station-part"
              :style="{
                'background-color': props.line.style.stroke,
                'color': getContrastTextColor(props.line.style.stroke),
              }"
            >
              <div class="station-name">{{ station.name }}</div>
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
            <div>
              <el-button v-if="station.style.hidden" type="primary" @click="()=>station.show()">显示</el-button>
              <el-button v-else type="primary" @click="()=>station.hide()">隐藏</el-button>
            </div>
          </Row>
        </div>
      </el-tab-pane>
      <el-tab-pane label="节点" name="joints" v-if="props.line.joints.length" class="joint-tab fc">
        <div
          v-for="(joint, index) in reactiveJoints"
          :key="joint.id || index + 'j'"
          class="joint-show fc"
          :style="{
            '--line-color': props.line.style.stroke,
          }"
        >
          <div class="joint-related-station-name">{{ jointRelatedStationName(joint.relatedStationId) }}</div>
          <Row>
            <div 
              class="joint-dot"
              :class="{
                'with-connect-line': index > 0,
                'is-station': !!joint.relatedStationId,
              }"
              :style="{
                'background-color': props.line.style.stroke,
                'border-color': props.line.style.stroke,
              }"
              :station-name="jointRelatedStationName(joint.relatedStationId)"
            ></div>
            <Row>
              <Input v-model="joint.x" label="x" type="number" :width="80" @blur="handleJointMove(joint)" />
              <Input v-model="joint.y" label="y" type="number" :width="80" @blur="handleJointMove(joint)" />
            </Row>
          </Row>
        </div>
      </el-tab-pane>
      <el-tab-pane label="更多信息" name="info">
        <InfoDisplay :infoObj="props.line.info" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import InfoDisplay from '@/components/InfoDisplay.vue'
import { getContrastTextColor, generateUniqueId } from '@/tools/utils'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { selectedElement, svg } = storeToRefs(drawStore)

const activeName = ref('style')
const inputAndSelectWidth = '150px'

const jointRelatedStationName = computed(() => {
  return (relatedStationId) => relatedStationId ? props.line.stations.find(station => station.id === relatedStationId).name : ''
})

const props = defineProps({
  line: {
    type: Object,
    default: () => ({})
  },
})

const reactiveJoints = reactive(props.line.joints)

const refreshTarget = () => {
  props.line.refreshStyle()
  props.line.refreshSelect()
}

const handleJointMove = ({ x, y, relatedStationId }) => {
  props.line.refreshDom()
  props.line.refreshSelect()
  if (relatedStationId) {
    const station = Object.values(svg.value.stationMap).find(station => station.id === relatedStationId)
    if (station) {
      station.modifyPoints({
        'relatedLineId': props.line.id,
      }, { x, y })
    }
  }
}

const setConnection = (index, tag) => {
  const startIndex = props.line.joints.findIndex(joint => joint.relatedStationId === props.line.stations[index - 1].id)
  const endIndex = props.line.joints.findIndex(joint => joint.relatedStationId === props.line.stations[index].id)
  for (let i = startIndex + 1; i <= endIndex; i++) {
    props.line.joints[i].tag = tag
  }
  if (index === 1 || ['gray', 'hidden'].includes(props.line.joints[startIndex].tag)) {
    props.line.stations[index - 1].hide()
  } else if (index === props.line.stations.length - 1 || ['gray', 'hidden'].includes(props.line.joints[endIndex + 1].tag)) {
    props.line.stations[index].hide()
  }
  refreshTarget()
}

</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
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

.station-tab {
  position: relative;
  align-items: flex-start;
  gap: 0;
  width: 100%;

  .station-show {
    align-items: flex-start;
    gap: 0;

    .station-part {
      display: flex;
      position: relative;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      width: 100%;
      padding: 8px 12px;
      box-sizing: border-box;
      user-select: none;
      gap: 8px;
      width: 104px;

      .transfers {
        // position: absolute;
        gap: 2px;
        // top: 8px;
        // right: 8px;
        transform: translateY(-50%);
      }
    }

    .connection-part {
      align-items: center;
      gap: 8px;

      .connection-line {
        margin: 0 47px;
        width: 10px;
        height: 50px;
        background-color: #fff;
      }
    }
    
  }
}

.joint-tab {
  .joint-show {
    height: 50px;
    position: relative;
    padding-left: 50px;

    .joint-related-station-name {
      position: absolute;
      top: 45%;
      left: 0px;
      transform: translateY(-60%);
      font-size: 12px;
      color: var(--line-color);
      max-width: 40px;
      text-align: right;
      // 文字超出换行
      word-wrap: break-word;
      word-break: normal;
    }

    .joint-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      position: relative;

      &.with-connect-line::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -100%);
        width: 5px;
        height: 50px;
        background-color: inherit;
      }

      &.is-station::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 18px;
        height: 18px;
        background-color: none;
        border: 2px solid #fff;
        border-color: inherit;
        border-radius: 50%;
      }
    }

    
  }
  
}


</style>