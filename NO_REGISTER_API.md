# 🆓 无需注册的免费价格 API

## 问题

Twelve Data 和 Alpha Vantage 都无法注册（网站问题）。

---

## ✅ 解决方案：无需注册的 API

### 方案 1: Frankfurter API（外汇）⭐

**网址**: https://www.frankfurter.app

**特点**:
- ✅ **完全免费，无需注册**
- ✅ 欧洲央行数据源
- ✅ 支持主要货币对
- ❌ 不支持贵金属（XAU/XAG）

**示例**:
```bash
curl "https://api.frankfurter.app/latest?from=EUR&to=USD"
```

**响应**:
```json
{
  "base": "EUR",
  "rates": {"USD": 1.0856},
  "date": "2026-03-21"
}
```

---

### 方案 2: 加密货币交易所（部分支持贵金属）

#### Kraken API

**网址**: https://api.kraken.com

**示例**:
```bash
curl "https://api.kraken.com/0/public/Ticker?pair=XAUUSD"
```

**响应**: 包含 XAUUSD 价格

#### Binance API

**网址**: https://api.binance.com

**示例**:
```bash
curl "https://api.binance.com/api/v3/ticker/price?symbol=XAUUSD"
```

---

### 方案 3: 伦敦金银市场协会（LBMA）

**网址**: https://www.lbma.org.uk

提供每日金银定价，但需要解析页面。

---

### 方案 4: 使用模拟价格 + 手动校准

如果暂时无法获取真实 API，可以：

1. **手动设置基准价格**
2. **系统自动添加小幅波动**
3. **定期手动更新基准**

**配置方法**:
编辑 `src/price-api.js` 中的 `getBasePrice()` 函数：

```javascript
getBasePrice(symbol) {
  const basePrices = {
    'XAUUSD': 4690,  // 手动设置为当前市场价
    'XAGUSD': 32,
    // ...
  };
  return basePrices[symbol] || 4690;
}
```

---

## 🎯 我的建议

### 最佳组合（无需注册）

| 用途 | API | 状态 |
|------|-----|------|
| 外汇 | Frankfurter | ✅ 无需注册 |
| 贵金属 | 手动校准 | ✅ 临时方案 |
| 美股 | MarketStack | ✅ 已配置 |

### 长期方案

**仍然建议注册一个 API**（等网站恢复后）：
- Alpha Vantage
- Twelve Data
- 或其他类似服务

---

## 📝 代码集成

系统已支持多源 fallback：

1. Alpha Vantage（需要 key）
2. Twelve Data（需要 key）
3. 免费 API（无需 key）
4. 模拟价格

---

## 💡 临时方案

**如果只需要测试功能**：

1. 使用当前模拟价格
2. 手动设置基准价为市场价（约 4690）
3. 功能演示完全够用

**如果需要真实交易**：

- 等 API 网站恢复后注册
- 或寻找其他付费服务

---

**告诉我你想用哪个方案，我帮你配置！** 🤖
