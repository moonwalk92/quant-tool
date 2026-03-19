@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════╗
echo ║          MT4 桥接服务启动脚本 (Windows)            ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo ✓ Python: 
python --version
echo.

REM 创建虚拟环境
if not exist "venv" (
    echo 正在创建 Python 虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装依赖
echo 正在安装 Python 依赖...
pip install -q pyzmq colorama

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  启动方式选择：                                    ║
echo ║                                                   ║
echo ║  1. 仅启动 Node.js 服务器（模拟模式）               ║
echo ║  2. 启动 Python MT4 桥接 + Node.js 服务器            ║
echo ║                                                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.
set /p choice="请选择 (1/2): "

if "%choice%"=="2" (
    echo 正在启动 Python MT4 桥接服务...
    start "MT4 Bridge" cmd /c "python mt4_bridge.py"
    timeout /t 3 /nobreak >nul
    echo ✓ MT4 桥接服务已启动
)

cd ..

REM 检查 Node.js 依赖
if not exist "node_modules" (
    echo 正在安装 Node.js 依赖...
    call npm install
)

REM 启动 Node.js 服务器
echo.
echo 正在启动量化交易服务器...
echo.
call npm start

pause
