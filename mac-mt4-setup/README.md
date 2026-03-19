# Mac 上运行 MT4 完整指南

## 方案选择

### 推荐：Whisky (免费，Apple Silicon 优化)
- ✅ 免费
- ✅ 针对 M1/M2/M3 优化
- ✅ 性能好
- ✅ 支持完整 MT4 功能（包括 EA）

### 备选：CrossOver (付费，更稳定)
- ✅ 商业支持
- ✅ 更稳定的兼容性
- ✅ 易于使用
- ❌ 付费（约 $74/年）

### 不推荐：Parallels/VirtualBox
- ❌ 需要完整 Windows 系统
- ❌ 资源占用大
- ❌ 性能较差

---

## 方案一：使用 Whisky (推荐)

### 第 1 步：下载并安装 Whisky

```bash
# 访问官网下载
https://getwhisky.app/

# 或使用 Homebrew 安装（如果支持）
brew install --cask whisky
```

### 第 2 步：下载 MT4 安装包

从你的券商官网下载 Windows 版 MT4：

**常见券商 MT4 下载链接：**
- IC Markets: https://www.icmarkets.com/zh/trading-platforms/metatrader-4/
- Pepperstone: https://pepperstone.com/zh/trading-platforms/metatrader-4/
- XM: https://www.xm.com/zh/metatrader-4-platform
- Exness: https://www.exness.com/zh/help/articles/metatrader-4-trading-platform/

下载 `.exe` 安装文件，例如：`icmarkets_mt4_setup.exe`

### 第 3 步：使用 Whisky 安装 MT4

1. **打开 Whisky**
2. **创建新瓶子 (Bottle)**
   - 点击 `+` 或 `Create Bottle`
   - 名称：`MT4`
   - Windows 版本：`Windows 10 64-bit`
   - 创建

3. **安装 MT4**
   - 在 Whisky 中选择刚创建的 `MT4` 瓶子
   - 点击 `Run EXE` 或拖拽 `mt4_setup.exe` 到 Whisky
   - 按提示完成 MT4 安装
   - 记住安装路径（通常是 `C:\Program Files\MetaTrader 4`）

4. **启动 MT4**
   - 在 Whisky 的瓶子中会显示已安装的程序
   - 点击 `terminal.exe` 或 `metaeditor.exe` 启动
   - 登录你的 MT4 账户

### 第 4 步：配置 MT4 允许自动化交易

1. **打开 MT4**
2. **工具 → 选项**
3. **社区标签** - 登录 MQL5 账户（可选）
4. **专家顾问标签**：
   - ✅ 允许自动化交易
   - ✅ 允许 DLL 导入
   - ✅ 允许 WebRequest（添加我们的桥接 URL）

### 第 5 步：找到 MT4 数据目录

在 MT4 中：
1. **文件 → 打开数据文件夹**
2. 记录路径，例如：
   ```
   /Users/你的用户名/Library/Containers/whisky/Data/Documents/MT4/drive_c/Program Files/MetaTrader 4
   ```

---

## 方案二：使用 CrossOver

### 第 1 步：安装 CrossOver

```bash
# 官网下载
https://www.codeweavers.com/crossover

# 或试用版
https://www.codeweavers.com/crossover/trial
```

### 第 2 步：安装 MT4

1. 打开 CrossOver
2. 点击 `安装 Windows 应用程序`
3. 搜索 `MetaTrader 4` 或选择 `未列出的应用程序`
4. 选择 MT4 安装文件
5. 按提示完成安装

---

## 配置量化桥接服务

### 重要：网络配置

由于 MT4 运行在 Whisky/CrossOver 的 Windows 环境中，而我们的桥接服务运行在 macOS 上，需要正确配置网络。

### 方案 A：本地连接（推荐）

MT4 和桥接服务都在同一台 Mac 上，使用 `127.0.0.1` 或 `localhost`：

```python
# mt4_bridge.py 配置
bridge = MT4Bridge(
    host='127.0.0.1',  # 或 'localhost'
    port=5555
)
```

### 方案 B：使用 host.docker.internal（如果有网络问题）

```python
bridge = MT4Bridge(
    host='host.docker.internal',
    port=5555
)
```

---

## 启动完整交易系统

### 第 1 步：启动 MT4

通过 Whisky 或 CrossOver 启动 MT4，确保：
- ✅ MT4 已登录交易账户
- ✅ 图表已打开（至少一个）
- ✅ 允许自动化交易已启用

### 第 2 步：启动 Python 桥接

```bash
cd /Users/huan/.openclaw/workspace/quant-tool/mt4-bridge

# 创建虚拟环境（首次）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install pyzmq colorama

# 启动桥接服务
python mt4_bridge.py
```

### 第 3 步：启动 Node.js 服务器

```bash
cd /Users/huan/.openclaw/workspace/quant-tool
npm start
```

### 第 4 步：访问网页界面

打开浏览器访问：http://localhost:3000

点击 **启动交易** 按钮开始！

---

## 故障排除

### 问题 1：Whisky 无法运行 MT4

**解决：**
1. 确保 Whisky 是最新版本
2. 尝试不同的 Windows 版本（Windows 10 vs Windows 11）
3. 在 Whisky 设置中启用 `DXVK` 和 `MSync`
4. 重新创建瓶子

### 问题 2：MT4 连接桥接服务失败

**解决：**
1. 检查防火墙设置，允许端口 5555
2. 确保桥接服务已启动：`python mt4_bridge.py`
3. 测试连接：`python test-bridge.py`

### 问题 3：MT4 无法登录交易账户

**解决：**
1. 检查网络连接
2. 确认账户信息正确（账号、密码、服务器）
3. 联系券商确认账户状态
4. 尝试在 MT4 中手动登录

### 问题 4：订单执行失败

**解决：**
1. 检查账户余额是否充足
2. 确认交易品种可交易
3. 检查手数是否在允许范围内
4. 查看 MT4 的"专家"和"日志"标签

---

## 实盘交易检查清单

在开始真实交易前，请确认：

- [ ] MT4 已通过 Whisky/CrossOver 正常运行
- [ ] MT4 已登录真实交易账户
- [ ] 账户有足够余额（建议至少 $1000）
- [ ] 桥接服务测试通过
- [ ] 网页界面可以正常显示价格
- [ ] **已在模拟账户充分测试策略**
- [ ] 理解双向多开策略的风险
- [ ] 设置好回撤限制（默认 20%）
- [ ] 设置好单笔风险（默认 1%）
- [ ] 准备好监控系统运行

---

## 性能优化建议

### Whisky 设置

1. **启用 DXVK** - 提升图形性能
2. **启用 MSync** - 提升 CPU 性能
3. **分配足够内存** - 建议 4GB+
4. **使用 SSD 存储** - 提升加载速度

### MT4 设置

1. **减少图表数量** - 只保留必要的
2. **关闭不必要的指标** - 减少 CPU 占用
3. **禁用新闻推送** - 工具 → 选项 → 新闻
4. **降低日志级别** - 工具 → 选项 → 服务器

### 桥接服务优化

1. **调整更新频率** - 默认 1 秒，可调整为 500ms
2. **使用有线网络** - 比 WiFi 更稳定
3. **关闭其他占用网络的程序**

---

## 安全备份

### 备份 MT4 配置

```bash
# 备份 MT4 数据目录
cp -r ~/Library/Containers/whisky/Data/Documents/MT4 \
      ~/Documents/MT4-Backup-$(date +%Y%m%d)
```

### 备份交易记录

定期从网页界面导出交易历史，或从 MT4 导出：
- MT4 → 文件 → 打开数据文件夹 → history

---

## 下一步

1. **安装 Whisky** - 下载并安装
2. **安装 MT4** - 通过 Whisky 安装 Windows 版 MT4
3. **测试桥接** - 运行 `python test-bridge.py`
4. **模拟测试** - 先用模拟账户测试策略
5. **实盘交易** - 确认无误后开始实盘

---

**祝你交易顺利！** 📈🍎
