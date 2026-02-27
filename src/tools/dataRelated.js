import { ElMessage, ElMessageBox } from 'element-plus'
import Station from '@/model/station.js'
import Line from '@/model/line.js'
import { Group, Text } from '@/model/element.js'

// 绘图相关的全局变量
// import { useDrawStore } from '@/store/drawStore.js'
// const drawStore = useDrawStore()

function getSvgData (ele) {
  if (!ele.children) return { ...ele.compress() }
  const result = ele.compress() || {}
  result.children = {}
  for (const [id, child] of Object.entries(ele.children)) {
    result.children[id] = getSvgData(child)
  }
  return result
}

export function exportJsonByInstance (ele, bgSetting) {
  const json = {
    bgSetting,
    data: getSvgData(ele),
  }
  exportJson(json)
}

/**
 * 导出JSON数据为文件
 * @param data 要导出的数据
 * @param filename 导出的文件名（不含扩展名）
 */
export function exportJson(data, filename = '我的地铁图数据') {
  try {
    // 将数据转换为JSON字符串，缩进2个空格
    const jsonStr = JSON.stringify(data, null, 2);
    // 创建Blob对象
    const blob = new Blob([jsonStr], { type: 'application/json' });

    ElMessageBox.prompt('输入项目名称', '保存为JSON数据', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputValue: '我的地铁图数据',
      // 通过正则校验输入内容不为空
      inputPattern: /\S+/,
      inputErrorMessage: '请输入名称',
    })
      .then(({ value }) => {
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${value}.json`;
        // 模拟点击下载
        document.body.appendChild(a);
        a.click();
        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // 提示用户导出成功
        ElMessage.success('导出JSON数据成功');
        return true;
      })
      .catch(() => {
        return false;
      });
  } catch (error) {
    console.error('导出JSON失败:', error);
    // 提示用户导出失败
    ElMessage.error('导出JSON数据失败');
    return false;
  }
}

function addInstance (parentNode, instance) {
  if (!instance.children) {
    if (instance.id.includes('station')) {
      return new Station(parentNode, instance)
    } else if (instance.id.includes('line') || instance.id.includes('edge')) {
      return new Line(parentNode, instance)
    } else if (instance.id.includes('text')) {
      return new Text(parentNode, instance)
    }
  }
  const gInstance = parentNode.children[instance.id] || new Group(parentNode, instance)
  for (const [id, child] of Object.entries(instance.children)) {
    addInstance(gInstance, child)
  }
  return gInstance
}

export function importJson(data, svgNode) {
  try {
    svgNode.parent.loadBackground(data.bgSetting)
    addInstance(svgNode, data.data)
    ElMessage.success('导入JSON数据成功');
    return true;
  } catch (error) {
    console.error('导入JSON失败:', error);
    // 提示用户导入失败
    ElMessage.error('导入JSON数据失败');
    return false;
  }
}