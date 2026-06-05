<template>
  <label 
    class="my-label" 
    :style="{ width: props.width }"
  >
    <slot></slot>
  </label>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  width: {
    type: String,
    default: 'auto'
  }
})
</script>

<style lang="scss" scoped>
.my-label {
  white-space: nowrap;
  color: #1772b4;
  font-weight: 500;
  font-size: 16px;
  text-align: right;
}
</style>
