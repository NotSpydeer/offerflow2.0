# OfferFlow

> AI驱动的求职决策引擎 — 不只是记录投递，更是帮你做更聪明的求职决策。

## 功能一览

| 模块 | 功能 |
|------|------|
| **Landing Page** | 产品展示首页，无需登录即可查看 |
| **登录系统** | 简洁的认证入口，保护内部数据 |
| **岗位投递** | 列表 + 看板双视图，CRUD + 状态流转 |
| **JD 智能解析** | 截图上传 → OCR 识别 → LLM 结构化提取 |
| **简历管理** | PDF/DOCX 多版本上传，标签分类 |
| **JD × 简历匹配** | AI 匹配评分 + 能力差距分析 + 投递策略建议 |
| **最优简历推荐** | 批量评分所有简历版本，自动选最佳 |
| **简历一键优化** | 基于 JD 重写简历，对齐关键词 |
| **面试记录** | 按岗位分组的时间线，支持复盘 Markdown |
| **数据 Dashboard** | 投递漏斗、状态/渠道分布图 |

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DOUBAO_API_KEY（火山引擎 Ark API）

# 3. 初始化数据库
npm run db:push

# 4. 启动
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)，用 `admin / 123456` 登录。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript |
| 样式 | Tailwind CSS + Radix UI |
| 数据库 | SQLite + Prisma ORM |
| OCR | Tesseract.js（本地，中英文） |
| AI | 火山引擎 Ark / DeepSeek-V3 |
| 文档解析 | pdf-parse + mammoth |
| 图表 | Recharts |
| 拖拽 | @hello-pangea/dnd |

## 环境变量

```env
# .env.local（不提交，手动创建）
DOUBAO_API_KEY=your_volcengine_ark_api_key

# .env.development / .env.production（已提交，无密钥）
DATABASE_URL="file:./dev.db"
```

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # Landing Page
│   ├── login/                # 登录页
│   ├── (app)/                # 认证保护的内部页面
│   │   ├── dashboard/
│   │   ├── applications/
│   │   ├── resumes/
│   │   └── interviews/
│   └── api/                  # 后端接口（含 4 个 AI 接口）
├── components/
│   ├── auth/                 # 路由守卫
│   ├── applications/         # 业务组件
│   ├── dashboard/            # 图表组件
│   └── layout/               # Sidebar + Header
└── lib/
    ├── auth.ts               # 认证工具
    ├── prisma.ts             # 数据库客户端
    └── utils.ts              # 工具函数
```

## 常用命令

```bash
npm run dev          # 开发环境 :3000
npm run dev:beta     # 开发环境 :3001（双环境对比）
npm run db:push      # 同步数据库 schema
npm run db:studio    # 可视化数据库
```

## 文档

详细的架构说明、开发记录和 AI Prompt 资产见 [docs/](docs/) 目录。
