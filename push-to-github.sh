#!/bin/bash

echo "╔═══════════════════════════════════════════════════╗"
echo "║     推送代码到 GitHub                             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 检查是否已配置 Git
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  首次使用，请配置 Git 用户信息"
    echo ""
    read -p "请输入你的 GitHub 用户名：" git_user
    read -p "请输入你的 GitHub 邮箱：" git_email
    
    git config --global user.name "$git_user"
    git config --global user.email "$git_email"
    
    echo "✅ Git 配置完成"
    echo ""
fi

# 检查是否已关联远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "📋 请输入你的 GitHub 仓库地址"
    echo ""
    echo "格式：https://github.com/你的用户名/quant-tool.git"
    echo ""
    read -p "仓库地址：" repo_url
    
    git remote add origin "$repo_url"
    echo "✅ 已关联远程仓库"
    echo ""
fi

# 推送代码
echo "🚀 正在推送代码到 GitHub..."
echo ""

git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║  ✅ 推送成功！                                     ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo ""
    echo "📦 下一步：部署到 Railway"
    echo ""
    echo "1. 访问：https://railway.app"
    echo "2. 登录 GitHub"
    echo "3. 点击 'New Project' → 'Deploy from GitHub repo'"
    echo "4. 选择 'quant-tool' 仓库"
    echo "5. 点击 'Deploy Now'"
    echo ""
    echo "等待 2-3 分钟，部署完成后会获得一个网址"
    echo "把网址发给朋友就可以使用了！"
    echo ""
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "1. GitHub 仓库是否存在"
    echo "2. 仓库地址是否正确"
    echo "3. 是否有访问权限"
    echo ""
fi
