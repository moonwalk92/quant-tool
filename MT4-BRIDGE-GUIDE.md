# MT4 桥接使用指南

## 概述

本量化交易系统使用 **Python + ZeroMQ + MetaTrader4** 架构实现与 MT4 的真实连接。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      量化交易系统                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ZeroMQ       ┌──────────────┐        │
│  │  Node.js     │  ◄─────────────►  │   Python     │        │
│  │  交易引擎    │     TCP:5555      │   桥接服务   │        │
│  └──────────────┘                   └──────────────┘        │
│         │                                    │               │
│         │                                    │ MetaTrader4   │
│         │                                    │ DLL           │
│         ▼                                    ▼               │
│  ┌──────────────┐                   ┌──────────────┐        │
│  │  WebSocket   │                   │   MT4 终端    │        │
│  │  网页界面    │                   │  (Windows)   │        │
│  └──────────────┘                   └──────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 工作模式

### 模式 1：模拟模式（默认）

无需 MT4，使用模拟价格数据，适合：
- 功能测试
- 策略回测
- 界面演示

**启动方式：**
```bash
npm start
```

### 模式 2：真实 MT4 连接

需要 MT4 终端运行，适合：
- 实盘交易
- 模拟账户测试

**启动方式：**
```bash
# macOS / Linux
./start-mt4-bridge.sh

# Windows
cd mt4-bridge
start.bat
```

## 安装步骤

### 1. 安装 Node.js 依赖

```bash
cd quant-tool
npm install
```

### 2. 安装 Python 依赖

```bash
cd mt4-bridge

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 安装基础依赖
pip install pyzmq colorama
```

### 3. 安装 MetaTrader4 库（仅真实连接需要）

```bash
pip install MetaTrader4
```

> ⚠️ **注意**：MetaTrader4 库仅在 Windows 上可用，需要 MT4 终端运行。

## 配置 MT4 连接

编辑 `mt4-bridge/mt4_bridge.py`，在启动时传入 MT4 账户信息：

```python
bridge = MT4Bridge(
    host='localhost',
    port=5555,
    mt4_login='12345678',          # 你的 MT4 账号
    mt4_password='your_password',   # 你的 MT4 密码
    mt4_server='ICMarkets-Demo'    # 你的 MT4 服务器
)
```

或者通过命令行参数：

```bash
python mt4_bridge.py --login 12345678 --password your_password --server ICMarkets-Demo
```

## 使用示例

### 启动完整服务（真实 MT4）

```bash
# 方式 1：使用启动脚本
./start-mt4-bridge.sh
# 选择选项 2

# 方式 2：手动启动
# 终端 1 - 启动 Python 桥接
cd mt4-bridge
python mt4_bridge.py --login 12345678 --password your_password

# 终端 2 - 启动 Node.js 服务器
cd ..
npm start
```

### 启动模拟模式

```bash
npm start
```

## API 参考

### Python MT4 桥接 API

```python
from mt4_bridge import MT4Bridge

bridge = MT4Bridge()
bridge.connect_mt4()

# 获取价格
price = bridge.get_real_time_price('XAUUSD')
print(price)  # {'bid': 2000.5, 'ask': 2000.8, ...}

# 获取账户信息
account = bridge.get_account_info()
print(account)  # {'balance': 10000, 'equity': 10050, ...}

# 发送市价单
result = bridge.send_market_order('XAUUSD', 'BUY', 0.1, sl=1990, tp=2020)

# 发送挂单
result = bridge.send_pending_order('XAUUSD', 'BUY', 0.1, price=1995)

# 平仓
result = bridge.close_position(order_id)

# 撤单
result = bridge.cancel_order(order_id)

# 获取持仓
positions = bridge.get_positions()

# 获取挂单
orders = bridge.get_orders()
```

### Node.js MT4 客户端 API

```javascript
const { MT4Client, MockMT4Client } = require('./mt4-bridge/mt4-client');

// 真实连接
const mt4 = new MT4Client({ host: 'localhost', port: 5555 });
await mt4.connect();

// 模拟模式
const mt4 = new MockMT4Client();
await mt4.connect();

// 获取价格
const price = await mt4.getPrice('XAUUSD');

// 获取账户信息
const account = await mt4.getAccountInfo();

// 发送市价单
const result = await mt4.sendMarketOrder('XAUUSD', 'BUY', 0.1, 1990, 2020);

// 发送挂单
const result = await mt4.sendPendingOrder('XAUUSD', 'BUY', 0.1, 1995);

// 平仓
const result = await mt4.closePosition(orderId);

// 撤单
const result = await mt4.cancel_order(orderId);

// 获取持仓
const positions = await mt4.getPositions();

// 获取挂单
const orders = await mt4.getOrders();
```

## 故障排除

### 问题 1：无法连接 MT4 桥接

**症状：** `连接失败：connect ECONNREFUSED`

**解决：**
1. 确保 Python 桥接服务已启动
2. 检查端口 5555 是否被占用
3. 检查防火墙设置

### 问题 2：MetaTrader4 库导入失败

**症状：** `ModuleNotFoundError: No module named 'MetaTrader4'`

**解决：**
```bash
pip install MetaTrader4
```

如果安装失败，系统将自动切换到模拟模式。

### 问题 3：MT4 登录失败

**症状：** `MT4 登录失败`

**解决：**
1. 检查 MT4 账号、密码、服务器名称是否正确
2. 确保 MT4 终端已启动并登录
3. 检查网络连接

### 问题 4：订单发送失败

**症状：** `订单发送失败`

**解决：**
1. 检查账户是否有足够保证金
2. 检查交易品种是否可交易
3. 检查手数是否在允许范围内
4. 查看 MT4 终端的"专家"日志

## 安全提示

⚠️ **重要：**

1. **先用模拟账户测试** - 不要直接在实盘账户运行
2. **设置合理的风险控制** - 确保回撤限制和手数限制正确配置
3. **监控系统运行** - 定期检查日志和交易记录
4. **备份配置** - 保存好 MT4 账户信息
5. **了解策略逻辑** - 确保你理解双向多开和顺势挂单的风险

## 性能优化

### 调整价格更新频率

编辑 `src/server.js`：

```javascript
setInterval(async () => {
  // ... 价格更新逻辑
}, 1000); // 1000ms = 1 秒，可调整为更频繁
```

### 调整 ZeroMQ 超时

编辑 `mt4-bridge/mt4-client.js`：

```javascript
this.timeout = options.timeout || 5000; // 5 秒超时
```

## 扩展开发

### 添加新的交易品种

在交易引擎中配置：

```javascript
const engine = new TradingEngine({
  symbol: 'XAUUSD',  // 改为其他品种
  pointValue: 0.01,  // 根据品种调整点值
  // ...
});
```

### 添加自定义指标

在 `trading-engine.js` 中添加：

```javascript
async calculateCustomIndicator() {
  const prices = await this.getHistoricalPrices();
  // 计算指标逻辑
  return indicator;
}
```

## 技术支持

- 查看日志：`logs/` 目录
- MT4 终端日志：MT4 的"专家"标签
- 问题反馈：查看 GitHub Issues

---

**祝交易顺利！** 📈
