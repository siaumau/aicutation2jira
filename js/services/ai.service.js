import AppConfig from '../config.js';
import ApiService from './api.service.js';
import StorageService from './storage.service.js';
import Utils from '../utils.js';

/**
 * AI 服務 - 處理與 AI 模型的交互
 */
class AIService {
    /**
     * 初始化 AI 服務
     */
    constructor() {
        this.apiService = new ApiService();
        this.storageService = new StorageService();
        this.model = AppConfig.AI.MODEL;
        this.temperature = AppConfig.AI.TEMPERATURE;
        this.endpoint = AppConfig.AI.API_ENDPOINT;
    }

    /**
     * 生成提示文本
     * @param {string} requirement 需求描述
     * @returns {string} 完整的提示文本
     */
    generatePrompt(requirement) {
        return `你是一位敏捷開發專家，請幫我將以下需求拆分成適合 JIRA 的工作卡片，每個卡片需包含：卡片標題（格式為"[類型] 功能描述"）、用戶故事（格式為"作為...，我希望...，以便..."）、任務描述、驗收標準（至少3項）、估計點數（以菲波那契數列：1、2、3、5、8、13）、估計時間（以天為單位）和依賴關係。需求：${requirement}

        請以JSON格式回覆，不要包含任何其他解釋文字，JSON格式如下：
        {
            "tasks": [
                {
                    "title": "[前端] 卡片標題",
                    "userStory": "作為用戶，我希望..., 以便...",
                    "description": "詳細任務描述",
                    "acceptanceCriteria": ["標準1", "標準2", "標準3"],
                    "storyPoints": 3,
                    "estimatedDays": 1,
                    "dependencies": []
                },
                // 更多卡片...
            ]
        }

        卡片類型可以是：[前端]、[後端]、[設計]、[測試]、[資料庫]等。依賴關係使用卡片數組索引（從0開始）。請確保至少拆分出8-15張卡片，每張卡片包含詳細的驗收標準，並且合理安排依賴關係。`;
    }

    /**
     * 調用 AI 模型
     * @param {string} requirement 需求描述
     * @returns {Promise<Object>} 解析後的任務對象
     */
    async generateTasks(requirement) {
        try {
            const apiKey = this.storageService.getSetting('openrouterApiKey');

            if (!apiKey) {
                throw new Error('未設置 OpenRouter API Key');
            }

            const prompt = this.generatePrompt(requirement);

            const response = await this.apiService.post(
                this.endpoint,
                {
                    model: this.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: this.temperature
                },
                {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.href
                }
            );

            // 檢查 AI 響應
            if (!response || !response.choices || !response.choices.length) {
                console.error('AI 響應格式不正確:', response);
                throw new Error('AI 服務回應格式不符，請檢查 API 金鑰是否正確');
            }

            // 提取內容
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('AI 回應中沒有找到內容');
            }

            // 解析 JSON
            const tasksJson = Utils.extractJson(content);
            if (!tasksJson || !tasksJson.tasks || !Array.isArray(tasksJson.tasks)) {
                throw new Error('AI 回應格式無效');
            }

            return tasksJson.tasks;
        } catch (error) {
            console.error('AI 生成任務失敗:', error);
            throw error;
        }
    }
}

export default AIService;
