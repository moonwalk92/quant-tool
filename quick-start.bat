@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════╗
echo ║     Quant Tool 量化交易工具                        ║
echo ║     快速启动脚本 (Windows)                         ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Node.js
    echo.
    echo 请先安装 Node.js 18+
    echo 访问：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

REM 检查依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo ╔═══════════════════════════════════════════════════╗
echo ║  启动方式选择：                                    ║
echo ║                                                   ║
echo ║  1. 模拟模式（演示用，无需 MT4）                    ║
echo ║  2. 真实交易模式（需要 MT4 和桥接服务）               ║
echo ║                                                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.
set /p choice="请选择 (1/2): "

if "%choice%"=="2" (
    echo.
    echo 正在启动 Python 桥接服务...
    cd mt4-bridge
    if not exist "venv" (
        python -m venv venv
    )
    call venv\Scripts\activate
    pip install -q pyzmq colorama
    start "MT4 Bridge" cmd /c "python mt4_bridge.py"
    cd ..
    timeout /t 3 /nobreak >nul
    echo ✅ Python 桥接已启动
)

echo.
echo 正在启动量化交易服务器...
echo.
call npm start

pause
