// airtableUtils.js
import axios from 'axios';

// 配置 Airtable 基础信息
const AIRTABLE_BASE_ID = import.meta.env.VITE_APP_AIRTABLE_BASE_ID || ''
const AIRTABLE_API_KEY = import.meta.env.VITE_APP_AIRTABLE_API_KEY || ''

/**
 * 通过 buriedPointId 查找记录的 recordId
 * @param {string} buriedPointId - 埋点ID
 * @returns {Promise<string>} - 找到的 recordId
 */
const getRecordIdByBuriedPointId = async (tableName, buriedPointId) => {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) return
  const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
  try {
    // 构建筛选条件：buriedPointId 等于目标值
    const filterFormula = `buriedPointId = '${buriedPointId}'`;
    const encodedFilter = encodeURIComponent(filterFormula);
    
    const response = await axios.get(`${AIRTABLE_API_URL}?filterByFormula=${encodedFilter}`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 检查是否找到记录
    if (response.data.records.length === 0) {
      throw new Error(`未找到 buriedPointId 为 ${buriedPointId} 的记录`);
    }

    // 返回第一个匹配记录的 ID（如果可能有多个，需根据业务逻辑处理）
    return response.data.records[0].id;

  } catch (error) {
    console.error('查询 recordId 失败:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 原子操作：自增指定记录的 count 字段（避免并发冲突）
 * 注意：原子操作已在2024年11月之后失效
 * @param {string} recordId - 记录的 ID
 * @param {number} step - 自增步长（默认1）
 * @returns {Promise<Object>} - 更新后的记录数据
 */
export const atomicIncreaseCount = async (tableName, buriedPointId, step = 1) => {
  const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
  try {
    // 先根据 buriedPointId 查询 recordId
    const recordId = await getRecordIdByBuriedPointId(tableName, buriedPointId);
    
    const updateResponse = await axios.patch(
      `${AIRTABLE_API_URL}/${recordId}`,
      {
        fields: {
          // 使用 Airtable 的 increment 操作符，实现原子自增
          count: {
            _increment: Number(step)
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`记录 ${recordId} 的 count 已原子自增 ${step}`);
    return updateResponse.data;

  } catch (error) {
    console.error('原子更新失败:', error.response?.data || error.message);
    throw error;
  }
};
/**
 * 非原子操作：自增指定记录的 count 字段（不建议使用，可能导致并发冲突）
 * @param {string} recordId - 记录的 ID
 * @param {number} step - 自增步长（默认1）
 * @returns {Promise<Object>} - 更新后的记录数据
 */
export const increaseCount = async (tableName, buriedPointId) => {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) return
  const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
  try {
    // 先根据 buriedPointId 查询 recordId
    const recordId = await getRecordIdByBuriedPointId(tableName, buriedPointId);

    // 1. 获取当前值
    const record = await axios.get(`${AIRTABLE_API_URL}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const currentCount = record.data.fields.count || 0;

    // 2. 加1后更新
    await axios.patch(`${AIRTABLE_API_URL}/${recordId}`, {
      fields: { count: currentCount + 1 }
    }, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
  } catch (error) {
    console.error('更新记录失败:', error.response?.data || error.message);
    throw error;
  }
}
    