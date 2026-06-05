import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import moment from 'moment'
import { messageBoxInput } from '@/tools/interact'
import { exportJson } from '@/tools/dataRelated'
import { getRoundCornerD, getRectByPoints } from '@/tools/svgRelated'
import * as d3 from 'd3'
import { useElementMover } from '@/tools/svgMover'
import { id } from 'element-plus/es/locales.mjs'

export const useLineStore = defineStore('line', () => {
  const presetStationNames = ref([])

  function setPresetStationNames (str) {
    if (str === 'clear') {
      presetStationNames.value = []
    } else {
      presetStationNames.value = [ ...presetStationNames.value, ...str.split(' ') ]
    }
  }
  
  function removePresetStationName (name) {
    presetStationNames.value = presetStationNames.value.filter(n => n !== name)
  }
  
  return {
    presetStationNames,
    setPresetStationNames,
    removePresetStationName
  }
})