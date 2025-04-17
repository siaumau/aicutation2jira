import AppConfig from '../config.js';
import StorageService from './storage.service.js';

/**
 * API 服務 - 處理 CORS 和網絡請求
 */
class ApiService {
    /**
     * 初始化 API 服務
     */
    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * 使用代理服務解決 CORS 問題
     * @param {string} url 原始 URL
     * @param {Object} options 請求選項
     * @returns {Promise<Response>} Fetch 響應
     */
    async fetchWithProxy(url, options) {
        const useProxy = this.storageService.getSetting('useProxy') === 'true';

        if (useProxy) {
            try {
                // 嘗試不同的代理服務，直到成功
                for (const proxyUrl of AppConfig.PROXY.SERVICES) {
                    try {
                        console.log(`嘗試使用代理: ${proxyUrl}`);

                        // 對於某些代理，可能需要修改 URL
                        let finalUrl = proxyUrl;

                        // 如果代理需要 URL 編碼
                        if (proxyUrl.includes('?url=')) {
                            finalUrl += encodeURIComponent(url);
                        } else {
                            finalUrl += url;
                        }

                        // 克隆原始選項並修改為適合代理的格式
                        const proxyOptions = { ...options };

                        // 某些代理可能需要添加額外的頭部信息
                        if (!proxyOptions.headers) {
                            proxyOptions.headers = {};
                        }

                        const response = await fetch(finalUrl, proxyOptions);

                        // 如果請求成功，返回響應
                        return response;
                    } catch (error) {
                        console.error(`代理 ${proxyUrl} 請求失敗:`, error);
                        // 繼續嘗試下一個代理
                    }
                }

                // 所有代理都失敗，拋出錯誤
                throw new Error('所有代理服務請求都失敗');
            } catch (error) {
                console.error("代理請求失敗:", error);
                throw error;
            }
        } else {
            // 直接請求 (可能會有 CORS 問題)
            console.log(`直接發送請求: ${url}`);
            return fetch(url, options);
        }
    }

    /**
     * 發送 REST API 請求
     * @param {string} url 請求 URL
     * @param {string} method HTTP 方法
     * @param {Object} data 請求數據
     * @param {Object} headers 請求頭
     * @returns {Promise<any>} 響應數據
     */
    async request(url, method = 'GET', data = null, headers = {}) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await this.fetchWithProxy(url, options);

            // 檢查響應狀態
            if (!response.ok) {
                // 嘗試解析錯誤詳情
                let errorDetails = '';
                try {
                    const errorData = await response.json();
                    errorDetails = JSON.stringify(errorData.errors || errorData.errorMessages || errorData);
                } catch (e) {
                    errorDetails = response.statusText;
                }
                throw new Error(`API 錯誤 (${response.status}): ${errorDetails}`);
            }

            // 對於 204 No Content 響應，返回 null
            if (response.status === 204) {
                return null;
            }

            // 解析 JSON 響應
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error('API 請求失敗:', error);
            throw error;
        }
    }

    /**
     * 發送 GET 請求
     * @param {string} url 請求 URL
     * @param {Object} headers 請求頭
     * @returns {Promise<any>} 響應數據
     */
    async get(url, headers = {}) {
        return this.request(url, 'GET', null, headers);
    }

    /**
     * 發送 POST 請求
     * @param {string} url 請求 URL
     * @param {Object} data 請求數據
     * @param {Object} headers 請求頭
     * @returns {Promise<any>} 響應數據
     */
    async post(url, data, headers = {}) {
        return this.request(url, 'POST', data, headers);
    }

    /**
     * 發送 PUT 請求
     * @param {string} url 請求 URL
     * @param {Object} data 請求數據
     * @param {Object} headers 請求頭
     * @returns {Promise<any>} 響應數據
     */
    async put(url, data, headers = {}) {
        return this.request(url, 'PUT', data, headers);
    }

    /**
     * 發送 DELETE 請求
     * @param {string} url 請求 URL
     * @param {Object} headers 請求頭
     * @returns {Promise<any>} 響應數據
     */
    async delete(url, headers = {}) {
        return this.request(url, 'DELETE', null, headers);
    }
}

export default ApiService;
