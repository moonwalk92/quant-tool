# Quant Tool 量化交易工具 - 发布说明

## 📦 版本信息

**版本号：** v1.0.0  
**发布日期：** 2026-03-19  
**类型：** 公开发布

---

## ✨ 功能特性

### 核心功能

- ✅ **实时数据跟踪** - 每秒更新价格
- ✅ **双向多开** - 自动做多 + 做空
- ✅ **止盈止损** - 20 点固定止盈/止损
- ✅ **顺势挂单** - 成交价±5 点自动挂单
- ✅ **仓位管理** - 单笔风险 1%，0.01-1.0 手
- ✅ **回撤控制** - 超过 20% 自动停止交易
- ✅ **网页监控界面** - 实时数据显示
- ✅ **MT4 桥接** - Python + ZeroMQ

### 交易逻辑

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

## 🚀 快速开始

### 方式 1：本地运行（推荐新手）

**步骤：**

1. **安装 Node.js**
   - 访问：https://nodejs.org/
   - 下载并安装 LTS 版本（18.x）

2. **解压文件**
   - 解压下载的压缩包

3. **启动程序**
   
   **macOS / Linux:**
   ```bash
   cd quant-tool
   ./quick-start.sh
   ```
   
   **Windows:**
   ```bash
   cd quant-tool
   quick-start.bat
   ```

4. **访问界面**
   - 打开浏览器：http://localhost:3000

5. **开始交易**
   - 点击"启动交易"按钮

### 方式 2：线上部署

查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解如何部署到：
- Vercel + Railway（免费，5 分钟）
- VPS 服务器（完整功能）

---

## 📁 文件说明

```
quant-tool/
├── src/                        # 源代码
│   ├── server.js              # Node.js 服务器
│   └── trading-engine.js      # 交易引擎
├── mt4-bridge/                 # MT4 桥接
│   ├── mt4_bridge.py          # Python 桥接服务
│   └── mt4-client.js          # Node.js 客户端
├── public/                     # 网页界面
│   └── index.html             # 监控界面
├── quick-start.sh              # macOS/Linux 启动脚本
├── quick-start.bat             # Windows 启动脚本
├── package.json                # Node.js 配置
├── README.md                   # 基础文档 ⭐
├── README-REAL.md              # 实盘交易指南 ⭐
├── LIVE-TRADING-START.md       # 快速启动指南
├── DEPLOYMENT.md               # 线上部署指南
└── 使用说明 - 在线演示版.txt     # 使用说明
```

---

## ⚙️ 配置参数

### 默认配置（`src/server.js`）

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

## ⚠️ 重要提示

### 模拟模式 vs 真实交易

**当前版本：** 模拟模式（使用模拟价格）

**真实交易需要：**
1. MT4 交易账户
2. Whisky 或 CrossOver（Mac 运行 MT4）
3. Python MT4 桥接服务
4. 充分测试（至少 1-2 周模拟）

### 风险提示

- ⚠️ **量化交易不是稳赚不赔的** - 可能亏损本金
- ⚠️ **先用模拟账户测试** - 至少 1-2 周
- ⚠️ **不要投入超过承受能力的资金** - 用闲钱交易
- ⚠️ **定期监控系统** - 不要完全放任不管
- ⚠️ **理解策略逻辑** - 不要盲目使用

---

## 🛠️ 技术栈

- **后端：** Node.js 18+
- **前端：** 原生 HTML/CSS/JavaScript
- **实时通信：** Socket.IO
- **MT4 桥接：** Python + ZeroMQ
- **部署：** Vercel / Railway / VPS

---

## 📚 文档导航

### 新手入门

1. **[使用说明 - 在线演示版.txt](使用说明%20-%20在线演示版.txt)** - 快速上手
2. **[README.md](README.md)** - 基础使用文档
3. **[LIVE-TRADING-START.md](LIVE-TRADING-START.md)** - 快速启动指南

### 实盘交易

4. **[README-REAL.md](README-REAL.md)** - 实盘交易总览 ⭐
5. **[mac-mt4-setup/README.md](mac-mt4-setup/README.md)** - Mac 安装 MT4
6. **[mac-mt4-setup/live-trading-checklist.md](mac-mt4-setup/live-trading-checklist.md)** - 实盘检查清单

### 部署和维护

7. **[DEPLOYMENT.md](DEPLOYMENT.md)** - 线上部署指南
8. **[MT4-BRIDGE-GUIDE.md](MT4-BRIDGE-GUIDE.md)** - 桥接详细指南

---

## 🆘 常见问题

### Q: 这是什么？

A: 这是一个量化交易工具，可以自动执行双向交易策略。

### Q: 需要付费吗？

A: 完全免费！开源项目。

### Q: 安全吗？

A: 
- 代码开源，可以审查
- 本地运行，数据不上传
- 模拟模式，不会真实亏损

### Q: 可以真实交易吗？

A: 可以，但需要：
1. MT4 交易账户
2. 配置桥接服务
3. 充分测试后再实盘

### Q: 如何停止？

A: 
- 网页点击"停止交易"按钮
- 或在终端按 Ctrl+C

### Q: 亏损了怎么办？

A: 
- 模拟模式：不会真实亏损
- 实盘模式：设置好回撤限制，达到自动停止

### Q: 如何修改参数？

A: 编辑 `src/server.js`，修改配置后重启服务。

### Q: 多人能同时使用吗？

A: 可以，部署到服务器后支持多人访问。

---

## 📞 获取帮助

### 文档

- 查看压缩包内的文档
- 在线阅读：查看 GitHub 仓库

### 社区

- GitHub Issues
- MQL5 论坛
- 量化交易社区

### 联系方式

- Email: support@quant-tool.com（示例）
- GitHub: https://github.com/your-username/quant-tool

---

## 🎯 下一步

### 对于使用者

1. ✅ 解压文件
2. ✅ 安装 Node.js
3. ✅ 运行 `quick-start.sh` 或 `quick-start.bat`
4. ✅ 访问 http://localhost:3000
5. ✅ 点击"启动交易"
6. ✅ 观察交易过程
7. 📖 阅读文档了解更多信息

### 对于实盘交易者

1. ✅ 充分模拟测试（1-2 周）
2. ✅ 阅读 [README-REAL.md](README-REAL.md)
3. ✅ 填写实盘检查清单
4. ✅ 配置 MT4 和桥接服务
5. ✅ 小资金开始实盘
6. ✅ 定期监控和优化

### 对于开发者

1. ✅ 查看源代码
2. ✅ 修改和优化策略
3. ✅ 提交 Pull Request
4. ✅ 贡献代码

---

## 📊 更新日志

### v1.0.0 (2026-03-19)

**新增：**
- ✅ 实时数据跟踪
- ✅ 双向多开策略
- ✅ 自动止盈止损
- ✅ 顺势挂单
- ✅ 仓位管理
- ✅ 回撤控制
- ✅ 网页监控界面
- ✅ MT4 桥接集成
- ✅ 快速启动脚本
- ✅ 完整文档

**修复：**
- 无（首次发布）

**改进：**
- 优化用户体验
- 完善文档
- 添加快速启动脚本

---

## 📜 许可证

MIT License

---

## 🙏 致谢

感谢所有贡献者和使用者！

---

**祝你使用愉快，交易顺利！** 📈🤖

---

*最后更新：2026-03-19*
