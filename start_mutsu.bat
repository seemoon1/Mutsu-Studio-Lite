@echo off
setlocal enabledelayedexpansion
title Mutsu Studio Lite - Safe Boot

echo.
echo ==================================================
echo      MUTSU STUDIO LITE (Community Edition)
echo           System Initialization...
echo ==================================================
echo.

:: 1. 检查 Node.js
echo [1/5] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH!
    echo Please install Node.js v18 or later.
    pause
    exit /b
)
echo    - Node.js found.

:: 2. 自动创建目录
echo [2/5] Verifying storage architecture...

if not exist "data_storage\" mkdir "data_storage"
if not exist "data_storage\slots\" mkdir "data_storage\slots"

:: 确保 public 下的所有素材目录都存在
if not exist "public\gallery\" mkdir "public\gallery"
if not exist "public\tachie\" mkdir "public\tachie"
if not exist "public\live2d\" (
    echo [+] Creating live2d directory...
    mkdir "public\live2d"
)
if not exist "public\music\" (
    echo [+] Creating music directory...
    mkdir "public\music"
)
if not exist "public\backgrounds\" (
    echo [+] Creating backgrounds directory...
    mkdir "public\backgrounds"
)

echo    - Directories ready.

:: 3. 依赖安装检测
echo [3/5] Checking dependencies...
if exist "node_modules\" goto :SKIP_INSTALL

echo    - node_modules not found. Installing...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b
)
echo    - Dependencies installed.

:SKIP_INSTALL

:: 4. 配置文件生成
echo [4/5] Checking config files...
if exist "scripts\ensure_configs.js" (
    node scripts/ensure_configs.js
) else (
    echo    - Script 'ensure_configs.js' not found, skipping.
)

:: 5. 启动服务
echo.
echo [5/5] Starting Neural Link...
echo.
echo ==================================================
echo    Access: http://localhost:3000
echo    Status: STARTING...
echo ==================================================
echo.

:: 打开浏览器 (稍微延迟一点，防止网页报错)
timeout /t 3 >nul
start "" "http://localhost:3000"

:: 启动 Next.js (这是最容易报错的地方)
call npm run dev

:: 如果运行到这里，说明服务器崩溃了
echo.
echo ==================================================
echo [CRITICAL] The server process has crashed!
echo Please check the error messages above.
echo ==================================================
pause