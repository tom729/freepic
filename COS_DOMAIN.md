# COS 自定义域名配置指南

## 概述

将腾讯云 COS 绑定自定义域名 `tukupic.mepai.me`，可以让图片 URL 更简洁专业：

- **之前**: `https://no-copyright-1251461203.cos.ap-shanghai.myqcloud.com/image.jpg`
- **之后**: `https://tukupic.mepai.me/image.jpg`

---

## 配置步骤

### 1. 腾讯云 COS 控制台配置

#### 1.1 进入自定义域名设置

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 **对象存储 COS** → 选择你的 Bucket (`no-copyright-1251461203`)
3. 左侧菜单 → **域名与传输管理** → **自定义 CDN 加速域名**

#### 1.2 添加自定义域名

1. 点击 **添加域名**
2. 填写域名：`tukupic.mepai.me`
3. 回源方式选择：**默认源站**
4. 点击 **保存**

#### 1.3 配置 HTTPS（强烈推荐）

1. 在域名列表中找到 `tukupic.mepai.me`
2. 点击 **编辑** → **HTTPS 配置**
3. 选择证书来源：
   - **腾讯云托管证书**：如果你有腾讯云 SSL 证书
   - **自有证书**：上传你的证书文件（.crt 和 .key）
4. 开启 **强制跳转 HTTPS**（可选但推荐）

#### 1.4 配置防盗链（推荐）

1. 进入域名详情 → **访问控制**
2. 开启 **防盗链设置**
3. 选择 **白名单模式**
4. 添加你的主站域名，例如：
   - `*.mepai.me`
   - `mepai.me`
   - `localhost`（本地开发测试用）

---

### 2. DNS 配置

在你的域名解析服务商（如 DNSPod、阿里云 DNS、Cloudflare 等）添加 CNAME 记录：

| 记录类型 | 主机记录 | 记录值                                                 |
| -------- | -------- | ------------------------------------------------------ |
| CNAME    | tukupic  | `no-copyright-1251461203.cos.ap-shanghai.myqcloud.com` |

**注意**：

- 记录值请从腾讯云 COS 控制台复制的 **CNAME** 地址
- TTL 建议设置为 600（10分钟），方便快速生效
- 配置完成后，等待 5-30 分钟让 DNS 生效

---

### 3. 项目代码配置

代码已自动更新支持自定义域名，你只需要：

#### 3.1 设置环境变量

在 `.env.local` 或服务器环境变量中添加：

```env
# 已有配置
TENCENT_COS_SECRET_ID=你的SecretId
TENCENT_COS_SECRET_KEY=你的SecretKey
TENCENT_COS_REGION=ap-shanghai
TENCENT_COS_BUCKET=no-copyright-1251461203

# 新增：自定义域名
TENCENT_COS_DOMAIN=tukupic.mepai.me
```

#### 3.2 重启应用

```bash
# 开发环境
npm run dev

# 生产环境（使用 PM2）
pm2 restart freepic
```

---

## 验证配置

### 1. 检查 DNS 解析

```bash
# 在终端执行
nslookup tukupic.mepai.me

# 应该返回类似
# Name: tukupic.mepai.me
# Address: xxx.xxx.xxx.xxx
```

### 2. 检查 HTTPS 访问

在浏览器访问：

```
https://tukupic.mepai.me/
```

应该显示 XML 格式的 Bucket 列表（如果没有配置静态网站托管）。

### 3. 测试图片访问

上传一张图片后，检查图片 URL 是否使用自定义域名：

```bash
# 调用 API 获取图片列表
curl http://localhost:9000/api/images

# 检查返回的 URL 字段，应该是 tukupic.mepai.me 开头
```

---

## 代码变更说明

本次更新对以下文件进行了修改：

### 1. `lib/cos.ts`

- 在 `CosConfig` 接口中添加了 `domain?: string` 字段
- 修改了 `getImageUrl` 函数，支持自定义域名
- 配置了自定义域名时，直接返回 `https://domain/key` 格式的 URL

### 2. `next.config.mjs`

- 在 `remotePatterns` 中添加了 `tukupic.mepai.me` 域名
- 确保 Next.js Image 组件可以加载自定义域名的图片

### 3. `.env.local`

- 添加了 `TENCENT_COS_DOMAIN` 环境变量

---

## 常见问题

### Q1: 配置自定义域名后图片访问变慢了？

**A**: 首次访问可能会慢一些，因为 CDN 节点需要回源获取数据。后续访问会直接从 CDN 节点缓存，速度会更快。

### Q2: 如何刷新 CDN 缓存？

**A**:

1. 进入腾讯云 CDN 控制台
2. 找到 `tukupic.mepai.me` 域名
3. 点击 **缓存刷新** → **URL 刷新** 或 **目录刷新**

### Q3: 自定义域名支持图片处理参数吗？

**A**: 支持！URL 格式如下：

```
https://tukupic.mepai.me/image.jpg?imageMogr2/thumbnail/!400x/format/webp
```

### Q4: 自定义域名是否支持私有读写权限？

**A**: 当前代码配置为 **公有读私有写**，自定义域名直接访问即可，无需签名。如果你需要私有访问，需要额外配置 URL 签名鉴权。

### Q5: 如何取消自定义域名？

**A**:

1. 删除 `.env.local` 中的 `TENCENT_COS_DOMAIN` 变量
2. 重启应用
3. （可选）在腾讯云控制台删除自定义域名配置
4. （可选）在 DNS 服务商删除 CNAME 记录

---

## 优化建议

### 1. 配置 CDN 缓存策略

在腾讯云 CDN 控制台，为图片文件配置长期缓存：

- 图片文件 (_.jpg, _.png, _.webp, _.avif)：缓存 30 天
- 缩略图 (\*-thumb.jpg)：缓存 7 天

### 2. 启用智能压缩

在 CDN 控制台开启 **智能压缩**，自动将图片转换为 WebP/AVIF 格式，减少传输体积。

### 3. 配置 HTTP/2

确保 CDN 域名开启 HTTP/2，提升多图片并行加载性能。

---

## 参考文档

- [腾讯云 COS 自定义域名文档](https://cloud.tencent.com/document/product/436/36638)
- [腾讯云 CDN 配置指南](https://cloud.tencent.com/document/product/228/3129)
- [COS 图片处理文档](https://cloud.tencent.com/document/product/436/44880)
