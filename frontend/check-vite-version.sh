#!/bin/bash
# 获取 Vite 最新稳定版本

echo "📦 查询 Vite 可用版本..."

# 方法 1：使用 npm 查询
echo ""
echo "方法 1：使用 npm 查询"
echo "------------------------"
echo "npm view vite versions"
npm view vite versions | grep -E "latest|^[0-9]+\." | tail -5

echo ""
echo "方法 2：访问 Vite 官方网站"
echo "------------------------"
echo "请访问以下链接查看最新版本："
echo "https://github.com/vitejs/vite/releases"
echo ""
echo "推荐版本："
echo "v5.4.x 系列（稳定）"
echo "v4.5.x 系列（LTS）"
echo ""
echo "当前使用的版本：vite@^7.3.2 可能过时了"
echo ""
echo "建议尝试："
echo "  vite@^6.5.4  或 ^5.4.x"
echo "  vite@^6.4.2 或 ^5.4.x"
echo "  vite@^6.4.0 或 ^5.4.x"
echo ""
echo "使用最新稳定版本后，更新 package.json："
echo "  \"vite\": \"^6.5.4\","
echo "  \"vite\": \"^6.4.0\","
echo "  或 \"vite\": \"^5.4.0\","
