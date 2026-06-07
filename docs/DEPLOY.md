# 基金管理系统 - 部署文档

## 📋 前置要求

- Linux 服务器（Ubuntu 20.04+ 推荐）
- Docker & Docker Compose
- 域名（可选，用于 HTTPS）

---

## 🔧 开发环境配置

### 1. 后端配置

```bash
cd backend

# 创建虚拟环境
uv venv
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt

# 配置环境变量（可选，使用默认值即可）
# 如需修改，创建 .env 文件
echo "SECRET_KEY=your-dev-secret-key" > .env

# 启动后端
uvicorn app.main:app --reload --port 8000
```

### 2. 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（Vite 会自动代理 API 请求到 localhost:8000）
npm run dev
```

### 开发环境说明

- 前端地址：`http://localhost:5173`
- 后端地址：`http://localhost:8000`
- API 代理：Vite 自动将 `/api/*` 请求转发到后端
- **无需额外配置**，`vite.config.ts` 已包含代理设置

---

## 🚀 生产环境部署

### 方案一：Docker Compose（推荐）

#### 1. 准备服务器

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 部署应用

```bash
# 克隆代码
git clone https://github.com/Zaaachary/fund_manager.git
cd fund_manager

# 配置环境变量
cp .env.example .env
nano .env
```

**必须修改的配置：**
```bash
# 生成强密钥
SECRET_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=$SECRET_KEY" >> .env
```

**可选配置：**
```bash
# 数据库路径（默认即可）
DATABASE_URL=sqlite:///data/fund_manager.db

# JWT Token 有效期（天）
ACCESS_TOKEN_EXPIRE_DAYS=7
```

#### 3. 启动服务

```bash
docker-compose up -d
```

#### 4. 配置 Nginx（反向代理）

创建 `/etc/nginx/sites-available/fund-manager`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    location / {
        root /path/to/fund_manager/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/fund-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. 配置 HTTPS（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

## 🔒 安全配置

### 1. 修改默认密钥

```bash
# 生成新的密钥
openssl rand -hex 32

# 更新 .env 文件
nano .env
```

### 2. 数据库备份

```bash
# 手动备份
cp data/fund_manager.db backup/fund_manager_$(date +%Y%m%d).db

# 自动备份脚本（添加到 crontab）
# 每天凌晨 3 点备份
0 3 * * * cp /path/to/fund_manager/data/fund_manager.db /path/to/backup/fund_manager_$(date +\%Y\%m\%d).db
```

### 3. 防火墙配置

```bash
# 只允许 80/443 端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8000/tcp  # 禁止直接访问后端
sudo ufw enable
```

---

## 🔄 更新部署

```bash
cd fund_manager

# 拉取最新代码
git pull origin main

# 重建并重启容器
docker-compose down
docker-compose up -d --build

# 如果需要保留数据库，确保 data/ 目录已挂载
```

---

## 🐛 故障排查

```bash
# 查看所有容器日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 进入容器调试
docker-compose exec backend sh

# 检查后端健康状态
curl http://localhost:8000/api/v1/health
```

---

## 📁 目录结构

```
fund_manager/
├── backend/              # 后端代码
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # 前端代码
│   ├── Dockerfile
│   └── dist/             # 构建产物
├── data/                 # 数据库文件（持久化）
├── docker-compose.yml    # Docker 编排配置
├── .env                  # 环境变量（不提交到 Git）
├── .env.example          # 环境变量示例
└── docs/
    └── DEPLOY.md         # 本文件
```

---

## 📞 常见问题

### Q: 前端提示 API 404
A: 检查 Nginx 配置中的 `proxy_pass` 是否正确，确保后端服务已启动

### Q: 数据库连接失败
A: 检查 `data/` 目录权限：`chmod 755 data/`

### Q: 如何查看后端日志？
A: `docker-compose logs -f backend` 或 `tail -f backend/app.log`

---

## 🔗 相关链接

- 前端地址：`http://your-domain.com`
- API 文档：`http://your-domain.com/api/v1/docs` (Swagger UI)
- 默认账号：`admin` / `admin123` （部署后请立即修改密码）
