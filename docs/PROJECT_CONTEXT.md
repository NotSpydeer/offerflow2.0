# OfferFlow — 项目总览

## 产品定位

**OfferFlow** 是一个"AI驱动的求职决策引擎"。

不只是投递记录工具 — 核心价值是帮用户回答：
> "这个岗位值得投吗？投哪份简历？怎么优化胜算？"

## 核心用户价值

- 📋 **投递全程记录**：岗位、状态、渠道、面试轮次一体管理
- 🔍 **JD 智能解析**：截图 OCR → LLM 提取结构化信息（公司/职位/要求/描述）
- 🧠 **语义匹配分析**：JD × 简历 → 匹配评分 + 能力差距 + 投递策略
- 📊 **最优简历推荐**：多版本简历批量评分，自动选最佳
- ✍️ **简历一键优化**：基于 JD 重写简历，对齐关键词
- 🗓 **面试复盘**：记录题目、结果、反思，形成成长档案
- 📈 **求职漏斗统计**：回复率、面试率、Offer 率数据可视化

## 当前完成情况（2026-04）

### ✅ 已实现

| 功能模块 | 路由/页面 | 备注 |
|----------|-----------|------|
| Landing Page | `/` | 产品展示首页，无需登录 |
| 假登录系统 | `/login` | admin/123456，localStorage token |
| 路由守卫 | 全局 `(app)/layout.tsx` | 未登录自动跳 /login |
| 岗位投递管理 | `/applications` | 列表+看板双视图，CRUD，状态流转 |
| OCR+JD解析 | `POST /api/ocr` | Tesseract.js + DeepSeek 结构化提取 |
| 简历管理 | `/resumes` | PDF/DOCX 上传，多版本，标签系统 |
| JD×简历匹配 | `POST /api/match` | 评分+优势+差距+建议 |
| 最优简历推荐 | `POST /api/resume-match` | 批量评分，返回排名 |
| 简历优化 | `POST /api/resume-optimize` | 基于 JD 重写简历文本 |
| 面试记录 | `/interviews` | 按岗位分组，时间线展示 |
| 数据 Dashboard | `/dashboard` | 状态/渠道分布图，最近投递列表 |
| Git 分支体系 | main / feature/* | 双环境 dev/prod 配置 |

### ⚠️ 已知问题

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | `parseResume` 在 3 个 API 文件重复 | 维护负担，改动需同步 3 处 |
| P0 | OCR 语言包需手动部署 | 新环境部署失败 |
| P1 | `resume-match` 性能慢 | 多简历时响应超时风险 |
| P1 | 优化后简历无法保存 | 用户体验缺口 |
| P2 | `OPENAI_API_KEY` 存在但未被代码使用 | 环境变量混乱 |

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 14.2.5 (App Router) + React 18 + TypeScript |
| 样式 | Tailwind CSS + tailwind-merge + Radix UI |
| 数据库 | SQLite via Prisma ORM 5.x |
| OCR | Tesseract.js v5（本地，中英文） |
| AI/LLM | 火山引擎 Ark API / DeepSeek-V3（deepseek-v3-2-251201） |
| 文档解析 | pdf-parse（PDF）+ mammoth（DOCX） |
| 图表 | Recharts |
| 拖拽 | @hello-pangea/dnd |
| 图标 | lucide-react |
| 认证 | 假登录（localStorage token，无真实后端） |

## 环境变量

```env
# .env.development（提交到 Git）
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_ENV="development"

# .env.production（提交到 Git）
DATABASE_URL="file:./prod.db"
NEXT_PUBLIC_ENV="production"

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
