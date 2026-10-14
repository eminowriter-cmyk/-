@echo off
chcp 65001 >nul
title 貓咪互動樂園 - 展覽伺服器
echo ========================================================
echo  🐱 貓咪互動樂園 (Crayon Cat Paradise) 展覽伺服器啟動中
echo ========================================================
echo.
echo 正在開啟瀏覽器大螢幕畫面...
start http://localhost:8000
echo.
echo 正在啟動伺服器與目錄監聽器...
python server.py
if %errorlevel% neq 0 (
    echo.
    echo [提示] 正在嘗試使用 py 指令啟動...
    py server.py
)
pause
