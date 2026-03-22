# 腾讯云轻量服务器 + MT5 + 量化交易工具
# 部署指南

---

## 第一步：购买 VPS

### 1.1 访问购买页面
👉 https://buy.cloud.tencent.com/lighthouse

### 1.2 选择配置（按以下选项选）

| 配置项 | 选择 |
|--------|------|
| 地域 | **新加坡**（延迟最低，到IC Markets ~30ms） |
| 套餐类型 | **锐驰型** |
| 套餐规格 | **2核 4G / 60G SSD / 200Mbps 无限流量** |
| 镜像 | **Windows Server 2022 中文**（或 2019） |
| 时长 | **1年**（享85折，¥85×12=¥1020/年）|

> 💡 购买完成后，去站内信查收 **Administrator 密码**

### 1.3 开放端口
购买后在控制台 → 防火墙 → 添加规则：
```
端口: 3389 (RDP)   协议: TCP   用途: 远程桌面
端口: 8888          协议: TCP   用途: MT5 Web服务（可选）
端口: 22            协议: TCP   用途: SSH（可选）
```

---

## 第二步：连接 Windows VPS

### 方式 A：远程桌面（推荐）
1. Windows 按 `Win + R`，输入 `mstsc`
2. 输入 VPS 的 **公网IP**
3. 用户名：`Administrator`
4. 密码：站内信里的密码

### 方式 B：Mac 连接
1. App Store 下载 **Microsoft Remote Desktop**
2. 新建连接 → 输入 IP、用户名、密码

---

## 第三步：VPS 上安装 MT5

### 3.1 下载 IC Markets MT5
在 VPS 的浏览器里打开：
👉 https://www.icmarkets.com/zh/setup

点击「**下载 MT5**」，安装到 VPS。

### 3.2 登录 MT5
- 服务器：`ICMarketsSC-Demo`
- 账号：`104724832`
- 密码：`Hyc6.62606`

> ⚠️ 首次登录可能需要手机号验证或验证码，按提示操作即可。

### 3.3 开启 MT5 自动登录
在 MT5 里：工具 → 选项 → 服务器 → 勾选「允许 DLL 调用」和「允许外部 DLL」

---

## 第四步：安装 Python 环境

在 VPS 上打开 **PowerShell**（开始菜单 → 搜索 `PowerShell` → 右键 → 以管理员身份运行）：

```powershell
# 安装 Python 3.11
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe" -OutFile "python-installer.exe"
.\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1

# 等待安装完成（约2分钟）
Start-Sleep -Seconds 120

# 验证安装
python --version
pip --version
```

---

## 第五步：安装 MT5 Python 库

在 PowerShell 里运行：

```powershell
pip install MetaTrader5
```

---

## 第六步：配置环境变量（你的账号密码）

在 PowerShell 里运行（一次性设置，永久生效）：

```powershell
# 设置环境变量（永久）
[System.Environment]::SetEnvironmentVariable("MT5_LOGIN", "104724832", "User")
[System.Environment]::SetEnvironmentVariable("MT5_PASSWORD", "Hyc6.62606", "User")
[System.Environment]::SetEnvironmentVariable("MT5_SERVER", "ICMarketsSC-Demo", "User")
[System.Environment]::SetEnvironmentVariable("SYMBOL", "XAUUSD", "User")

# 验证
[System.Environment]::GetEnvironmentVariable("MT5_LOGIN", "User")
[System.Environment]::GetEnvironmentVariable("MT5_SERVER", "User")
```

---

## 第七步：下载并运行量化交易工具

在 PowerShell 里运行：

```powershell
# 克隆代码
git clone https://github.com/moonwalk92/quant-tool.git
cd quant-tool
pip install MetaTrader5 pandas requests

# 运行（先确保MT5已打开并登录！）
python quant_trading_bot.py
```

---

## 第八步：验证价格是否正确

运行后观察输出：

```
[2026-03-22 14:51] MT5连接: ✅ 成功
[2026-03-22 14:51] XAUUSD Bid: 4xxx.xx  Ask: 4xxx.xx   ← 应该是4500左右，不是4689
[2026-03-22 14:51] 策略状态: 正常
```

如果看到价格是 **4xxx**，说明 MT5 真实价格接入成功 ✅

---

## 常见问题

### Q1: MT5 连接失败
**原因**：MT5 终端没有打开
**解决**：先手动打开 MT5，登录账号，确认连接后再运行 Python

### Q2: Python 报错 `ModuleNotFoundError: No module named 'MetaTrader5'`
**解决**：在 PowerShell 重新运行
```powershell
pip install MetaTrader5
```

### Q3: MT5 账号登录不上
**原因**：Demo账号有有效期（通常30天）
**解决**：去 IC Markets 官网重新申请一个新的 Demo 账号

### Q4: 价格还是 4689（模拟价格）
**原因**：没有连接到 MT5，代码在模拟模式
**解决**：确认 MT5 已打开并显示已连接，然后重新运行 `python quant_trading_bot.py`

---

## 架构总览

```
[腾讯云 VPS - 新加坡]
       │
       ├── Windows Server 2022
       │       │
       │       ├── MT5 终端 (已登录账号 104724832)
       │       │       │
       │       │       └── IC Markets 服务器
       │       │
       │       └── Python 脚本 (quant_trading_bot.py)
       │               │
       │               └── MetaTrader5 Python 库
       │                       │
       │                       └── 读取MT5实时数据 → 执行交易
       │
       └── 你的Mac/手机
               │
               └── 通过微信/飞书接收报警通知
```

---

## 完成后推荐：接入飞书通知

在 VPS 上配置飞书机器人（可选）：
1. 飞书群 → 添加机器人 → 自定义机器人
2. 复制 Webhook URL
3. 在代码里填入 Webhook，止盈止损时会自动推送到飞书群

---

有问题随时告诉我！
