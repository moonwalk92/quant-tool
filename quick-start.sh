#!/bin/bash

echo "╔═══════════════════════════════════════════════════╗"
echo "║     Quant Tool 量化交易工具                        ║"
echo "║     快速启动脚本                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js"
    echo ""
    echo "请先安装 Node.js 18+"
    echo "访问：https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  启动方式选择：                                    ║"
echo "║                                                   ║"
echo "║  1. 模拟模式（演示用，无需 MT4）                    ║"
echo "║  2. 真实交易模式（需要 MT4 和桥接服务）               ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
read -p "请选择 (1/2): " choice

if [ "$choice" = "2" ]; then
    echo ""
    echo "正在启动 Python 桥接服务..."
    cd mt4-bridge
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -q pyzmq colorama
    python mt4_bridge.py &
    BRIDGE_PID=$!
    cd ..
    echo "✅ Python 桥接已启动 (PID: $BRIDGE_PID)"
    sleep 2
fi

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  启动量化交易服务器...                             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 启动服务器
npm start

# 清理
if [ ! -z "$BRIDGE_PID" ]; then
    kill $BRIDGE_PID 2>/dev/null
fi
