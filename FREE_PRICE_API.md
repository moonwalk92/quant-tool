# 🆓 免费价格 API 推荐

## 问题

Twelve Data 网站故障（Internal Server Error），无法注册。

---

## ✅ 解决方案：Alpha Vantage

**推荐原因**:
- ✅ 网站稳定（正常运行）
- ✅ 免费注册（只需邮箱，2 分钟）
- ✅ 支持外汇、贵金属、股票
- ✅ 每天 500 次请求
- ✅ 实时价格

---

## 🚀 快速配置（5 分钟完成）

### 步骤 1: 注册 Alpha Vantage

**访问**: https://www.alphavantage.co/support/#api-key

填写表单：
- **Name**: 你的名字
- **Email**: 你的邮箱

**立即获得 API key**（显示在页面上）！

示例 key 格式：`K8L9M2N4P6Q8R1S3`

---

### 步骤 2: 配置到 Railway

1. 访问 https://railway.app
2. 选择 `quant-tool` 项目
3. 点击 **"Variables"** 标签
4. 添加新变量：

```
Key: ALPHA_VANTAGE_API_KEY
Value: 你的 API key
```

5. Railway 会自动重启服务

---

### 步骤 3: 测试

```bash
# 等待 1-2 分钟部署完成
curl "https://quant-tool-production.up.railway.app/api/status"
```

应该显示真实价格（XAUUSD 约 4660-4720 美元）！

---

## 📊 系统配置

代码已更新为**多源 fallback**：

1. **第一优先**: Alpha Vantage（真实价格）
2. **第二优先**: Twelve Data（如果你有 key）
3. **第三优先**: 免费 API
4. **最后**: 模拟价格

---

## 📝 其他 API 对比

| API | 注册 | 免费额度 | 支持 | 推荐度 |
|-----|------|----------|------|--------|
| **Alpha Vantage** | 需注册 | 500/天 | 外汇/贵金属/股票 | ⭐⭐⭐⭐⭐ |
| Twelve Data | 需注册 | 800/天 | 外汇/贵金属 | ⭐⭐⭐ (网站故障) |
| Frankfurter | 无需注册 | 无限 | 外汇 | ⭐⭐⭐⭐ |
| MarketStack | 需注册 | 1000/天 | 股票 | ⭐⭐⭐⭐ |

---

## ⚠️ 临时方案

如果暂时不配置 API，系统会使用**模拟价格**：

```javascript
XAUUSD: ~2680 美元（带小幅波动）
```

**适合**: 开发测试、功能演示  
**不适合**: 真实交易

---

## 🔗 相关链接

- **Alpha Vantage 注册**: https://www.alphavantage.co/support/#api-key
- **API 文档**: https://www.alphavantage.co/documentation/
- **Railway**: https://railway.app

---

## 💡 提示

1. API key 是免费的，不需要信用卡
2. 一个邮箱可以注册一个 key
3. key 永久有效
4. 如果达到限额，等第二天重置

---

**注册完成后告诉我，我帮你测试！** 🤖📈
