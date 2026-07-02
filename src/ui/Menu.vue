<template>
  <div class="menu">
    <div
      v-for="item in menuItems" 
      :key="item.text"
      class="menu-item"
    >
      <div class="menu-item-text" @click.stop="item.func(item)">
        {{ item.text }}
      </div>
      <div
        v-if="item.showSubItems"
        class="menu-item-sub"
      >
        <div
          v-for="subItem in item.subItems"
          :key="subItem.text"
          class="menu-item-sub-item"
          @click.stop="() => { item.showSubItems = false; subItem.func(); }"
        >
          {{ subItem.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const props = defineProps({
  menuItems: {
    type: Array,
    default: () => reactive([
      {
        text: '项目',
        showSubItems: false,
        func: (item) => {
          item.showSubItems = !item.showSubItems
        },
        subItems: [
          {
            text: '导入项目',
            func: () => {
              console.log('导入项目')
            }
          },
          {
            text: '导出项目',
            func: () => {
              console.log('导出项目')
            }
          },
          {
            text: '保存为图片',
            func: () => {
              console.log('保存为图片')
            }
          }
        ]
      },
      {
        text: '导入底图',
        func: () => {
          console.log('导入底图')
        }
      },
      {
        text: '画布',
        showSubItems: false,
        func: (item) => {
          item.showSubItems = !item.showSubItems
        },
        subItems: [
          {
            text: '添加画布',
            func: () => {
              console.log('添加画布')
            }
          },
          {
            text: '管理画布',
            func: () => {
              console.log('管理画布')
            }
          }
        ]
      },
      {
        text: '帮助',
        func: () => {
          console.log('帮助')
        }
      }
    ])
  }
})

onMounted(() => {
  // 给所有.menu-item添加点击事件
  const menuItems = document.querySelectorAll('.menu-item')
  menuItems.forEach((item, index) => {
    item.addEventListener('mouseenter', (e) => {
      e.stopPropagation()
      if (props.menuItems[index].subItems) {
        props.menuItems[index].showSubItems = true
      }
      // props.menuItems.forEach((item, i) => {
      //   if (i !== index) {
      //     item.showSubItems = false
      //   }
      // })
    })
    item.addEventListener('mouseleave', (e) => {
      e.stopPropagation()
      props.menuItems[index].showSubItems = false
      // props.menuItems.forEach((item, i) => {
      //   if (i !== index) {
      //     item.showSubItems = false
      //   }
      // })
    })
  })
})
</script>

<style lang="scss" scoped>
.menu {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #8de0ff;
  border-radius: 4px;
  padding: 0 10px;

  .menu-item {
    font-size: 18px;
    color: #224466;
    padding: 4px 8px;
    border-radius: 4px 4px 0 0;
    position: relative;
    cursor: pointer;

    &:hover {
      background-color: #1772b4;
      color: #fff;
    }

    &:active {
      background-color: #1772b4;
      color: #fff;
    }

    .menu-item-sub {
      position: absolute;
      width: 120px;
      top: 100%;
      left: 0;
      background-color: #1772b4;
      border-radius: 0 0 4px 4px;
      padding: 8px 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .menu-item-sub-item {
        font-size: 16px;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
      }
      .menu-item-sub-item:hover {
        background-color: #8de0ff;
        color: #224466;
      }
      .menu-item-sub-item:active {
        background-color: #8de0ff;
        color: #224466;
      }
    }
  }
}
</style>
