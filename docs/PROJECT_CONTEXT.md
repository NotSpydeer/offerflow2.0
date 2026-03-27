# OfferFlow — 项目总览

## 项目目标

OfferFlow 是一个**求职简历投递管理系统**，面向个人求职者，帮助其：

- 统一管理所有岗位投递记录
- 通过 OCR 识别招聘截图，自动结构化 JD 内容
- 利用 LLM 进行 JD × 简历匹配分析
- 自动推荐最优简历、生成定制化优化简历
- 记录面试过程与复盘

---

## 核心功能列表

| 功能 | 状态 | 入口 |
|------|------|------|
| 岗位管理（增删改查） | ✅ 完成 | `/applications` |
| 看板视图（拖拽状态） | ✅ 完成 | `/applications` → 看板 |
| OCR 识别 JD 截图 | ✅ 完成 | 新增岗位弹窗 → 上传截图 |
| JD 结构化解析（LLM） | ✅ 完成 | OCR 后自动调用 |
| 简历管理（多版本） | ✅ 完成 | `/resumes` |
| JD × 简历匹配分析 | ✅ 完成 | 岗位展开行 → AI 匹配分析 |
| 自动选最优简历 | ✅ 完成 | 岗位展开行 → 自动选最优简历 |
| 自动优化简历 | ✅ 完成 | 岗位展开行 → 优化简历 |
| 面试记录与复盘 | ✅ 已有页面 | `/interviews` |
| 数据统计 Dashboard | ✅ 已有 | `/dashboard` |

---

## 技术架构

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 14（App Router）+ React 18 + TypeScript |
| 样式 | TailwindCSS |
| 数据库 | SQLite（via Prisma ORM） |
| OCR | Tesseract.js（本地，支持中英文） |
| LLM | DeepSeek-V3（via 火山引擎 Ark API） |
| 简历解析 | pdf-parse（PDF）、mammoth（DOCX） |
| 图表 | Recharts |
| 拖拽 | @hello-pangea/dnd |

---

## 环境变量

```env
DATABASE_URL=file:./dev.db
DOUBAO_API_KEY=<火山引擎 Ark API Key>
```

> `DOUBAO_API_KEY` 用于所有 LLM 调用，模型固定为 `deepseek-v3-2-251201`，
> endpoint: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`

---

## 核心流程

### 1. OCR → JD 结构化

```
用户上传截图
  → POST /api/ocr
  → Tesseract.js OCR 识别 → rawText
  → extractJobInfoWithLLM(rawText)
      → 调用 DeepSeek，返回 { company, position, requirements, description }
      → 失败则 fallback 到正则提取
  → ApplicationForm 自动填充表单字段
```

### 2. JD × 简历匹配分析

```
用户点击「AI 匹配分析」
  → MatchModal：选择简历
  → POST /api/match { jdText, resumeId }
  → parseResume(filepath, mimetype) → resumeText
  → DeepSeek 分析 → { score, matchLevel, strengths, gaps, suggestions, strategy }
  → 展示评分卡 + 详细分析
```

### 3. 自动选最优简历

```
用户点击「自动选最优简历」
  → ResumeRankModal 自动发起请求
  → POST /api/resume-match { jdText }
  → prisma.resume.findMany() → 逐个 parseResume
  → 单次 DeepSeek 调用，批量评分 → ranking[]
  → 展示推荐简历 + 排名列表
```

### 4. 自动优化简历

```
用户点击「优化简历」→ 选择简历
  → POST /api/resume-optimize { jdText, resumeId }
  → parseResume → resumeText
  → DeepSeek 优化 → { optimizedResume, changes }
  → 展示修改点 + 全文（可复制）
```

---

## 当前完成情况

**前端：**
- `/applications` 页面：列表视图 + 看板视图，支持搜索/筛选/排序
- 展开行：JD 内容预览 + 三个 AI 功能按钮
- `/resumes` 页面：简历上传管理
- `/interviews` 页面：面试记录时间线
- `/dashboard` 页面：统计图表

**后端 API：**
- `GET/POST /api/applications`
- `GET/PUT/DELETE /api/applications/[id]`
- `GET/POST /api/resumes`
- `DELETE /api/resumes/[id]`
- `GET/POST /api/interviews`
- `PUT/DELETE /api/interviews/[id]`
- `POST /api/ocr`
- `POST /api/match`
- `POST /api/resume-match`
- `POST /api/resume-optimize`
- `GET /api/stats`

---

## 当前已知问题 / 待优化

1. **parseResume 重复定义**：`match/route.ts`、`resume-match/route.ts`、`resume-optimize/route.ts` 中各有一份，应提取为 `src/lib/parseResume.ts`
2. **Tesseract 语言包**：需要本地 `public/tessdata/` 目录存放 `chi_sim.traineddata.gz` 和 `eng.traineddata.gz`，否则 OCR 失败
3. **resume-match 性能**：简历多时逐个解析 + 单次大 prompt 可能超时
4. **优化简历无持久化**：优化结果只能复制，无法保存为新简历版本
5. **面试记录功能**：页面已有，功能完整性待验证
