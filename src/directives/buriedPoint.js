import { increaseCount } from '@/request/airtable.js';

const clickCounter = {
  mounted(el, binding) {
    el.addEventListener('click', async () => {
      // 这里可以将点击次数发送到服务器进行存储和统计，例如使用 axios 发送请求
      await increaseCount('count_report', binding.value);
    });
  }
};

export default clickCounter;