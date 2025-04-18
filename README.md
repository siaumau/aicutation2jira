# JIRA AI 需求拆分工具

使用 AI 大型語言模型來智能拆分需求並自動創建 JIRA 卡片的工具。

## 功能特點

### 1. 系統配置
- JIRA 設定整合
  - JIRA URL 配置
  - API Token 管理
  - 專案 Key 設定
  - 電子郵件驗證
- AI 模型設定
  - OpenRouter API Key 配置
  - 支援 Meta-Llama/Llama-4-Maverick 模型
- Sprint 管理
  - 自動獲取當前 Sprint ID
  - 預設任務負責人設定
- 系統優化
  - CORS 代理支援
  - 設定狀態持久化

### 2. 需求拆分
- 智能需求分析
- 自動任務拆分
- 即時 AI 處理狀態顯示
- 支援多層次任務依賴關係

### 3. 任務管理
- 批量任務選擇
- 任務統計展示
- 成功/失敗狀態追蹤
- 自動移除已建立卡片
- 支援重新請求需求拆分

### 4. JIRA 整合
- 自動創建 JIRA 卡片
- 任務依賴關係建立
- Sprint 自動關聯
- 操作日誌記錄

## 系統流程

### 需求拆分流程
```mermaid
sequenceDiagram
    participant User as 使用者
    participant UI as 前端介面
    participant AI as AI 模型
    participant JIRA as JIRA API

    User->>UI: 輸入需求描述
    UI->>AI: 發送需求到 OpenRouter API
    AI-->>UI: 返回拆分後的任務清單
    UI->>User: 顯示拆分結果
    User->>UI: 選擇要建立的卡片
    UI->>JIRA: 建立 JIRA 卡片
    UI->>JIRA: 建立任務依賴關係
    JIRA-->>UI: 返回建立結果
    UI->>User: 更新統計和狀態
```

### 卡片建立流程
```mermaid
flowchart TD
    A[開始] --> B{檢查配置}
    B -->|未配置| C[顯示錯誤]
    B -->|已配置| D[獲取選中的任務]
    D --> E[循環處理任務]
    E --> F{建立 JIRA 卡片}
    F -->|成功| G[更新成功計數]
    F -->|失敗| H[更新失敗計數]
    G --> I[處理依賴關係]
    I --> J{建立關聯}
    J -->|成功| K[更新UI]
    J -->|失敗| L[記錄錯誤]
    K --> M[移除已建立卡片]
    L --> M
    M --> N[結束]
```

## 技術棧
- 前端：HTML5, TailwindCSS, JavaScript
- AI：OpenRouter API (Meta-Llama/Llama-4-Maverick)
- 整合：JIRA REST API
- 動畫：CSS3 Animations

## 最新更新
- 新增卡片建立成功/失敗統計
- 支援自動移除已建立的卡片
- 添加重新請求需求拆分功能
- 優化設定面板的展開/收合功能
- 改進任務依賴關係的建立機制
- 添加 OpenRouter API 相關說明和連結

## 使用說明
1. 配置必要的 API 設定
2. 輸入需求描述
3. 等待 AI 分析和拆分
4. 選擇要建立的卡片
5. 點擊建立按鈕自動創建 JIRA 卡片

## 注意事項
- 需要有效的 JIRA API Token
- 需要 OpenRouter API Key
- 建議使用現代瀏覽器以獲得最佳體驗
- 如遇到 CORS 問題，可啟用代理功能

## 系統需求

- Node.js 14.0 或以上版本
- 現代化瀏覽器（Chrome、Firefox、Edge 等）
- JIRA 帳號和 API 權限
- OpenRouter API 金鑰

## 安裝步驟

1. 克隆專案：
   ```bash
   git clone [專案網址]
   cd aicutation2jira
   ```

2. 安裝依賴：
   ```bash
   npm install
   ```

3. 設定環境變數：
   - 複製 `.env.example` 為 `.env`
   - 填入必要的設定值

4. 啟動代理服務器：
   ```bash
   npm run dev
   ```

5. 開啟應用程式：
   - 使用瀏覽器開啟 `index.html`

## 使用流程

```mermaid
graph TD
    A[開始] --> B[設定系統參數]
    B --> C[輸入需求描述]
    C --> D[AI 分析需求]
    D --> E[生成任務卡片]
    E --> F{調整任務細節}
    F -->|修改估點/工時| F
    F -->|確認完成| G[選擇要建立的卡片]
    G --> H[建立 JIRA 任務]
    H --> I[建立相依關係]
    I --> J[完成]
```

## 系統架構

```mermaid
graph LR
    A[前端介面] --> B[Node.js 代理服務器]
    B --> C[JIRA API]
    A --> D[OpenRouter AI API]
    D --> A
    B --> A
```

## 資料流程

```mermaid
sequenceDiagram
    participant U as 使用者
    participant F as 前端介面
    participant P as 代理服務器
    participant J as JIRA
    participant A as AI 服務

    U->>F: 輸入需求
    F->>A: 發送需求分析請求
    A->>F: 返回拆分結果
    F->>U: 顯示任務卡片
    U->>F: 調整並確認
    F->>P: 發送建立請求
    P->>J: 建立 JIRA 任務
    J->>P: 返回建立結果
    P->>F: 返回處理結果
    F->>U: 顯示完成訊息
```

## 主要功能說明

### 1. 需求分析
- 使用 AI 模型分析需求文本
- 識別關鍵功能點
- 建議合適的拆分方式

### 2. 任務拆分
- 自動生成任務標題和描述
- 建議故事點數和工時
- 識別任務相依關係
- 支援多種任務類型（前端、後端、設計等）

### 3. 估算調整
- 可調整故事點數（1、2、3、5、8、13）
- 可調整預估工時（支援小數點）
- 即時更新調整結果

### 4. JIRA 整合
- 自動建立 JIRA 任務
- 設定任務相依關係
- 支援添加到 Sprint
- 可指定預設經辦人

## 注意事項

1. 安全性考慮
   - 請勿在公共環境儲存敏感資訊
   - 定期更新 API 金鑰
   - 使用適當的權限設定

2. 使用建議
   - 定期備份重要資料
   - 在建立大量任務前先確認設定
   - 注意 API 使用限制

## 常見問題

Q: 為什麼需要代理服務器？
A: 為了解決瀏覽器的 CORS 限制，確保能安全地與 JIRA API 通訊。

Q: 如何調整 AI 生成的結果？
A: 您可以直接在介面上調整故事點數和工時，系統會即時儲存修改。

Q: 支援哪些 JIRA 項目類型？
A: 目前支援 Story、Task、Bug 等標準類型，可根據需求擴充。

## 更新日誌

### v1.0.0
- 初始版本發布
- 基本需求拆分功能
- JIRA 整合
- AI 分析支援

## 貢獻指南

歡迎提交 Issue 和 Pull Request 來改善此工具。

## 授權

MIT License
