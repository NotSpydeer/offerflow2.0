# OfferFlow — Prompt 资产库

## 通用调用信息

```
API 端点：https://ark.cn-beijing.volces.com/api/v3/chat/completions
认证方式：Authorization: Bearer ${DOUBAO_API_KEY}
响应格式：OpenAI 兼容，取 choices[0].message.content
JSON 安全解析：raw.match(/\{[\s\S]*\}/) + JSON.parse() + try/catch
```

---

## 0. 视觉 OCR 识别 Prompt

**位置**: `src/app/api/ocr/route.ts` → 豆包视觉模型调用
**Endpoint ID**: `ep-20260408002519-qt4vq`（doubao-1-5-vision-pro-32k-250115）
**Temperature**: `0`
**触发条件**: `DOUBAO_API_KEY` 存在时使用（生产环境）

### User Message（多模态）

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "请完整识别这张招聘截图中的所有文字内容，保持原始格式和换行。只输出识别到的文字，不要添加任何解释。"
    },
    {
      "type": "image_url",
      "image_url": { "url": "data:{mimetype};base64,{base64}" }
    }
  ]
}
```

### 本地 Fallback

无 API Key 时使用 Tesseract.js 本地 OCR（chi_sim+eng）。

---

## 1. JD 结构化解析 Prompt

**位置**: `src/app/api/ocr/route.ts` → `extractJobInfoWithLLM()`
**Endpoint ID**: `ep-m-20260322111822-htwdm`（DeepSeek-V3）
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
2、不要使用 ```json 包裹
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

使用 `extractJobInfo()` 函数进行 regex 关键词匹配：
- 公司名：匹配"公司名称/招聘方/企业名称"标签，或含"有限公司/科技/集团"等后缀
- 职位名：匹配"工程师/产品经理/设计师"等职位关键词
- 岗位要求/描述：识别段落标题后逐行采集

---

## 2. JD × 简历匹配分析 Prompt

**位置**: `src/app/api/match/route.ts`
**Endpoint ID**: `ep-m-20260322111822-htwdm`
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

1. 从数据库读取 Resume 记录（filepath + mimetype）
2. 调用 `parseResume(filepath, mimetype)` 解析文件为文本（来自 `src/lib/parseResume.ts`）
3. 将 jdText 和简历文本传入 Prompt

---

## 3. 简历批量排名 Prompt

**位置**: `src/app/api/resume-match/route.ts`
**Endpoint ID**: `ep-m-20260322111822-htwdm`
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

### resumeList 构造格式

```
【简历1】ID: ${r.id}
名称: ${r.name}
内容:
${r.text}

---

【简历2】ID: ${r.id}
...
```

每份简历文本截取前 2000 字符。

---

## 4. 简历优化 Prompt

**位置**: `src/app/api/resume-optimize/route.ts`
**Endpoint ID**: `ep-m-20260322111822-htwdm`
**Temperature**: `0.3`（唯一使用非零 temperature 的接口，保持文本自然流畅）

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

- System role 强调"只输出JSON"，抑制解释性文本
- User prompt 明确 JSON schema，字段含类型说明
- 输入文本截断（2000/3000/4000 字符，防止超 context）
- `temperature: 0` 保证结构化输出稳定性（优化接口除外用 0.3）
- 安全 JSON 解析：`raw.match(/\{[\s\S]*\}/)` + try/catch + fallback
- Vision OCR 用多模态消息格式（text + image_url）

### 可优化方向

- [ ] JD 解析增加 few-shot 示例提升准确率
- [ ] 匹配分析增加"评分必须有依据"约束
- [ ] 文本截断阈值基于实际 token 限制重新校准
- [ ] resume-match 考虑 streaming 响应
- [ ] 优化 Prompt 增加"输出格式化简历"而非纯文本
