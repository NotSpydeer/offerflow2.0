# OfferFlow — 系统架构

## 目录结构

```
OfferFlow/
├── prisma/schema.prisma        # 数据模型
├── public/
│   ├── tessdata/               # OCR 语言包（chi_sim + eng，.gz格式）
│   └── uploads/
│       ├── resumes/            # 用户上传的简历文件
│       └── jd-screenshots/     # OCR 临时图片（处理后自动删除）
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根 Layout（纯壳，无业务 UI）
│   │   ├── page.tsx            # Landing Page（/）
│   │   ├── login/page.tsx      # 登录页（/login）
│   │   ├── (app)/              # 路由组：认证后的内部页面
│   │   │   ├── layout.tsx      # 内部 Layout（Sidebar + Header + AuthGuard）
│   │   │   ├── dashboard/      # 数据统计
│   │   │   ├── applications/   # 岗位投递
│   │   │   ├── resumes/        # 简历管理
│   │   │   └── interviews/     # 面试记录
│   │   └── api/                # 后端 API Routes
│   │       ├── applications/[id]/
│   │       ├── resumes/[id]/
│   │       ├── interviews/[id]/
│   │       ├── stats/
│   │       ├── ocr/            # OCR + LLM 解析
│   │       ├── match/          # JD × 简历匹配
│   │       ├── resume-match/   # 批量简历排名
│   │       └── resume-optimize/# 简历优化
│   ├── components/
│   │   ├── auth/AuthGuard.tsx  # 客户端路由守卫
│   │   ├── layout/             # Sidebar + Header
│   │   ├── applications/       # 业务组件（Table/Kanban/Modals）
│   │   ├── dashboard/          # 图表组件
│   │   └── interviews/         # 面试时间线组件
│   ├── lib/
│   │   ├── prisma.ts           # Prisma 单例
│   │   ├── auth.ts             # 认证工具（localStorage token）
│   │   └── utils.ts            # cn/formatDate/STATUS_LIST 等
│   └── types/index.ts          # 全局 TypeScript 类型
├── .env.development            # dev 环境配置（提交到 Git）
├── .env.production             # prod 环境配置（提交到 Git）
├── .env.local                  # 本地密钥（不提交）
└── nginx.conf                  # 服务器双环境反向代理参考配置
```

## 数据模型

```prisma
Application   // 岗位投递记录
  id, company, position, channel, appliedDate, status
  jdText, jdRequire, jdDesc  // OCR 解析结果
  notes, resumeId            // 备注 + 关联简历
  interviews[]               // 一对多 → Interview

Resume        // 简历版本
  id, name, filename, filepath, filesize, mimetype
  tags (JSON string)
  applications[]             // 一对多 → Application

Interview     // 面试记录
  id, applicationId (cascade delete)
  round, scheduledAt, interviewer, location
  questions, reflection, result
```

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

## API 路由一览

### CRUD 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/applications` | 列表（支持 status/search/limit 过滤） |
| POST | `/api/applications` | 新建 |
| GET/PUT/DELETE | `/api/applications/[id]` | 详情/更新/删除 |
| GET | `/api/resumes` | 简历列表（含关联数量） |
| POST | `/api/resumes` | 上传（multipart/form-data） |
| DELETE | `/api/resumes/[id]` | 删除（含文件清理） |
| GET/POST | `/api/interviews` | 面试列表/新建 |
| PUT/DELETE | `/api/interviews/[id]` | 更新/删除 |
| GET | `/api/stats` | 统计数据 |

### AI 接口

| 方法 | 路径 | 输入 | 输出 |
|------|------|------|------|
| POST | `/api/ocr` | FormData {image} | {rawText, company, position, requirements, description} |
| POST | `/api/match` | {jdText, resumeId} | {score, matchLevel, strengths, gaps, suggestions, strategy} |
| POST | `/api/resume-match` | {jdText} | {bestResumeId, bestResumeName, bestScore, ranking[]} |
| POST | `/api/resume-optimize` | {jdText, resumeId} | {optimizedResume, changes[]} |

## LLM 调用规范

```typescript
// 所有 AI 接口统一格式
const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'deepseek-v3-2-251201',
    messages: [
      { role: 'system', content: '...' },
      { role: 'user', content: '...' },
    ],
    temperature: 0,  // resume-optimize 用 0.3
  }),
})
const data = await response.json()
const raw = data.choices[0].message.content

// 统一 JSON 安全解析
const match = raw.match(/\{[\s\S]*\}/)
const parsed = JSON.parse(match[0])
```

## parseResume 工具（⚠️ 当前重复，待提取）

当前在 `match/route.ts`、`resume-match/route.ts`、`resume-optimize/route.ts` 中各有一份相同实现：

```typescript
async function parseResume(filepath: string, mimetype: string): Promise<string>
// filepath: 相对 public/ 的路径，如 /uploads/resumes/xxx.pdf
// 支持 PDF（pdf-parse）和 DOCX（mammoth）
// 待迁移到：src/lib/parseResume.ts
```

## 前端状态管理

全部使用 React 内置 hooks（useState / useCallback / useEffect），无全局状态库。

## 数据流示例：OCR → 新建岗位

```
用户上传截图
→ POST /api/ocr（Tesseract.js 识别原文）
→ extractJobInfoWithLLM()（DeepSeek 结构化）
→ 返回 {company, position, requirements, description}
→ 前端 ApplicationForm 自动填充字段
→ 用户确认后 POST /api/applications 写入数据库
```
