import axios from 'axios';

// 替换为你的 Cloudflare D1 数据库 API 端点和密钥
const D1_API_URL = 'https://api.cloudflare.com/client/v4/accounts/2245990708/d1/databases/b411401c-fd08-447b-9dbc-d73644384eea/query';
const D1_API_KEY = '13b4d6a5be34b66b61fb1bdbe967f70df1f38';

// 插入数据示例
export const insertData = async (tableName, data) => {
    const sql = `INSERT INTO ${tableName} (${Object.keys(data).join(',')}) VALUES (${Object.values(data).map(() => '?').join(',')})`;
    try {
        const response = await axios.post(D1_API_URL, {
            "sql": sql,
            "bindings": Object.values(data)
        }, {
            headers: {
                "Authorization": `Bearer ${D1_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error('插入数据时出错:', error);
        throw error;
    }
};

// 更新数据示例
export const updateData = async (tableName, updateData, condition) => {
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(',');
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${condition}`;
    try {
        const response = await axios.post(D1_API_URL, {
            "sql": sql,
            "bindings": Object.values(updateData)
        }, {
            headers: {
                "Authorization": `Bearer ${D1_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error('更新数据时出错:', error);
        throw error;
    }
};

// 更新数据示例
export const incrementCount = async (tableName, id) => {
    const sql = `UPDATE ${tableName} SET count = count + 1 WHERE id = ${id}`;
    try {
        const response = await axios.post(D1_API_URL, {
            "sql": sql
        }, {
            headers: {
                "Authorization": `Bearer ${D1_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error('更新数据时出错:', error);
        throw error;
    }
};

// 删除数据示例
export const deleteData = async (tableName, condition) => {
    const sql = `DELETE FROM ${tableName} WHERE ${condition}`;
    try {
        const response = await axios.post(D1_API_URL, {
            "sql": sql
        }, {
            headers: {
                "Authorization": `Bearer ${D1_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error('删除数据时出错:', error);
        throw error;
    }
};