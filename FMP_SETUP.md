# 🚀 FMP API 配置指南

**FMP (Financial Modeling Prep)** - 性价比最高的价格 API！

---

## 📋 步骤 1: 注册 FMP 账号

### 访问官网

**网址**: https://financialmodelingprep.com/pricing

### 选择计划

**推荐**: **Starter Plan** - $19/月

**包含**:
- ✅ 每天 250 次请求（免费层）
- ✅ 实时价格（外汇、贵金属、股票）
- ✅ 历史数据
- ✅ 技术支持

### 注册流程

1. 点击 **"Get Started"** 或 **"Sign Up"**
2. 填写信息：
   - **Email**: 你的邮箱
   - **Password**: 设置密码
   - **Name**: 你的名字
3. 验证邮箱（查收确认邮件）
4. 登录账号

---

## 📋 步骤 2: 获取 API Key

### 登录后

1. 进入 **Dashboard** (控制面板)
2. 找到 **"API Key"** 或 **"Account"** 页面
3. 复制你的 API Key

**API Key 格式**: 类似 `fmp_abc123def456...`（一串字母数字）

---

## 📋 步骤 3: 配置到 Railway

### 访问 Railway

1. 打开 https://railway.app
2. 选择 `quant-tool` 项目
3. 点击 **"Variables"** 标签

### 添加环境变量

点击 **"New Variable"** 或 **"+"**，添加：

```
Key: FMP_API_KEY
Value: 你的 FMP API key
```

**示例**:
```
FMP_API_KEY=fmp_abc123def456ghi789
```

### 自动重启

Railway 会自动检测变量变化并重新部署（约 1-2 分钟）。

---

## 📋 步骤 4: 测试

### 等待部署完成

约 1-2 分钟后，测试 API：

```bash
# 测试状态
curl "https://quant-tool-production.up.railway.app/api/status"

# 测试黄金价格
curl "https://quant-tool-production.up.railway.app/api/stock/XAUUSD"

# 测试股票价格
curl "https://quant-tool-production.up.railway.app/api/stock/AAPL"
```

### 预期结果

**XAUUSD** 应该显示**真实市场价格**（约 4660-4720 美元）！

```json
{
  "success": true,
  "data": {
    "symbol": "XAUUSD",
    "price": 4685.50,
    "change": 12.30,
    "changePercent": 0.26
  }
}
```

---

## 📋 步骤 5: 本地测试（可选）

### 创建 .env 文件

```bash
cd quant-tool
cp .env.example .env
```

### 编辑 .env

```bash
FMP_API_KEY=你的 FMP API key
MARKETSTACK_API_KEY=a3e52a1083788b9f3afa054fe53cda7f
PORT=3000
```

### 运行测试

```bash
npm start
```

访问 http://localhost:3000

---

## 📊 价格优先级

配置 FMP 后，系统会按以下顺序获取价格：

1. **FMP** ← 优先使用（真实价格）
2. Alpha Vantage
3. Twelve Data
4. 免费 API
5. 模拟价格

---

## 💰 费用说明

### Starter Plan - $19/月

**计费周期**:
- 按月付费
- 随时取消
- 首月可能按比例计费

**免费层**:
- 注册即送 250 次/天
- 无需付费即可测试
- 升级后额度增加

**支付方式**:
- 信用卡
- PayPal
- 其他在线支付

---

## ⚠️ 注意事项

### 1. API 限额

- **免费层**: 250 次/天
- **Starter**: 根据计划不同
- 已实现缓存，减少请求次数

### 2. 数据范围

**支持**:
- ✅ 美股股票（AAPL, GOOG, MSFT...）
- ✅ 外汇（EURUSD, GBPUSD...）
- ✅ 贵金属（XAUUSD, XAGUSD...）
- ✅ 加密货币（部分）

**不支持**:
- ❌ A 股（中国）
- ❌ 港股（部分支持）
- ❌ 期货期权（部分支持）

### 3. 实时性

- **股票**: 实时或延迟 15 分钟（取决于市场）
- **外汇**: 实时
- **贵金属**: 实时

---

## 🔧 故障排除

### Q: API 返回错误？

**检查**:
1. API Key 是否正确（无空格）
2. Railway 环境变量是否保存
3. Railway 是否完成重启

### Q: 价格不更新？

**检查**:
1. 查看 Railway 部署日志
2. 确认 FMP 账号状态正常
3. 检查 API 限额是否用完

### Q: 限额不够用？

**解决**:
1. 升级到更高计划
2. 增加缓存时间
3. 减少请求频率

---

## 📞 支持

### FMP 官方支持

- **文档**: https://financialmodelingprep.com/developer/docs
- **邮箱**: support@financialmodelingprep.com
- **Discord**: 有社区支持

### 项目文档

- `PAID_API_OPTIONS.md` - API 对比
- `PRICE_UPDATE_20260321.md` - 价格更新说明

---

## ✅ 完成清单

- [ ] 注册 FMP 账号
- [ ] 选择 Starter 计划 ($19/月)
- [ ] 获取 API Key
- [ ] 配置到 Railway (FMP_API_KEY)
- [ ] 等待部署完成
- [ ] 测试 API 端点
- [ ] 验证真实价格

---

## 🎉 完成后

配置完成后，你的系统将显示**真实市场价格**！

**XAUUSD**: 约 4660-4720 美元（实时）  
**AAPL**: 实时股价  
**EURUSD**: 实时汇率

---

**有问题随时问我！** 🤖📈
