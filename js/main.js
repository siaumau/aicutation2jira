/**
 * 應用配置常量
 */
// config.js start --------------------------------
const AppConfig = {
    // 應用版本
    VERSION: '1.0.0',

    // 本地存儲密鑰
    STORAGE_KEY: 'jiraAISettings',

    // JIRA 相關配置
    JIRA: {
        DEFAULT_ISSUE_TYPE: 'Story',
        STORY_POINTS_FIELD: 'customfield_10016',
        LINK_TYPE: 'Blocks'
    },

    // AI 相關配置
    AI: {
        MODEL: 'meta-llama/llama-4-maverick:free',
        TEMPERATURE: 0.2,
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
    }
};


// config.js end --------------------------------




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

// utils.js --------------------------end


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

// storageservice ---------------------end


/**
 * UI 服務 - 處理界面交互和顯示
 */
class UIService {
    /**
     * 初始化UI服務
     */
    constructor() {
        this.requirementSection = document.getElementById('requirementSection');
        this.settingsHeader = document.getElementById('settingsHeader');
        this.settingsContent = document.getElementById('settingsContent');
        this.settingsToggleIcon = document.getElementById('settingsToggleIcon');
        this.settingsStatus = document.getElementById('settingsStatus');
        this.aiThinkingAnimation = document.getElementById('aiThinkingAnimation');
        this.aiThinkingStep = document.getElementById('aiThinkingStep');
        this.tasksContainer = document.getElementById('tasksContainer');
        this.tasksList = document.getElementById('tasksList');
        this.resultLog = document.getElementById('resultLog');
        this.logContent = document.getElementById('logContent');
        this.loadingIndicator = document.getElementById('loadingIndicator');

        // 初始化
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 設定區域收合
        this.settingsHeader.addEventListener('click', () => {
            this.toggleSettingsPanel();
        });

        // 全選 checkbox 事件
        document.getElementById('selectAllCheckbox')?.addEventListener('change', function() {
            document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    /**
     * 切換設定面板顯示/隱藏
     */
    toggleSettingsPanel() {
        this.settingsContent.classList.toggle('hidden');

        if (this.settingsContent.classList.contains('hidden')) {
            this.settingsToggleIcon.classList.remove('fa-chevron-down');
            this.settingsToggleIcon.classList.add('fa-chevron-right');
        } else {
            this.settingsToggleIcon.classList.remove('fa-chevron-right');
            this.settingsToggleIcon.classList.add('fa-chevron-down');
        }
    }

    /**
     * 切換需求區塊顯示/隱藏
     */
    toggleRequirementSection() {
        if (this.requirementSection.classList.contains('hidden')) {
            this.requirementSection.classList.remove('hidden');
            this.requirementSection.classList.add('slide-down');
        } else {
            this.requirementSection.classList.add('hidden');
        }
    }

    /**
     * 顯示設定已配置狀態
     * @param {boolean} isConfigured 是否已配置
     */
    showSettingsConfigured(isConfigured) {
        if (isConfigured) {
            this.settingsStatus.classList.remove('hidden');
            // 預設收合設定區域
            setTimeout(() => {
                this.settingsContent.classList.add('hidden');
                this.settingsToggleIcon.classList.remove('fa-chevron-down');
                this.settingsToggleIcon.classList.add('fa-chevron-right');
            }, 100);
        } else {
            this.settingsStatus.classList.add('hidden');
            // 預設展開設定區域
            this.settingsContent.classList.remove('hidden');
        }
    }

    /**
     * 顯示 AI 思考動畫
     * @returns {Object} 控制對象
     */
    showAIThinking() {
        // 收起需求區塊
        this.requirementSection.classList.add('hidden');

        // 顯示 AI 思考動畫
        this.aiThinkingAnimation.classList.remove('hidden');
        this.aiThinkingAnimation.classList.add('slide-up');

        // 思考步驟動畫
        const thinkingSteps = AppConfig.THINKING_STEPS;
        let currentStep = 0;

        // 定時更新思考步驟
        const stepInterval = setInterval(() => {
            currentStep = (currentStep + 1) % thinkingSteps.length;
            this.aiThinkingStep.textContent = thinkingSteps[currentStep];
        }, 2000);

        return {
            clear: () => {
                clearInterval(stepInterval);
                this.aiThinkingAnimation.classList.add('hidden');
            }
        };
    }

    /**
     * 顯示載入指示器
     * @param {HTMLElement} button 相關按鈕
     * @param {boolean} show 是否顯示
     */
    showLoadingIndicator(button, show) {
        if (show) {
            this.loadingIndicator.classList.remove('hidden');
            this.loadingIndicator.classList.add('flex');
            button.disabled = true;
            button.classList.add('opacity-50');
        } else {
            this.loadingIndicator.classList.add('hidden');
            this.loadingIndicator.classList.remove('flex');
            button.disabled = false;
            button.classList.remove('opacity-50');
        }
    }

    /**
     * 添加日誌
     * @param {string} message 日誌消息
     * @param {string} type 日誌類型 (info, error, success, warning)
     */
    addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = 'mb-1 pb-1 border-b border-gray-100 flex items-start';

        const timestamp = new Date().toLocaleTimeString();

        // 根據類型添加不同樣式
        let iconClass = 'fa-info-circle text-blue-500';
        if (type === 'error') {
            iconClass = 'fa-exclamation-circle text-red-500';
        } else if (type === 'success') {
            iconClass = 'fa-check-circle text-green-500';
        } else if (type === 'warning') {
            iconClass = 'fa-exclamation-triangle text-yellow-500';
        }

        logEntry.innerHTML = `
            <span class="text-gray-400 mr-2">[${timestamp}]</span>
            <i class="fas ${iconClass} mr-1 mt-1"></i>
            <span class="text-gray-700">${message}</span>
        `;

        this.logContent.appendChild(logEntry);
        this.logContent.scrollTop = this.logContent.scrollHeight;

        // 確保日誌容器可見
        this.resultLog.classList.remove('hidden');
    }

    /**
     * 顯示任務列表
     * @param {Array} tasks 任務數組
     */
    displayTasks(tasks) {
        this.tasksList.innerHTML = '';

        // 更新任務計數
        document.getElementById('taskCount').textContent = `卡片數量: ${tasks.length}`;

        tasks.forEach((task, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';

            // 取得任務類型樣式
            const typeClass = Utils.getTaskTypeClass(task.title);
            const taskType = Utils.extractTaskType(task.title);

            // 建立依賴關係標籤
            let dependenciesHtml = '';
            if (task.dependencies && task.dependencies.length > 0) {
                dependenciesHtml = task.dependencies.map(dep =>
                    `<span class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1">#${dep + 1}</span>`
                ).join('');
            }

            // 建立驗收標準 HTML
            const acceptanceCriteriaHtml = task.acceptanceCriteria.map(criteria =>
                `<li class="mb-1">${criteria}</li>`
            ).join('');

            row.innerHTML = `
                <td class="p-3 whitespace-nowrap">
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" class="task-checkbox form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500" data-index="${index}">
                        <span class="text-sm">#${index + 1}</span>
                    </label>
                </td>
                <td class="p-3">
                    <div class="flex flex-col">
                        <span class="${typeClass} text-xs font-semibold px-2 py-1 rounded-full mb-1 inline-block w-fit">${taskType}</span>
                        <span class="font-medium text-gray-900">${task.title}</span>
                    </div>
                </td>
                <td class="p-3">
                    <div class="text-sm text-gray-700">
                        ${task.userStory}
                    </div>
                </td>
                <td class="p-3">
                    <div class="text-sm text-gray-700">
                        ${task.description}
                    </div>
                </td>
                <td class="p-3">
                    <ul class="list-disc pl-4 text-sm text-gray-700">
                        ${acceptanceCriteriaHtml}
                    </ul>
                </td>
                <td class="p-3 text-center">
                    <select class="story-points-select px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full border-none focus:ring-2 focus:ring-indigo-300" data-index="${index}">
                        ${[1, 2, 3, 5, 8, 13].map(point =>
                            `<option value="${point}" ${task.storyPoints === point ? 'selected' : ''}>${point}</option>`
                        ).join('')}
                    </select>
                </td>
                <td class="p-3 text-center">
                    <input type="number" class="estimated-days-input w-16 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border-none focus:ring-2 focus:ring-green-300"
                           value="${task.estimatedDays}" min="0.5" step="0.5" data-index="${index}">
                    <span class="text-sm text-gray-600">天</span>
                </td>
                <td class="p-3">
                    <div class="flex flex-wrap">
                        ${dependenciesHtml || '<span class="text-gray-400 text-sm">無</span>'}
                    </div>
                </td>
            `;

            this.tasksList.appendChild(row);
        });

        // 添加事件監聽器
        this.setupTaskEditListeners();

        // 顯示任務容器
        this.tasksContainer.classList.remove('hidden');
        this.resultLog.classList.remove('hidden');

        // 更新全選 checkbox 狀態
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }

        // 自動收起需求區塊
        this.requirementSection.classList.add('hidden');

        // 滾動到任務列表
        this.tasksContainer.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 設置任務編輯相關的事件監聽器
     */
    setupTaskEditListeners() {
        // 故事點數變更事件
        document.querySelectorAll('.story-points-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const newValue = parseInt(e.target.value);
                window.generatedTasks[index].storyPoints = newValue;

                // 顯示更新提示
                this.addLog(`已更新任務 #${index + 1} 的故事點數為 ${newValue}`, 'info');
            });
        });

        // 估計天數變更事件
        document.querySelectorAll('.estimated-days-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const newValue = parseFloat(e.target.value);
                window.generatedTasks[index].estimatedDays = newValue;

                // 顯示更新提示
                this.addLog(`已更新任務 #${index + 1} 的估計時間為 ${newValue} 天`, 'info');
            });
        });
    }

    /**
     * 顯示進度條
     * @param {number} current 當前進度
     * @param {number} total 總進度
     * @param {string} id 進度條ID
     */
    updateProgressBar(current, total, id = 'creation-progress') {
        let progressBar = document.getElementById(id);

        // 如果進度條不存在，則創建
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'mt-3 mb-3';
            progressBar.id = id;
            progressBar.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <div class="text-sm font-medium text-gray-700">進度</div>
                    <div class="text-sm font-medium text-gray-700" id="${id}-text">0/${total}</div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full" id="${id}-bar" style="width: 0%"></div>
                </div>
            `;

            this.logContent.parentNode.insertBefore(progressBar, this.logContent);
        }

        // 更新進度
        document.getElementById(`${id}-text`).textContent = `${current}/${total}`;
        document.getElementById(`${id}-bar`).style.width = `${(current / total) * 100}%`;
    }

    /**
     * 全選任務
     */
    selectAllTasks() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        document.getElementById('selectAllCheckbox').checked = true;
    }

    /**
     * 取消全選任務
     */
    deselectAllTasks() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.getElementById('selectAllCheckbox').checked = false;
    }

    /**
     * 獲取選中的任務索引
     * @returns {number[]} 選中的任務索引數組
     */
    getSelectedTaskIndices() {
        const selectedIndices = [];
        document.querySelectorAll('.task-checkbox:checked').forEach(checkbox => {
            selectedIndices.push(parseInt(checkbox.getAttribute('data-index')));
        });
        return selectedIndices;
    }

    /**
     * 添加 JIRA 鏈接
     * @param {string} jiraUrl JIRA URL
     * @param {string} projectKey 項目key
     */
    addJiraLink(jiraUrl, projectKey) {
        const jiraLink = document.createElement('div');
        jiraLink.className = 'mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md';
        jiraLink.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-external-link-alt text-indigo-600 mr-2"></i>
                <a href="${jiraUrl}/secure/RapidBoard.jspa?projectKey=${projectKey}"
                   target="_blank" class="text-indigo-600 hover:underline">
                   在 JIRA 中查看建立的卡片
                </a>
            </div>
        `;
        this.logContent.parentNode.appendChild(jiraLink);
    }
}

// ui service  -------------------------------- end


/**
 * API 服務 - 處理 CORS 和網絡請求
 */
class ApiService {
    /**
     * 初始化 API 服務
     */
    constructor() {
        this.storageService = new StorageService();
        this.proxyUrl = 'http://localhost:3000'; // 代理服務器地址
    }

    /**
     * 使用代理服務解決 CORS 問題
     * @param {string} url 原始 URL
     * @param {Object} options 請求選項
     * @returns {Promise<Response>} Fetch 響應
     */
    async fetchWithProxy(url, options) {
        try {
            // 如果是 JIRA API 請求
            if (url.includes('/rest/api/') || url.includes('/rest/agile/')) {
                const jiraUrl = this.storageService.getSetting('jiraUrl');
                const proxyPath = url.replace(jiraUrl, '/jira');

                // 添加 JIRA URL 到請求頭
                options.headers = {
                    ...options.headers,
                    'X-JIRA-URL': jiraUrl
                };

                // 添加 credentials 設定
                options.credentials = 'include';

                // 發送到代理服務器
                const response = await fetch(`${this.proxyUrl}${proxyPath}`, options);

                // 檢查響應狀態
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `請求失敗: ${response.status}`);
                }

                return response;
            }

            // 其他請求直接發送
            return fetch(url, options);
        } catch (error) {
            console.error("代理請求失敗:", error);
            throw error;
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

// --------------------- api service   end

/**
 * JIRA 服務 - 處理與 JIRA API 的交互
 */
class JiraService {
    /**
     * 初始化 JIRA 服務
     */
    constructor() {
        this.apiService = new ApiService();
        this.storageService = new StorageService();

        // 從設定中獲取 JIRA 相關信息
        this.jiraUrl = this.storageService.getSetting('jiraUrl');
        this.jiraToken = this.storageService.getSetting('jiraToken');
        this.jiraEmail = this.storageService.getSetting('jiraEmail');
        this.jiraProject = this.storageService.getSetting('jiraProject');
    }

    /**
     * 更新 JIRA 設定
     */
    updateSettings() {
        this.jiraUrl = this.storageService.getSetting('jiraUrl');
        this.jiraToken = this.storageService.getSetting('jiraToken');
        this.jiraEmail = this.storageService.getSetting('jiraEmail');
        this.jiraProject = this.storageService.getSetting('jiraProject');
    }

    /**
     * 獲取認證頭部
     * @returns {Object} 包含認證的頭部對象
     */
    getAuthHeaders() {
        return {
            'Authorization': `Basic ${btoa(`${this.jiraEmail}:${this.jiraToken}`)}`
        };
    }

    /**
     * 獲取專案的所有看板
     * @returns {Promise<Array>} 看板數組
     */
    async getBoards() {
        try {
            this.updateSettings();
            const result = await this.apiService.get(
                `${this.jiraUrl}/rest/agile/1.0/board?projectKeyOrId=${this.jiraProject}`,
                this.getAuthHeaders()
            );
            return result.values || [];
        } catch (error) {
            console.error('獲取看板失敗:', error);
            throw new Error(`獲取看板失敗: ${error.message}`);
        }
    }

    /**
     * 獲取活躍的 Sprint
     * @param {number} boardId 看板 ID
     * @returns {Promise<Object>} 活躍的 Sprint 對象
     */
    async getActiveSprint(boardId) {
        try {
            this.updateSettings();
            const result = await this.apiService.get(
                `${this.jiraUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
                this.getAuthHeaders()
            );

            if (!result.values || result.values.length === 0) {
                throw new Error('找不到活躍的 Sprint');
            }

            return result.values[0];
        } catch (error) {
            console.error('獲取 Sprint 失敗:', error);
            throw new Error(`獲取 Sprint 失敗: ${error.message}`);
        }
    }

    /**
     * 創建 JIRA 任務
     * @param {Object} taskData 任務數據
     * @returns {Promise<Object>} 創建的任務對象
     */
    async createIssue(taskData) {
        try {
            this.updateSettings();

            // 準備 JIRA 任務數據
            const jiraTask = {
                fields: {
                    project: {
                        key: this.jiraProject
                    },
                    summary: taskData.title,
                    description: taskData.description,
                    issuetype: {
                        name: AppConfig.JIRA.DEFAULT_ISSUE_TYPE
                    }
                }
            };

            // 添加故事點數
            if (taskData.storyPoints) {
                jiraTask.fields[AppConfig.JIRA.STORY_POINTS_FIELD] = taskData.storyPoints;
            }

            // 添加預設負責人（如果有）
            const defaultAssignee = this.storageService.getSetting('defaultAssignee');
            if (defaultAssignee && defaultAssignee.trim() !== '') {
                jiraTask.fields.assignee = {
                    name: defaultAssignee
                };
            }

            return await this.apiService.post(
                `${this.jiraUrl}/rest/api/2/issue`,
                jiraTask,
                this.getAuthHeaders()
            );
        } catch (error) {
            console.error('創建任務失敗:', error);
            throw new Error(`創建任務失敗: ${error.message}`);
        }
    }

    /**
     * 將任務添加到 Sprint
     * @param {string} issueKey 任務 Key
     * @param {number} sprintId Sprint ID
     * @returns {Promise<Object>} 響應結果
     */
    async addIssueToSprint(issueKey, sprintId) {
        try {
            this.updateSettings();
            return await this.apiService.post(
                `${this.jiraUrl}/rest/agile/1.0/sprint/${sprintId}/issue`,
                {
                    issues: [issueKey]
                },
                this.getAuthHeaders()
            );
        } catch (error) {
            console.error('添加任務到 Sprint 失敗:', error);
            throw new Error(`添加任務到 Sprint 失敗: ${error.message}`);
        }
    }

    /**
     * 創建任務間的鏈接
     * @param {string} inwardIssueKey 入向任務 Key
     * @param {string} outwardIssueKey 出向任務 Key
     * @returns {Promise<Object>} 響應結果
     */
    async createIssueLink(inwardIssueKey, outwardIssueKey) {
        try {
            this.updateSettings();
            return await this.apiService.post(
                `${this.jiraUrl}/rest/api/2/issueLink`,
                {
                    type: {
                        name: AppConfig.JIRA.LINK_TYPE
                    },
                    inwardIssue: {
                        key: inwardIssueKey
                    },
                    outwardIssue: {
                        key: outwardIssueKey
                    }
                },
                this.getAuthHeaders()
            );
        } catch (error) {
            console.error('創建任務鏈接失敗:', error);
            throw new Error(`創建任務鏈接失敗: ${error.message}`);
        }
    }

    /**
     * 獲取當前活躍的 Sprint
     * @returns {Promise<Object>} 活躍的 Sprint 對象
     */
    async getCurrentActiveSprint() {
        try {
            this.updateSettings();

            // 先獲取所有看板
            const boards = await this.getBoards();

            if (boards.length === 0) {
                throw new Error('找不到專案的看板');
            }

            // 使用第一個看板獲取活躍的 Sprint
            const boardId = boards[0].id;
            return await this.getActiveSprint(boardId);
        } catch (error) {
            console.error('獲取當前活躍 Sprint 失敗:', error);
            throw error;
        }
    }

    /**
     * 批量創建任務
     * @param {Array} tasks 任務數組
     * @param {function} progressCallback 進度回調函數
     * @returns {Promise<Object>} 結果對象 {success: Array, failed: Array, keys: Object}
     */
    async createIssues(tasks, progressCallback = null) {
        const results = {
            success: [],
            failed: [],
            keys: {}
        };

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];

            try {
                // 構建任務描述
                const description = this.formatTaskDescription(task);

                // 創建任務
                const issueData = await this.createIssue({
                    title: task.title,
                    description: description,
                    storyPoints: task.storyPoints
                });

                // 添加任務鍵值對應
                results.keys[i] = issueData.key;

                // 添加到成功列表
                results.success.push({
                    index: i,
                    key: issueData.key,
                    title: task.title
                });

                // 報告進度
                if (progressCallback) {
                    progressCallback(i + 1, tasks.length);
                }
            } catch (error) {
                // 添加到失敗列表
                results.failed.push({
                    index: i,
                    title: task.title,
                    error: error.message
                });

                // 報告進度
                if (progressCallback) {
                    progressCallback(i + 1, tasks.length);
                }
            }
        }

        return results;
    }

    /**
     * 處理任務依賴關係
     * @param {Array} tasks 任務數組
     * @param {Object} keysMap 任務索引到 Key 的映射
     * @param {function} progressCallback 進度回調函數
     * @returns {Promise<Object>} 結果對象 {success: number, failed: Array}
     */
    async processTaskDependencies(tasks, keysMap, progressCallback = null) {
        const results = {
            success: 0,
            failed: []
        };

        let processedCount = 0;

        // 遍歷所有任務
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const currentKey = keysMap[i];

            // 如果當前任務有鍵且有依賴
            if (currentKey && task.dependencies && task.dependencies.length > 0) {
                // 處理每個依賴
                for (const depIndex of task.dependencies) {
                    const depKey = keysMap[depIndex];

                    // 如果依賴任務有鍵
                    if (depKey) {
                        try {
                            // 創建任務鏈接
                            await this.createIssueLink(currentKey, depKey);
                            results.success++;
                        } catch (error) {
                            results.failed.push({
                                from: currentKey,
                                to: depKey,
                                error: error.message
                            });
                        }
                    }
                }
            }

            // 更新進度
            processedCount++;
            if (progressCallback) {
                progressCallback(processedCount, tasks.length);
            }
        }

        return results;
    }

    /**
     * 格式化任務描述
     * @param {Object} task 任務對象
     * @returns {string} 格式化後的描述
     */
    formatTaskDescription(task) {
        return `*用戶故事:* ${task.userStory}\n\n*任務描述:* ${task.description}\n\n*驗收標準:*\n${task.acceptanceCriteria.map(criteria => `# ${criteria}`).join('\n')}`;
    }
}

// jira service ------------------ end

/**
 * 任務服務 - 處理任務數據和操作
 */
class TaskService {
    /**
     * 初始化任務服務
     */
    constructor() {
        this.tasks = [];
        this.jiraService = new JiraService();
        this.aiService = new AIService();
        this.uiService = new UIService();
        this.storageService = new StorageService();
    }

    /**
     * 設置任務
     * @param {Array} tasks 任務數組
     */
    setTasks(tasks) {
        this.tasks = tasks;
        // 存儲到全局變量供其他地方使用
        window.generatedTasks = tasks;
    }

    /**
     * 獲取任務
     * @returns {Array} 任務數組
     */
    getTasks() {
        return this.tasks;
    }

    /**
     * 使用 AI 生成任務
     * @param {string} requirement 需求描述
     * @returns {Promise<Array>} 生成的任務數組
     */
    async generateTasks(requirement) {
        try {
            // 顯示 AI 思考動畫
            const aiThinking = this.uiService.showAIThinking();

            // 添加日誌
            this.uiService.addLog('開始使用 AI 拆分需求...', 'info');
            this.uiService.addLog('正在發送請求到 OpenRouter API...', 'info');

            // 調用 AI 服務
            const tasks = await this.aiService.generateTasks(requirement);

            // 隱藏 AI 思考動畫
            aiThinking.clear();

            // 設置任務
            this.setTasks(tasks);

            // 添加日誌
            this.uiService.addLog(`成功拆分需求為 ${tasks.length} 個任務`, 'success');

            return tasks;
        } catch (error) {
            this.uiService.addLog(`${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 創建 JIRA 任務
     * @param {Array} selectedIndices 選中的任務索引
     * @returns {Promise<Object>} 創建結果
     */
    async createJiraTasks(selectedIndices) {
        try {
            if (!selectedIndices || selectedIndices.length === 0) {
                throw new Error('未選擇任何任務');
            }

            const tasks = this.getTasks();
            const selectedTasks = selectedIndices.map(index => tasks[index]);

            this.uiService.addLog(`開始建立 ${selectedTasks.length} 個 JIRA 任務...`, 'info');

            // 創建任務
            const createResults = await this.jiraService.createIssues(
                selectedTasks,
                (current, total) => {
                    this.uiService.updateProgressBar(current, total, 'creation-progress');
                }
            );

            if (createResults.success.length === 0) {
                throw new Error('所有任務創建失敗');
            }

            // 添加到 Sprint
            const sprintId = this.storageService.getSetting('sprintId');
            if (sprintId) {
                this.uiService.addLog(`正在將任務添加到 Sprint ${sprintId}...`, 'info');

                for (const task of createResults.success) {
                    try {
                        await this.jiraService.addIssueToSprint(task.key, sprintId);
                        this.uiService.addLog(`任務 ${task.key} 已添加到 Sprint`, 'success');
                    } catch (error) {
                        this.uiService.addLog(`添加任務 ${task.key} 到 Sprint 失敗: ${error.message}`, 'warning');
                    }
                }
            }

            // 處理依賴關係
            this.uiService.addLog('正在處理任務依賴關係...', 'info');

            const dependencyResults = await this.jiraService.processTaskDependencies(
                selectedTasks,
                createResults.keys,
                (current, total) => {
                    this.uiService.updateProgressBar(current, total, 'dependency-progress');
                }
            );

            // 顯示結果摘要
            this.uiService.addLog(`任務建立完成：${createResults.success.length} 成功，${createResults.failed.length} 失敗`, 'success');

            if (dependencyResults.failed.length > 0) {
                this.uiService.addLog(`依賴關係建立：${dependencyResults.success} 成功，${dependencyResults.failed.length} 失敗`, 'warning');
            } else {
                this.uiService.addLog(`依賴關係建立：${dependencyResults.success} 成功`, 'success');
            }

            // 添加 JIRA 鏈接
            const jiraUrl = this.storageService.getSetting('jiraUrl');
            const jiraProject = this.storageService.getSetting('jiraProject');
            if (jiraUrl && jiraProject) {
                this.uiService.addJiraLink(jiraUrl, jiraProject);
            }

            return {
                createResults,
                dependencyResults
            };
        } catch (error) {
            this.uiService.addLog(error.message, 'error');
            throw error;
        }
    }

    /**
     * 獲取活躍的 Sprint
     * @returns {Promise<void>}
     */
    async getActiveSprint() {
        try {
            this.uiService.addLog('正在獲取活躍的 Sprint...', 'info');

            const sprint = await this.jiraService.getCurrentActiveSprint();

            // 更新設定
            this.storageService.setSetting('sprintId', sprint.id);

            this.uiService.addLog(`成功載入活躍的 Sprint: ${sprint.name} (ID: ${sprint.id})`, 'success');

            return sprint;
        } catch (error) {
            this.uiService.addLog(error.message, 'error');
            throw error;
        }
    }
}

//  task service   end -------------------------------

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

/**
 * 應用主類 - 協調各個服務和處理事件
 */
class App {
    /**
     * 初始化應用
     */
    constructor() {
        this.uiService = new UIService();
        this.storageService = new StorageService();
        this.taskService = new TaskService();

        // 初始化
        this.initialize();
    }

    /**
     * 初始化應用
     */
    initialize() {
        console.log(`JIRA AI 需求拆分工具 v${AppConfig.VERSION} 初始化中...`);

        // 載入設定
        this.loadSettings();

        // 設置事件監聽器
        this.setupEventListeners();

        // 檢查設定狀態
        this.checkSettingsStatus();
    }

    /**
     * 載入設定
     */
    loadSettings() {
        const settings = this.storageService.loadSettings();

        // 填充表單
        AppConfig.SETTINGS_FIELDS.forEach(id => {
            const element = document.getElementById(id);
            if (element && settings[id]) {
                if (element.type === 'checkbox') {
                    element.checked = settings[id] === 'true';
                } else {
                    element.value = settings[id];
                }
            }
        });
    }

    /**
     * 檢查設定狀態
     */
    checkSettingsStatus() {
        const isConfigured = this.storageService.hasRequiredSettings();
        this.uiService.showSettingsConfigured(isConfigured);
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 保存設定
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // 生成任務
        document.getElementById('generateTasks').addEventListener('click', () => this.generateTasks());

        // 獲取活躍 Sprint
        document.getElementById('loadActiveSprint').addEventListener('click', () => this.getActiveSprint());

        // 選擇任務操作
        document.getElementById('selectAllTasks').addEventListener('click', () => this.uiService.selectAllTasks());
        document.getElementById('deselectAllTasks').addEventListener('click', () => this.uiService.deselectAllTasks());
        document.getElementById('showRequirement').addEventListener('click', () => this.uiService.toggleRequirementSection());

        // 創建 JIRA 任務
        document.getElementById('createJiraTasks').addEventListener('click', () => this.createJiraTasks());
    }

    /**
     * 保存設定
     */
    saveSettings() {
        try {
            const settings = {};

            // 收集表單值
            AppConfig.SETTINGS_FIELDS.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        settings[id] = element.checked.toString();
                    } else {
                        settings[id] = element.value;
                    }
                }
            });

            // 保存到本地存儲
            const success = this.storageService.saveSettings(settings);

            if (success) {
                this.uiService.addLog('設定已儲存', 'success');
                this.checkSettingsStatus();
            } else {
                this.uiService.addLog('設定儲存失敗', 'error');
            }
        } catch (error) {
            console.error('保存設定時出錯:', error);
            this.uiService.addLog(`保存設定失敗: ${error.message}`, 'error');
        }
    }

    /**
     * 生成任務
     */
    async generateTasks() {
        try {
            const requirementInput = document.getElementById('requirementInput');
            const requirement = requirementInput.value.trim();

            if (!requirement) {
                this.uiService.addLog('請輸入需求描述', 'warning');
                return;
            }

            // 顯示載入指示器
            const generateButton = document.getElementById('generateTasks');
            this.uiService.showLoadingIndicator(generateButton, true);

            // 調用任務服務生成任務
            const tasks = await this.taskService.generateTasks(requirement);

            // 顯示任務
            this.uiService.displayTasks(tasks);
        } catch (error) {
            console.error('生成任務失敗:', error);
            this.uiService.addLog(`生成任務失敗: ${error.message}`, 'error');

            // 重新顯示需求區塊
            document.getElementById('requirementSection').classList.remove('hidden');
        } finally {
            // 隱藏載入指示器
            const generateButton = document.getElementById('generateTasks');
            this.uiService.showLoadingIndicator(generateButton, false);
        }
    }

    /**
     * 獲取活躍 Sprint
     */
    async getActiveSprint() {
        try {
            // 檢查必要設定
            if (!this.checkRequiredSettings(['jiraUrl', 'jiraToken', 'jiraEmail', 'jiraProject'])) {
                this.uiService.addLog('請先設定 JIRA 相關參數', 'warning');
                return;
            }

            // 禁用按鈕
            const loadButton = document.getElementById('loadActiveSprint');
            loadButton.disabled = true;
            const originalContent = loadButton.innerHTML;
            loadButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 載入中';

            // 獲取活躍 Sprint
            await this.taskService.getActiveSprint();

            // 添加視覺反饋
            const sprintIdField = document.getElementById('sprintId');
            sprintIdField.classList.add('border-green-500');
            setTimeout(() => {
                sprintIdField.classList.remove('border-green-500');
            }, 2000);
        } catch (error) {
            console.error('獲取活躍 Sprint 失敗:', error);
            this.uiService.addLog(`獲取活躍 Sprint 失敗: ${error.message}`, 'error');
        } finally {
            // 恢復按鈕
            const loadButton = document.getElementById('loadActiveSprint');
            loadButton.disabled = false;
            loadButton.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> 獲取';
        }
    }

    /**
     * 創建 JIRA 任務
     */
    async createJiraTasks() {
        try {
            // 檢查必要設定
            if (!this.checkRequiredSettings(['jiraUrl', 'jiraToken', 'jiraEmail', 'jiraProject'])) {
                this.uiService.addLog('請先設定 JIRA 相關參數', 'warning');
                return;
            }

            // 獲取選中的任務索引
            const selectedIndices = this.uiService.getSelectedTaskIndices();

            if (selectedIndices.length === 0) {
                this.uiService.addLog('請選擇至少一個要建立的任務', 'warning');
                return;
            }

            // 禁用按鈕
            const createButton = document.getElementById('createJiraTasks');
            createButton.disabled = true;
            createButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 正在建立...';
            createButton.classList.add('opacity-50');

            // 創建任務
            await this.taskService.createJiraTasks(selectedIndices);
        } catch (error) {
            console.error('創建 JIRA 任務失敗:', error);
            this.uiService.addLog(`創建 JIRA 任務失敗: ${error.message}`, 'error');
        } finally {
            // 恢復按鈕
            const createButton = document.getElementById('createJiraTasks');
            createButton.disabled = false;
            createButton.innerHTML = '<i class="fas fa-plus-circle mr-1"></i> 建立選定的 JIRA 卡片';
            createButton.classList.remove('opacity-50');
        }
    }

    /**
     * 檢查必要設定
     * @param {Array} fields 要檢查的字段名數組
     * @returns {boolean} 是否所有字段都有值
     */
    checkRequiredSettings(fields) {
        for (const field of fields) {
            const value = this.storageService.getSetting(field);
            if (!value || value.trim() === '') {
                return false;
            }
        }
        return true;
    }
}

// 頁面加載完成後初始化應用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// app.js  end
