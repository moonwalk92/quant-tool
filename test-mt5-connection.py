#!/usr/bin/env python3
"""
MT5 连接测试脚本
在开始真实交易前，先运行此脚本测试连接
"""

import os
import sys
from datetime import datetime

# 加载环境变量
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

print("=" * 60)
print("🔌 MT5 连接测试")
print("=" * 60)
print()

# 检查环境变量
login = os.environ.get('MT5_LOGIN', '')
password = os.environ.get('MT5_PASSWORD', '')
server = os.environ.get('MT5_SERVER', '')

print("📋 配置检查:")
print(f"   账户号：{'✅' if login and login != '你的账户号' else '❌ 未配置'}")
print(f"   密码：{'✅' if password else '❌ 未配置'}")
print(f"   服务器：{'✅' if server else '❌ 未配置'}")
print()

if not login or login == '你的账户号':
    print("❌ 错误：请先在 .env 文件中配置 MT5 账户信息")
    sys.exit(1)

# 尝试导入 MetaTrader5
try:
    import MetaTrader5 as mt5
    print("✅ MetaTrader5 库已安装")
except ImportError:
    print("❌ 错误：未安装 MetaTrader5 库")
    print("   安装命令：pip3 install MetaTrader5")
    sys.exit(1)

print()
print("🔌 尝试连接 MT5...")
print()

# 初始化 MT5
if not mt5.initialize():
    print(f"❌ MT5 初始化失败：{mt5.last_error()}")
    print()
    print("可能原因:")
    print("  1. MT5 终端未运行")
    print("  2. 账户信息错误")
    print("  3. 网络连接问题")
    sys.exit(1)

print("✅ MT5 初始化成功")

# 获取账户信息
account_info = mt5.account_info()
if account_info:
    print()
    print("💰 账户信息:")
    print(f"   账户号：{account_info.login}")
    print(f"   服务器：{account_info.server}")
    print(f"   余额：${account_info.balance:.2f}")
    print(f"   净值：${account_info.equity:.2f}")
    print(f"   货币：{account_info.currency}")
    print(f"   杠杆：1:{account_info.leverage}")
    print()
    
    # 检查是否是模拟账户
    if 'demo' in account_info.server.lower() or account_info.balance < 100:
        print("⚠️  检测到模拟账户或小额账户")
        print("   真实交易前请确认账户类型和资金充足")
    else:
        print("✅ 账户状态正常")
else:
    print("❌ 无法获取账户信息")

# 测试获取价格
print()
print("📊 测试获取价格 (XAUUSD)...")
symbol = "XAUUSD"
mt5.symbol_select(symbol, True)
tick = mt5.symbol_info_tick(symbol)

if tick:
    print(f"✅ 获取价格成功:")
    print(f"   Bid: ${tick.bid:.2f}")
    print(f"   Ask: ${tick.ask:.2f}")
    print(f"   时间：{datetime.fromtimestamp(tick.time)}")
else:
    print(f"❌ 获取价格失败：{mt5.last_error()}")
    print("   可能该品种不可用，请检查交易商支持的品种")

print()
print("=" * 60)
print("✅ 连接测试完成！")
print("=" * 60)
print()
print("🚀 下一步:")
print("   如果测试通过，可以启动真实交易:")
print("   ./start-real-trading.sh")
print()

mt5.shutdown()
