# 📊 股票查询 API - 使用指南

你的 quant-tool 现在已经支持美股股票价格查询了！

---

## 🚀 新增功能

### 股票价格查询 API

使用 MarketStack API 获取美股实时价格数据。

**支持股票**: AAPL, GOOG, MSFT, NVDA, TSLA, 等所有美股

**数据包括**:
- ✅ 当前价格
- ✅ 开盘价、最高价、最低价
- ✅ 成交量
- ✅ 涨跌幅

---

## 📡 API 端点

### 1. 查询单只股票

```bash
GET /api/stock/:symbol
```

**示例**:
```bash
curl http://localhost:3000/api/stock/AAPL
```

**响应**:
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "price": 247.99,
    "open": 248.11,
    "high": 249.20,
    "low": 246.00,
    "volume": 87981315,
    "change": -0.12,
    "changePercent": -0.05,
    "date": "2026-03-20",
    "source": "marketstack"
  }
}
```

### 2. 查询多只股票

```bash
GET /api/stocks?symbols=AAPL,GOOG,MSFT
```

**示例**:
```bash
curl "http://localhost:3000/api/stocks?symbols=AAPL,GOOG,MSFT,NVDA,TSLA"
```

**响应**:
```json
{
  "success": true,
  "data": [
    { "symbol": "AAPL", "price": 247.99, ... },
    { "symbol": "GOOG", "price": 298.79, ... },
    { "symbol": "MSFT", "price": 381.87, ... }
  ],
  "errors": []
}
```

### 3. 查询默认股票列表

```bash
GET /api/stocks/default
```

返回预设的 5 只热门股票：AAPL, GOOG, MSFT, NVDA, TSLA

---

## 🌐 在线测试

你的 Railway 部署地址：https://quant-tool-production.up.railway.app/

**API 端点**:
- `https://quant-tool-production.up.railway.app/api/stock/AAPL`
- `https://quant-tool-production.up.railway.app/api/stocks?symbols=AAPL,GOOG,MSFT`
- `https://quant-tool-production.up.railway.app/api/stocks/default`

---

## 🔧 本地运行

```bash
cd quant-tool

# 安装依赖（如果还没安装）
npm install

# 启动服务
npm start
```

访问 http://localhost:3000

---

## 📦 部署到 Railway

### 方式 1: 自动更新现有部署

```bash
cd quant-tool
git add -A
git commit -m "📊 添加股票查询 API"
git push
```

Railway 会自动重新部署！

### 方式 2: 手动配置环境变量

在 Railway 项目面板中设置：

| 变量名 | 值 |
|--------|-----|
| `MARKETSTACK_API_KEY` | `a3e52a1083788b9f3afa054fe53cda7f` |
| `PORT` | `3000` |

---

## 💡 使用场景

### 1. 在网页中显示股票价格

```javascript
// 获取 Apple 股票价格
fetch('/api/stock/AAPL')
  .then(res => res.json())
  .then(data => {
    console.log(`AAPL: $${data.data.price}`);
  });
```

### 2. 获取多只股票组成投资组合

```javascript
// 获取科技股组合
fetch('/api/stocks?symbols=AAPL,GOOG,MSFT,NVDA,TSLA')
  .then(res => res.json())
  .then(data => {
    data.data.forEach(stock => {
      console.log(`${stock.symbol}: $${stock.price} (${stock.changePercent}%)`);
    });
  });
```

### 3. 定时刷新价格

```javascript
// 每分钟刷新一次（EOD 数据不需要太频繁）
setInterval(() => {
  fetch('/api/stocks/default')
    .then(res => res.json())
    .then(data => {
      // 更新 UI
    });
}, 60000);
```

---

## ⚠️ 注意事项

### 数据延迟

- **免费计划**: MarketStack 提供 EOD (日线) 数据
- **更新时间**: 美股交易日收盘后更新
- **非实时**: 不适合高频交易，适合日常监控

### API 限额

- **免费额度**: 每天 1000 次请求
- **缓存策略**: 已实现 1 分钟缓存，避免重复请求
- **建议**: 生产环境可考虑升级到付费计划

### 交易时间

- **美股交易**: 周一至周五 9:30 AM - 4:00 PM (EST)
- **周末/节假日**: 无新数据，显示最近交易日收盘价

---

## 🔗 相关链接

- **MarketStack**: https://marketstack.com
- **API 文档**: https://marketstack.com/documentation
- **注册获取 Key**: https://marketstack.com/product

---

## 🎉 集成完成！

现在你的 quant-tool 同时支持：
- ✅ 外汇/贵金属 (Twelve Data)
- ✅ 美股股票 (MarketStack)

**一站式查看全球资产价格！** 🌍📈
