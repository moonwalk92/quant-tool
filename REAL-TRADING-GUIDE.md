# 🚀 真实交易接入指南

## ⚠️ 重要风险提示

**在开始真实交易前，请务必阅读：**

1. **本金风险** - 真实交易存在本金损失风险，请只用你能承受损失的资金
2. **充分测试** - 务必先在模拟账户充分测试，确认策略有效后再考虑实盘
3. **风险控制** - 系统已设置 20% 最大回撤保护，但请根据个人风险承受能力调整
4. **网络稳定性** - 真实交易需要稳定的网络连接，建议使用 VPS 部署

---

## 📋 接入步骤

### 步骤 1：准备交易账户

你需要一个 **MetaTrader 4/5** 交易账户：

#### 推荐交易商（支持黄金/外汇）
| 交易商 | 最低入金 | 点差 (XAUUSD) | 监管 |
|--------|---------|--------------|------|
| IC Markets | $200 | ~0.15 USD | ASIC, CySEC |
| Pepperstone | $200 | ~0.18 USD | FCA, ASIC |
| XM | $5 | ~0.20 USD | IFSC |

#### 获取账户信息
注册后，你需要以下信息：
- **账户号** (Login) - 如：104724832
- **密码** (Password) - 交易密码
- **服务器** (Server) - 如：ICMarketsSC-Demo

---

### 步骤 2：配置环境变量

创建 `.env` 文件：

```bash
cd /Users/huan/.openclaw/workspace/quant-tool
cp .env.example .env
```

编辑 `.env` 文件，填入你的交易账户信息：

```bash
# MT5 账户信息（真实交易必填）
MT5_LOGIN=你的账户号
MT5_PASSWORD=你的交易密码
MT5_SERVER=你的服务器名称

# 交易参数
TRADING_SYMBOL=XAUUSD
RISK_PER_TRADE=0.01        # 单笔风险 1%
MAX_DRAWDOWN=0.20          # 最大回撤 20%
```

---

### 步骤 3：启动真实交易

#### 方式 1：Python 交易机器人（推荐）

```bash
cd /Users/huan/.openclaw/workspace/quant-tool
python3 quant_trading_bot.py
```

#### 方式 2：Node.js 交易引擎

```bash
# 1. 启动 MT4 Bridge
cd mt4-bridge
python3 mt4_bridge.py

# 2. 启动交易服务器
cd /Users/huan/.openclaw/workspace/quant-tool
npm start
```

访问：http://localhost:3000

---

## 🔒 安全检查清单

在开始真实交易前，请确认：

- [ ] 已在模拟账户充分测试（至少 2 周）
- [ ] 已设置合理的止损和止盈
- [ ] 已确认账户资金充足（建议至少 $1000）
- [ ] 已设置最大回撤保护（默认 20%）
- [ ] 已测试网络稳定性

---

## 🛑 紧急停止

### 命令行停止
```bash
Ctrl+C  # 停止交易机器人
```

### Web 界面停止
访问：http://localhost:3000，点击「紧急停止」

---

**⚠️ 最后提醒：交易有风险，入市需谨慎！**
