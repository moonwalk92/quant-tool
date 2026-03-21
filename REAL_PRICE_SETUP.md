# 📈 获取真实市场价格 - 配置指南

## 问题说明

当前 XAUUSD 显示 **2699 美元** 是**模拟价格**，不是真实市场价。

**真实价格**: 约 **4660-4720 美元/盎司**（2026 年 3 月）

---

## 解决方案

### 方案 A: 注册 Twelve Data（推荐）⭐

**免费额度**: 每天 800 次请求

#### 步骤：

1. **访问**: https://twelvedata.com/pricing

2. **注册免费账号**:
   - 点击 "Get API Key"
   - 填写邮箱
   - 验证邮箱

3. **获取 API Key**:
   - 登录后在 Dashboard 查看
   - 格式类似：`abc123def456...`

4. **配置到 Railway**:
   - 访问 https://railway.app
   - 选择 `quant-tool` 项目
   - 点击 **"Variables"**
   - 添加：`TWELVE_DATA_API_KEY=你的 key`

5. **重启服务**:
   - Railway 会自动重启
   - 或手动点击 "Redeploy"

---

### 方案 B: 使用其他免费 API

#### 1. GoldAPI.io（贵金属专用）

- **网址**: https://www.goldapi.io
- **免费额度**: 每天 500 次
- **配置**: 修改 `price-api.js` 中的 API key

#### 2. Alpha Vantage

- **网址**: https://www.alphavantage.co
- **免费额度**: 每天 500 次
- **支持**: 外汇、贵金属、股票

#### 3. MarketStack（已配置）

- **网址**: https://marketstack.com
- **免费额度**: 每天 1000 次
- **当前用于**: 美股股票

---

## 当前状态

### ✅ 已配置

| 数据源 | 用途 | 状态 |
|--------|------|------|
| MarketStack | 美股股票 | ✅ 正常工作 |
| Twelve Data | 外汇/贵金属 | ⚠️ 需要 API key |

### ⚠️ 模拟价格

当 API 不可用时，系统使用**模拟价格**（带小幅波动）：

```javascript
XAUUSD: ~2680 美元（基准价）
XAGUSD: ~31 美元
EURUSD: ~1.09
```

**注意**: 模拟价格仅用于测试，真实交易必须使用真实 API！

---

## 快速测试

### 本地测试

```bash
cd quant-tool
node test-stock-api.js
```

### 查看当前价格源

访问你的 Railway 部署：

```bash
# 查看状态（包含价格源）
curl https://quant-tool-production.up.railway.app/api/status
```

---

## 配置环境变量

### Railway 配置

访问 https://railway.app → 选择项目 → Variables

**必需配置**:

```bash
# Twelve Data API Key（注册获取）
TWELVE_DATA_API_KEY=你的 API key

# MarketStack API Key（已配置）
MARKETSTACK_API_KEY=a3e52a1083788b9f3afa054fe53cda7f

# 服务器端口
PORT=3000
```

### 本地配置

创建 `.env` 文件：

```bash
cd quant-tool
cp .env.example .env
# 编辑 .env，填入你的 API key
```

---

## 验证配置

配置完成后，测试价格 API：

```bash
# 测试黄金价格
curl "https://quant-tool-production.up.railway.app/api/status" | grep -i price

# 应该显示真实价格（约 4660-4720），而不是模拟价格（2680）
```

---

## 常见问题

### Q: 为什么 API key 无效？

A: 确保：
1. 从官网注册（不要用 demo）
2. 复制完整 key（无空格）
3. Railway 已重启

### Q: 免费额度够用吗？

A: 对于个人使用：
- Twelve Data: 800 次/天 ≈ 每 2 分钟一次
- 建议：前端实现缓存，减少请求

### Q: 可以不用 API 吗？

A: 可以，但价格会是**模拟的**：
- 适合：开发测试
- 不适合：真实交易

---

## 推荐配置

**最佳实践**:

1. **注册 Twelve Data**（5 分钟完成）
2. **配置到 Railway**
3. **前端实现 1-2 秒缓存**
4. **监控 API 使用量**

---

## 相关链接

- **Twelve Data**: https://twelvedata.com
- **MarketStack**: https://marketstack.com
- **GoldAPI**: https://www.goldapi.io
- **Railway**: https://railway.app

---

**配置完成后，XAUUSD 将显示真实市场价格！** 📈✨
