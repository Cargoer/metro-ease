<template>
  <div class="guess-station fr">
    <Column>
      <Input ref="keywordRef" v-model="curGuess" placeholder="输入猜测" style="margin-bottom: 10px;" />
      <div class="fc match">
        <div class="match-item" v-for="station in allStationNames.filter(s => !curGuess || s.name.includes(curGuess))" :key="station.name" @click="compareGuess(station)">
          <span>{{ station.name }}</span>
        </div>
      </div>
      
    </Column>
    <Column align="flex-start" style="max-height: 600px; overflow: auto;">
      <div v-for="(chain, index) in guessChains" class="fr guess-round" :key="index">
        <div 
          v-for="item in chain" 
          :key="item.char"
          class="guess-char"
          :style="{
            color: item.charCorrect ? (item.positionCorrect ? 'rgb(179, 225, 157)' : 'rgb(243, 209, 158)') : 'rgb(250, 182, 182)',
            backgroundColor: item.charCorrect ? (item.positionCorrect ? 'rgba(179, 225, 157, 0.5)' : 'rgba(243, 209, 158, 0.5)') : 'rgba(250, 182, 182, 0.5)',
            borderRadius: '5px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: item.charCorrect ? (item.positionCorrect ? 'rgb(179, 225, 157)' : 'rgb(243, 209, 158)') : 'rgb(250, 182, 182)',
          }"
          v-html="item.char"
        >
        </div>
      </div>
    </Column>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'

// 绘图相关的全局变量
import { useDrawStore } from '@/store/drawStore.js'
import { storeToRefs } from 'pinia'
const drawStore = useDrawStore()
const { svg } = storeToRefs(drawStore)

function compareGuess(curGuessStation) {
  const curGuessResult = []
  curGuessResult.push({
    char: curGuessStation.lines.join('<br>'),
    charCorrect: targetStation.value.lines.some(line => curGuessStation.lines.includes(line)),
    positionCorrect: true
  })
  for (const char of curGuessStation.name) {
    curGuessResult.push({
      char,
      charCorrect: targetStation.value.name.includes(char),
      positionCorrect: targetStation.value.name.indexOf(char) === curGuessStation.name.indexOf(char)
    })
  }
  guessChains.value.unshift(curGuessResult)
}

let allStationNames = ref([])
let targetStation = ref({})
const curGuess = ref('')
const guessChains = ref([])
onMounted(() => {
  allStationNames.value = Object.values(svg.value.stationMap).map(station => ({ name: station.name, lines: station.lines.map(line => line.name) }))
  // 随机选择一个站名作为目标站名
  targetStation.value = allStationNames.value[Math.floor(Math.random() * allStationNames.value.length)]
})
</script>

<style lang="scss" scoped>
.guess-station {
  // max-height: 400px;
  // overflow: auto;
  gap: 10px;

  .match {
    max-height: 400px;
    overflow: auto;
    padding: 5px;
    box-sizing: border-box;
    .match-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 18px;
      cursor: pointer;
      padding: 5px 0;
      border-bottom: 1px solid #ccc;
      span {
        width: 120px;
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

  .guess-round {
    gap: 5px;

    .guess-char {
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 24px;
    }
   }
}
</style>
