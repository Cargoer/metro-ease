<template>
  <div class="row" :style="{ gap: props.gap }">
    <Label v-if="props.label" :width="props.labelWidth">{{ props.label }}</Label>
    <slot></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  gap: {
    type: String,
    default: '10px'
  },
  label: {
    type: String,
    default: ''
  },
  labelWidth: {
    type: String,
    default: null
  }
})
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;

  .label {
    white-space: nowrap;
    color: #1772b4;
    font-weight: 500;
    font-size: 14px;
  }
}
</style>