# OfferFlow — Claude 接手指南

## 第一步：快速了解项目（2分钟）

按顺序阅读：

```
1. docs/PROJECT_CONTEXT.md   ← 项目是什么、功能列表、已知问题
2. docs/ARCHITECTURE.md      ← 数据模型、API 列表、组件结构
3. prisma/schema.prisma      ← 数据库三张表的字段定义
4. .env.local                ← 确认 DOUBAO_API_KEY 是否配置
```

---

## 第二步：了解当前状态

```
docs/DEV_LOG.md              ← 已做了什么、还有什么问题、下一步方向
```

---

## 第三步：熟悉关键代码

| 场景 | 文件 |
|------|------|
| OCR + JD 解析 | `src/app/api/ocr/route.ts` |
| 简历匹配分析 | `src/app/api/match/route.ts` |
| 自动选简历 | `src/app/api/resume-match/route.ts` |
| 简历优化 | `src/app/api/resume-optimize/route.ts` |
| 岗位列表页 | `src/app/applications/page.tsx` |
| 展开行+AI按钮 | `src/components/applications/ApplicationTable.tsx` |
| 类型定义 | `src/types/index.ts` |
| 工具函数 | `src/lib/utils.ts` |

---

## 开发规范（必须遵守）

```
1. 所有修改必须基于"已有代码"，不要假设代码内容
2. 优先最小修改（不要重构整个项目）
3. 每次只解决一个问题
4. 不破坏现有功能
5. 如果信息不足，先读取文件，不要猜
```

---

## 环境变量

```env
# .env
DATABASE_URL=file:./dev.db

# .env.local（不提交 Git）
DOUBAO_API_KEY=<火山引擎 Ark API Key>
```

---

## 启动项目

```bash
npm run dev        # 启动开发服务器 → http://localhost:3000
npm run db:push    # 同步数据库 schema（首次或 schema 变更后）
npm run db:studio  # 打开 Prisma Studio 查看数据
```

---

## LLM 调用模板

所有 AI 接口统一用此模式（在 `src/app/api/` 下的 route 文件中）：

```ts
const apiKey = process.env.DOUBAO_API_KEY
if (!apiKey) return NextResponse.json({ error: '未配置 LLM API Key' }, { status: 500 })

const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'deepseek-v3-2-251201',
    temperature: 0,
    messages: [
      { role: 'system', content: '只输出JSON，不允许输出任何解释。' },
      { role: 'user', content: prompt },
    ],
  }),
})

if (!res.ok) {
  const errText = await res.text()
  console.error('DeepSeek报错:', errText)
  return NextResponse.json({ error: 'LLM 调用失败' }, { status: 500 })
}

const data = await res.json()
const raw = data.choices?.[0]?.message?.content ?? ''

// JSON 安全提取（统一方式）
const match = raw.match(/\{[\s\S]*\}/)
if (!match) return NextResponse.json({ error: 'LLM 返回格式异常' }, { status: 500 })
const parsed = JSON.parse(match[0])
```

---

## 简历文件解析模板

> ⚠️ `parseResume` 目前在多个 route 中重复定义，应提取为 `src/lib/parseResume.ts`

```ts
async function parseResume(filepath: string, mimetype: string): Promise<string> {
  // filepath 是相对 public/ 的路径，如 /uploads/resumes/xxx.pdf
  const absPath = path.join(process.cwd(), 'public', filepath)
  const buffer = await readFile(absPath)

  if (mimetype === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default
    return (await pdfParse(buffer)).text
  }

  if (mimetype.includes('wordprocessingml') || mimetype === 'application/msword') {
    const mammoth = await import('mammoth')
    return (await mammoth.extractRawText({ buffer })).value
  }

  throw new Error(`不支持的格式：${mimetype}`)
}
```

---

## 常见问题排查

| 问题 | 原因 | 解决 |
|------|------|------|
| OCR 失败 | 缺少语言包 | 确认 `public/tessdata/` 有 `chi_sim.traineddata.gz` 和 `eng.traineddata.gz` |
| LLM 返回空 | API Key 未配置 | 检查 `.env.local` 中 `DOUBAO_API_KEY` |
| 简历解析失败 | 文件格式不支持 | 只支持 PDF 和 DOCX |
| 数据库报错 | schema 未同步 | 运行 `npm run db:push` |

---

## 当前最高优先级待办

1. 提取 `parseResume` 为共享 lib（`src/lib/parseResume.ts`）
2. 验证面试记录功能完整性
3. 优化简历保存为新版本功能
