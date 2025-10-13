import { ElMessageBox } from 'element-plus'

export async function messageBoxInput (title, tip, defaultValue) {
  return new Promise((resolve, reject) => {
    ElMessageBox.prompt(title, tip, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: defaultValue,
      // 通过正则校验输入内容不为空
      inputPattern: /\S+/,
      inputErrorMessage: '请输入名称',
    }).then(({ value }) => {
      resolve(value)
    }).catch(() => {
      reject()
    })
  })
}