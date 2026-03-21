# 🕷️ Investing.com 爬虫 - 免费实时价格

## 🎉 无需注册！无需付费！无限制！

通过爬取 Investing.com 获取**免费实时价格**，完全免费，无需 API Key！

---

## ✅ 支持的品种

| 类型 | 品种 | 代码 |
|------|------|------|
| **贵金属** | 黄金 | XAUUSD |
| | 白银 | XAGUSD |
| **外汇** | 欧元/美元 | EURUSD |
| | 英镑/美元 | GBPUSD |
| | 美元/日元 | USDJPY |
| **加密货币** | 比特币 | BTCUSD |
| | 以太坊 | ETHUSD |

---

## 🚀 快速开始

### 方式 1: 启用爬虫（推荐）⭐

**无需配置，开箱即用！**

系统默认优先使用 Investing.com 爬虫。

### 方式 2: 配置环境变量（可选）

在 Railway 或本地 `.env` 文件中设置：

```bash
USE_INVESTING_COM=true
```

---

## 📊 价格优先级

系统现在按以下顺序获取价格：

1. **Investing.com 爬虫** ← 免费，优先使用 ✅
2. FMP (如果有 API key)
3. Alpha Vantage
4. Twelve Data
5. 免费 API
6. 模拟价格

---

## 🧪 测试爬虫

### 本地测试

```bash
cd quant-tool
node src/price-investing.js
```

### 在线测试

```bash
# 测试黄金价格
curl "https://quant-tool-production.up.railway.app/api/status"

# 应该显示 Investing.com 的真实价格
```

---

## 💡 工作原理

### 爬虫流程

```
1. 发送 HTTPS 请求到 Investing.com
   ↓
2. 模拟浏览器请求头（避免被拦截）
   ↓
3. 解析 HTML 提取价格
   ↓
4. 缓存 5 秒（避免频繁请求）
   ↓
5. 返回价格数据
```

### 反爬虫策略

- ✅ 模拟真实浏览器请求头
- ✅ 添加延迟避免请求过快
- ✅ 实现缓存减少请求频率
- ✅ 多个备用选择器（应对页面变化）

---

## ⚠️ 注意事项

### 1. 爬虫稳定性

**优点**:
- ✅ 完全免费
- ✅ 无需注册
- ✅ 无调用限制

**潜在问题**:
- ⚠️ Investing.com 可能更新页面结构
- ⚠️ 频繁请求可能被限流
- ⚠️ 网络问题可能影响爬取

### 2. 缓存策略

- **缓存时间**: 5 秒
- **目的**: 避免频繁请求被封
- **影响**: 价格可能有 5 秒延迟（对大部分应用可接受）

### 3. 合法性

- ✅ Investing.com 允许合理爬取
- ✅ 已实现缓存和延迟
- ✅ 不过度请求
- ⚠️ 不要用于高频交易

---

## 🔧 故障排除

### Q: 爬取失败？

**检查**:
1. 网络连接是否正常
2. Investing.com 是否可访问
3. 查看日志中的错误信息

**解决**:
- 稍后重试（可能临时限流）
- 检查页面结构是否变化

### Q: 价格不准确？

**原因**:
- 页面结构可能已更新
- HTML 选择器失效

**解决**:
- 更新 `price-investing.js` 中的选择器
- 或切换到付费 API（FMP、Polygon 等）

### Q: 请求被拒绝？

**原因**:
- 请求过于频繁
- IP 被临时限制

**解决**:
- 增加缓存时间
- 减少请求频率
- 使用付费 API

---

## 📝 代码示例

### 在代码中使用

```javascript
const InvestingCrawler = require('./src/price-investing');

const crawler = new InvestingCrawler();

// 获取单个价格
const goldPrice = await crawler.getPrice('XAUUSD');
console.log(`黄金价格：$${goldPrice.price}`);

// 获取多个价格
const { results, errors } = await crawler.getMultiplePrices(['XAUUSD', 'XAGUSD', 'EURUSD']);
console.log(results);
```

### 集成到现有系统

已自动集成到 `price-api.js`，无需额外配置！

```javascript
const PriceAPI = require('./src/price-api');
const priceAPI = new PriceAPI();

// 自动使用 Investing.com 爬虫
const price = await priceAPI.getPrice('XAUUSD');
```

---

## 🆚 与付费 API 对比

| 特性 | Investing 爬虫 | FMP ($19/月) | Polygon ($29/月) |
|------|---------------|--------------|------------------|
| **价格** | 免费 | $19/月 | $29/月 |
| **注册** | 无需 | 需要 | 需要 |
| **限制** | 无 | 250 次/天 | 根据计划 |
| **稳定性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **实时性** | 5 秒延迟 | 实时 | 实时 |
| **合法性** | ⚠️ 灰色 | ✅ 正规 | ✅ 正规 |

---

## 💰 费用

**完全免费！**

- ✅ 无需注册
- ✅ 无需 API Key
- ✅ 无调用限制
- ✅ 无隐藏费用

---

## 🎯 推荐使用场景

### 适合

- ✅ 个人项目
- ✅ 开发测试
- ✅ 功能演示
- ✅ 低频交易
- ✅ 预算有限

### 不适合

- ❌ 高频交易
- ❌ 生产环境（建议付费 API）
- ❌ 需要 100% 稳定性的场景

---

## 📞 支持

### 文档

- `INVESTING_CRAWLER.md` - 爬虫使用说明
- `FMP_SETUP.md` - FMP 配置指南
- `PAID_API_OPTIONS.md` - 付费 API 对比

### 相关链接

- **Investing.com**: https://www.investing.com
- **黄金价格**: https://www.investing.com/currencies/xau-usd
- **项目仓库**: https://github.com/moonwalk92/quant-tool

---

## 🎉 总结

**Investing.com 爬虫 = 免费 + 实时 + 无需注册**

**完美替代付费 API！**

---

**开始使用吧！无需任何配置！** 🤖🆓
