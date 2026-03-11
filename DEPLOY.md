# 服务器部署指南

## 1. 服务器环境准备

### 系统要求

- Node.js 18+
- npm 9+
- 支持 SQLite 的系统（大多数 Linux 都支持）

### 安装 Node.js

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 验证
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 安装 PM2（进程管理器）

```bash
npm install -g pm2
```

### 安装 Nginx（反向代理）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

---

## 2. 上传代码到服务器

### 方式一：Git 克隆

```bash
cd /var/www
git clone <你的仓库地址> freepic
cd freepic
```

### 方式二：直接上传

使用 SCP 或 SFTP 上传代码：

```bash
# 本地执行
scp -r ./freepic user@server:/var/www/
```

---

## 3. 安装依赖

```bash
cd /var/www/freepic

# 安装生产依赖（不安装 devDependencies）
npm ci --production

# 或者全量安装（如果要构建）
npm ci
```

**注意：** better-sqlite3 需要编译原生模块，确保服务器有 build 工具：

```bash
# Ubuntu/Debian
sudo apt install build-essential python3

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
```

---

## 4. 环境变量配置

创建 `.env.local` 文件：

```bash
cd /var/www/freepic
nano .env.local
```

填入以下内容（根据你的实际情况修改）：

```env
# Tencent Cloud COS Configuration（生产环境必配）
TENCENT_COS_SECRET_ID=你的SecretId
TENCENT_COS_SECRET_KEY=你的SecretKey
TENCENT_COS_REGION=ap-shanghai
TENCENT_COS_BUCKET=你的Bucket名称

# JWT Secret（生产环境必配，至少32位随机字符串）
JWT_SECRET=your-production-secret-key-min-32-characters-long

# App URL（改为你的域名）
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# SMTP Email Configuration（用于发送激活邮件）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=你的邮箱
SMTP_PASS=你的授权码
SMTP_FROM=你的邮箱
```

---

## 5. 数据库准备

### 创建数据库目录

```bash
mkdir -p /var/www/freepic/database
```

### 运行数据库迁移

```bash
# 生成迁移文件（如果 schema.ts 有修改）
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate
```

### 初始化数据（可选）

```bash
# 如果需要测试数据
npx tsx scripts/seed.ts
```

---

## 6. 构建项目

```bash
npm run build
```

构建完成后会生成 `.next` 目录。

---

## 7. PM2 进程管理配置

创建 PM2 配置文件：

```bash
nano /var/www/freepic/ecosystem.config.js
```

内容如下：

```javascript
module.exports = {
  apps: [
    {
      name: 'freepic',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 9000',
      cwd: '/var/www/freepic',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
      },
      // 日志配置
      log_file: '/var/log/freepic/combined.log',
      out_file: '/var/log/freepic/out.log',
      error_file: '/var/log/freepic/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 内存限制
      max_memory_restart: '1G',
      // 监控
      watch: false,
      // 启动延迟
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
```

创建日志目录：

```bash
sudo mkdir -p /var/log/freepic
sudo chown -R $USER:$USER /var/log/freepic
```

---

## 8. Nginx 反向代理配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/freepic
```

内容如下：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 静态文件缓存
    location /_next/static {
        alias /var/www/freepic/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件缓存
    location /uploads {
        alias /var/www/freepic/public/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 和页面代理到 Next.js
    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 上传文件大小限制（50MB）
    client_max_body_size 50M;
}
```

启用站点：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/freepic /etc/nginx/sites-enabled/

# 检查配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 9. 启动应用

### 使用 PM2 启动

```bash
cd /var/www/freepic
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs freepic
```

### 保存 PM2 配置（开机自启）

```bash
pm2 save
pm2 startup systemd
# 执行显示的命令
```

---

## 10. 配置 HTTPS（SSL）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期测试
sudo certbot renew --dry-run
```

Certbot 会自动修改 Nginx 配置添加 HTTPS。

---

## 11. 日常维护命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs freepic
pm2 logs freepic --lines 100

# 重启应用
pm2 restart freepic

# 停止应用
pm2 stop freepic

# 重新加载（零停机）
pm2 reload freepic

# 监控
pm2 monit
```

---

## 12. 更新部署流程

当有新代码时：

```bash
cd /var/www/freepic

# 拉取最新代码
git pull origin main

# 安装新依赖
npm ci --production

# 如果有数据库变更
npx drizzle-kit migrate

# 重新构建
npm run build

# 重启应用
pm2 restart freepic

# 查看是否正常
pm2 logs freepic --lines 50
```

---

## 13. 故障排查

### 应用无法启动

```bash
# 检查日志
pm2 logs freepic

# 检查端口占用
lsof -i :9000

# 手动测试启动
npm run start
```

### 数据库错误

```bash
# 检查数据库文件权限
ls -la /var/www/freepic/database/

# 检查数据库连接
npx tsx -e "import { db } from './lib/db'; console.log('DB OK')"
```

### Nginx 错误

```bash
# 检查配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 检查端口转发
curl http://localhost:9000
```

---

## 14. 安全建议

1. **防火墙配置**

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

2. **文件权限**

```bash
# 设置正确的权限
sudo chown -R $USER:$USER /var/www/freepic
chmod -R 755 /var/www/freepic
chmod 600 /var/www/freepic/.env.local
```

3. **定期备份**

```bash
# 备份数据库
cp /var/www/freepic/database/sqlite.db /backup/freepic-$(date +%Y%m%d).db

# 备份 uploads
rsync -av /var/www/freepic/public/uploads/ /backup/uploads/
```

---

## 15. 性能优化

### 启用 Gzip

编辑 `/etc/nginx/nginx.conf`：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### PM2 集群模式（多核 CPU）

修改 `ecosystem.config.js`：

```javascript
instances: 'max',  // 使用所有 CPU 核心
exec_mode: 'cluster',
```

---

**部署完成！** 访问 `https://yourdomain.com` 查看应用。
