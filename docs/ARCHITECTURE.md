# OfferFlow — 系统架构

## 目录结构

```
OfferFlow/
├── prisma/
│   └── schema.prisma          # 数据模型定义
├── public/
│   ├── tessdata/              # Tesseract OCR 语言包（chi_sim + eng）
│   └── uploads/
│       ├── resumes/           # 上传的简历文件（PDF/DOCX）
│       └── jd-screenshots/    # OCR 临时图片（处理后自动删除）
├── src/
│   ├── app/
│   │   ├── api/               # 后端 API Routes
│   │   ├── applications/      # 岗位管理页面
│   │   ├── resumes/           # 简历管理页面
│   │   ├── interviews/        # 面试记录页面
│   │   ├── dashboard/         # 数据统计页面
│   │   ├── layout.tsx         # 全局布局
│   │   └── page.tsx           # 首页（redirect）
│   ├── components/
│   │   ├── applications/      # 岗位相关组件
│   │   ├── dashboard/         # 图表组件
│   │   ├── interviews/        # 面试组件
│   │   └── layout/            # 导航/侧边栏
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端单例
│   │   └── utils.ts           # 工具函数（cn, formatDate, STATUS_LIST 等）
│   └── types/
│       └── index.ts           # 全局 TypeScript 类型定义
├── .env                       # DATABASE_URL
├── .env.local                 # DOUBAO_API_KEY（不提交 Git）
└── docs/                      # 项目文档（本目录）
```

---

## 数据层（Prisma + SQLite）

### 数据模型

```
Application（岗位投递）
  ├── id, company, position, channel, appliedDate, status
  ├── jdText, jdRequire, jdDesc          ← OCR/LLM 填充
  ├── notes
  ├── resumeId → Resume（可选关联）
  └── interviews[] → Interview（一对多）

Resume（简历版本）
  ├── id, name, filename, filepath, filesize, mimetype
  ├── tags（JSON 字符串）
  └── applications[] → Application

Interview（面试记录）
  ├── id, applicationId → Application
  ├── round, scheduledAt, interviewer, location
  └── questions, reflection, result
```

### 关键约束
- Application 删除时：Interview 级联删除（`onDelete: Cascade`）
- Resume 删除时：Application.resumeId 置 null（`onDelete: SetNull`）

---

## 服务层（API Routes）

### 岗位管理
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/applications` | 列表（支持 status/search/limit 参数） |
| POST | `/api/applications` | 新建岗位 |
| GET | `/api/applications/[id]` | 单条详情 |
| PUT | `/api/applications/[id]` | 更新（含状态变更） |
| DELETE | `/api/applications/[id]` | 删除 |

### 简历管理
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/resumes` | 简历列表 |
| POST | `/api/resumes` | 上传简历（multipart/form-data） |
| DELETE | `/api/resumes/[id]` | 删除简历（含文件） |

### 面试记录
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/interviews` | 列表（支持 applicationId 筛选） |
| POST | `/api/interviews` | 新建面试记录 |
| PUT | `/api/interviews/[id]` | 更新 |
| DELETE | `/api/interviews/[id]` | 删除 |

### AI 功能
| 方法 | 路径 | 输入 | 输出 |
|------|------|------|------|
| POST | `/api/ocr` | `FormData { image }` | `{ rawText, company, position, requirements, description }` |
| POST | `/api/match` | `{ jdText, resumeId }` | `{ score, matchLevel, strengths, gaps, suggestions, strategy }` |
| POST | `/api/resume-match` | `{ jdText }` | `{ bestResumeId, bestResumeName, bestScore, ranking[] }` |
| POST | `/api/resume-optimize` | `{ jdText, resumeId }` | `{ optimizedResume, changes[], originalName }` |

### 统计
| 方法 | 路径 | 输出 |
|------|------|------|
| GET | `/api/stats` | `{ total, replied, replyRate, interviewing, offerCount, statusDistribution[], channelDistribution[], recentApplications[] }` |

---

## AI 层

### LLM 配置
- **Provider**：火山引擎 Ark（`https://ark.cn-beijing.volces.com/api/v3/chat/completions`）
- **模型**：`deepseek-v3-2-251201`
- **认证**：`Authorization: Bearer ${DOUBAO_API_KEY}`
- **响应格式**：OpenAI 兼容格式，取值路径 `data.choices[0].message.content`

### JSON 安全解析（所有 AI 接口统一用法）
```ts
const match = raw.match(/\{[\s\S]*\}/)
if (!match) return fallback
const parsed = JSON.parse(match[0])
```

### OCR 配置
- **库**：Tesseract.js v5
- **语言**：`chi_sim+eng`
- **语言包路径**：`public/tessdata/`（本地，避免 CDN 问题）
- **fallback**：LLM 解析失败时使用正则提取

### parseResume 工具函数
> ⚠️ 当前在三个 route 文件中各有一份，应重构为 `src/lib/parseResume.ts`

```ts
async function parseResume(filepath: string, mimetype: string): Promise<string>
// filepath: 相对 public/ 的路径，如 /uploads/resumes/xxx.pdf
// 支持: application/pdf → pdf-parse
//       application/vnd...docx / application/msword → mammoth
```

---

## 前端层

### 组件结构

```
src/components/applications/
  ├── ApplicationTable.tsx    # 列表视图（可展开行 + 3个AI按钮）
  ├── KanbanBoard.tsx         # 看板视图（拖拽）
  ├── ApplicationForm.tsx     # 新增/编辑弹窗（含 OCR 上传）
  ├── MatchModal.tsx          # AI 匹配分析弹窗
  ├── ResumeRankModal.tsx     # 自动选最优简历弹窗
  ├── ResumeOptimizeModal.tsx # 简历优化弹窗
  └── StatusBadge.tsx         # 状态标签
```

### 状态管理
- 全部使用 React `useState` / `useCallback` / `useEffect`，无全局状态库
- 岗位列表数据在 `ApplicationsPage` 维护，通过 props 传递给子组件
- Modal 的 open/close 状态由 `ApplicationTable` 内部维护

### 关键工具（src/lib/utils.ts）
- `STATUS_LIST`：岗位状态枚举
- `CHANNEL_LIST`：投递渠道枚举
- `cn()`：Tailwind 类名合并
- `formatDate()`：日期格式化

---

## 数据流示意

```
用户操作
  │
  ├── 新增岗位（含OCR）
  │     ApplicationForm → POST /api/ocr → POST /api/applications
  │
  ├── 匹配分析
  │     ApplicationTable(展开) → MatchModal → POST /api/match
  │                                         → prisma + parseResume + DeepSeek
  │
  ├── 自动选简历
  │     ResumeRankModal(自动) → POST /api/resume-match
  │                           → prisma.findMany + parseResume × N + DeepSeek
  │
  └── 优化简历
        ResumeOptimizeModal → POST /api/resume-optimize
                            → prisma.findUnique + parseResume + DeepSeek
```
