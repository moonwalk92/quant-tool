# 🚀 真实交易接入 - 快速开始

## ⚡ 3 分钟快速配置

### 1️⃣ 运行配置向导
```bash
cd /Users/huan/.openclaw/workspace/quant-tool
./setup-real-trading.sh
```

### 2️⃣ 编辑配置文件
```bash
vi .env
# 或
nano .env
```

填入你的 MT5 账户信息：
```bash
MT5_LOGIN=你的账户号
MT5_PASSWORD=你的交易密码
MT5_SERVER=你的服务器名称
```

### 3️⃣ 测试连接
```bash
python3 test-mt5-connection.py
```

### 4️⃣ 启动交易
```bash
./start-real-trading.sh
```

---

## 📋 完整文档

- **REAL-TRADING-GUIDE.md** - 详细配置指南
- **.env.trading** - 配置文件模板
- **test-mt5-connection.py** - 连接测试脚本

---

## ⚠️ 风险提示

- 真实交易存在本金损失风险
- 建议先在模拟账户测试至少 2 周
- 只用你能承受损失的资金交易
- 系统已设置 20% 最大回撤保护

---

## 🆘 需要帮助？

1. 查看日志：`tail -f trading_bot.log`
2. 测试连接：`python3 test-mt5-connection.py`
3. 检查配置：`cat .env`
