# OfferFlow — Prompt 资产库

所有 AI 调用统一使用：
- **Provider**: 火山引擎 Ark（`https://ark.cn-beijing.volces.com/api/v3/chat/completions`）
- **Model**: `deepseek-v3-2-251201`
- **Auth**: `Authorization: Bearer ${DOUBAO_API_KEY}`
- **格式**: OpenAI 兼容，取 `choices[0].message.content`

---

## 1. JD 结构化解析 Prompt

**位置**: `src/app/api/ocr/route.ts` → `extractJobInfoWithLLM()`
**Temperature**: `0`

### System Prompt
```
你是一个专业的招聘JD解析引擎，只输出JSON，不允许输出任何解释或多余内容。
```

### User Prompt
```
请从以下招聘文本中提取结构化信息。

严格按照以下JSON格式输出：

{
  "company": string | null,
  "position": string | null,
  "requirements": string | null,
  "description": string | null
}

要求：
1、必须是合法JSON
2、不要使用 `json 包裹
3、不要添加任何解释或前后文本
4、字段缺失返回 null
5、保持原文语义，不要编造

招聘文本：
${text.slice(0, 3000)}
```

### 输出字段映射

| 字段 | 映射到 | 说明 |
|------|--------|------|
| `company` | `Application.company` | 公司名称 |
| `position` | `Application.position` | 职位名称 |
| `requirements` | `Application.jdRequire` | 岗位要求 |
| `description` | `Application.jdDesc` | 岗位描述 |

### Fallback（LLM 失败时）

```typescript
// regex 提取兜底
company: text.match(/公司[：:]\s*(.+)/)?.[1]?.trim() || null
position: text.match(/职位[：:]\s*(.+)/)?.[1]?.trim() || null
```

---

## 2. JD × 简历匹配分析 Prompt

**位置**: `src/app/api/match/route.ts`
**Temperature**: `0`

### System Prompt
```
你是一个专业的招聘匹配分析引擎，只输出JSON，不允许输出任何解释或多余内容。
```

### User Prompt
```
你是一个专业的招聘匹配分析助手。

请根据以下招聘JD和候选人简历，进行匹配分析。

【输出要求】

必须返回 JSON，格式如下：

{
  "score": number（0-100的匹配分数）,
  "matchLevel": "高匹配/中匹配/低匹配",
  "strengths": string[]（匹配的优势）,
  "gaps": string[]（能力缺口）,
  "suggestions": string[]（简历优化建议）,
  "strategy": string（投递策略建议）
}

【评分标准】

- 80-100：高度匹配（建议优先投递）
- 60-79：中等匹配（建议优化后投递）
- 0-59：低匹配（谨慎投递）

【要求】

1、必须是合法JSON
2、不能有任何解释
3、不要使用 markdown
4、基于真实内容分析，不要编造

【招聘JD】
${jdText}

【候选人简历】
${resumeText.slice(0, 4000)}
```

### 调用前置步骤

1. 从数据库读取 `resumeId` 对应的 Resume 记录（filepath + mimetype）
2. 调用 `parseResume(filepath, mimetype)` 解析文件为文本
3. 将 `jdText`（来自 Application 记录）和简历文本传入 Prompt

---

## 3. 简历批量排名 Prompt

**位置**: `src/app/api/resume-match/route.ts`
**Temperature**: `0`

### System Prompt
```
你是一个专业的简历匹配排名引擎，只输出JSON。
```

### User Prompt
```
你是一个招聘匹配评估系统。

请根据以下招聘JD，对所有候选人简历进行匹配评分，并返回排名。

只返回JSON，格式如下：

{
  "ranking": [
    { "resumeId": "id字符串", "resumeName": "简历名称", "score": 数字, "reason": "简要原因（20字以内）" }
  ]
}

要求：
1、必须是合法JSON
2、不要任何解释
3、ranking 按 score 从高到低排序

【招聘JD】
${jdText.slice(0, 2000)}

【候选简历列表】
${resumeList}
```

### resumeList 格式

```
简历 1：${resume.name}
${resumeText}

---

简历 2：${resume.name}
...
```

### 返回处理

```typescript
const bestResume = ranking[0]  // ranking[0] 即最优简历
return { bestResumeId, bestResumeName, bestScore, ranking }
```

---

## 4. 简历优化 Prompt

**位置**: `src/app/api/resume-optimize/route.ts`
**Temperature**: `0.3`（唯一使用非零 temperature 的接口，为保持文本自然流畅）

### System Prompt
```
你是一个专业的简历优化引擎，只输出JSON。
```

### User Prompt
```
你是一个顶级求职顾问。

请根据招聘JD，对候选人简历进行优化。

目标：让简历更匹配JD，提高面试通过率。

要求：
1、保留真实经历，不允许编造
2、优化表达，使其更专业
3、突出与JD相关的经验
4、增加关键词匹配

只返回JSON，格式如下：

{
  "optimizedResume": "优化后的完整简历文本",
  "changes": ["修改点1", "修改点2", "修改点3"]
}

要求：
1、必须是合法JSON
2、不要任何解释

【招聘JD】
${jdText.slice(0, 2000)}

【原简历】
${resumeText.slice(0, 3000)}
```

---

## Prompt 工程说明

### 已采用的最佳实践

- ✅ System role 强调"只输出JSON"，抑制解释性文本
- ✅ User prompt 明确 JSON schema，字段含类型说明
- ✅ 输入文本截断（3000/4000/2000 字符，防止超 context）
- ✅ `temperature: 0` 保证结构化输出稳定性（优化接口除外）
- ✅ 安全 JSON 解析：`raw.match(/\{[\s\S]*\}/)` + try/catch + fallback

### 可优化方向

- [ ] JD 解析 Prompt 增加少样本示例（few-shot）提升准确率
- [ ] 匹配分析 Prompt 增加"评分必须有依据"约束
- [ ] 文本截断阈值基于实际 token 限制重新校准
- [ ] 考虑 streaming 响应（尤其 resume-match 多简历场景）
