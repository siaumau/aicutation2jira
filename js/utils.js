import AppConfig from './config.js';

/**
 * 工具函數類
 */
class Utils {
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 防抖函數
     * @param {Function} func 要執行的函數
     * @param {number} wait 等待時間（毫秒）
     * @returns {Function} 防抖處理後的函數
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 等待指定時間
     * @param {number} ms 等待毫秒數
     * @returns {Promise<void>}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 安全地解析 JSON 字符串
     * @param {string} jsonString JSON 字符串
     * @param {*} fallback 解析失敗時的返回值
     * @returns {*} 解析結果或 fallback
     */
    static safeJsonParse(jsonString, fallback = {}) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('JSON 解析失敗:', error);
            return fallback;
        }
    }

    /**
     * 格式化日期時間
     * @param {Date} date 日期對象
     * @returns {string} 格式化後的日期時間字符串
     */
    static formatDateTime(date = new Date()) {
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * 從字符串中提取 JSON 對象
     * @param {string} text 可能包含 JSON 的文本
     * @returns {Object|null} 提取的 JSON 對象或 null
     */
    static extractJson(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        } catch (error) {
            console.error('提取 JSON 失敗:', error);
            return null;
        }
    }

    /**
     * 從文本中提取任務類型
     * @param {string} title 任務標題文本
     * @returns {string} 提取的任務類型，如果未找到則返回默認值
     */
    static extractTaskType(title) {
        const typeMatch = title.match(/\[([^\]]+)\]/);
        return typeMatch ? typeMatch[1] : '任務';
    }

    /**
     * 獲取任務類型對應的 CSS 類名
     * @param {string} title 任務標題
     * @returns {string} CSS 類名
     */
    static getTaskTypeClass(title) {
        const taskType = this.extractTaskType(title);

        for (const [type, className] of Object.entries(AppConfig.TASK_TYPE_COLORS)) {
            if (taskType.includes(type)) {
                return className;
            }
        }

        return AppConfig.TASK_TYPE_COLORS.default;
    }

    /**
     * 安全地從對象中獲取嵌套屬性
     * @param {Object} obj 要讀取的對象
     * @param {string} path 屬性路徑，例如 "a.b.c"
     * @param {*} defaultValue 如果路徑不存在時的默認值
     * @returns {*} 屬性值或默認值
     */
    static getNestedValue(obj, path, defaultValue = null) {
        if (!obj) return defaultValue;

        const keys = path.split('.');
        let result = obj;

        for (const key of keys) {
            if (result === undefined || result === null) {
                return defaultValue;
            }
            result = result[key];
        }

        return result !== undefined ? result : defaultValue;
    }
}

export default Utils;
