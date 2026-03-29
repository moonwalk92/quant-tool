# 🔧 真实交易连接问题修复指南

## 问题分析

根据截图，连接失败显示 "连接失败：undefined"，原因如下：

### 1. 后端 API 问题
- **错误处理不完善**：catch 块返回的错误可能没有 message 属性
- **缺少日志记录**：无法追踪具体错误原因

### 2. Railway 部署问题
- **MT5 终端不可用**：Railway 是 Linux 环境，无法运行 Windows MT5 终端
- **需要 MT4 Bridge**：必须通过 MT4 Bridge 连接 Windows 上的 MT5

---

## 解决方案

### 方案 A：使用 MT4 Bridge（推荐）

#### 1. 在 Windows VPS 上部署 MT4 Bridge
```bash
# 在 Windows VPS 上运行
cd mt4-bridge
python mt4_bridge.py
```

#### 2. Railway 配置环境变量
```bash
USE_MT4_BRIDGE=true
MT4_HOST=你的 VPS IP 地址
MT4_PORT=5555
```

#### 3. 开放 VPS 防火墙端口
```bash
# 开放 5555 端口
netsh advfirewall firewall add rule name="MT4 Bridge" dir=in action=allow protocol=TCP localport=5555
```

---

### 方案 B：本地运行（测试用）

#### 1. 本地启动服务器
```bash
cd /Users/huan/.openclaw/workspace/quant-tool
npm start
```

#### 2. 访问本地页面
```
http://localhost:3000/real-trading.html
```

---

### 方案 C：模拟模式（当前默认）

如果 `USE_MT4_BRIDGE=false`（默认），系统会进入**模拟连接模式**：
- ✅ 显示"连接成功"
- ✅ 可以测试前端功能
- ⚠️ **不会执行真实交易**

---

## 快速修复步骤

### 1. 查看 Railway 日志
登录 Railway 控制台，查看应用日志，找到具体错误信息。

### 2. 配置环境变量
在 Railway 项目设置中添加：
```bash
# 模拟模式（测试用）
USE_MT4_BRIDGE=false

# 或真实模式（需要 VPS）
USE_MT4_BRIDGE=true
MT4_HOST=你的 VPS IP
MT4_PORT=5555
```

### 3. 重启 Railway 部署
在 Railway 控制台点击 "Restart" 按钮。

---

## 错误排查

### 查看后端日志
```bash
# Railway 日志
# 在 Railway 控制台查看 "Logs" 标签

# 本地日志
tail -f trading_bot.log
```

### 常见错误

#### 1. "MT4 Bridge 连接失败"
- **原因**：桥接服务未运行
- **解决**：在 Windows VPS 上启动 `python mt4_bridge.py`

#### 2. "网络超时"
- **原因**：VPS 防火墙阻止连接
- **解决**：开放 5555 端口

#### 3. "undefined" 错误
- **原因**：后端返回错误但没有 message 属性
- **解决**：已修复，添加完善的错误处理

---

## 测试连接

### 1. 测试 API
```bash
curl -X POST http://localhost:3000/api/real/connect \
  -H "Content-Type: application/json" \
  -d '{"login":"104724832","password":"Hyc6.62606","server":"ICMarketsSC-Demo"}'
```

### 2. 查看响应
```json
{
  "success": true,
  "message": "MT5 连接成功（模拟模式）",
  "warning": "当前为模拟连接，实际交易需要部署 MT4 Bridge"
}
```

---

## 下一步

### 如果要真实交易：
1. 租用 Windows VPS（约 $10/月）
2. 在 VPS 上安装 MT5 终端
3. 运行 MT4 Bridge 服务
4. Railway 配置 `MT4_HOST` 为 VPS IP

### 如果只是测试：
1. 保持当前配置（模拟模式）
2. 测试前端功能
3. 本地运行测试交易逻辑

---

**注意**：当前代码已修复错误处理，会显示具体的错误信息而不是 "undefined"。
