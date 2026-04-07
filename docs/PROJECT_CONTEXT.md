# OfferFlow — 项目总览

## 产品定位

**OfferFlow** 是一个"AI驱动的求职决策引擎"。

不只是投递记录工具 — 核心价值是帮用户回答：
> "这个岗位值得投吗？投哪份简历？怎么优化胜算？"

## 核心用户价值

- **投递全程记录**：岗位、状态、渠道、面试轮次一体管理
- **JD 智能解析**：截图上传 → 视觉模型 OCR → LLM 提取结构化信息（公司/职位/要求/描述）
- **语义匹配分析**：JD × 简历 → 匹配评分 + 能力差距 + 投递策略
- **最优简历推荐**：多版本简历批量评分，自动选最佳
- **简历一键优化**：基于 JD 重写简历，对齐关键词
- **面试复盘**：记录题目、结果、反思，形成成长档案
- **求职漏斗统计**：回复率、面试率、Offer 率数据可视化

## 当前完成情况（2026-04-08）

### 已实现

| 功能模块 | 路由/页面 | 备注 |
|----------|-----------|------|
| Landing Page | `/` | 产品展示首页，无需登录 |
| 假登录系统 | `/login` | admin/123456，localStorage token |
| 路由守卫 | `(app)/layout.tsx` | AuthGuard + key={pathname} 强制页面刷新 |
| 岗位投递管理 | `/applications` | 列表+看板双视图，CRUD，拖拽状态流转 |
| OCR+JD解析 | `POST /api/ocr` | 生产：豆包视觉模型；本地：Tesseract.js fallback |
| 简历管理 | `/resumes` | PDF/DOCX 上传到 Vercel Blob，多版本，标签系统 |
| JD×简历匹配 | `POST /api/match` | 评分+优势+差距+建议+策略 |
| 最优简历推荐 | `POST /api/resume-match` | 批量评分，返回排名 |
| 简历优化 | `POST /api/resume-optimize` | 基于 JD 重写简历文本 |
| 面试记录 | `/interviews` | 按岗位分组，时间线展示 |
| 数据 Dashboard | `/dashboard` | 统计卡片、状态/渠道分布图、最近投递 |
| Vercel 部署 | offerflow.com.cn | Neon PostgreSQL + Vercel Blob + 自定义域名 |

### 已知问题

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | Dashboard 导航刷新仍有偶发缓存问题 | 切换页面后数据可能不更新 |
| P1 | `resume-match` 性能慢 | 多简历时单次 LLM 调用 prompt 过大 |
| P1 | 优化后简历无法保存 | 用户只能复制文本，无法存为新版本 |
| P1 | 本地开发环境不完整 | 本地需要 SQLite 但 schema 已改 PostgreSQL |
| P2 | 无真实用户认证 | 仅 demo 登录，无注册/权限系统 |
| P2 | `@types/node` 本地安装异常 | IDE 类型报错，不影响 Vercel 构建 |

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 14.2.5 (App Router) + React 18 + TypeScript |
| 样式 | Tailwind CSS + tailwind-merge + Radix UI |
| 数据库 | PostgreSQL (Neon) via Prisma ORM 5.x |
| 文件存储 | Vercel Blob（public store） |
| OCR（生产） | 豆包视觉模型 `ep-20260408002519-qt4vq`（火山引擎） |
| OCR（本地） | Tesseract.js v5（中英文，public/tessdata/ 语言包） |
| AI/LLM | 火山引擎 Ark API / DeepSeek-V3（endpoint: `ep-m-20260322111822-htwdm`） |
| PDF 解析 | unpdf（替代 pdf-parse，Vercel serverless 兼容） |
| DOCX 解析 | mammoth |
| 图表 | Recharts |
| 拖拽 | @hello-pangea/dnd |
| 图标 | lucide-react |
| 认证 | 假登录（localStorage token，无真实后端） |
| 部署 | Vercel（Serverless Functions） |
| 域名 | offerflow.com.cn（阿里云 DNS → Vercel） |

## 部署信息

| 项目 | 值 |
|------|-----|
| Vercel 项目 | offerflow2.0 |
| GitHub 主仓库 | NotSpydeer/offerflow (origin) |
| GitHub 部署仓库 | NotSpydeer/offerflow2.0 (vercel remote) |
| 数据库 | Neon PostgreSQL (us-east-1) |
| 文件存储 | Vercel Blob (public access) |
| 构建命令 | `npx prisma generate && npm run build` |
| 域名 | offerflow.com.cn / www.offerflow.com.cn |

## 环境变量

### Vercel 生产环境

| 变量 | 来源 |
|------|------|
| `DATABASE_URL` | Neon 连接字符串 |
| `DOUBAO_API_KEY` | 火山引擎 API Key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 自动注入 |

### 本地开发

```env
# .env.development（提交到 Git）
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_ENV="development"

# .env.local（不提交，手动创建）
DOUBAO_API_KEY=你的火山引擎密钥
```

## 启动命令

```bash
npm run dev          # 开发环境 :3000
npm run dev:beta     # 开发环境 :3001
npm run build && npm run start:prod  # 生产环境
npm run db:push      # 同步数据库 schema
npm run db:studio    # 可视化数据库
```
