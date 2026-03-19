# MT4 下载和安装指南

## 🎯 快速下载（推荐方式）

### 方式 1：使用 Safari 直接下载

**IC Markets 官方下载页面：**

1. 打开 Safari
2. 访问：`https://www.icmarkets.com/zh/metatrader-4/`
3. 点击"下载 MetaTrader 4"
4. 保存 `icmarkets_mt4_setup.exe`

**如果上面打不开，尝试这些备选：**

| 券商 | 下载链接 | 备注 |
|------|----------|------|
| IC Markets | https://www.icmarkets.com/zh/metatrader-4/ | 推荐 |
| Pepperstone | https://pepperstone.com/zh/trading-platforms/metatrader-4/ | 备选 1 |
| XM | https://www.xm.com/zh/metatrader-4-platform | 备选 2 |
| Exness | https://www.exness.com/zh/help/articles/metatrader-4-trading-platform/ | 备选 3 |

---

### 方式 2：直接下载链接

如果网页打不开，直接下载 EXE 文件：

```
IC Markets:
https://cdn.icmarkets.com/mt4/icmarkets_mt4_setup.exe

Pepperstone:
https://pepperstone.com/media/3829/ps_mt4_setup.exe

XM:
https://www.xm.com/files/mt4/xm_mt4_setup.exe
```

**下载方法：**
1. 复制链接
2. 在 Safari 地址栏粘贴
3. 按回车，文件会自动下载

---

### 方式 3：使用手机下载

如果电脑网络不好，用手机：

1. 用手机浏览器访问 IC Markets 官网
2. 下载 MT4 APP
3. 注册账户
4. 在官网登录后可下载电脑版 MT4

---

## 📥 下载后验证

下载完成后检查：

- **文件名：** `icmarkets_mt4_setup.exe` 或类似
- **文件大小：** 约 20-30 MB
- **文件类型：** Windows 应用程序 (.exe)

---

## 🍎 在 Mac 上安装（通过 Whisky）

### 第 1 步：安装 Whisky

```bash
# 访问官网
open https://getwhisky.app/

# 或使用 Homebrew（如果支持）
brew install --cask whisky
```

### 第 2 步：创建瓶子

1. **打开 Whisky**
2. **点击 `+` 或 `Create Bottle`**
3. **配置：**
   - 名称：`MT4`
   - Windows 版本：`Windows 10 64-bit`
   - 点击 `Create`

### 第 3 步：安装 MT4

1. **在 Whisky 中选择 `MT4` 瓶子**
2. **点击 `Run EXE`**
3. **选择下载的 `icmarkets_mt4_setup.exe`**
4. **按提示完成安装**
   - 接受许可协议
   - 选择安装路径（默认即可）
   - 等待安装完成

### 第 4 步：启动 MT4

1. **在 Whisky 瓶子中找到 `terminal.exe`**
2. **点击运行**
3. **登录 MT4 账户**
   - 如果没有账户，点击"开设新账户"
   - 或联系券商获取账户信息

---

## ⚠️ 常见问题

### Q1: 所有链接都打不开

**解决：**
1. 检查网络连接
2. 尝试使用 VPN
3. 联系券商客服获取最新下载链接
4. 使用其他券商的 MT4（功能相同）

### Q2: 下载速度极慢

**解决：**
1. 更换下载时间（避开高峰）
2. 使用下载工具（如 IDM）
3. 尝试其他券商的下载链接
4. 使用手机热点

### Q3: Whisky 无法运行安装程序

**解决：**
1. 确保 Whisky 是最新版本
2. 在 Whisky 设置中启用：
   - DXVK: ✅
   - MSync: ✅
3. 尝试重新创建瓶子
4. 使用 CrossOver（备选方案）

### Q4: MT4 安装后无法启动

**解决：**
1. 在 Whisky 中重新创建瓶子
2. 尝试 Windows 11 兼容模式
3. 检查 Mac 系统版本（需要 macOS 12.0+）
4. 重启 Whisky 和 Mac

---

## 📞 获取帮助

### IC Markets 客服

- **在线客服：** 官网右下角聊天窗口
- **邮箱：** support@icmarkets.com
- **电话：** +61 2 8005 0770
- **中文支持：** ✅

### 其他资源

- [Mac 安装 MT4 详细指南](mac-mt4-setup/README.md)
- [实盘交易快速启动](LIVE-TRADING-START.md)
- [Whisky 官网教程](https://getwhisky.app/)

---

## ✅ 安装完成后的下一步

1. **登录 MT4 账户**
   - 如果有账户，直接登录
   - 如果没有，先注册模拟账户

2. **测试 MT4 运行**
   - 打开 XAUUSD 图表
   - 确认价格实时更新
   - 测试手动下单

3. **安装量化 EA**
   - 查看 [EA 安装指南](mac-mt4-setup/EA-INSTALL-GUIDE.md)
   - 编译并安装 QuantToolEA

4. **启动量化系统**
   - 运行 `./start-all.sh`
   - 访问 http://localhost:3000
   - 开始交易

---

**祝你安装顺利！** 📥🍎
