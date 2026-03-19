#!/bin/bash

# MT4 桥接启动脚本

echo "╔═══════════════════════════════════════════════════╗"
echo "║          MT4 桥接服务启动脚本                      ║"
echo "╚═══════════════════════════════════════════════════╝"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误：未找到 Python3，请先安装 Python3"
    exit 1
fi

echo "✓ Python3: $(python3 --version)"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✓ Node.js: $(node --version)"

# 进入桥接目录
cd "$(dirname "$0")/mt4-bridge"

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "正在创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "正在安装 Python 依赖..."
pip install -q pyzmq colorama

# 检查是否安装 MetaTrader4
if pip show MetaTrader4 > /dev/null 2>&1; then
    echo "✓ MetaTrader4 库已安装"
else
    echo "⚠ MetaTrader4 库未安装，将使用模拟模式"
    echo "  如需真实 MT4 连接，请运行：pip install MetaTrader4"
fi

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  启动方式选择：                                    ║"
echo "║                                                   ║"
echo "║  1. 仅启动 Node.js 服务器（模拟模式）               ║"
echo "║  2. 启动 Python MT4 桥接 + Node.js 服务器            ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
read -p "请选择 (1/2): " choice

if [ "$choice" = "2" ]; then
    # 启动 Python MT4 桥接（后台）
    echo "正在启动 Python MT4 桥接服务..."
    python3 mt4_bridge.py &
    BRIDGE_PID=$!
    echo "✓ MT4 桥接服务已启动 (PID: $BRIDGE_PID)"
    sleep 2
fi

# 返回项目根目录
cd ..

# 检查 Node.js 依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装 Node.js 依赖..."
    npm install
fi

# 启动 Node.js 服务器
echo ""
echo "正在启动量化交易服务器..."
echo ""
npm start

# 清理（如果按 Ctrl+C 停止）
if [ ! -z "$BRIDGE_PID" ]; then
    echo ""
    echo "正在停止 MT4 桥接服务..."
    kill $BRIDGE_PID 2>/dev/null
fi
