<template>
  <div class="my-input-wrapper" :class="{'label-inner': props.labelInner, 'textarea': props.type === 'textarea'}">
    <!-- 前置标签 -->
    <Label v-if="props.label" :width="props.labelWidth">{{ props.label }}</Label>

    <input
      v-if="props.type !== 'textarea'"
      ref="inputRef"
      v-model="inputValue"
      class="my-input"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :type="props.type"
      :style="wrapperStyle"
      @blur="handleBlur"
    />

    <textarea
      v-else
      ref="inputRef"
      v-model="inputValue"
      class="my-input"
      rows="5"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :type="props.type"
      :style="wrapperStyle"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref, onMounted } from 'vue'

// 定义 props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '100%'
  },
  placeholder: {
    type: String,
    default: '请输入内容'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'text'
  },
  labelInner: {
    type: Boolean,
    default: false
  },
  labelWidth: {
    type: String,
    default: null
  }
})

// 定义 ref
const inputRef = ref(null)

// 定义 emits
const emit = defineEmits(['update:modelValue', 'blur'])

// 双向绑定处理
const inputValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

// 外部可接收原生blur事件（可选）
const handleBlur = (e) => {
  emit('blur', e)
}

// 宽度样式
const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? props.width + 'px' : props.width
}))

onMounted(() => {
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && props.type !== 'textarea') {
      handleBlur(e)
      inputRef.value && inputRef.value.blur()
    } else if (e.key === 'Tab') {
      e.preventDefault()
    }
  })
})
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.my-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  // margin-bottom: var(--form-gap);
  box-sizing: border-box;
  position: relative;

  &.textarea {
    align-items: flex-start;
  }

  &.label-inner {
    border-radius: 4px;
    background-color: #f5f7fa;
    padding-left: 10px;

    .my-input {
      border-radius: 0 4px 4px 0;
      border-color: #f5f7fa;
    }
  }

  .my-input-label {
    white-space: nowrap;
    color: #1772b4;
    font-weight: 500;
    font-size: 14px;
  }

  .my-input {
    flex-shrink: 0;
    padding: 6px 10px;
    border: 2px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    background-color: #fff;
    transition: all 0.25s ease;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: #1772b4;
      border-width: 2px;
      // box-shadow: 0 0 0 3px rgba(141, 224, 255, 0.4);
      background-color: #fff;
    }

    &:disabled {
      background-color: #eef7fb;
      color: #999;
      cursor: not-allowed;
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .my-input-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .my-input {
    width: 100%;
    padding: 12px 14px;
    font-size: 15px;
  }
}
</style>