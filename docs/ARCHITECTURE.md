# OfferFlow — 系统架构

## 目录结构

```
OfferFlow/
├── prisma/schema.prisma        # 数据模型（PostgreSQL）
├── public/
│   └── tessdata/               # OCR 语言包（本地开发用，chi_sim + eng）
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根 Layout（纯壳，无业务 UI）
│   │   ├── page.tsx            # Landing Page（/）
│   │   ├── login/page.tsx      # 登录页（/login）
│   │   ├── (app)/              # 路由组：认证后的内部页面
│   │   │   ├── layout.tsx      # 内部 Layout（Sidebar + Header + AuthGuard + key={pathname}）
│   │   │   ├── dashboard/      # 数据统计
│   │   │   ├── applications/   # 岗位投递
│   │   │   ├── resumes/        # 简历管理
│   │   │   └── interviews/     # 面试记录
│   │   └── api/                # 后端 API Routes（全部 force-dynamic）
│   │       ├── applications/   # CRUD
│   │       ├── applications/[id]/
│   │       ├── resumes/        # CRUD + Vercel Blob 上传
│   │       ├── resumes/[id]/   # 删除含 Blob 清理
│   │       ├── interviews/     # CRUD
│   │       ├── interviews/[id]/
│   │       ├── stats/          # 统计聚合
│   │       ├── ocr/            # 视觉模型 OCR + LLM 解析
│   │       ├── match/          # JD × 简历匹配
│   │       ├── resume-match/   # 批量简历排名
│   │       └── resume-optimize/# 简历优化
│   ├── components/
│   │   ├── auth/AuthGuard.tsx  # 客户端路由守卫
│   │   ├── layout/             # Sidebar + Header
│   │   ├── applications/       # Table/Kanban/MatchModal/RankModal/OptimizeModal
│   │   ├── dashboard/          # StatsCards/StatusPieChart/ChannelBarChart
│   │   └── interviews/         # InterviewForm/Timeline
│   ├── lib/
│   │   ├── prisma.ts           # Prisma 单例
│   │   ├── auth.ts             # 认证工具（localStorage token）
│   │   ├── parseResume.ts      # 统一简历解析（Blob URL + 本地文件）
│   │   └── utils.ts            # cn/formatDate/STATUS_LIST 等
│   └── types/index.ts          # 全局 TypeScript 类型
├── docs/                       # 项目文档（本文件所在目录）
├── .env.development            # dev 环境配置（提交到 Git）
├── .env.production             # prod 环境配置（提交到 Git）
├── .env.local                  # 本地密钥（不提交）
└── next.config.js              # Next.js 配置（serverComponentsExternalPackages）
```

## 四层架构

### 1. 数据层（Prisma + Neon PostgreSQL）

```prisma
Application   // 岗位投递记录
  id, company, position, channel, appliedDate, status
  jdText, jdRequire, jdDesc  // OCR 解析结果
  notes, resumeId            // 备注 + 关联简历
  interviews[]               // 一对多 → Interview

Resume        // 简历版本
  id, name, filename, filepath, filesize, mimetype
  tags (JSON string)         // 如 '["产品","AI"]'
  applications[]             // 一对多 → Application
  // filepath: Vercel Blob URL（生产）或本地路径（开发）

Interview     // 面试记录
  id, applicationId (cascade delete)
  round, scheduledAt, interviewer, location
  questions, reflection, result
```

- 生产：Neon PostgreSQL（`DATABASE_URL` 环境变量）
- 本地开发：可用 SQLite（需在 schema 中临时切换 provider）

### 2. 服务层（Next.js API Routes）

所有 API 路由均声明 `export const dynamic = 'force-dynamic'`，防止 Vercel 缓存。

#### CRUD 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/applications` | 列表（支持 status/search/page/limit 过滤） |
| POST | `/api/applications` | 新建 |
| GET/PUT/DELETE | `/api/applications/[id]` | 详情/更新/删除 |
| GET | `/api/resumes` | 简历列表（含关联投递数量） |
| POST | `/api/resumes` | 上传（multipart → Vercel Blob `put()`） |
| GET/PUT/DELETE | `/api/resumes/[id]` | 详情/更新/删除（含 Blob `del()` 清理） |
| GET/POST | `/api/interviews` | 面试列表/新建（新建时自动更新 Application 状态） |
| PUT/DELETE | `/api/interviews/[id]` | 更新/删除 |
| GET | `/api/stats` | 统计数据（并发查询，`Promise.all`） |

#### AI 接口

| 方法 | 路径 | 输入 | 输出 |
|------|------|------|------|
| POST | `/api/ocr` | FormData {image} | {rawText, company, position, requirements, description} |
| POST | `/api/match` | {jdText, resumeId\|resumeText} | {score, matchLevel, strengths, gaps, suggestions, strategy} |
| POST | `/api/resume-match` | {jdText} | {bestResumeId, bestResumeName, bestScore, ranking[]} |
| POST | `/api/resume-optimize` | {jdText, resumeId} | {optimizedResume, changes[], originalName} |

### 3. AI 层（火山引擎 Ark API）

```
API 端点：https://ark.cn-beijing.volces.com/api/v3/chat/completions
认证方式：Authorization: Bearer ${DOUBAO_API_KEY}
```

| 功能 | Endpoint ID | 模型 | Temperature |
|------|------------|------|-------------|
| OCR 图片识别 | `ep-20260408002519-qt4vq` | doubao-1-5-vision-pro-32k | 0 |
| JD 结构化解析 | `ep-m-20260322111822-htwdm` | DeepSeek-V3 | 0 |
| 匹配分析 | `ep-m-20260322111822-htwdm` | DeepSeek-V3 | 0 |
| 批量排名 | `ep-m-20260322111822-htwdm` | DeepSeek-V3 | 0 |
| 简历优化 | `ep-m-20260322111822-htwdm` | DeepSeek-V3 | 0.3 |

**统一 JSON 安全解析：**

```typescript
const raw = data.choices[0].message.content
const match = raw.match(/\{[\s\S]*\}/)
const parsed = JSON.parse(match[0])
```

### 4. 前端层（React Client Components）

- 全部使用 React hooks（useState/useCallback/useEffect），无全局状态库
- 看板拖拽：@hello-pangea/dnd，乐观更新
- 图表：Recharts（饼图 + 柱状图）
- UI 原语：Radix UI（Dialog/Dropdown/Tabs/Tooltip）
- Dashboard：`router.refresh()` + 时间戳参数防缓存

## parseResume 工具

**位置：** `src/lib/parseResume.ts`

统一简历解析入口，被 match/resume-match/resume-optimize 三个 API 共享调用。

```typescript
export async function parseResume(filepath: string, mimetype: string): Promise<string>
```

逻辑：
1. `filepath` 以 `http` 开头 → `fetch()` 从 Vercel Blob 下载
2. 否则 → 从本地 `public/` 目录读取（开发环境）
3. PDF → `unpdf` 库 `extractText()` → `result.text.join('\n')`
4. DOCX → `mammoth` 库 `extractRawText()` → `result.value`

## 文件存储

- **生产（Vercel）**：`@vercel/blob` 的 `put()` 上传，`del()` 删除
- **数据库 filepath 字段**：存储 Blob URL（如 `https://xxx.public.blob.vercel-storage.com/resumes/...`）
- **本地开发**：可通过配置 `BLOB_READ_WRITE_TOKEN` 使用 Blob，或保持本地文件系统

## 认证架构

```
访问 /dashboard（或任何 (app)/* 页面）
         ↓
(app)/layout.tsx 渲染 AuthGuard（Client Component）
         ↓
useEffect → isAuthenticated() → 读 localStorage['offerflow_token']
         ├─ 无 token → router.replace('/login')
         └─ 有 token → setVerified(true) → 渲染页面

登录流程：
/login → 输入 admin/123456 → auth.ts:login() → 写入 localStorage
→ router.replace('/dashboard')
```

## 数据流示例：OCR → 新建岗位

```
用户上传 JD 截图
→ POST /api/ocr
→ 图片转 base64
→ 豆包视觉模型识别原文（ep-20260408002519-qt4vq）
→ DeepSeek 结构化提取（ep-m-20260322111822-htwdm）
→ 返回 {rawText, company, position, requirements, description}
→ 前端 ApplicationForm 自动填充字段
→ 用户确认后 POST /api/applications 写入数据库
```

## 部署架构（Vercel）

```
用户浏览器
    ↓ HTTPS
offerflow.com.cn (Vercel CDN)
    ↓
Next.js Serverless Functions
    ├── Neon PostgreSQL (DATABASE_URL)
    ├── Vercel Blob (BLOB_READ_WRITE_TOKEN)
    └── 火山引擎 Ark API (DOUBAO_API_KEY)
```
