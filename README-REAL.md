# 量化交易工具 - 实盘交易版

> 在 Mac 上通过 Whisky 运行 MT4，实现真实量化交易

---

## 🎯 快速开始（3 步）

### 1️⃣ 安装 Whisky 和 MT4

```bash
# 下载 Whisky
open https://getwhisky.app/

# 下载 MT4（以 IC Markets 为例）
open https://www.icmarkets.com/zh/trading-platforms/metatrader-4/

# 通过 Whisky 安装 MT4
# 1. 打开 Whisky
# 2. 创建新瓶子 "MT4"
# 3. 运行 mt4_setup.exe
# 4. 完成安装并登录
```

### 2️⃣ 启动服务

```bash
# 方式 A：使用一键启动脚本
./start-all.sh

# 方式 B：手动启动
# 终端 1 - Python 桥接
cd mt4-bridge && python3 mt4_bridge.py

# 终端 2 - Node.js 服务器
cd .. && npm start
```

### 3️⃣ 开始交易

```bash
# 打开浏览器
open http://localhost:3000

# 点击"启动交易"按钮
```

---

## 📚 完整文档导航

### 🚀 新手入门

1. **[实盘交易快速启动](LIVE-TRADING-START.md)** ⭐ 从这里开始
   - 30 分钟完整流程
   - 一键启动脚本
   - 配置参数推荐

2. **[Mac 安装 MT4 指南](mac-mt4-setup/README.md)**
   - Whisky 安装教程
   - CrossOver 备选方案
   - MT4 配置优化

3. **[EA 安装指南](mac-mt4-setup/EA-INSTALL-GUIDE.md)**
   - 编译和安装 EA
   - ZeroMQ 库配置
   - 故障排除

### 📋 检查和配置

4. **[实盘交易检查清单](mac-mt4-setup/live-trading-checklist.md)** ⭐ 实盘前必读
   - 8 阶段检查流程
   - 风险参数配置
   - 启动流程详解

5. **[MT4 桥接指南](MT4-BRIDGE-GUIDE.md)**
   - 架构说明
   - API 参考
   - 高级配置

### 📊 参考文档

6. **[项目总结](PROJECT-SUMMARY.md)**
   - 功能列表
   - 技术栈
   - 项目结构

7. **[基础 README](README.md)**
   - 功能介绍
   - 基础使用
   - 配置说明

---

## 🎛️ 核心功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 实时数据跟踪 | ✅ | 每秒获取 MT4 实时报价 |
| 双向多开 | ✅ | 首次启动发送双向市价单 |
| 止盈止损 | ✅ | 每单固定 20 点止盈/止损 |
| 顺势挂单 | ✅ | 成交价±5 点自动挂单 |
| 仓位管理 | ✅ | 单笔风险 1%，0.01-1.0 手 |
| 回撤控制 | ✅ | 超过 20% 自动停止 |
| MT4 桥接 | ✅ | Python + ZeroMQ |
| 网页监控 | ✅ | 实时数据显示 |
| EA 支持 | ✅ | MT4 专家顾问 |

---

## 💻 系统要求

### 硬件

- Mac M1/M2/M3（Apple Silicon）或 Intel Mac
- 至少 8GB 内存
- 至少 10GB 可用磁盘空间
- 稳定的网络连接

### 软件

- macOS 12.0+
- Whisky 2.0+ 或 CrossOver 22+
- Node.js 18+
- Python 3.8+
- MT4 交易平台

---

## 📦 项目结构

```
quant-tool/
├── src/
│   ├── server.js              # Node.js 服务器
│   └── trading-engine.js      # 交易引擎核心
├── mt4-bridge/
│   ├── mt4_bridge.py          # Python MT4 桥接服务
│   ├── mt4-client.js          # Node.js MT4 客户端
│   ├── test-bridge.py         # 桥接测试脚本
│   └── start.bat              # Windows 启动脚本
├── mac-mt4-setup/
│   ├── README.md              # Mac 安装 MT4 指南
│   ├── EA-INSTALL-GUIDE.md    # EA 安装指南
│   ├── live-trading-checklist.md  # 实盘检查清单
│   └── QuantToolEA/
│       └── QuantToolEA.mq4    # MT4 专家顾问源码
├── public/
│   └── index.html             # 网页监控界面
├── start-all.sh               # 一键启动脚本
├── start-mt4-bridge.sh        # 桥接启动脚本
├── package.json               # Node.js 配置
├── README.md                  # 基础文档
├── README-REAL.md             # 实盘文档（本文件）⭐
├── LIVE-TRADING-START.md      # 快速启动指南 ⭐
├── MT4-BRIDGE-GUIDE.md        # 桥接详细指南
└── PROJECT-SUMMARY.md         # 项目总结
```

---

## ⚙️ 配置参数

### 基础配置（`src/server.js`）

```javascript
{
  symbol: 'XAUUSD',              // 交易品种
  initialCapital: 10000,         // 初始资金（美元）
  riskPerTrade: 0.01,            // 单笔风险（1%）
  minLots: 0.01,                 // 最小手数
  maxLots: 1.0,                  // 最大手数
  takeProfitPoints: 20,          // 止盈点数
  stopLossPoints: 20,            // 止损点数
  pendingOrderInterval: 5,       // 挂单间隔（点）
  maxDrawdown: 0.20,             // 最大回撤（20%）
  pointValue: 0.1,               // 点值
  contractSize: 100              // 合约大小
}
```

### 风险等级推荐

| 等级 | 初始资金 | 单笔风险 | 最大回撤 | 适合人群 |
|------|----------|----------|----------|----------|
| 保守 | $5,000 | 0.5% | 15% | 新手 |
| 稳健 | $10,000 | 1% | 20% | 有经验 |
| 激进 | $20,000 | 2% | 25% | 专业交易者 |

---

## 🎯 交易逻辑

```
启动交易
    ↓
发送双向市价单（做多 + 做空）
    ↓
设置双向挂单（成交价 ±5 点）
    ↓
实时监控价格（每秒）
    ↓
┌─────────────────────────────────┐
│ 1. 检查挂单是否触发 → 开仓      │
│ 2. 检查止盈止损 → 平仓          │
│ 3. 平仓后重新设置挂单           │
│ 4. 检查回撤 → 超限则停止        │
└─────────────────────────────────┘
```

---

## ⚠️ 风险提示

### 重要警告

1. **量化交易不是稳赚不赔的** - 可能亏损本金
2. **先用模拟账户测试** - 至少 1-2 周
3. **不要投入超过承受能力的资金** - 用闲钱交易
4. **定期监控系统** - 不要完全放任不管
5. **理解策略逻辑** - 不要盲目使用

### 风险因素

- **市场风险** - 极端行情可能导致大额亏损
- **技术风险** - 系统故障、网络中断
- **执行风险** - 滑点、延迟、订单失败
- **策略风险** - 策略可能失效

### 风险控制

- ✅ 设置单笔风险限额（建议≤1%）
- ✅ 设置最大回撤限制（建议≤20%）
- ✅ 定期出金（锁定利润）
- ✅ 多品种分散（降低单一品种风险）
- ✅ 持续学习和优化

---

## 🛠️ 故障排除

### 常见问题

**Q: Whisky 运行 MT4 卡顿？**

A: 启用 DXVK 和 MSync，减少图表数量。

**Q: 订单执行失败？**

A: 检查余额、手数限制、交易时间。

**Q: 桥接服务连接失败？**

A: 运行 `python test-bridge.py` 测试连接。

**Q: 回撤太大？**

A: 降低 RiskPerTrade 和 MaxDrawdown 参数。

### 获取帮助

1. 查看对应文档
2. 检查日志文件
3. 运行测试脚本
4. 联系技术支持

---

## 📈 性能优化

### MT4 优化

- 减少图表数量（1-2 个即可）
- 关闭新闻推送
- 禁用不必要的指标
- 使用 SSD 存储

### 系统优化

- 使用有线网络（比 WiFi 稳定）
- 关闭占用资源的程序
- 定期重启 MT4
- 保持系统更新

### 策略优化

- 根据品种调整参数
- 避开高波动时段
- 定期回测和优化
- 记录和分析交易数据

---

## 📱 移动监控

### 券商 APP

- 下载券商的 MT4 手机 APP
- 登录同一账户
- 随时查看持仓和盈亏
- 紧急情况下手动平仓

### 邮件通知（可选）

配置关键事件邮件通知：
- 回撤达到警告线
- 交易异常
- 系统故障

---

## 🎓 学习资源

### 书籍推荐

- 《量化交易：如何建立自己的算法交易事业》
- 《交易心理分析》
- 《日本蜡烛图技术》
- 《海龟交易法则》

### 在线资源

- MQL4 文档：https://docs.mql4.com/
- BabyPips（外汇学习）：https://www.babypips.com/
- MQL5 社区：https://www.mql5.com/

---

## 📞 技术支持

### 文档

- 📖 [快速启动](LIVE-TRADING-START.md)
- 📖 [Mac 安装 MT4](mac-mt4-setup/README.md)
- 📖 [EA 安装](mac-mt4-setup/EA-INSTALL-GUIDE.md)
- 📖 [检查清单](mac-mt4-setup/live-trading-checklist.md)
- 📖 [桥接指南](MT4-BRIDGE-GUIDE.md)

### 其他

- 券商客服
- GitHub Issues
- MQL5 论坛

---

## ✅ 实盘前最后检查

在开始真实交易前，请确认：

- [ ] 已完成模拟测试（至少 1-2 周）
- [ ] 已阅读所有相关文档
- [ ] 已理解策略逻辑和风险
- [ ] 已设置合理的风险参数
- [ ] 投入的资金亏损不会影响生活
- [ ] 已填写 [实盘检查清单](mac-mt4-setup/live-trading-checklist.md)

---

**祝你交易顺利，稳定盈利！** 📈🤖

**记住：** 风险控制第一，盈利第二。

---

*最后更新：2026-03-19*
