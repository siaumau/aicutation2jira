import JiraService from './jira.service.js';
import AIService from './ai.service.js';
import UIService from './ui.service.js';
import StorageService from './storage.service.js';

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

export default TaskService;
