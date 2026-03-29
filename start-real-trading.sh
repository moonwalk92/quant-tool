#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║           🚀 量化交易工具 - 真实交易模式               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误：未找到 .env 配置文件"
    echo ""
    echo "请先配置交易账户信息："
    echo "  1. cp .env.example .env"
    echo "  2. 编辑 .env，填入你的 MT5 账户信息"
    echo ""
    exit 1
fi

# 加载环境变量
source .env

# 检查 MT5 账户配置
if [ -z "$MT5_LOGIN" ] || [ "$MT5_LOGIN" == "你的账户号" ]; then
    echo "❌ 错误：未配置 MT5 账户信息"
    echo ""
    echo "请在 .env 文件中设置："
    echo "  MT5_LOGIN=你的账户号"
    echo "  MT5_PASSWORD=你的交易密码"
    echo "  MT5_SERVER=你的服务器名称"
    echo ""
    exit 1
fi

echo "✅ 配置文件检查通过"
echo ""
echo "📋 交易配置："
echo "   账户：$MT5_LOGIN"
echo "   服务器：$MT5_SERVER"
echo "   品种：${TRADING_SYMBOL:-XAUUSD}"
echo "   单笔风险：${RISK_PER_TRADE:-0.01} (${RISK_PER_TRADE:-0.01}*100)%"
echo "   最大回撤：${MAX_DRAWDOWN:-0.20} (${MAX_DRAWDOWN:-0.20}*100)%"
echo ""

# 安全检查
echo "🔒 安全检查："
read -p "⚠️  确认已充分了解交易风险，是否继续？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo ""
    echo "❌ 已取消启动"
    exit 0
fi

echo ""
echo "✅ 安全检查通过"
echo ""
echo "🚀 启动真实交易..."
echo ""

# 启动 Python 交易机器人
python3 quant_trading_bot.py
