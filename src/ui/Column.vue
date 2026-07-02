<template>
  <div 
    class="column" 
    :id="cid"
    :style="{ gap: props.gap, alignItems: props.align }"
    ref="slotRef"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, watch, useSlots, ref, nextTick } from 'vue'
import { generateUniqueId} from '@/tools/utils'

const cid = 'column-' + generateUniqueId()
const slotRef = ref(null)

// 核心：每次渲染更新 key
const slotKey = ref(0)
defineExpose({
  $forceUpdate: () => {
    slotKey.value++
  }
})

const props = defineProps({
  gap: {
    type: String,
    default: '10px'
  },
  align: {
    type: String,
    default: 'center'
  },
  formed: {
    type: Boolean,
    default: false
  },
  labelWidth: {
    type: [String, Number],
    default: null
  },
  formItemWidth: {
    type: [String, Number],
    default: null
  }
})

function adjustLabelWidth() {
  const labels = document.querySelectorAll(`#${cid} label`)
  labels.forEach(label => {
    label.style.width = typeof props.labelWidth === 'number' ? props.labelWidth + 'px' : props.labelWidth
  })
}

function adjustFormItemWidth() {
  document.querySelectorAll(`#${cid} input`).forEach(input => {
    input.style.width = typeof props.formItemWidth === 'number' ? props.formItemWidth + 'px' : props.formItemWidth
  })
  document.querySelectorAll(`#${cid} select`).forEach(select => {
    select.style.width = typeof props.formItemWidth === 'number' ? props.formItemWidth + 'px' : props.formItemWidth
  })
}

function adjustForm() {
  if (props.formed) {
    if (props.labelWidth) {
      adjustLabelWidth()
    }
    if (props.formItemWidth) {
      adjustFormItemWidth()
    }
  }
}

let observer = null
onMounted(() => {
  adjustForm()
  observer = new MutationObserver(() => {
    // ✅ v-if 切换一定会触发这里！    
    nextTick(() => {
      adjustForm()
    })
  })

  observer.observe(slotRef.value, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  })
})
</script>

<style lang="scss" scoped>
.column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
</style>