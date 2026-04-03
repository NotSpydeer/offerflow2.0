# OfferFlow — Claude 接管指南

> **目标**：让任何 Claude 在 1 分钟内接手该项目，无需历史对话。

---

## 第一步：快速理解（必读顺序）

```
1. docs/PROJECT_CONTEXT.md   → 了解产品定位 + 功能全貌 + 当前问题
2. docs/ARCHITECTURE.md      → 理解代码结构 + API 设计 + 数据流
3. docs/DEV_LOG.md           → 了解开发历史 + 下一步方向
4. docs/PROMPTS.md           → 了解所有 AI Prompt（改 AI 功能时必读）
```

---

## 第二步：启动项目

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制模板后填入真实 API Key）
cp .env.example .env.local
# 编辑 .env.local，填入 DOUBAO_API_KEY

# 3. 初始化数据库
npm run db:push

# 4. 启动开发服务器
npm run dev          # localhost:3000
```

**登录账号**：`admin / 123456`（假登录，无需真实后端）

---

## 第三步：项目结构速览

```
src/app/
├── page.tsx              # Landing Page（无需登录）
├── login/page.tsx        # 登录页
├── (app)/                # 认证保护的内部页面
│   ├── layout.tsx        # ← 在这里加 Sidebar/Header/守卫
│   ├── dashboard/        # 数据统计
│   ├── applications/     # 岗位投递（核心功能）
│   ├── resumes/          # 简历管理
│   └── interviews/       # 面试记录
└── api/                  # 后端接口

src/lib/
├── auth.ts               # 登录/登出/token 工具
├── prisma.ts             # 数据库客户端
└── utils.ts              # cn / formatDate / STATUS_LIST 等
```

---

## 第四步：关键代码位置速查

| 想修改的东西 | 找这个文件 |
|------------|-----------|
| AI Prompt（JD解析） | `src/app/api/ocr/route.ts` |
| AI Prompt（匹配分析） | `src/app/api/match/route.ts` |
| AI Prompt（简历优化） | `src/app/api/resume-optimize/route.ts` |
| 登录逻辑 / 账号密码 | `src/lib/auth.ts` |
| 路由守卫 | `src/components/auth/AuthGuard.tsx` |
| 侧边栏导航 | `src/components/layout/Sidebar.tsx` |
| 全局状态枚举 | `src/lib/utils.ts`（STATUS_LIST 等） |
| 数据库 Schema | `prisma/schema.prisma` |
| 环境变量模板 | `.env.example` |

---

## 第五步：开发规范

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
git branch -d feature/你的功能名
```

### 新增 API 接口模板

```typescript
// src/app/api/xxx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'deepseek-v3-2-251201',
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

### 解析简历文件模板（待迁移到 src/lib/parseResume.ts）

```typescript
// 当前在 match/resume-match/resume-optimize 三处重复
async function parseResume(filepath: string, mimetype: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'public', filepath)
  const buffer = fs.readFileSync(fullPath)
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer)
    return data.text
  } else {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
}
```

---

## 常见问题

### Q: OCR 识别结果为空 / 出错

检查 `public/tessdata/` 目录是否存在且包含：
- `chi_sim.traineddata.gz`
- `eng.traineddata.gz`

如不存在，运行：`node scripts/download-tessdata.js`

### Q: LLM 调用失败 / 返回 401

检查 `.env.local` 中 `DOUBAO_API_KEY` 是否正确填写。
注意：`.env.local` 不在 Git 中，每个新环境需手动创建。

### Q: 数据库为空 / 报错

```bash
npm run db:push    # 重新同步 schema
npm run db:studio  # 可视化检查数据
```

### Q: 修改了 Prisma schema 后报错

```bash
npm run db:migrate  # 创建迁移文件
# 或开发时直接
npm run db:push     # 强制同步（不生成迁移）
```

---

## 待完成的优先 TODO（接手后可直接开始）

```
P0 - 提取 parseResume 到 src/lib/parseResume.ts
     → 当前在 match/resume-match/resume-optimize 三处重复

P1 - 优化后的简历保存为新版本
     → ResumeOptimizeModal 增加"保存为新简历"按钮
     → POST /api/resumes 支持纯文本内容写入

P1 - resume-match 性能优化
     → 考虑 streaming 响应或并发控制
```
