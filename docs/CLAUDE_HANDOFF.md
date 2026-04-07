# OfferFlow — Claude 接管指南

> **目标**：让任何 Claude 在 1 分钟内接手该项目，无需历史对话。

---

## 第一步：快速理解（必读顺序）

```
1. docs/PROJECT_CONTEXT.md   → 产品定位 + 功能全貌 + 技术栈 + 部署信息
2. docs/ARCHITECTURE.md      → 代码结构 + 四层架构 + API 设计 + 数据流
3. docs/DEV_LOG.md           → 开发历史 + 当前问题 + 下一步方向
4. docs/PROMPTS.md           → 所有 AI Prompt（改 AI 功能时必读）
```

---

## 第二步：项目概要

OfferFlow 是一个 AI 驱动的求职管理工具，核心功能：
- JD 截图 OCR → 结构化解析 → 岗位管理
- JD × 简历语义匹配 → 评分 + 策略建议
- 简历批量排名 + 一键优化
- 面试记录 + 数据统计

**技术栈**：Next.js 14 + React 18 + Prisma + PostgreSQL (Neon) + Vercel Blob + 火山引擎 LLM

---

## 第三步：启动项目

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DOUBAO_API_KEY

# 3. 注意：schema 当前为 PostgreSQL
# 本地开发如需 SQLite，临时修改 prisma/schema.prisma:
#   provider = "sqlite" + DATABASE_URL = "file:./dev.db"

# 4. 初始化数据库
npm run db:push

# 5. 启动
npm run dev          # localhost:3000
```

**登录账号**：`admin / 123456`（假登录，无需真实后端）

### Vercel 生产环境

- **仓库**：NotSpydeer/offerflow2.0
- **构建命令**：`npx prisma generate && npm run build`
- **环境变量**：DATABASE_URL (Neon) + DOUBAO_API_KEY + BLOB_READ_WRITE_TOKEN (自动)
- **域名**：offerflow.com.cn

---

## 第四步：项目结构速览

```
src/app/
├── page.tsx              # Landing Page（无需登录）
├── login/page.tsx        # 登录页
├── (app)/                # 认证保护的内部页面
│   ├── layout.tsx        # ← Sidebar/Header/AuthGuard/key={pathname}
│   ├── dashboard/        # 数据统计
│   ├── applications/     # 岗位投递（核心功能）
│   ├── resumes/          # 简历管理
│   └── interviews/       # 面试记录
└── api/                  # 后端接口（全部 force-dynamic）

src/lib/
├── auth.ts               # 登录/登出/token 工具
├── prisma.ts             # 数据库客户端
├── parseResume.ts        # 简历解析（Blob URL + 本地，unpdf + mammoth）
└── utils.ts              # cn / formatDate / STATUS_LIST 等
```

---

## 第五步：关键代码位置速查

| 想修改的东西 | 找这个文件 |
|------------|-----------|
| AI Prompt（OCR 视觉识别） | `src/app/api/ocr/route.ts` |
| AI Prompt（JD 结构化解析） | `src/app/api/ocr/route.ts` → `extractJobInfoWithLLM()` |
| AI Prompt（匹配分析） | `src/app/api/match/route.ts` |
| AI Prompt（批量排名） | `src/app/api/resume-match/route.ts` |
| AI Prompt（简历优化） | `src/app/api/resume-optimize/route.ts` |
| 简历文件解析逻辑 | `src/lib/parseResume.ts` |
| 登录逻辑 / 账号密码 | `src/lib/auth.ts` |
| 路由守卫 | `src/components/auth/AuthGuard.tsx` |
| 侧边栏导航 | `src/components/layout/Sidebar.tsx` |
| 全局状态枚举 | `src/lib/utils.ts`（STATUS_LIST / CHANNEL_LIST 等） |
| 数据库 Schema | `prisma/schema.prisma` |
| Next.js 配置 | `next.config.js` |
| 环境变量模板 | `.env.example` |

---

## 第六步：开发规范

### Git 工作流

```bash
# 新功能开发
git checkout main
git checkout -b feature/你的功能名
# ... 开发 ...
git add .
git commit -m "feat: 功能描述"
git checkout main
git merge feature/你的功能名

# 推送到两个仓库
git push origin main          # 主仓库
git push vercel main          # Vercel 部署仓库（自动触发部署）
```

### 新增 API 接口模板

```typescript
// src/app/api/xxx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'  // 必须加！防止 Vercel 缓存

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ... 逻辑 ...
    return NextResponse.json({ result })
  } catch (error) {
    console.error('xxx error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
```

### 调用 LLM 模板

```typescript
const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DOUBAO_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'ep-m-20260322111822-htwdm',  // DeepSeek-V3 endpoint ID
    messages: [
      { role: 'system', content: 'System prompt...' },
      { role: 'user', content: 'User prompt...' },
    ],
    temperature: 0,
  }),
})
const data = await res.json()
const raw = data.choices[0].message.content
const match = raw.match(/\{[\s\S]*\}/)
if (!match) throw new Error('LLM 未返回有效 JSON')
const parsed = JSON.parse(match[0])
```

### 解析简历文件

```typescript
// 直接导入共享工具
import { parseResume } from '@/lib/parseResume'

const resumeText = await parseResume(resume.filepath, resume.mimetype)
// filepath 为 Vercel Blob URL（生产）或本地路径（开发）
// 支持 PDF（unpdf）和 DOCX（mammoth）
```

---

## 常见问题

### Q: Vercel 部署后 API 返回旧数据

确认 API 路由文件顶部有 `export const dynamic = 'force-dynamic'`。
如果刚加，重新部署时**取消勾选 "Use existing Build Cache"**。

### Q: OCR 识别失败 / 视觉模型报错

1. 检查 `DOUBAO_API_KEY` 环境变量是否正确（无多余空格/引号）
2. 确认 endpoint ID `ep-20260408002519-qt4vq` 在火山引擎方舟控制台已创建
3. 查看 Vercel Logs（项目 → Deployments → 最新部署 → Logs）

### Q: 简历上传失败 / Blob 报错

1. 确认 Vercel Blob Store 已创建（Storage → Blob）且为 **public access**
2. 确认 `BLOB_READ_WRITE_TOKEN` 环境变量已自动注入
3. 重新部署一次让新环境变量生效

### Q: LLM 调用失败 / 返回 401

1. 检查 `DOUBAO_API_KEY` 是否正确
2. 确认使用的是 **endpoint ID**（`ep-xxx` 格式），不是模型名
3. 确认 endpoint 在火山引擎方舟控制台已创建且可用

### Q: 本地开发数据库报错

当前 schema 为 PostgreSQL。本地开发如需 SQLite：
1. 修改 `prisma/schema.prisma` 中 `provider = "sqlite"`
2. 确保 `.env.development` 有 `DATABASE_URL="file:./dev.db"`
3. 运行 `npm run db:push`
4. **注意**：提交代码前改回 `"postgresql"`

---

## 待完成的优先 TODO（接手后可直接开始）

```
P0 - 修复 Dashboard 导航刷新问题
     → 考虑引入 SWR 或全局状态管理

P1 - 优化后的简历保存为新版本
     → ResumeOptimizeModal 增加"保存为新简历"按钮
     → POST /api/resumes 支持纯文本内容写入

P1 - resume-match 性能优化
     → 考虑 streaming 响应或并发控制

P1 - 本地开发环境完善
     → 支持 SQLite/PostgreSQL 自动切换
```

---

## 火山引擎模型信息

| 用途 | Endpoint ID | 模型名 |
|------|------------|--------|
| Vision OCR | `ep-20260408002519-qt4vq` | doubao-1-5-vision-pro-32k-250115 |
| DeepSeek LLM | `ep-m-20260322111822-htwdm` | deepseek-v3-2-251201 |

**控制台**：https://console.volcengine.com/ark
