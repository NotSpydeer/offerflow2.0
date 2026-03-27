# OfferFlow — Prompt 资产库

所有 LLM 调用均使用：
- **模型**：`deepseek-v3-2-251201`
- **endpoint**：`https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- **通用格式**：OpenAI 兼容（`messages` 数组，`choices[0].message.content` 取值）

---

## 1. JD 结构化解析 Prompt

**位置**：`src/app/api/ocr/route.ts` → `extractJobInfoWithLLM()`

**System**：
```
你是一个专业的招聘JD解析引擎，只输出JSON，不允许输出任何解释或多余内容。
```

**User**：
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
2、不要使用 ```json 包裹
3、不要添加任何解释或前后文本
4、字段缺失返回 null
5、保持原文语义，不要编造

招聘文本：
${text.slice(0, 3000)}
```

**输出字段说明**：
| 字段 | 含义 | 映射到表单 |
|------|------|-----------|
| company | 公司名称 | ApplicationForm.company |
| position | 职位名称 | ApplicationForm.position |
| requirements | 任职要求 | ApplicationForm.jdRequire |
| description | 工作职责 | ApplicationForm.jdDesc |

---

## 2. JD × 简历匹配分析 Prompt

**位置**：`src/app/api/match/route.ts`

**System**：
```
你是一个专业的招聘匹配分析引擎，只输出JSON，不允许输出任何解释或多余内容。
```

**User**：
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

**输出字段说明**：
| 字段 | 类型 | 含义 |
|------|------|------|
| score | number | 0-100 匹配分 |
| matchLevel | string | 高匹配/中匹配/低匹配 |
| strengths | string[] | 匹配优势列表 |
| gaps | string[] | 能力缺口列表 |
| suggestions | string[] | 简历优化建议 |
| strategy | string | 投递策略文字 |

---

## 3. 简历批量排名 Prompt

**位置**：`src/app/api/resume-match/route.ts`

**System**：
```
你是一个专业的简历匹配排名引擎，只输出JSON。
```

**User**：
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
${resumeList}  // 格式：【简历N】ID: xxx\n名称: xxx\n内容:\nxxx
```

**输出字段说明**：
| 字段 | 含义 |
|------|------|
| ranking[].resumeId | 简历数据库 ID |
| ranking[].resumeName | 简历名称 |
| ranking[].score | 匹配分（0-100） |
| ranking[].reason | 推荐/不推荐的简短原因 |

---

## 4. 简历优化 Prompt

**位置**：`src/app/api/resume-optimize/route.ts`

**System**：
```
你是一个专业的简历优化引擎，只输出JSON。
```

**User**：
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

**输出字段说明**：
| 字段 | 含义 |
|------|------|
| optimizedResume | 优化后简历全文（纯文本） |
| changes | 修改点列表 |

---

## Prompt 优化建议

### 通用技巧（已采用）
- ✅ System role 强调"只输出JSON"
- ✅ User prompt 明确 JSON schema
- ✅ 输入文本截断（避免超 token）
- ✅ 用 `raw.match(/\{[\s\S]*\}/)` 兜底提取 JSON

### 待优化
- [ ] JD 解析：可加入 few-shot 示例，提高准确率
- [ ] 匹配分析：`temperature: 0` 已设置，但 score 可能不稳定，可加"评分须有依据"约束
- [ ] 简历优化：`temperature: 0.3`（稍高），目的是生成更自然的文本，但可能导致 JSON 格式不稳定
- [ ] 所有 Prompt 的文本截断（3000/4000字）是经验值，实际可根据模型 context window 调整
