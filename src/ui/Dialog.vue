<template>
  <div class="dialog">
    <div class="content">
      <div class="dialog-title">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="scss">
.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 300px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
.dialog-header {
  padding: 20px;
  border-bottom: 1px solid #ccc;
}
.dialog-title {
  font-size: 20px;
  font-weight: bold;
}
</style>
