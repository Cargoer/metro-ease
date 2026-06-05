// 导入你的组件
import Select from './Select.vue'
import Input from './Input.vue'
import Checkbox from './Checkbox.vue'
import Row from './Row.vue'
import Column from './Column.vue'
import ColorPickerWithPreset from './ColorPickerWithPreset.vue'
import Dialog from './Dialog.vue'
import Label from './Label.vue'
import Slider from './Slider.vue'

// 自动全局注册
export default (app) => {
  app.component('Row', Row) // 名字随便起，建议大驼峰
  app.component('Column', Column) // 名字随便起，建议大驼峰
  app.component('Checkbox', Checkbox) // 名字随便起，建议大驼峰
  app.component('Select', Select) // 名字随便起，建议大驼峰
  app.component('Input', Input) // 名字随便起，建议大驼峰
  app.component('Label', Label) // 名字随便起，建议大驼峰
  app.component('ColorPickerWithPreset', ColorPickerWithPreset) // 名字随便起，建议大驼峰
  app.component('Dialog', Dialog) // 名字随便起，建议大驼峰
  app.component('Slider', Slider) // 名字随便起，建议大驼峰
}