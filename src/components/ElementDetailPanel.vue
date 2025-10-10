<template>
  <div class="element-detail-panel" v-if="visible">
    <div class="dialog-header">
      <el-input
        v-model="nameToShow"
        style="width: 250px;"
      >
        <template #prepend>名称</template>
      </el-input>
    </div>
    <div class="dialog-content">
      <template v-if="selectedElement.id.includes('line')">
        <!-- <LineSetting :setting="selectedElement.settings" :target="selectedElement" /> -->
        <LineDetail :line="selectedElement" />
      </template>
      <template v-else-if="selectedElement.id.includes('station')">
        <!-- <StationSetting :targetSetting="selectedElement.settings" /> -->
        <StationDetail :station="selectedElement" />
      </template>
      <template v-else-if="selectedElement.id.includes('text')">
        <TextSetting :targetSetting="selectedElement.settings" />
      </template>
    </div>
    <div class="close-btn" @click="closeDialog">×</div>
    <slot />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import LineSetting from '@/components/LineSetting.vue'
import StationSetting from '@/components/StationSetting.vue'
import TextSetting from '@/components/TextSetting.vue'
import LineDetail from '@/components/line/LineDetail.vue'
import StationDetail from '@/components/station/StationDetail.vue'

// drawStore
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { selectedElement } = storeToRefs(drawStore)

const nameToShow = computed({
  get() {
    return selectedElement.value.name || '未命名'
  },
  set(val) {
    selectedElement.value.name = val
  }
})

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // target: {
  //   type: Object,
  //   default: () => ({})
  // },
})

const emit = defineEmits(['close', 'update:visible'])

const closeDialog = () => {
  emit('close')
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.element-detail-panel {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  position: fixed;
  top: 100px;
  right: 20px;
  width: 350px;
  height: calc(100vh - 180px);
  overflow: auto;
  z-index: 500;
  // display: flex;
  // flex-direction: column;
  // align-items: flex-start;

  .dialog-header {
    font-size: 22px;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 20px;
    cursor: pointer;

    &:hover {
      transform: scale(1.3);
      color: #1772b4;
    }
  }
}

</style>