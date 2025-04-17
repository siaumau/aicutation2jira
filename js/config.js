/**
 * 應用配置常量
 */
const AppConfig = {
    // 應用版本
    VERSION: '1.0.0',

    // 本地存儲密鑰
    STORAGE_KEY: 'aicutation2jira',

    // JIRA 相關配置
    JIRA: {
        DEFAULT_BOARD_ID: null,
        API_BASE_URL: null,
        USERNAME: null,
        API_TOKEN: null
    },

    // AI 相關配置
    AI: {
        MODEL: 'openai/gpt-3.5-turbo',
        TEMPERATURE: 0.7,
        API_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions'
    },

    // CORS 代理服務
    PROXY: {
        // 可能的代理服務列表，按優先順序排列
        SERVICES: [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url='
        ]
    },

    // 默認設定字段列表
    SETTINGS_FIELDS: [
        'jiraUrl',
        'jiraToken',
        'jiraEmail',
        'jiraProject',
        'openrouterApiKey',
        'defaultAssignee',
        'sprintId',
        'useProxy'
    ],

    // 必填設定字段
    REQUIRED_SETTINGS: [
        'jiraUrl',
        'jiraToken',
        'jiraEmail',
        'jiraProject',
        'openrouterApiKey'
    ],

    // AI 思考步驟
    THINKING_STEPS: [
        "正在理解您的需求...",
        "正在分析並識別任務組件...",
        "正在考慮最佳拆分方法...",
        "正在生成卡片標題和描述...",
        "正在確定任務間的依賴關係...",
        "正在計算故事點數和估計時間...",
        "正在整合結果，即將完成..."
    ],

    // 任務類型顏色映射
    TASK_TYPE_COLORS: {
        '前端': 'bg-blue-100 text-blue-800',
        '後端': 'bg-green-100 text-green-800',
        '設計': 'bg-purple-100 text-purple-800',
        '測試': 'bg-yellow-100 text-yellow-800',
        '資料庫': 'bg-red-100 text-red-800',
        'default': 'bg-gray-100 text-gray-800'
    },

    // 本地化設定
    I18N: {
        DEFAULT_LANG: 'zh-TW',
        SUPPORTED_LANGS: ['zh-TW', 'en-US']
    }
};

export default AppConfig;
