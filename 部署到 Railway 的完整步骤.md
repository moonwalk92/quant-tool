# 部署到 Railway 完整步骤

## ✅ 已完成：代码已准备好

你的 GitHub 仓库：https://github.com/moonwalk92/quant-tool

---

## 📋 第 1 步：推送代码到 GitHub（需要手动操作）

### 方式 A：使用 GitHub Desktop（推荐新手）

1. **下载 GitHub Desktop**
   ```
   https://desktop.github.com/
   ```

2. **安装并登录**
   - 打开 GitHub Desktop
   - 登录你的 GitHub 账号

3. **添加项目**
   - File → Add Local Repository
   - 选择文件夹：`/Users/huan/.openclaw/workspace/quant-tool`
   - 点击 "Add Repository"

4. **推送到 GitHub**
   - 点击 "Push origin" 按钮
   - 等待完成

### 方式 B：使用命令行（需要配置认证）

```bash
cd /Users/huan/.openclaw/workspace/quant-tool

# 设置 Git 用户信息（首次使用）
git config --global user.name "moonwalk92"
git config --global user.email "你的邮箱@example.com"

# 推送代码
git branch -M main
git push -u origin main
```

**如果提示输入密码：**
- 使用 GitHub Token（不是密码）
- 创建 Token：https://github.com/settings/tokens
- 权限：repo, workflow

### 方式 C：直接上传文件（最简单）

1. 访问：https://github.com/moonwalk92/quant-tool
2. 点击 "uploading an existing file"
3. 拖拽文件到浏览器
4. 点击 "Commit changes"

---

## 🚀 第 2 步：部署到 Railway

### 1. 访问 Railway

```
https://railway.app
```

### 2. 登录/注册

- 点击 **"Start a New Project"**
- 选择 **"Login with GitHub"**
- 授权 Railway 访问你的 GitHub 仓库

### 3. 创建项目

1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 找到并选择 **`moonwalk92/quant-tool`**
4. 点击 **"Deploy Now"**

### 4. 等待部署

Railway 会自动：
- ✅ 检测 Node.js 项目
- ✅ 安装依赖（npm install）
- ✅ 启动服务器（npm start）
- ✅ 分配公网域名

**等待时间：** 2-3 分钟

### 5. 获取访问地址

部署完成后：

1. 点击项目卡片进入详情页
2. 点击 **"Settings"** 标签
3. 滚动到 **"Networking"** 部分
4. 点击 **"Generate Domain"**（如果没有域名）
5. 复制域名，格式类似：
   ```
   https://quant-tool-production-xxxx.up.railway.app
   ```

### 6. 测试访问

在浏览器打开：
```
https://quant-tool-production-xxxx.up.railway.app
```

应该能看到：
- ✅ 网页正常加载
- ✅ 标题：量化交易工具
- ✅ 实时价格显示
- ✅ "启动交易"按钮

---

## 🎉 第 3 步：分享给朋友

### 分享文案模板

**微信/QQ:**
```
我做了个量化交易工具，在线就能用！

🔗 访问：https://quant-tool-production-xxxx.up.railway.app

功能：
✅ 自动双向交易
✅ 实时价格跟踪
✅ 自动止盈止损
✅ 风险控制
✅ 完全免费

打开就能用，无需安装！😊
```

**朋友圈/社交媒体:**
```
🎉 开源项目分享 | 量化交易工具

做了一个免费的量化交易工具，支持：
✅ 自动双向交易
✅ 止盈止损
✅ 网页监控
✅ 风险控制

🔗 在线演示：https://quant-tool-production-xxxx.up.railway.app
💻 源码：https://github.com/moonwalk92/quant-tool

完全开源免费，欢迎试用！🙌

#量化交易 #开源 #编程
```

---

## 💰 费用说明

### Railway 免费额度

- **每月 $5 免费额度**
- 包含：
  - 500 小时运行时间
  - 1GB 内存
  - 基础带宽

### 个人使用

- ✅ 完全在免费额度内
- ✅ 无需绑定信用卡
- ✅ 永久免费

### 如果超出额度

- Railway 会邮件通知
- 项目会暂停运行
- 下个月自动恢复

---

## ⚙️ 配置说明

### 环境变量（可选）

在 Railway 项目页面：
1. 点击 **"Variables"**
2. 可以添加（默认不需要）：
   - `PORT`: 自动设置
   - `NODE_ENV`: production

### 域名（可选）

如果想用自定义域名：
1. 在 Railway 项目页面
2. 点击 **"Settings"**
3. 滚动到 **"Domains"**
4. 点击 **"Add Custom Domain"**
5. 输入你的域名
6. 按提示配置 DNS

---

## 🛠️ 故障排除

### 问题 1：推送代码失败

**错误：** `could not read Username`

**解决：**
```bash
# 使用 HTTPS + Token
git remote set-url origin https://你的用户名:你的 Token@github.com/moonwalk92/quant-tool.git
git push -u origin main
```

**或使用 GitHub Desktop（推荐）**

### 问题 2：Railway 部署失败

**可能原因：**
- 代码未推送到 GitHub
- 仓库是私有的
- 依赖安装失败

**解决：**
1. 确认代码已推送到 GitHub
2. 确保仓库是公开的
3. 查看 Railway 部署日志
4. 重新部署

### 问题 3：网页打不开

**可能原因：**
- 部署未完成
- 域名未生成

**解决：**
1. 等待 2-3 分钟
2. 检查 Railway 项目状态
3. 生成域名（Settings → Networking → Generate Domain）

### 问题 4：价格不更新

**原因：** WebSocket 连接问题

**解决：**
1. 刷新页面
2. 检查浏览器控制台（F12）
3. 重启 Railway 项目

---

## 📊 监控和管理

### 查看日志

在 Railway 项目页面：
- 点击 **"Deployments"**
- 查看实时日志
- 可以看到服务器输出

### 重启服务

在 Railway 项目页面：
- 点击 **"Settings"**
- 点击 **"Restart"**

### 更新代码

```bash
# 修改代码后
git add .
git commit -m "Update"
git push

# Railway 会自动重新部署
```

### 删除项目

在 Railway 项目页面：
- 点击 **"Settings"**
- 滚动到底部
- 点击 **"Delete Project"**

---

## 🎯 快速检查清单

### 部署前

- [ ] GitHub 账号已注册
- [ ] 仓库已创建：https://github.com/moonwalk92/quant-tool
- [ ] 代码已推送到 GitHub

### 部署中

- [ ] Railway 账号已登录
- [ ] 项目已创建
- [ ] 部署已开始

### 部署后

- [ ] 域名已生成
- [ ] 网页可以访问
- [ ] 价格实时更新
- [ ] 启动交易功能正常

---

## 📞 需要帮助？

### 官方文档

- Railway: https://docs.railway.app/
- GitHub: https://docs.github.com/

### 查看日志

- Railway 项目 → Deployments → 查看日志

### 常见问题

- 查看本文档的故障排除部分

---

## ✅ 成功标志

部署成功后，你应该有：

1. ✅ GitHub 仓库：https://github.com/moonwalk92/quant-tool
2. ✅ Railway 项目：已部署
3. ✅ 访问网址：https://quant-tool-production-xxxx.up.railway.app
4. ✅ 网页可以正常访问
5. ✅ 可以分享给朋友

---

**祝你部署顺利！** 🚀

**部署完成后，把网址发给我看看！** 😊
