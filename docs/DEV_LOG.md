# OfferFlow — 开发记录

## 已实现功能（按时间顺序）

### Phase 1：基础框架
- Next.js 14 App Router 项目搭建
- Prisma + SQLite 数据库配置
- 三张核心表：Application、Resume、Interview
- 基础 CRUD API

### Phase 2：岗位管理页面
- 列表视图（支持排序、搜索、状态筛选）
- 看板视图（@hello-pangea/dnd 拖拽）
- 新增/编辑弹窗（Tab 布局：基本信息 / JD内容 / 备注）
- 状态乐观更新

### Phase 3：OCR 功能
- Tesseract.js 本地 OCR（中英文）
- 语言包本地化（解决国内 CDN 问题）
- 正则 fallback 提取：公司名、职位名、岗位要求、岗位描述

### Phase 4：LLM 结构化解析
- 接入火山引擎 Ark / DeepSeek-V3
- OCR → LLM 提取结构化字段（company/position/requirements/description）
- 调试日志增强（状态码、原始返回、JSON解析过程）
- JSON 安全解析（正则提取 `{...}` 块）

### Phase 5：简历匹配功能
- `/api/match`：JD + 简历 → 匹配分析（score/matchLevel/strengths/gaps/suggestions/strategy）
- MatchModal：下拉选择简历库 → 自动解析 PDF/DOCX → LLM 分析 → 评分卡展示
- pdf-parse + mammoth 集成

### Phase 6：AI 扩展功能
- `/api/resume-match`：批量评分所有简历，单次 LLM 调用返回排名
- `/api/resume-optimize`：基于 JD 重写优化简历文本
- ResumeRankModal：打开即自动分析，展示推荐简历+分数+排名
- ResumeOptimizeModal：选简历 → 优化 → 修改点 + 全文（可复制）
- ApplicationTable 展开行：三个 AI 功能按钮（匹配分析/最优简历/优化简历）

---

## 当前存在的问题

### P0（影响功能）
- [ ] `parseResume` 函数在 3 个 route 文件中重复，应提取为 `src/lib/parseResume.ts`
- [ ] OCR 需要 `public/tessdata/` 目录存在语言包文件，部署时需手动准备

### P1（体验问题）
- [ ] `resume-match` 简历多时请求慢（逐个解析 + 大 prompt）
- [ ] 优化后的简历无法保存为新版本（只能复制）
- [ ] 匹配/优化失败时错误提示不够友好

### P2（功能缺失）
- [ ] 面试记录页面功能完整性未验证
- [ ] Dashboard 图表数据是否实时（vs 缓存）未确认
- [ ] 无搜索面试记录功能

---

## 下一步建议优化方向

### 短期（1-2次迭代）
1. **提取共享 `parseResume`** → `src/lib/parseResume.ts`，消除重复代码
2. **优化简历保存**：将优化结果另存为新简历版本（写入 DB，filepath 存 null 或另存文本文件）
3. **面试记录功能验证**：测试新增/编辑/删除面试，确保复盘 Markdown 渲染正常

### 中期
4. **批量匹配优化**：`resume-match` 改为流式响应，或限制并发数
5. **Dashboard 增强**：增加投递趋势折线图、面试通过率漏斗图
6. **岗位详情页**：点击岗位进入独立详情页，展示完整 JD + 所有面试记录

### 长期
7. **简历版本对比**：对比两个版本的差异（Diff 视图）
8. **导出功能**：导出投递记录为 CSV / Excel
9. **多用户支持**：现为单用户本地系统，如需多人使用需加认证层
