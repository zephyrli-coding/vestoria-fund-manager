#!/bin/bash
# 一键清理并重新安装依赖

echo "🧹 清理依赖和缓存..."

# 清理依赖
rm -rf node_modules
rm -f package-lock.json

# 清理缓存
rm -rf .vite
rm -rf .turbo
rm -rf dist
rm -rf .eslintcache

# 清理 npm 缓存
npm cache clean --force

echo "✅ 清理完成！"

# 重新安装依赖
echo "📦 安装依赖中..."
npm install

echo "✅ 安装完成！"
echo ""
echo "🚀 启动开发服务器..."
npm run dev
