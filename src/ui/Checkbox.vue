<template>
  <div class="custom-checkbox" :class="{'label-inner': props.labelInner}">
    <div
      class="checkbox-box"
      :class="{ 'checked': !!props.modelValue }"
      @click="toggleChecked"
    ></div>
    
    <!-- 前置标签 -->
    <label v-if="props.label" class="my-input-label">
      {{ props.label }}
    </label>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

// 定义 props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
})

// 定义 emits
const emit = defineEmits(['update:modelValue', 'change'])

function toggleChecked () {
  emit('update:modelValue', !props.modelValue)
  emit('change', !props.modelValue)
}
</script>

<style lang="scss" scoped>
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #333;
  min-height: 34px;

  /* 盒子本体 */
  .checkbox-box {
    width: 20px;
    height: 20px;
    border: 2px solid #d0d5dd;
    border-radius: 4px;
    position: relative;
    // transition: all 0.2s ease;
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 1px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) scale(0);
      transition: transform 0.2s ease;
    }

    &.checked {
      background-color: #8de0ff;
      border-color: #8de0ff;
      &::after {
        transform: rotate(45deg) scale(1);
      }
    }
  }

  &:hover .checkbox-box {
    border-color: #1772b4;
    // transform: scale(1.05);
  }
}
</style>