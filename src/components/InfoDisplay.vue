<template>
  <div class="info-display fc" style="margin-top: 15px; gap: 10px;">
    <div v-for="(value, key) in props.infoObj" :key="key">
      <div class="info-item" v-if="typeof value === 'string'">
        <el-input
          :value="value"
          style="width: 300px;"
          @change="(val) => props.infoObj[key] = val"
        >
          <template #prepend>{{ key }}</template>
        </el-input>
      </div>
    </div>
    <div class="add-info-area fr">
      <el-input
        v-if="isAdding"
        v-model="newInfoKey"
        style="width: 100px;"
        placeholder="键"
      />
      <el-input
        v-if="isAdding"
        v-model="newInfoValue"
        style="width: 100px;"
        placeholder="值"
      />
      <el-button @click="addInfoItem">{{ isAdding ? '确定' : '新增键值对' }}</el-button>
      <el-button v-if="isAdding" @click="isAdding.value = false">取消</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, defineProps } from 'vue'
import { useDrawStore } from '@/store/drawStore'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { selectedElement } = storeToRefs(drawStore)

import { ElMessage } from 'element-plus'

import * as d3 from 'd3'

import { CirclePlus } from '@element-plus/icons-vue'

const props = defineProps({
  infoObj: {
    type: Object,
    default: () => ({})
  }
})

const isAdding = ref(false)
const newInfoKey = ref('')
const newInfoValue = ref('')
function addInfoItem () {
  if (isAdding.value) {
    if (newInfoKey.value && newInfoValue.value) {
      props.infoObj[newInfoKey.value] = newInfoValue.value
      newInfoKey.value = ''
      newInfoValue.value = ''
      isAdding.value = false
    } else {
      ElMessage.error('请输入键值对')
    }
  } else {
    isAdding.value = true
  }
}

</script>

<style lang="scss" scoped>
:deep(.el-input-group__append) {
  padding: 0 10px;
  background: '#fff';
}
:deep(.el-input-group__prepend) {
  padding: 0 10px;
  background: '#fff';
}
</style>