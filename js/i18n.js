import AppConfig from './config.js';

const translations = {
    'zh-TW': {
        errors: {
            ai: {
                noApiKey: '請先設定 API 金鑰',
                apiError: 'AI API 呼叫失敗',
                invalidResponse: 'AI 回應格式無效'
            }
        },
        prompts: {
            taskGeneration: {
                role: '你是一個專業的任務分析助手，請協助將任務需求轉換成 Jira 任務格式。',
                format: '請依照以下格式回覆：\n- 標題：[簡短描述]\n- 描述：[詳細說明]\n- 預估時間：[工時預估]\n- 優先級：[高/中/低]\n- 標籤：[相關標籤]'
            }
        }
    },
    'en-US': {
        errors: {
            ai: {
                noApiKey: 'Please set the API key first',
                apiError: 'AI API call failed',
                invalidResponse: 'Invalid AI response format'
            }
        },
        prompts: {
            taskGeneration: {
                role: 'You are a professional task analysis assistant, please help convert task requirements into Jira task format.',
                format: 'Please reply in the following format:\n- Title: [Brief description]\n- Description: [Detailed explanation]\n- Estimated time: [Time estimation]\n- Priority: [High/Medium/Low]\n- Labels: [Related tags]'
            }
        }
    }
};

class I18nService {
    constructor() {
        this.currentLanguage = AppConfig.DEFAULT_LANGUAGE || 'zh-TW';
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLanguage = lang;
        } else {
            console.warn(`Language ${lang} not supported, falling back to zh-TW`);
            this.currentLanguage = 'zh-TW';
        }
    }

    t(key) {
        const keys = key.split('.');
        let result = translations[this.currentLanguage];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                console.warn(`Translation key "${key}" not found for language ${this.currentLanguage}`);
                return key;
            }
        }

        return result;
    }
}

export default new I18nService();
