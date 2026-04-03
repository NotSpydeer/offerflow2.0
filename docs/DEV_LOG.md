# OfferFlow — 开发记录

## Phase 1：基础框架（已完成）

- Next.js 14 App Router 项目初始化
- Prisma + SQLite 数据库配置
- 三张核心表：Application / Resume / Interview
- 基础 CRUD API

## Phase 2：岗位管理页面（已完成）

- 列表视图（排序/搜索/状态筛选）
- 看板视图（@hello-pangea/dnd 拖拽）
- 新建/编辑 Modal（Tab 布局：基本信息/JD内容/备注）
- 状态乐观更新

## Phase 3：OCR 功能（已完成）

- Tesseract.js 本地 OCR（中英文）
- 语言包本地化（解决国内 CDN 问题）
- Regex fallback 提取（公司名/职位/要求/描述）

## Phase 4：LLM 结构化解析（已完成）

- 接入火山引擎 Ark / DeepSeek-V3
- OCR → LLM 提取结构化字段
- 增强 debug 日志（状态码/原始返回/JSON 解析过程）
- 安全 JSON 解析（regex 提取 `{...}` 块）

## Phase 5：简历匹配（已完成）

- `/api/match`：JD + 简历 → 匹配分析（分数/等级/优势/差距/建议/策略）
- MatchModal：下拉选简历 → 自动解析 → LLM 分析 → 评分卡展示
- pdf-parse + mammoth 集成

## Phase 6：AI 扩展功能（已完成）

- `/api/resume-match`：批量评分所有简历，返回排名
- `/api/resume-optimize`：基于 JD 重写简历
- ResumeRankModal：自动分析，展示推荐简历
- ResumeOptimizeModal：选简历 → 优化 → 变更点 + 全文

## Phase 7：登录系统 + Landing Page（已完成）

- `src/lib/auth.ts`：localStorage token 假登录（admin/123456）
- `src/components/auth/AuthGuard.tsx`：客户端路由守卫
- Next.js Route Groups：`src/app/(app)/` 承载所有内部页面
- 根 `layout.tsx` 剥为纯壳，`(app)/layout.tsx` 含 Sidebar + Header + AuthGuard
- `/login` 页面：居中卡片，loading 状态，错误提示
- `/` Landing Page：Hero + 功能卡片 + How it Works + CTA Banner + Footer

## Phase 8：Git 分支体系 + 双环境（已完成）

- Git 仓库初始化，main 作为稳定分支
- `feature/login-landing` 分支开发，合并到 main
- `.env.development` / `.env.production` 双环境配置
- `npm run dev:beta`（:3001）/ `npm run start:prod`（:3000）
- `.gitignore` 排除 `.env` / `.env.*.local` / `*.traineddata`
- `nginx.conf` 双域名反向代理参考配置

---

## 当前已知问题

### P0（影响功能）

- [ ] `parseResume` 在 `match/route.ts`、`resume-match/route.ts`、`resume-optimize/route.ts` 各有一份重复 → 应提取到 `src/lib/parseResume.ts`
- [ ] OCR 语言包需手动准备：`public/tessdata/chi_sim.traineddata.gz` 和 `eng.traineddata.gz`（已在 `.gitignore` 排除，新环境需手动下载）

### P1（体验问题）

- [ ] `resume-match` 性能慢：顺序解析多份简历 + 大 prompt，有超时风险
- [ ] 优化后的简历只能复制，无法保存为新简历版本
- [ ] AI 接口失败时错误提示不够友好
- [ ] `OPENAI_API_KEY` 存在于 `.env.local` 模板但代码中未使用（只用 `DOUBAO_API_KEY`）

### P2（功能缺失）

- [ ] 面试记录页功能完整性未完整验证
- [ ] Dashboard 数据为实时查询，无缓存（大数据量时可能慢）
- [ ] 无简历版本对比功能（Diff view）

---

## 下一步优化建议

### 短期（1-2 次迭代）

1. **提取 `parseResume`** → `src/lib/parseResume.ts`，消除三处重复
2. **优化简历保存** → 将优化结果写入数据库新简历记录（filepath 为 null，content 为文本）
3. **完善错误处理** → AI 接口失败统一返回友好提示 + 重试按钮

### 中期

4. **`resume-match` 性能优化** → 改为 streaming 响应或限制并发
5. **Dashboard 增强** → 添加投递趋势折线图、面试通过率漏斗图
6. **岗位详情页** → 独立详情页展示完整 JD + 所有面试记录

### 长期

7. **简历版本对比** → Diff 视图，比较两版简历差异
8. **数据导出** → 投递记录导出 CSV / Excel
9. **Tesseract 优化** → 探索 OCR 准确率提升方案或替换为云端 OCR
