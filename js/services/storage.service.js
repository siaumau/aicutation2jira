import AppConfig from '../config.js';

/**
 * 存儲服務 - 負責管理本地存儲的設定
 */
class StorageService {
    /**
     * 初始化存儲服務
     */
    constructor() {
        this.storageKey = AppConfig.STORAGE_KEY;
    }

    /**
     * 保存設定到本地存儲
     * @param {Object} settings 要保存的設定對象
     * @returns {boolean} 是否成功保存
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('保存設定失敗:', error);
            return false;
        }
    }

    /**
     * 從本地存儲加載設定
     * @returns {Object} 設定對象
     */
    loadSettings() {
        try {
            const settingsJson = localStorage.getItem(this.storageKey);
            return settingsJson ? JSON.parse(settingsJson) : {};
        } catch (error) {
            console.error('加載設定失敗:', error);
            return {};
        }
    }

    /**
     * 刪除本地設定
     * @returns {boolean} 是否成功刪除
     */
    clearSettings() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('刪除設定失敗:', error);
            return false;
        }
    }

    /**
     * 檢查是否有必要的設定
     * @returns {boolean} 是否具有所有必要設定
     */
    hasRequiredSettings() {
        const settings = this.loadSettings();
        return AppConfig.REQUIRED_SETTINGS.every(field =>
            settings[field] && settings[field].trim() !== ''
        );
    }

    /**
     * 獲取特定設定項
     * @param {string} key 設定鍵名
     * @param {*} defaultValue 默認值
     * @returns {*} 設定值或默認值
     */
    getSetting(key, defaultValue = null) {
        const settings = this.loadSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    /**
     * 設置特定設定項
     * @param {string} key 設定鍵名
     * @param {*} value 設定值
     * @returns {boolean} 是否成功設置
     */
    setSetting(key, value) {
        try {
            const settings = this.loadSettings();
            settings[key] = value;
            this.saveSettings(settings);
            return true;
        } catch (error) {
            console.error(`設置 ${key} 失敗:`, error);
            return false;
        }
    }
}

export default StorageService;
