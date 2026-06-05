<template>
  <div class="custom-slider" :class="{ disabled }">
    <!-- 前置标签 -->
    <Label v-if="props.label" :width="props.labelWidth">{{ props.label }}</Label>
    <!-- 轨道 -->
    <div class="slider-track" @click="handleTrackClick">
      <!-- 已选中进度条 -->
      <div 
        class="slider-fill"
        :style="{ width: fillWidth + '%' }"
      ></div>
      <!-- 滑块 -->
      <div
        class="slider-thumb"
        :style="{ left: fillWidth + '%' }"
        @mousedown="handleMouseDown"
      ></div>
      <div
        class="slider-value"
        :style="{ left: fillWidth + '%' }"
      >{{ props.modelValue }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 接收 props
const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  disabled: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  labelWidth: {
    type: String,
    default: null
  },
})

// 触发更新事件
const emit = defineEmits(['update:modelValue', 'change'])

// 计算当前百分比
const fillWidth = computed(() => {
  const range = props.max - props.min
  if (range === 0) return 0
  return ((props.modelValue - props.min) / range) * 100
})

// 鼠标拖拽状态
const isDragging = ref(false)

const fixValue = (num) => {
  return Math.round(num * 1000) / 1000
}

// 根据位置计算数值
const calcValue = (clientX) => {
  const track = document.querySelector('.slider-track')
  if (!track) return props.modelValue

  const rect = track.getBoundingClientRect()
  let percent = (clientX - rect.left) / rect.width
  percent = Math.max(0, Math.min(1, percent))

  // 计算原始值 + 步长取整
  let rawVal = props.min + percent * (props.max - props.min)
  const steppedVal = Math.round(rawVal / props.step) * props.step
  // 限制区间
  return fixValue(Math.max(props.min, Math.min(props.max, steppedVal)))
}

// 更新值并触发 v-model
const updateValue = (val) => {
  if (val !== props.modelValue) {
    emit('update:modelValue', val)
    emit('change', val)
  }
}

// 点击轨道跳转
const handleTrackClick = (e) => {
  if (props.disabled) return
  const val = calcValue(e.clientX)
  updateValue(val)
}

// 按下滑块
const handleMouseDown = () => {
  if (props.disabled) return
  isDragging.value = true
}

// 拖拽移动
const handleMouseMove = (e) => {
  if (!isDragging.value || props.disabled) return
  const val = calcValue(e.clientX)
  updateValue(val)
}

// 松开结束拖拽
const handleMouseUp = () => {
  isDragging.value = false
}

// 全局监听鼠标事件
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.custom-slider {
  width: 100%;
  height: 6px;
  padding: 10px 0;
  cursor: pointer;
  user-select: none;
}

.slider-track {
  position: relative;
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin: 0 10px;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #409eff;
  border-radius: 3px;
  transform-origin: left center;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.1s;
}

.slider-thumb:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.slider-value {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -120%);
  font-size: 12px;
  color: #224466;
}



/* 禁用样式 */
.custom-slider.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>