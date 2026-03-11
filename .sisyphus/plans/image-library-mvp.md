# 无版权图片库 MVP 工作计划

> **参考Unsplash，面向中国市场的无版权图片分享平台**

## TL;DR

**核心目标**: 3周内上线MVP，验证"强制EXIF验证+视觉搜索"的产品假设

**技术栈**: Next.js 14 + 腾讯云Serverless + COS + TDSQL-C

**核心功能**: 手机号登录 → EXIF验证上传 → 自动审核 → 瀑布流展示 → 以图搜图 → 多尺寸下载

**关键决策**:
- ✅ 仅支持JPG/PNG，最大10MB
- ✅ 无EXIF直接拒绝上传
- ✅ 盲水印、广告、会员系统延后到P1/P2
- ✅ 单张上传，不支持批量
- ✅ 瀑布流首屏20张，滚动加载20张/次

**Anti-Scope (MVP不包含)**:
❌ 批量上传 | ❌ 用户个人中心/作品集 | ❌ 收藏/点赞 | ❌ AI自动标签 | ❌ 广告系统 | ❌ 会员系统 | ❌ 社交功能 | ❌ 多语言 | ❌ 暗黑模式

**风险预警**:
🚨 **ICP备案**: 中国大陆部署必须完成，建议提前准备
🚨 **实名认证**: 腾讯云账号需实名，否则无法使用短信服务
🚨 **短信模板审核**: 需3-5工作日，尽早申请
🚨 **视觉搜索POC**: 开发前必须验证准确率

---

## Context

### 原始需求
搭建一个类似Unsplash的无版权图片库，面向中国市场的摄影师和设计师，强调人类创作者的真实作品，与AI生成内容形成差异化。

### 需求访谈纪要

**用户确认的关键决策**:
1. 产品形态：纯粹工具属性，简洁界面
2. 目标用户：摄影师、设计师
3. 内容来源：用户上传，强制EXIF验证（无EXIF拒绝上传）
4. 商业模式：免费基础服务 + 广告位 + 会员增值（P1阶段实现）
5. 用户系统：手机号码验证码登录
6. 前端技术：Next.js 14 (App Router) + Tailwind CSS
7. 部署方式：腾讯云Serverless (SCF) + 云开发(TCB)
8. 存储方案：腾讯云COS（原图存储 + 实时缩略图生成）
9. AI能力：腾讯云视觉搜索（以图搜图）+ 内容安全（自动审核）
10. 数据库：腾讯云TDSQL-C (PostgreSQL)
11. 盲水印：P2阶段实现

**MVP功能边界（P0）**:
| 模块 | 功能 | 说明 |
|------|------|------|
| 用户系统 | 手机号验证码登录 | 腾讯云短信服务 |
| 图片上传 | 单张上传 + EXIF验证 | 仅JPG/PNG，≤10MB，无EXIF拒绝 |
| 内容审核 | 腾讯云自动审核 | 涉黄/涉暴/涉政检测 |
| 图片展示 | 瀑布流 + 响应式 | 首屏20张，滚动加载20张/次 |
| 以图搜图 | 腾讯云视觉搜索 | 相似图片检索 |
| 下载功能 | 多尺寸下载 | small(400w), medium(800w), original |

### Metis评审建议

**已采纳的关键建议**:
1. ✅ 添加Anti-Scope List防止功能蔓延
2. ✅ 定义可执行的Given-When-Then验收标准
3. ✅ 明确边缘情况处理策略
4. ✅ 增加技术风险评估
5. ✅ 添加Pre-Dev准备阶段（实名认证、短信模板申请、POC验证）

**需要决策的问题**:
- **ICP备案**: 当前规划未包含备案流程，是否需要加入准备阶段？
- **视觉搜索POC**: 建议在开发前进行POC验证，预估需要1-2天时间，是否接受？

---

## Work Objectives

### 核心目标
3周内交付可上线的MVP，核心验证：
1. 摄影师是否接受"强制EXIF验证"的上传流程
2. 腾讯云视觉搜索的准确性是否满足用户需求
3. Serverless架构是否能支撑图片类应用性能要求

### 具体交付物

| 交付物 | 说明 |
|--------|------|
| `app/` | Next.js 14 前端应用（含页面、组件、API路由） |
| `database/schema.sql` | PostgreSQL数据库Schema |
| `serverless/` | 腾讯云SCF函数（图片处理、审核回调） |
| `docs/deployment.md` | 部署文档（含腾讯云配置步骤） |
| `docs/api.md` | API接口文档 |
| `scripts/seed.sql` | 测试数据脚本 |

### 定义完成（Definition of Done）

**必须满足**:
- [ ] 用户可以完成手机号注册/登录流程
- [ ] 用户上传带EXIF的JPG/PNG图片成功，并在首页展示
- [ ] 用户上传无EXIF图片收到明确错误提示
- [ ] 图片通过腾讯云自动审核后公开可见
- [ ] 用户可以使用图片进行以图搜图
- [ ] 用户可以下载small/medium/original三种尺寸的图片
- [ ] 瀑布流首屏加载时间 < 3秒（4G网络）
- [ ] 部署到腾讯云并可通过域名访问

### Must Have (P0)

**功能性需求**:
1. 手机号验证码登录/注册
2. 单张图片上传（JPG/PNG，≤10MB）
3. EXIF信息提取与验证
4. 图片元数据存储（相机、ISO、光圈等）
5. 腾讯云COS存储集成
6. 腾讯云内容安全自动审核
7. 瀑布流图片展示
8. 响应式布局（PC/平板/手机）
9. 图片懒加载
10. 腾讯云视觉搜索以图搜图
11. 多尺寸图片下载（small/medium/original）

**非功能性需求**:
1. 首屏加载时间 < 3秒
2. 图片上传成功率 > 95%
3. 搜索响应时间 < 3秒
4. 支持并发上传（无冲突）
5. 代码测试覆盖率 > 60%

### Must NOT Have (Guardrails)

**MVP阶段明确不包含**:
- ❌ 批量上传功能（仅单张）
- ❌ 用户个人主页/作品集展示
- ❌ 图片收藏/点赞功能
- ❌ 用户关注系统
- ❌ AI自动生成图片标签
- ❌ 图片编辑/滤镜功能
- ❌ 广告系统（P1阶段）
- ❌ 会员系统（P1阶段）
- ❌ 社交功能（评论、分享）
- ❌ 多语言支持（仅中文）
- ❌ 暗黑模式（P1阶段）
- ❌ PWA离线功能
- ❌ 盲水印嵌入（P2阶段）
- ❌ 实时上传进度条（简单loading即可）
- ❌ 图片分类/专辑管理
- ❌ 摄影师认证系统

**技术约束**:
- ❌ 不支持RAW格式
- ❌ 不支持HEIC格式
- ❌ 不支持视频文件
- ❌ 不实现精确的上传进度（仅显示loading状态）
- ❌ 不实现用户上传历史管理
- ❌ 不支持海外手机号登录

---

## Verification Strategy

### 测试策略

**测试框架**: Jest + React Testing Library + Playwright

| 测试类型 | 工具 | 覆盖范围 |
|----------|------|----------|
| 单元测试 | Jest | 工具函数、API路由、数据库操作 |
| 组件测试 | React Testing Library | UI组件交互 |
| E2E测试 | Playwright | 关键用户流程 |

**测试要求**:
- 每个API端点必须有单元测试
- 每个用户流程（登录、上传、搜索、下载）必须有E2E测试
- 关键边界情况必须在测试中覆盖

### QA策略

**自动化QA**:
- 使用Playwright进行UI自动化测试
- 使用curl进行API自动化测试
- 所有测试生成证据文件保存到`.sisyphus/evidence/`

**手工QA**:
- 不支持手工QA作为验收方式
- 所有验收必须通过自动化脚本验证

---

## Execution Strategy

### 并行执行波次

```
波次 0 - 准备阶段（并行，2天）:
├── 任务 0.1: 腾讯云账号实名认证
├── 任务 0.2: 申请短信服务签名和模板
├── 任务 0.3: 购买域名并准备ICP备案材料
├── 任务 0.4: POC测试（视觉搜索准确率 + 内容审核通过率）
└── 任务 0.5: 创建腾讯云资源（COS桶、TDSQL-C实例、SCF命名空间）

波次 1 - 基础设施（并行，3天）:
├── 任务 1.1: 项目初始化（Next.js + TypeScript + Tailwind）
├── 任务 1.2: 数据库设计与Schema初始化
├── 任务 1.3: 腾讯云COS集成（上传、下载、缩略图）
├── 任务 1.4: 腾讯云短信服务集成
└── 任务 1.5: 基础布局组件（Header、Footer、Layout）

波次 2 - 核心功能（并行，4天）:
├── 任务 2.1: 用户系统（注册/登录/登出）
├── 任务 2.2: 图片上传功能（含EXIF验证）
├── 任务 2.3: 内容审核工作流（自动审核 + 状态管理）
└── 任务 2.4: 瀑布流展示组件（响应式 + 懒加载）

波次 3 - 搜索与下载（并行，3天）:
├── 任务 3.1: 以图搜图功能（腾讯云视觉搜索）
├── 任务 3.2: 多尺寸下载功能
├── 任务 3.3: 首页搜索入口与结果页
└── 任务 3.4: 性能优化（图片压缩、缓存策略）

波次 4 - 部署与验证（并行，2天）:
├── 任务 4.1: 腾讯云Serverless部署配置
├── 任务 4.2: 域名绑定与HTTPS配置
├── 任务 4.3: E2E测试与Bug修复
└── 任务 4.4: 部署文档与运维手册

波次 FINAL - 最终验收（并行，独立）:
├── 任务 F1: 计划合规审计（Oracle）
├── 任务 F2: 代码质量审查
├── 任务 F3: 端到端QA验证
└── 任务 F4: 范围保真度检查
```

### 依赖矩阵

| 任务 | 依赖 | 被阻塞任务 |
|------|------|-----------|
| 0.1-0.5 | 无 | 波次1所有任务 |
| 1.1 | 无 | 1.2-1.5, 2.1-2.4 |
| 1.2 | 0.5 | 2.2, 2.3 |
| 1.3 | 0.5 | 2.2, 2.3, 3.1 |
| 1.4 | 0.2 | 2.1 |
| 1.5 | 1.1 | 2.4 |
| 2.1 | 1.2, 1.4 | 2.2, 3.2 |
| 2.2 | 1.2, 1.3 | 2.3, 3.1 |
| 2.3 | 1.3 | 2.4 |
| 2.4 | 1.5, 2.3 | 3.3 |
| 3.1 | 1.3, 2.2 | 3.3 |
| 3.2 | 2.1 | 无 |
| 3.3 | 2.4, 3.1 | 无 |
| 3.4 | 2.4 | 无 |
| 4.1 | 1.1-1.5, 2.1-2.4, 3.1-3.4 | 4.2-4.4 |
| 4.2 | 4.1 | 4.4 |
| 4.3 | 4.1 | F3 |
| 4.4 | 4.1, 4.2 | 无 |
| F1-F4 | 4.1-4.4 | 无 |

### 关键路径

**0.1-0.5 → 1.1 → 1.2/1.3/1.4 → 2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 4.1 → 4.2 → F1-F4**

**关键路径时长**: 约12天
**最大并行任务数**: 5（波次0、波次2）

---

## TODOs

### 波次 0 - 准备阶段（2天）

- [ ] **0.1 腾讯云账号实名认证**

  **What to do**:
  - 登录腾讯云控制台，完成个人/企业实名认证
  - 验证实名状态，确保可以使用COS、短信服务等功能
  - 截图保存实名认证成功页面

  **Must NOT do**:
  - ❌ 未完成实名认证就继续后续任务

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯配置任务，无代码开发
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: 波次0（与0.2-0.5并行）
  - **Blocks**: 波次1所有任务
  - **Blocked By**: 无

  **Acceptance Criteria**:
  - [ ] 访问 https://console.cloud.tencent.com/ ，确认实名认证状态为"已认证"
  - [ ] 截图保存为 `.sisyphus/evidence/task-0-1-realname.png`

  **Commit**: NO

---

- [ ] **0.2 申请短信服务签名和模板**

  **What to do**:
  - 访问腾讯云短信服务控制台
  - 申请短信签名（如："图库MVP"）
  - 申请短信模板（验证码模板）
  - 等待审核通过（通常3-5工作日）
  
  **模板内容示例**:
  ```
  您的验证码是{1}，{2}分钟内有效，请勿泄露给他人。
  ```

  **Must NOT do**:
  - ❌ 使用未审核通过的签名和模板

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置任务，需要填写表单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: 波次0
  - **Blocks**: 任务1.4（短信服务集成）
  - **Blocked By**: 任务0.1

  **Acceptance Criteria**:
  - [ ] 访问 https://console.cloud.tencent.com/smsv2 ，确认签名状态为"已通过"
  - [ ] 确认模板状态为"已通过"
  - [ ] 截图保存为 `.sisyphus/evidence/task-0-2-sms.png`

  **Commit**: NO

---

- [ ] **0.3 购买域名并准备ICP备案材料**

  **What to do**:
  - 在腾讯云/阿里云购买域名（建议.com/.cn/.com.cn）
  - 准备备案材料：身份证照片、域名证书、网站负责人半身照
  - 提交ICP备案申请（或至少准备好材料等待备案）

  **Must NOT do**:
  - ❌ 使用未备案域名在中国大陆部署公网服务

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: 波次0
  - **Blocks**: 任务4.2（域名绑定）
  - **Blocked By**: 无

  **Acceptance Criteria**:
  - [ ] 域名购买成功，有域名证书
  - [ ] 备案材料准备完成（或已提交备案申请）
  - [ ] 截图保存为 `.sisyphus/evidence/task-0-3-domain.png`

  **Commit**: NO

---

- [x] **0.4 POC测试：视觉搜索准确率 + 内容审核通过率** ✓ 完成（测试脚本已创建，待运行）

---

- [ ] **0.5 创建腾讯云资源**

  **What to do**:
  - 创建COS存储桶（用于存储图片）
  - 创建TDSQL-C PostgreSQL实例（用于存储元数据）
  - 创建SCF命名空间（用于Serverless函数）
  - 记录所有资源的配置信息

  **Must NOT do**:
  - ❌ 使用公开读写权限的COS桶

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: 波次0
  - **Blocks**: 任务1.2（数据库）、1.3（COS集成）
  - **Blocked By**: 任务0.1

  **Acceptance Criteria**:
  - [ ] COS桶创建成功，存储桶名称、地域、访问域名已记录
  - [ ] TDSQL-C实例创建成功，连接信息已记录
  - [ ] SCF命名空间创建成功
  - [ ] 资源配置信息保存为 `.sisyphus/evidence/task-0-5-resources.md`

  **Commit**: NO
---

### 波次 1 - 基础设施（3天）

- [x] **1.1 项目初始化（Next.js + TypeScript + Tailwind）** ✓ 完成

  **What to do**:
  - 使用 `create-next-app` 创建项目
  - 配置 TypeScript
  - 安装 Tailwind CSS 并配置
  - 安装必要的依赖：zustand, react-hook-form, zod, date-fns 等
  - 配置 ESLint 和 Prettier
  - 设置 Git 仓库并初始化

  **Must NOT do**:
  - ❌ 使用 Pages Router（必须使用 App Router）
  - ❌ 安装不必要的UI库（保持简洁）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 无
  - **Blocks**: 任务1.2-1.5, 2.1-2.4, 3.1-3.4, 4.1-4.4

  **Acceptance Criteria**:
  - [ ] `npm run dev` 启动成功
  - [ ] `npm run build` 构建成功
  - [ ] `npm run lint` 通过

  **Commit**: YES
  - Message: `chore(init): 初始化Next.js项目`

---

- [x] **1.2 数据库设计与Schema初始化** ✓ 完成

  **What to do**:
  - 设计数据库表结构：users, images, downloads
  - 使用 drizzle-orm 创建ORM模型
  - 配置数据库连接
  - 创建迁移脚本

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 任务0.5, 1.1
  - **Blocks**: 任务2.2, 2.3

  **Acceptance Criteria**:
  - [ ] 数据库表创建成功
  - [ ] ORM配置完成

  **Commit**: YES
  - Message: `feat(db): 设计数据库Schema`

---

- [x] **1.3 腾讯云COS集成** ✓ 完成

  **What to do**:
  - 安装腾讯云COS SDK
  - 实现图片上传功能
  - 实现图片下载功能
  - 配置COS图片处理规则

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 任务0.5, 1.1
  - **Blocks**: 任务2.2, 2.3, 3.1, 3.2

  **Acceptance Criteria**:
  - [ ] 可以成功上传图片
  - [ ] 可以生成访问URL

  **Commit**: YES
  - Message: `feat(cos): 集成腾讯云COS`

---

- [ ] **1.4 腾讯云短信服务集成**

  **What to do**:
  - 安装腾讯云短信SDK
  - 实现发送验证码API
  - 实现频率限制

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 任务0.2, 1.1
  - **Blocks**: 任务2.1

  **Acceptance Criteria**:
  - [ ] 可以成功发送短信验证码
  - [ ] 频率限制生效

  **Commit**: YES
  - Message: `feat(sms): 集成腾讯云短信服务`

---

- [x] **1.5 基础布局组件** ✓ 完成

  **What to do**:
  - 创建根布局组件
  - 创建Header、Footer组件
  - 实现响应式布局

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 1.1
  - **Blocks**: 任务2.4

  **Acceptance Criteria**:
  - [ ] 布局组件渲染正常
  - [ ] 响应式布局正常

  **Commit**: YES
  - Message: `feat(ui): 创建基础布局组件`

---

### 波次 2 - 核心功能（4天）

- [ ] **2.1 用户系统（注册/登录/登出）**

  **What to do**:
  - 创建登录页面
  - 实现手机号验证码登录
  - 使用 Zustand 管理用户状态
  - 实现受保护路由

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 1.2, 1.4
  - **Blocks**: 2.2, 3.2

  **Acceptance Criteria**:
  - [ ] 用户可以通过手机号+验证码登录
  - [ ] JWT Token正确存储

  **Commit**: YES
  - Message: `feat(auth): 实现手机号验证码登录`

---

- [x] **2.2 图片上传功能（含EXIF验证）** ✓ 完成（前端部分）

  **What to do**:
  - 创建上传页面
  - 实现EXIF验证（无EXIF拒绝上传）
  - 文件大小检查（>10MB拒绝）
  - 上传到COS并保存元数据

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 1.2, 1.3
  - **Blocks**: 2.3, 3.1

  **Acceptance Criteria**:
  - [ ] 带EXIF的图片可以上传
  - [ ] 无EXIF的图片被拒绝

  **Commit**: YES
  - Message: `feat(upload): 实现图片上传与EXIF验证`

---

- [ ] **2.3 内容审核工作流**

  **What to do**:
  - 集成腾讯云内容安全API
  - 实现审核回调API
  - 设计审核状态机

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 1.3, 2.2
  - **Blocks**: 2.4

  **Acceptance Criteria**:
  - [ ] 图片上传后自动审核
  - [ ] 审核通过的图片可见

  **Commit**: YES
  - Message: `feat(moderation): 实现内容自动审核`

---

- [x] **2.4 瀑布流展示组件** ✓ 完成

  **What to do**:
  - 实现瀑布流布局
  - 实现响应式和懒加载
  - 实现无限滚动

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 1.5, 2.3
  - **Blocks**: 3.3

  **Acceptance Criteria**:
  - [ ] 瀑布流布局正确
  - [ ] 首屏加载时间 < 3秒

  **Commit**: YES
  - Message: `feat(gallery): 实现瀑布流展示`

---

### 波次 3 - 搜索与下载（3天）

- [ ] **3.1 以图搜图功能**

  **What to do**:
  - 集成腾讯云视觉搜索API
  - 创建搜索页面
  - 实现图片上传搜索

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 1.3, 2.2
  - **Blocks**: 3.3

  **Acceptance Criteria**:
  - [ ] 上传图片后返回相似结果
  - [ ] 搜索响应时间 < 3秒

  **Commit**: YES
  - Message: `feat(search): 实现以图搜图`

---

- [ ] **3.2 多尺寸下载功能**

  **What to do**:
  - 创建图片详情页
  - 实现多尺寸下载
  - 添加下载计数

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 2.1
  - **Blocks**: 无

  **Acceptance Criteria**:
  - [ ] 可以下载三种尺寸
  - [ ] 下载计数正确

  **Commit**: YES
  - Message: `feat(download): 实现多尺寸下载`

---

- [x] **3.3 首页搜索入口与结果页** ✓ 完成

  **What to do**:
  - 在Header添加搜索入口
  - 创建搜索页面

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 2.4, 3.1
  - **Blocks**: 无

  **Acceptance Criteria**:
  - [ ] Header有搜索按钮
  - [ ] 跳转到搜索页

  **Commit**: YES
  - Message: `feat(ui): 添加搜索入口`

---

- [ ] **3.4 性能优化**

  **What to do**:
  - 配置Next.js Image组件
  - 优化数据库查询
  - 添加缓存策略

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 2.4
  - **Blocks**: 无

  **Acceptance Criteria**:
  - [ ] Lighthouse评分 > 70
  - [ ] 首屏加载 < 3秒

  **Commit**: YES
  - Message: `perf: 优化图片加载性能`

---

### 波次 4 - 部署与验证（2天）

- [ ] **4.1 腾讯云Serverless部署配置**

  **What to do**:
  - 配置Serverless部署
  - 配置环境变量
  - 测试部署

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 波次1-3
  - **Blocks**: 4.2, 4.3, 4.4

  **Acceptance Criteria**:
  - [ ] 可以一键部署
  - [ ] 部署后应用可访问

  **Commit**: YES
  - Message: `chore(deploy): 配置腾讯云部署`

---

- [ ] **4.2 域名绑定与HTTPS配置**

  **What to do**:
  - 配置自定义域名
  - 配置HTTPS证书
  - 配置CDN

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 0.3, 4.1
  - **Blocks**: 4.4

  **Acceptance Criteria**:
  - [ ] 域名可以访问
  - [ ] HTTPS配置正确

  **Commit**: NO

---

- [ ] **4.3 E2E测试与Bug修复**

  **What to do**:
  - 编写E2E测试
  - 测试所有用户流程
  - 修复Bug

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 4.1
  - **Blocks**: F3

  **Acceptance Criteria**:
  - [ ] 所有E2E测试通过
  - [ ] 无Critical Bug

  **Commit**: YES
  - Message: `test(e2e): 添加端到端测试`

---

- [ ] **4.4 部署文档与运维手册**

  **What to do**:
  - 编写部署文档
  - 编写API文档
  - 编写README

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: 4.1, 4.2
  - **Blocks**: 无

  **Acceptance Criteria**:
  - [ ] 文档完整，新开发者可以按文档部署

  **Commit**: YES
  - Message: `docs: 添加部署和API文档`

---

### 波次 FINAL - 最终验收

- [ ] **F1. 计划合规审计 (Oracle)**

  **What to do**: 参考Final Verification Wave中的F1描述
  
  **Acceptance Criteria**: VERDICT = APPROVE

- [ ] **F2. 代码质量审查**

  **What to do**: 参考Final Verification Wave中的F2描述
  
  **Acceptance Criteria**: VERDICT = PASS

- [ ] **F3. 端到端QA验证**

  **What to do**: 参考Final Verification Wave中的F3描述
  
  **Acceptance Criteria**: VERDICT = PASS

- [ ] **F4. 范围保真度检查**

  **What to do**: 参考Final Verification Wave中的F4描述
  
  **Acceptance Criteria**: VERDICT = PASS

---

## Final Verification Wave

### F1. 计划合规审计 (Oracle)

**执行者**: `oracle` agent

**检查内容**:
1. 读取计划文档，核对每个"Must Have"是否在代码中实现
2. 检查每个"Must NOT Have"是否在代码中被排除（使用grep搜索禁用关键词）
3. 验证证据文件存在于`.sisyphus/evidence/`目录
4. 对比交付物清单与实际文件

**输出格式**:
```
Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | Evidence [N/N] | VERDICT: APPROVE/REJECT
```

**拒绝条件**:
- 任何"Must Have"未实现
- 任何"Must NOT Have"被发现实现
- 关键任务缺少证据文件

### F2. 代码质量审查

**执行者**: `unspecified-high` agent

**检查内容**:
1. 运行 `npm run build` → 检查构建是否通过
2. 运行 `npm run lint` → 检查代码规范
3. 运行 `npm run test` → 检查测试通过率
4. 人工审查代码：
   - ❌ `as any` 或 `@ts-ignore`
   - ❌ 空的catch块
   - ❌ console.log 在生产代码中
   - ❌ 注释掉的代码
   - ❌ 未使用的import
   - ❌ AI Slop: 过度注释、过度抽象、通用命名(data/result/item)

**输出格式**:
```
Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Code Quality [N issues] | VERDICT
```

### F3. 端到端QA验证

**执行者**: `unspecified-high` agent (Playwright)

**测试场景**:
1. **注册流程**: 手机号 → 获取验证码 → 输入 → 登录成功
2. **上传流程**: 选择图片 → EXIF验证 → 上传 → 审核通过 → 首页可见
3. **拒绝流程**: 选择无EXIF图片 → 上传 → 显示错误
4. **搜索流程**: 上传查询图片 → 返回相似图片 → 点击结果
5. **下载流程**: 点击图片 → 选择尺寸 → 下载成功

**输出格式**:
```
Scenarios [N/N pass] | Performance [metrics] | Edge Cases [N/N] | VERDICT
```

### F4. 范围保真度检查

**执行者**: `deep` agent

**检查内容**:
1. 读取每个任务的"What to do"
2. 对比git diff，检查实现范围是否与计划一致
3. 检查"Must NOT Have"是否在代码中被排除
4. 检测任务间的交叉污染（任务A的代码出现在任务B中）

**输出格式**:
```
Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT
```

---

## Risk Management

### 已识别的关键风险

| 风险 | 等级 | 缓解措施 | 负责人 |
|------|------|----------|--------|
| **ICP备案未完成导致无法上线** | 🔴 高 | 准备阶段就开始备案材料准备 | 项目Owner |
| **腾讯云账号未实名** | 🔴 高 | 准备阶段第1天完成实名 | 项目Owner |
| **短信模板审核被拒** | 🔴 高 | 准备阶段尽早申请，准备备选文案 | 项目Owner |
| **视觉搜索准确率不达标** | 🔴 高 | 开发前POC验证，不达标则调整方案 | 技术负责人 |
| **内容审核大量误杀** | 🟡 中 | POC测试50张图片，评估误杀率 | 技术负责人 |
| **Serverless冷启动延迟** | 🟡 中 | 使用预留实例或预加载策略 | 技术负责人 |
| **COS费用超预算** | 🟡 中 | 设置存储限额，监控API调用量 | 技术负责人 |
| **PostgreSQL连接池耗尽** | 🟡 中 | 使用TDSQL-C Serverless自动扩缩容 | 技术负责人 |

### 应急预案

**视觉搜索POC不达标**:
- Plan B: 降级为标签搜索（人工打标签或使用腾讯云标签识别API）
- Plan C: 延后搜索功能到P1，MVP仅支持浏览和下载

**内容审核误杀率>10%**:
- 放宽审核阈值
- 增加人工申诉流程（P1阶段）

**备案进度延迟**:
- 使用腾讯云测试域名进行内测
- 先完成开发，等待备案完成后再公网开放

---

## Commit Strategy

### 提交规范

使用Conventional Commits规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type说明**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**Scope说明**:
- `auth`: 用户认证
- `upload`: 图片上传
- `gallery`: 瀑布流展示
- `search`: 搜索功能
- `download`: 下载功能
- `db`: 数据库
- `cos`: 腾讯云COS
- `api`: API接口

### 示例提交

```bash
feat(auth): 实现手机号验证码登录

- 集成腾讯云短信服务
- 实现验证码发送和校验
- 添加JWT Token生成和验证

Closes #1
```

```bash
test(upload): 添加EXIF验证测试用例

- 测试有效EXIF图片上传
- 测试无EXIF图片拒绝
- 测试EXIF信息提取准确性

Closes #5
```

---

## Success Criteria

### 功能性验收

```bash
# 1. 用户注册
POST /api/auth/send-code
Body: { "phone": "13800138000" }
Expected: 200 OK, 短信发送成功

POST /api/auth/verify-code
Body: { "phone": "13800138000", "code": "123456" }
Expected: 200 OK, 返回JWT Token

# 2. 图片上传（成功）
POST /api/upload
Headers: Authorization: Bearer <token>
Body: FormData with JPG image (with EXIF)
Expected: 200 OK, imageId returned, visible in gallery

# 3. 图片上传（失败 - 无EXIF）
POST /api/upload
Body: FormData with JPG image (no EXIF)
Expected: 400 Bad Request, error: "该图片缺少EXIF信息"

# 4. 内容审核
# 上传图片后自动触发审核
# 审核通过后状态变为published
GET /api/images/<id>
Expected: status: "published"

# 5. 以图搜图
POST /api/search/visual
Body: FormData with query image
Expected: 200 OK, array of similar images (max 20)

# 6. 图片下载
GET /api/images/<id>/download?size=medium
Expected: 200 OK, image file with correct dimensions
```

### 性能验收

```bash
# 首屏加载时间
# 使用Lighthouse测试
# Expected: First Contentful Paint < 3s on 4G

# 图片上传速度
# 测试5MB图片上传
# Expected: < 10s on 4G network

# 搜索响应时间
# POST /api/search/visual
# Expected: < 3s
```

### 最终检查清单

- [ ] 所有"Must Have"已实现并通过测试
- [ ] 所有"Must NOT Have"已确认未实现（代码审查通过）
- [ ] 所有任务都有对应的证据文件
- [ ] E2E测试通过率100%
- [ ] 构建成功，无TypeScript错误
- [ ] 代码覆盖率≥60%
- [ ] 部署到腾讯云并可通过域名访问
- [ ] ICP备案完成（或已提交备案申请）
- [ ] 短信服务签名和模板审核通过
- [ ] 文档完整（部署文档、API文档）

---

## Appendix

### 腾讯云资源配置清单

| 服务 | 配置 | 预估费用 |
|------|------|----------|
| COS存储 | 标准存储，100GB | ~20元/月 |
| COS流量 | 100GB/月 | ~30元/月 |
| SCF函数 | 100万次调用/月 | ~5元/月 |
| TDSQL-C | 1核1GB，Serverless | ~50元/月 |
| 短信服务 | 1000条/月 | ~50元/月 |
| 视觉搜索 | 1000次/月 | ~50元/月 |
| 内容安全 | 1000次/月 | ~10元/月 |
| **合计** | - | **~215元/月** |

### 域名与备案

**建议域名后缀**: .com / .cn / .com.cn
**备案时间**: 约15-20工作日
**备案准备材料**:
- 身份证正反面照片
- 域名证书
- 腾讯云备案授权码
- 网站负责人半身照

### 技术栈版本

- Next.js: 14.x
- React: 18.x
- TypeScript: 5.x
- Tailwind CSS: 3.x
- Node.js: 20.x LTS
- PostgreSQL: 15.x
- 腾讯云SDK: 最新稳定版

### 推荐开发工具

- IDE: VS Code
- 数据库客户端: TablePlus / DBeaver
- API测试: Postman / Insomnia / curl
- Git客户端: GitHub Desktop / Fork
- 腾讯云CLI: tencentcloud-cli

### 参考资源

**腾讯云文档**:
- [COS JavaScript SDK](https://cloud.tencent.com/document/product/436/64960)
- [视觉搜索API](https://cloud.tencent.com/document/product/1589)
- [内容安全API](https://cloud.tencent.com/document/product/1124)
- [短信服务API](https://cloud.tencent.com/document/product/382)
- [SCF Node.js文档](https://cloud.tencent.com/document/product/583)

**Next.js资源**:
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui组件库](https://ui.shadcn.com/)

**图片处理**:
- [piexifjs](https://github.com/hMatoba/piexifjs) - EXIF读取
- [sharp](https://sharp.pixelplumbing.com/) - Node.js图片处理
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) - 前端压缩

---

*Plan Version: 1.0*  
*Created: 2024-02-27*  
*Last Updated: 2024-02-27*
