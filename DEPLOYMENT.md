# 量化交易工具 - 线上部署指南

## 🌐 部署到线上让别人使用

有两种方式：

### 方案 A：快速演示版（推荐，5 分钟）

使用 **Vercel + Railway** 部署，免费且简单。

### 方案 B：完整交易版（需要服务器）

使用 **VPS 服务器** 部署，支持真实 MT4 连接。

---

## 🚀 方案 A：快速演示版（Vercel + Railway）

适合：展示功能、模拟交易、给别人试用

### 第 1 步：准备代码

```bash
cd /Users/huan/.openclaw/workspace/quant-tool

# 创建 GitHub 仓库
# 1. 访问 https://github.com/new
# 2. 仓库名：quant-tool
# 3. 公开仓库
# 4. 点击 Create repository
```

### 第 2 步：上传到 GitHub

```bash
# 初始化 Git
git init
git add .
git commit -m "Initial commit - Quant Tool"

# 关联 GitHub 仓库（替换为你的用户名）
git remote add origin https://github.com/YOUR_USERNAME/quant-tool.git
git branch -M main
git push -u origin main
```

### 第 3 步：部署前端到 Vercel

1. **访问 Vercel**
   - https://vercel.com
   - 用 GitHub 登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择 "Import Git Repository"
   - 选择 `quant-tool`
   - 点击 "Import"

3. **配置**
   - Framework Preset: `Other`
   - Root Directory: `./public`
   - 点击 "Deploy"

4. **获取域名**
   - 部署完成后会获得域名：`https://quant-tool-xxx.vercel.app`

### 第 4 步：部署后端到 Railway

1. **访问 Railway**
   - https://railway.app
   - 用 GitHub 登录

2. **新建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `quant-tool`

3. **配置**
   - Root Directory: `.`
   - Start Command: `npm start`
   - 点击 "Deploy"

4. **获取 API 地址**
   - 部署完成后会获得域名：`https://xxx-production.up.railway.app`

### 第 5 步：更新前端配置

编辑 `public/index.html`，修改 WebSocket 连接地址：

```javascript
// 原来：
const socket = io();

// 改为：
const socket = io('https://xxx-production.up.railway.app');
```

重新部署到 Vercel。

### ✅ 完成！

现在别人可以访问：
- **前端网址：** https://quant-tool-xxx.vercel.app
- **后端 API：** https://xxx-production.up.railway.app

---

## 🖥️ 方案 B：完整交易版（VPS 服务器）

适合：真实交易、连接 MT4、长期使用

### 推荐 VPS 服务商

| 服务商 | 价格 | 配置 | 链接 |
|--------|------|------|------|
| Vultr | $6/月 | 1 核 1G | https://vultr.com |
| DigitalOcean | $6/月 | 1 核 1G | https://digitalocean.com |
| Linode | $5/月 | 1 核 1G | https://linode.com |
| 阿里云 | ¥24/月 | 1 核 1G | https://aliyun.com |

### 第 1 步：购买并配置 VPS

**推荐配置：**
- 系统：Ubuntu 22.04 LTS
- CPU: 1 核
- 内存：1GB
- 硬盘：25GB

### 第 2 步：连接服务器

```bash
# SSH 连接（替换为你的服务器 IP）
ssh root@your_server_ip

# 输入密码登录
```

### 第 3 步：安装环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装 Python
apt install -y python3 python3-pip python3-venv

# 安装 Git
apt install -y git

# 安装 Nginx
apt install -y nginx
```

### 第 4 步：部署代码

```bash
# 克隆代码（或上传代码）
cd /var/www
git clone https://github.com/YOUR_USERNAME/quant-tool.git
cd quant-tool

# 安装依赖
npm install

# 创建 Python 虚拟环境
cd mt4-bridge
python3 -m venv venv
source venv/bin/activate
pip install pyzmq colorama
```

### 第 5 步：配置 PM2（进程管理）

```bash
# 安装 PM2
npm install -g pm2

# 启动 Node.js 服务器
cd /var/www/quant-tool
pm2 start src/server.js --name quant-tool

# 设置开机自启
pm2 startup
pm2 save
```

### 第 6 步：配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
nano /etc/nginx/sites-available/quant-tool
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替换为你的域名或 IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/quant-tool /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 第 7 步：配置防火墙

```bash
# 允许 HTTP/HTTPS
ufw allow 'Nginx Full'
ufw allow SSH
ufw enable
```

### ✅ 完成！

现在别人可以访问：
- **网址：** http://your_domain.com 或 http://your_server_ip

---

## 📦 打包给别人使用（离线版）

如果别人想在本地运行：

### 第 1 步：创建安装包

```bash
cd /Users/huan/.openclaw/workspace

# 创建压缩包
tar -czf quant-tool-release.tar.gz quant-tool/

# 或创建 ZIP
zip -r quant-tool-release.zip quant-tool/
```

### 第 2 步：创建快速启动脚本

创建 `quick-start.sh`：

```bash
#!/bin/bash

echo "╔═══════════════════════════════════════════════════╗"
echo "║     Quant Tool 快速启动                           ║"
echo "╚═══════════════════════════════════════════════════╝"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js 18+"
    echo "https://nodejs.org/"
    exit 1
fi

# 安装依赖
echo "正在安装依赖..."
npm install

# 启动服务
echo "启动服务..."
npm start
```

### 第 3 步：创建使用说明

创建 `使用说明.txt`：

```
╔═══════════════════════════════════════════════════╗
║     Quant Tool 量化交易工具                        ║
╚═══════════════════════════════════════════════════╝

【快速开始】

1. 安装 Node.js
   访问：https://nodejs.org/
   下载并安装 LTS 版本

2. 安装依赖
   打开终端（命令行）
   cd quant-tool
   npm install

3. 启动服务
   npm start

4. 访问界面
   打开浏览器：http://localhost:3000

【功能说明】

- 实时价格跟踪
- 双向多开交易
- 自动止盈止损
- 顺势挂单
- 回撤控制

【注意事项】

⚠️ 当前是模拟模式，使用模拟价格
⚠️ 真实交易需要 MT4 和桥接服务
⚠️ 详细文档见 README-REAL.md

【技术支持】

遇到问题？查看文档：
- README.md - 基础使用
- README-REAL.md - 实盘交易
- LIVE-TRADING-START.md - 快速启动
```

### 第 4 步：分享

**方式 1：网盘分享**
- 上传到百度网盘/Google Drive
- 分享链接给别人

**方式 2：GitHub 发布**
```bash
# 在 GitHub 创建 Release
# 上传压缩包
# 别人可以从 Releases 下载
```

**方式 3：直接发送**
- 使用微信/QQ 发送压缩包
- 适合小文件

---

## 🌍 部署后测试

### 测试清单

- [ ] 访问网站首页
- [ ] 价格实时更新
- [ ] 启动交易功能正常
- [ ] 持仓和挂单显示正确
- [ ] 手机也能访问
- [ ] 多人同时访问无问题

### 性能优化

如果多人使用卡顿：

1. **增加服务器配置**
   - 升级到 2 核 2G

2. **使用 CDN**
   - Cloudflare 免费 CDN

3. **优化代码**
   - 减少更新频率（从 1 秒改为 2 秒）
   - 压缩静态文件

---

## 📊 监控和维护

### 查看日志

```bash
# PM2 日志
pm2 logs quant-tool

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 重启服务

```bash
# 重启 Node.js
pm2 restart quant-tool

# 重启 Nginx
systemctl restart nginx
```

### 更新代码

```bash
cd /var/www/quant-tool
git pull
npm install
pm2 restart quant-tool
```

---

## 💰 成本估算

### 方案 A：Vercel + Railway（免费）

- Vercel：免费（个人版）
- Railway：$5/月（基础版）
- **总计：$5/月**

### 方案 B：VPS 服务器

- Vultr/DigitalOcean：$6/月
- 域名（可选）：$10/年
- **总计：$6/月 + $10/年**

### 方案 C：离线版（免费）

- 完全免费
- 别人在自己电脑运行

---

## 🎯 推荐方案

**如果只是展示给别人看：**
→ 使用 **方案 A（Vercel + Railway）**

**如果要真实交易：**
→ 使用 **方案 B（VPS 服务器）**

**如果只想发给朋友试用：**
→ 使用 **方案 C（离线版）**

---

## 📞 需要帮助？

- 查看对应部署文档
- 检查服务器日志
- 联系 VPS 客服
- 查看 GitHub Issues

---

**祝你部署顺利！** 🚀
