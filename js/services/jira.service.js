import AppConfig from '../config.js';
import ApiService from './api.service.js';
import StorageService from './storage.service.js';

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

export default JiraService;
