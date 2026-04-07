# OfferFlow — 开发记录

## Phase 1：基础框架

- Next.js 14 App Router 项目初始化
- Prisma + SQLite 数据库配置
- 三张核心表：Application / Resume / Interview
- 基础 CRUD API

## Phase 2：岗位管理页面

- 列表视图（排序/搜索/状态筛选）
- 看板视图（@hello-pangea/dnd 拖拽）
- 新建/编辑 Modal（Tab 布局：基本信息/JD内容/备注）
- 状态乐观更新

## Phase 3：OCR 功能

- Tesseract.js 本地 OCR（中英文）
- 语言包本地化（解决国内 CDN 问题）
- Regex fallback 提取（公司名/职位/要求/描述）

## Phase 4：LLM 结构化解析

- 接入火山引擎 Ark / DeepSeek-V3
- OCR → LLM 提取结构化字段
- 安全 JSON 解析（regex 提取 `{...}` 块 + try/catch + fallback）

## Phase 5：简历匹配

- `/api/match`：JD + 简历 → 匹配分析（分数/等级/优势/差距/建议/策略）
- MatchModal：下拉选简历 → 自动解析 → LLM 分析 → 评分卡展示
- pdf-parse + mammoth 集成

## Phase 6：AI 扩展功能

- `/api/resume-match`：批量评分所有简历，返回排名
- `/api/resume-optimize`：基于 JD 重写简历
- ResumeRankModal / ResumeOptimizeModal

## Phase 7：登录系统 + Landing Page

- `src/lib/auth.ts`：localStorage token 假登录（admin/123456）
- `src/components/auth/AuthGuard.tsx`：客户端路由守卫
- Next.js Route Groups：`src/app/(app)/` 承载所有内部页面
- `/` Landing Page：Hero + 功能卡片 + How it Works + CTA

## Phase 8：Git 分支体系 + 双环境

- Git 仓库初始化，main 作为稳定分支
- `.env.development` / `.env.production` 双环境配置
- GitHub 仓库：NotSpydeer/offerflow

## Phase 9：Vercel 部署

- SQLite → PostgreSQL（Neon）：修改 `prisma/schema.prisma` provider
- 本地文件 → Vercel Blob：`put()` 上传，`del()` 删除
- 提取 `parseResume` 到 `src/lib/parseResume.ts`，消除三处重复
- pdf-parse → unpdf：解决 Vercel serverless 上 DOMMatrix 不存在的问题
- 安装 `@vercel/blob` 依赖
- `next.config.js` 添加 unpdf、mammoth 到 serverComponentsExternalPackages
- GitHub 部署仓库：NotSpydeer/offerflow2.0（vercel remote）
- Neon 数据库手动建表（SQL Editor）
- Vercel Blob Store 创建（public access）
- 自定义域名 offerflow.com.cn（阿里云 DNS CNAME/A 记录）

## Phase 10：部署问题修复

- OCR：Tesseract.js 在 Vercel 上写文件失败 + 超时 → 改为豆包视觉模型（`doubao-1-5-vision-pro-32k-250115`）
- 模型调用：model 字段从模型名改为 endpoint ID（`ep-m-20260322111822-htwdm` / `ep-20260408002519-qt4vq`）
- API Key 格式：Vercel 环境变量有多余空格导致鉴权失败，修正后恢复
- API 缓存：所有 GET 路由加 `export const dynamic = 'force-dynamic'`
- Dashboard 缓存：`router.refresh()` + `?_t=${Date.now()}` 时间戳 + `key={pathname}` 强制重新挂载
- Vercel Build Cache：pdf-parse 降级后 Vercel 仍用缓存的 v2，需取消勾选 "Use existing Build Cache"

---

## 当前已知问题

### P0（影响功能）

- [ ] Dashboard 从其他页面切回时偶发显示旧数据（Next.js 路由缓存）

### P1（体验问题）

- [ ] `resume-match` 性能慢：顺序解析多份简历 + 大 prompt，有超时风险
- [ ] 优化后的简历只能复制，无法保存为新简历版本
- [ ] 本地开发环境不完整（schema 已改 PostgreSQL，本地 SQLite 需临时切换）
- [ ] `@types/node` 本地安装异常，IDE 有类型报错（不影响 Vercel 构建）

### P2（功能缺失）

- [ ] 无真实用户认证（仅 demo 登录）
- [ ] 无简历版本对比功能（Diff view）
- [ ] 无数据导出（CSV/Excel）
- [ ] 面试记录页功能完整性未充分验证

---

## 下一步优化建议

### 短期（1-2 次迭代）

1. **修复 Dashboard 刷新问题** → 考虑全局状态管理或 SWR
2. **优化简历保存** → 将优化结果写入数据库新简历记录
3. **本地开发环境** → 支持 SQLite/PostgreSQL 自动切换（env 判断）

### 中期

4. **resume-match 性能优化** → streaming 响应或限制并发数
5. **Dashboard 增强** → 投递趋势折线图、面试通过率漏斗图
6. **岗位详情页** → 独立详情页展示完整 JD + 面试记录

### 长期

7. **真实认证系统** → NextAuth.js 或类似方案
8. **简历版本对比** → Diff 视图
9. **数据导出** → CSV / Excel
10. **多用户支持** → 数据隔离
