#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║        🛠️  真实交易快速配置向导                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未检测到 Python3，请先安装 Python3"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 安装 Python 依赖
echo "📦 安装 Python 依赖..."
pip3 install MetaTrader5 2>&1 | tail -3
echo ""

# 安装 Node.js 依赖
echo "📦 安装 Node.js 依赖..."
npm install --silent 2>&1 | tail -3
echo ""

# 创建配置文件
if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.trading .env
    echo "✅ 已创建 .env 配置文件"
    echo ""
    echo "⚠️  请编辑 .env 文件，填入你的 MT5 账户信息："
    echo "   vi .env"
    echo ""
    echo "需要填写："
    echo "  - MT5_LOGIN (账户号)"
    echo "  - MT5_PASSWORD (交易密码)"
    echo "  - MT5_SERVER (服务器名称)"
    echo ""
else
    echo "✅ 配置文件已存在"
    echo ""
fi

echo "╔════════════════════════════════════════════════════════╗"
echo "║                    配置完成！                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 启动真实交易："
echo "   ./start-real-trading.sh"
echo ""
echo "📖 查看详细指南："
echo "   cat REAL-TRADING-GUIDE.md"
echo ""
