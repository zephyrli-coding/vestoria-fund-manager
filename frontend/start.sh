#!/bin/bash
# 快速启动脚本

echo "🚀 启动基金管理系统前端..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖中..."
  npm install
fi

echo "✅ 启动开发服务器..."
npm run dev
