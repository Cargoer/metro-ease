<template>
  <div class="my-select-wrapper" :class="{'label-inner': props.labelInner}">
    <!-- 前置标签 -->
    <Label v-if="props.label" :width="props.labelWidth">{{ props.label }}</Label>

    <select
      ref="selectRef"
      v-model="selectValue"
      class="my-select"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :style="wrapperStyle"
      @change="handleChange"
    >
      <option v-for="item in props.options.filter(item => (item.show === undefined || !!item.show))" :key="item.value" :value="item.value">
        {{ item.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref, onMounted } from 'vue'

// 定义 props
const props = defineProps({
  modelValue: {
    type: String,
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
  options: {
    type: Array,
    default: () => []
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
const selectRef = ref(null)

// 定义 emits
const emit = defineEmits(['update:modelValue', 'change'])

// 双向绑定处理
const selectValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

// 外部可接收原生blur事件（可选）
const handleChange = (e) => {
  emit('change', e)
  selectRef.value.blur()
}

// 宽度样式
const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? props.width + 'px' : props.width
}))
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.my-select-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  // margin-bottom: var(--form-gap);
  box-sizing: border-box;

  &.label-inner {
    border-radius: 4px;
    background-color: #f5f7fa;
    padding-left: 10px;

    .my-select {
      border-radius: 0 4px 4px 0;
      border-color: #f5f7fa;
    }
  }

  .my-select-label {
    white-space: nowrap;
    color: #1772b4;
    font-weight: 500;
    font-size: 14px;
  }

  .my-select {
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
  .my-select-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .my-select {
    width: 100%;
    padding: 12px 14px;
    font-size: 15px;
  }
}
</style>