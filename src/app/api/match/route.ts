// API: POST /api/match - JD 与简历匹配分析
// 支持 resumeId（从简历库读取）或 resumeText（直接传入文本）

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseResume } from '@/lib/parseResume' // ✅ 修改：从共享 lib 导入

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jdText, resumeId, resumeText: resumeTextDirect } = body

    if (!jdText) {
      return NextResponse.json({ error: '请提供 JD 内容' }, { status: 400 })
    }
    if (!resumeId && !resumeTextDirect) {
      return NextResponse.json({ error: '请提供简历（resumeId 或 resumeText）' }, { status: 400 })
    }

    // 从数据库读取简历并解析文件内容
    let resumeText = resumeTextDirect as string | undefined

    if (resumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
      if (!resume) {
        return NextResponse.json({ error: '简历不存在' }, { status: 404 })
      }

      try {
        resumeText = await parseResume(resume.filepath, resume.mimetype)
      } catch (e) {
        console.error('简历解析失败:', e)
        return NextResponse.json({ error: '简历文件解析失败，请确认文件格式为 PDF 或 DOCX' }, { status: 500 })
      }
    }

    if (!resumeText?.trim()) {
      return NextResponse.json({ error: '简历内容为空，无法分析' }, { status: 400 })
    }

    const apiKey = process.env.DOUBAO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 LLM API Key' }, { status: 500 })
    }

    const prompt = `
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
`

    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'ep-m-20260322111822-htwdm',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的招聘匹配分析引擎，只输出JSON，不允许输出任何解释或多余内容。',
          },
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

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({ error: 'LLM 返回格式异常' }, { status: 500 })
    }

    const parsed = JSON.parse(match[0])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('POST /api/match error:', error)
    return NextResponse.json({ error: '匹配分析失败，请重试' }, { status: 500 })
  }
}
