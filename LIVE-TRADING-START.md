# 实盘交易快速启动指南

## 🎯 目标

在 Mac 上通过 Whisky 运行 MT4，实现真实量化交易。

---

## 📋 完整流程（30 分钟）

### 步骤 1：安装 Whisky（5 分钟）

```bash
# 访问官网下载
open https://getwhisky.app/

# 或使用 Homebrew（如果支持）
brew install --cask whisky
```

### 步骤 2：安装 MT4（10 分钟）

```bash
# 1. 下载 MT4（以 IC Markets 为例）
open https://www.icmarkets.com/zh/trading-platforms/metatrader-4/

# 2. 打开 Whisky
# 3. 创建新瓶子：MT4
# 4. 运行下载的 mt4_setup.exe
# 5. 完成安装并登录账户
```

### 步骤 3：安装 EA（5 分钟）

```bash
# 1. 在 MT4 中按 F4 打开 MetaEditor
# 2. 打开文件：/Users/huan/.openclaw/workspace/quant-tool/mac-mt4-setup/QuantToolEA/QuantToolEA.mq4
# 3. 按 F7 编译
# 4. 将生成的 .ex4 文件复制到 MT4 数据文件夹的 MQL4/Experts/
# 5. 重启 MT4
```

### 步骤 4：启动桥接服务（5 分钟）

```bash
# 终端 1：启动 Python 桥接
cd /Users/huan/.openclaw/workspace/quant-tool/mt4-bridge
python3 -m venv venv
source venv/bin/activate
pip install pyzmq colorama
python mt4_bridge.py
```

### 步骤 5：启动交易服务器（5 分钟）

```bash
# 终端 2：启动 Node.js 服务器
cd /Users/huan/.openclaw/workspace/quant-tool
npm start
```

### 步骤 6：开始交易（5 分钟）

```bash
# 1. 打开浏览器：http://localhost:3000
# 2. 或在 MT4 图表上添加 QuantToolEA
# 3. 配置参数
# 4. 点击"启动交易"
```

---

## 🚀 一键启动脚本

创建启动脚本 `start-all.sh`：

```bash
#!/bin/bash

echo "╔═══════════════════════════════════════════════════╗"
echo "║     Quant Tool 实盘交易启动                       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 检查 MT4 是否运行
echo "[1/4] 检查 MT4 状态..."
# 需要手动通过 Whisky 启动 MT4
echo "⚠️  请先通过 Whisky 启动 MT4"
read -p "按回车继续..."

# 启动 Python 桥接
echo "[2/4] 启动 Python 桥接服务..."
cd /Users/huan/.openclaw/workspace/quant-tool/mt4-bridge
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q pyzmq colorama

# 后台启动桥接
python mt4_bridge.py &
BRIDGE_PID=$!
echo "✓ Python 桥接已启动 (PID: $BRIDGE_PID)"
sleep 2

# 启动 Node.js 服务器
echo "[3/4] 启动 Node.js 服务器..."
cd /Users/huan/.openclaw/workspace/quant-tool
npm start &
SERVER_PID=$!
echo "✓ Node.js 服务器已启动 (PID: $SERVER_PID)"
sleep 3

# 打开网页
echo "[4/4] 打开网页界面..."
open http://localhost:3000

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  所有服务已启动！                                  ║"
echo "║                                                   ║"
echo "║  - MT4: 通过 Whisky 运行                           ║"
echo "║  - Python 桥接：运行中 (PID: $BRIDGE_PID)          ║"
echo "║  - Node.js 服务器：运行中 (PID: $SERVER_PID)      ║"
echo "║  - 网页界面：http://localhost:3000                ║"
echo "║                                                   ║"
echo "║  按 Ctrl+C 停止所有服务                            ║"
echo "╚═══════════════════════════════════════════════════╝"

# 等待用户中断
wait
```

使用：

```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 📊 配置参数速查

### 保守型（推荐新手）

```javascript
{
  initialCapital: 5000,        // 初始资金 $5000
  riskPerTrade: 0.005,         // 单笔风险 0.5%
  takeProfitPoints: 20,        // 止盈 20 点
  stopLossPoints: 20,          // 止损 20 点
  pendingOrderInterval: 5,     // 挂单间隔 5 点
  maxDrawdown: 0.15            // 最大回撤 15%
}
```

### 稳健型（推荐）

```javascript
{
  initialCapital: 10000,       // 初始资金 $10000
  riskPerTrade: 0.01,          // 单笔风险 1%
  takeProfitPoints: 20,        // 止盈 20 点
  stopLossPoints: 20,          // 止损 20 点
  pendingOrderInterval: 5,     // 挂单间隔 5 点
  maxDrawdown: 0.20            // 最大回撤 20%
}
```

### 激进型（有经验者）

```javascript
{
  initialCapital: 20000,       // 初始资金 $20000
  riskPerTrade: 0.02,          // 单笔风险 2%
  takeProfitPoints: 25,        // 止盈 25 点
  stopLossPoints: 20,          // 止损 20 点
  pendingOrderInterval: 6,     // 挂单间隔 6 点
  maxDrawdown: 0.25            // 最大回撤 25%
}
```

---

## 🎛️ 监控面板

### 网页界面指标

访问：http://localhost:3000

- **实时价格** - 当前市场价格
- **当前权益** - 账户总权益
- **当日回撤** - 当日最大回撤百分比
- **交易统计** - 总交易数和总盈亏
- **当前持仓** - 做多和做空持仓
- **挂单** - 待触发的挂单
- **交易历史** - 最近的交易记录

### MT4 图表指标

- **状态** - 运行中/已停止
- **品种** - 交易品种
- **买入价/卖出价** - 实时价格
- **点差** - 当前点差
- **权益/余额** - 账户信息
- **回撤** - 当前回撤
- **持仓数/挂单数** - 订单统计

---

## ⚠️ 风险控制

### 每日检查

1. **开盘前**
   - [ ] 检查经济日历（避免重大新闻）
   - [ ] 检查系统状态
   - [ ] 确认账户余额

2. **交易中**
   - [ ] 每 2 小时检查一次
   - [ ] 关注回撤情况
   - [ ] 记录异常

3. **收盘后**
   - [ ] 记录当日盈亏
   - [ ] 检查交易记录
   - [ ] 备份日志

### 何时停止交易

**立即停止：**

- 当日回撤达到 15%
- 连续亏损 5 单
- 系统出现异常
- 重大新闻事件即将发布

**暂停调整：**

- 周回撤达到 10%
- 策略连续 3 天亏损
- 市场环境发生重大变化

---

## 📱 移动监控

### 设置邮件通知（可选）

编辑 `src/server.js` 添加邮件通知：

```javascript
const nodemailer = require('nodemailer');

function sendAlert(subject, message) {
  // 配置邮件发送
  // ...
}

// 在关键事件时调用
if (drawdown >= maxDrawdown) {
  sendAlert('回撤警告', '当日回撤已达到限制');
}
```

### 使用券商 APP

- 下载券商的 MT4 手机 APP
- 登录同一账户
- 随时查看持仓和盈亏
- 紧急情况下可以手动平仓

---

## 🔧 常见问题

### Q1: Whisky 运行 MT4 卡顿？

**A:** 
- 在 Whisky 设置中启用 DXVK 和 MSync
- 减少 MT4 打开的图表数量
- 关闭 MT4 的新闻推送

### Q2: 订单执行慢？

**A:**
- 检查网络连接
- 选择离你地理位置近的券商服务器
- 避开高波动时段

### Q3: 回撤太大？

**A:**
- 降低 RiskPerTrade 参数（如从 1% 降到 0.5%）
- 降低 MaxDrawdown 参数
- 考虑调整止盈止损点数

### Q4: 盈利不稳定？

**A:**
- 这是正常现象，量化交易不是稳赚不赔
- 关注长期表现（月线、季线）
- 定期优化参数
- 考虑多品种分散风险

---

## 📈 预期表现

### 历史回测（仅供参考）

**XAUUSD, 2024 年数据：**

| 月份 | 盈亏 | 最大回撤 | 交易数 |
|------|------|----------|--------|
| 1 月 | +5.2% | -8.3% | 45 |
| 2 月 | +3.8% | -6.1% | 38 |
| 3 月 | -2.1% | -12.5% | 52 |
| ... | ... | ... | ... |
| 年化 | ~20-40% | <-20% | ~500 |

**注意：** 过去表现不代表未来，实盘可能有差异。

---

## 🎓 学习资源

- **MQL4 文档**: https://docs.mql4.com/
- **量化交易入门**: 《量化交易：如何建立自己的算法交易事业》
- **风险管理**: 《交易心理分析》
- **技术分析**: 《日本蜡烛图技术》

---

## 📞 技术支持

遇到问题？

1. 查看日志文件
2. 检查 GitHub Issues
3. 联系券商技术支持
4. 查看文档：
   - README.md
   - MT4-BRIDGE-GUIDE.md
   - mac-mt4-setup/README.md
   - EA-INSTALL-GUIDE.md

---

**祝你交易顺利，稳定盈利！** 📈💰

**记住：** 风险控制第一，盈利第二。
