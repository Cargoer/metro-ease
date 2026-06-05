<template>
  <div class="layout" v-if="visible">
    <div class="dialog-container">
      <div class="dialog-header">
        {{ title }}
      </div>
      <div class="close-btn" @click="closeDialog">×</div>
      <slot />
      <div class="dialog-footer" v-if="withButton">
        <el-button type="primary" @click="confirmDialog">确定</el-button>
        <el-button type="primary" @click="closeDialog">取消</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  withButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'update:visible'])

const closeDialog = () => {
  emit('close')
  emit('update:visible', false)
}

const confirmDialog = () => {
  emit('confirm')
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.layout {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.dialog-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  position: relative;
  min-width: 400px;

  .dialog-header {
    font-size: 22px;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 20px;
    cursor: pointer;

    &:hover {
      transform: scale(1.3);
      color: #1772b4;
    }
  }
}

@media screen and (max-width: 500px) {
  .dialog-container {
    min-width: 100px;
    width: 80vw;
  }
}

</style>