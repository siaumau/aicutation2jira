@echo off
echo 正在啟動 JIRA AI 需求拆分工具...
echo.

REM 檢查是否已安裝 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 錯誤：未安裝 Node.js！
    echo 請先安裝 Node.js 後再執行此程式。
    echo 您可以從 https://nodejs.org 下載安裝。
    pause
    exit /b 1
)

echo 正在安裝必要套件...
call npm install
if %errorlevel% neq 0 (
    echo 錯誤：套件安裝失敗！
    pause
    exit /b 1
)
echo 套件安裝完成！
echo.

echo 正在啟動代理服務器...
start "JIRA AI 代理服務器" cmd /c "npm run dev"
echo 代理服務器啟動中...
echo.

REM 等待幾秒鐘確保服務器已啟動
timeout /t 3 /nobreak >nul

echo 正在開啟應用程式...
start "" "index.html"
echo.

echo 應用程式已啟動！
echo 請勿關閉此視窗，關閉後代理服務器將停止運作。
echo.
echo 按下 Ctrl+C 可以結束程式...
echo.
