@echo off
chcp 65001 >nul
title JIRA AI 需求拆分工具啟動器

cls
echo ================================================
echo              JIRA AI 需求拆分工具
echo ================================================
echo.

REM 檢查是否已安裝 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [31m錯誤：未安裝 Node.js！[0m
    echo 請先安裝 Node.js 後再執行此程式。
    echo 您可以從 https://nodejs.org 下載安裝。
    pause
    exit /b 1
)

echo [92m正在安裝必要套件...[0m
call npm install
if %errorlevel% neq 0 (
    echo [31m錯誤：套件安裝失敗！[0m
    pause
    exit /b 1
)
echo [92m套件安裝完成！[0m
echo.

echo [92m正在啟動代理服務器...[0m
start "JIRA AI 代理服務器" cmd /k "chcp 65001 >nul && echo 代理服務器已啟動，請勿關閉此視窗 && echo. && npm run dev"
echo [92m代理服務器啟動中...[0m
echo.

REM 等待幾秒鐘確保服務器已啟動
timeout /t 3 /nobreak >nul

echo [92m正在開啟應用程式...[0m
start "" "index.html"
echo.

echo [92m應用程式已啟動！[0m
echo [93m請注意：[0m
echo  - 請勿關閉命令視窗，否則代理服務器將停止運作
echo  - 要結束程式請按下 Ctrl+C 或關閉所有相關視窗
echo.
echo [96m================================================[0m
echo   如需協助請參考 README.md 文件
echo [96m================================================[0m
echo.
