import AppConfig from './config.js';
import i18n from './i18n.js';

class AIService {
    constructor() {
        this.apiKey = null;
        this.model = AppConfig.AI.MODEL;
        this.temperature = AppConfig.AI.TEMPERATURE;
        this.apiEndpoint = AppConfig.AI.API_ENDPOINT;
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    async generatePromptText(taskDescription) {
        if (!this.apiKey) {
            throw new Error(i18n.t('errors.ai.noApiKey'));
        }

        const systemPrompt = i18n.t('prompts.taskGeneration.role');
        const formatInstructions = i18n.t('prompts.taskGeneration.format');

        return `${systemPrompt}\n\n${formatInstructions}\n\n任務描述：${taskDescription}`;
    }

    async generateTask(taskDescription) {
        try {
            const promptText = await this.generatePromptText(taskDescription);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    temperature: this.temperature,
                    messages: [
                        { role: 'system', content: promptText }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(i18n.t('errors.ai.apiError'));
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error(i18n.t('errors.ai.invalidResponse'));
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI Task Generation Error:', error);
            throw error;
        }
    }
}

export default new AIService();
