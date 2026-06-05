<template>
  <div class="statistics">
    <Input v-model="keyword" placeholder="搜索" style="margin-bottom: 10px;" />
    <Row>
      <div class="fc map">
        <div class="map-item" v-for="char in sortedCharSet.filter(char => !keyword || char.includes(keyword))" :key="char" @click="selectedChar = char">
          <span>{{ char }}</span><span>{{ charSet[char].length }}</span>
        </div>
      </div>
      <div v-if="selectedChar" class="stationNames">
        <div v-for="stationName in charSet[selectedChar]" :key="stationName" v-html="displayHighlight(stationName)">
        </div>
      </div>
    </Row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { svg } = storeToRefs(drawStore)

const charSet = {}
let sortedCharSet = ref([])
const selectedChar = ref('')
const keyword = ref('')

const displayHighlight = computed(() => {
  return (name) => {
    return name.replace(selectedChar.value, `<span style="color: red;">${selectedChar.value}</span>`)
  }
})

onMounted(() => {
  Object.values(svg.value.stationMap).forEach(station => {
    for (const char of station.name) {
      if (!charSet[char]) {
        charSet[char] = []
      }
      charSet[char].push(station.name)
    }
  })
  sortedCharSet.value = Object.keys(charSet).sort((a, b) => charSet[b].length - charSet[a].length)
})
</script>

<style lang="scss" scoped>
.statistics {
  // max-height: 400px;
  // overflow: auto;
  gap: 10px;

  .map {
    max-height: 400px;
    overflow: auto;
    padding: 5px;
    box-sizing: border-box;
    .map-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 18px;
      cursor: pointer;
      padding: 5px 0;
      border-bottom: 1px solid #ccc;
      span {
        width: 60px;
      }
    }
  }
  .stationNames {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 5px;
    width: 300px;
    max-height: 400px;
    overflow: auto;
  }
}
</style>
