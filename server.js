require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// 配置 CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON 請求體
app.use(express.json());

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// JIRA API 代理
app.all('/jira/*', async (req, res) => {
    try {
        // 從原始請求中提取 JIRA URL 和認證信息
        const jiraUrl = req.headers['x-jira-url'];
        const authorization = req.headers['authorization'];

        if (!jiraUrl || !authorization) {
            return res.status(400).json({
                error: '缺少必要的 JIRA 設定'
            });
        }

        // 構建目標 URL
        const targetPath = req.url.replace('/jira', '');
        const targetUrl = `${jiraUrl}${targetPath}`;

        // 準備請求選項
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
            }
        };

        // 如果是 POST/PUT 請求，添加請求體
        if (['POST', 'PUT'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        // 發送請求到 JIRA
        const response = await fetch(targetUrl, fetchOptions);
        const data = await (response.status === 204 ? Promise.resolve(null) : response.json());

        // 返回響應
        res.status(response.status).json(data);
    } catch (error) {
        console.error('代理請求錯誤:', error);
        res.status(500).json({
            error: '代理請求失敗',
            details: error.message
        });
    }
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`代理服務器運行在端口 ${PORT}`);
});
