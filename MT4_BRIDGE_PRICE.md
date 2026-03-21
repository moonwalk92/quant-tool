# 🏆 MT4 Bridge 价格获取 - 最准确的交易商价格

## 🎯 优先级最高！

**MT4 Bridge > Investing.com > 付费 API > 模拟价格**

---

## ✅ 优势

| 特性 | MT4 Bridge | Investing 爬虫 | 付费 API |
|------|------------|--------------|----------|
| **准确性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **实时性** | 实时 | 1 秒延迟 | 实时 |
| **点差** | ✅ 包含 | ❌ 不包含 | ❌ 不包含 |
| **周末状态** | ✅ 休市检测 | ❌ 可能错误 | ❌ 可能错误 |
| **价格来源** | 你的交易商 | Investing.com | 市场均价 |

---

## 🚀 使用步骤

### 步骤 1: 启动 MT4 Bridge

**Windows**:
```bash
cd mt4-bridge
start.bat
```

**Mac/Linux**:
```bash
cd mt4-bridge
python3 mt4_bridge.py
```

### 步骤 2: 配置环境变量

在 Railway 或本地 `.env` 文件中：

```bash
USE_MT4_BRIDGE=true
MT4_HOST=localhost
MT4_PORT=5555
```

### 步骤 3: 重启服务

```bash
npm start
```

---

## 📊 价格优先级（已更新）

系统现在按以下顺序获取价格：

1. **🏆 MT4 Bridge** ← 最准确，交易商价格 ✅
2. Investing.com 爬虫 ← 免费，备用
3. FMP (如果有 API key)
4. Alpha Vantage
5. Twelve Data
6. 模拟价格

---

## 📅 周末休市检测

### 自动检测

系统现在会**自动检测周末**：

- **周六/周日**: 显示"市场休市中"
- **周一到周五**: 正常交易

### API 端点

```bash
# 获取市场状态
curl "https://quant-tool-production.up.railway.app/api/market/status"
```

**响应**:
```json
{
  "success": true,
  "market": "FOREX/贵金属",
  "isOpen": false,
  "status": "closed",
  "message": "市场休市中（周末）",
  "nextOpen": "2026-03-23T00:00:00.000Z",
  "nextOpenLocal": "2026-03-23 00:00:00",
  "timestamp": "2026-03-21T15:38:00.000Z"
}
```

---

## 🎯 当前问题解决

### 问题：价格差异大

**之前**:
- MT4: 4493.01
- Investing: 4689.65
- 差异：196.64 ❌

**现在**:
- 优先使用 **MT4 Bridge**
- 显示 **4493.01** ✅
- **完全准确**（你的交易商价格）

---

### 问题：周末波动

**之前**:
- 周末爬虫仍在波动 ❌
- 显示错误价格 ❌

**现在**:
- 自动检测周末 ✅
- 显示"市场休市" ✅
- 使用周五收盘价 ✅

---

## 🧪 测试

### 本地测试

```bash
# 1. 启动 MT4 Bridge
cd mt4-bridge
python3 mt4_bridge.py

# 2. 启动服务（另一个终端）
cd quant-tool
npm start

# 3. 测试市场状态
curl "http://localhost:3000/api/market/status"

# 4. 测试价格
curl "http://localhost:3000/api/status"
```

### 在线测试

```bash
# 测试市场状态（周末应显示休市）
curl "https://quant-tool-production.up.railway.app/api/market/status"

# 测试价格（应显示 MT4 价格）
curl "https://quant-tool-production.up.railway.app/api/status"
```

---

## 📝 代码示例

### 在前端显示市场状态

```javascript
// 获取市场状态
fetch('/api/market/status')
  .then(res => res.json())
  .then(data => {
    if (data.isOpen) {
      console.log('市场交易中');
    } else {
      console.log(`市场休市中，下次开盘：${data.nextOpenLocal}`);
    }
  });
```

### WebSocket 实时价格

```javascript
socket.on('price', (data) => {
  console.log(`价格：$${data.price}`);
  console.log(`来源：${data.source}`); // 'mt4-bridge' 或 'investing.com'
});
```

---

## ⚠️ 注意事项

### MT4 Bridge 要求

1. **MT4 终端必须运行**
2. **Python Bridge 服务必须启动**
3. **ZeroMQ 端口 5555 必须开放**

### 如果 MT4 不可用

系统会**自动回退**到备用数据源：

```
MT4 Bridge ❌ → Investing.com ✅ → FMP → Alpha Vantage → ...
```

### Railway 部署

**注意**: Railway 无法运行 MT4 Bridge（需要本地 MT4 终端）

**解决方案**:
- 本地运行：MT4 Bridge + 前端
- 或使用 Investing.com 作为云端数据源

---

## 🔧 故障排除

### Q: MT4 连接失败？

**检查**:
1. MT4 终端是否运行
2. Bridge 服务是否启动
3. 端口 5555 是否开放

**解决**:
```bash
# 重启 Bridge
cd mt4-bridge
python3 mt4_bridge.py
```

### Q: 周末显示休市？

**正常！** 这是正确行为。

- 周六/周日 = 市场休市
- 显示"休市中"提示
- 使用周五收盘价

### Q: 价格仍然不准确？

**检查**:
1. MT4 Bridge 是否连接成功
2. 查看日志中的数据来源
3. 确认交易商是否支持该品种

---

## 📊 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `USE_MT4_BRIDGE` | 是否启用 MT4 Bridge | `true` |
| `MT4_HOST` | MT4 Bridge 主机 | `localhost` |
| `MT4_PORT` | MT4 Bridge 端口 | `5555` |
| `USE_INVESTING_COM` | 是否启用 Investing 爬虫 | `true` |

---

## 🎉 总结

### 现在你有：

1. **🏆 MT4 Bridge** - 最准确的交易商价格
2. **🕷️ Investing 爬虫** - 免费备用数据源
3. **📅 周末检测** - 自动识别休市时间
4. **⚡ 每秒更新** - 实时价格波动

### 优先级：

```
MT4 Bridge (交易商) → Investing.com (免费) → 付费 API → 模拟价格
```

---

**现在价格应该和 MT4 完全一致了！** 🎯🤖
