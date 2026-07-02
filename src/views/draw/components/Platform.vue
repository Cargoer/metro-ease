<template>
  <div class="platform">
    
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps(['name'])
</script>

<style lang="scss" scoped>
.platform {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: red;
  border-radius: 50%;
}
</style>