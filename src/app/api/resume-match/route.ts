// API: POST /api/resume-match - 从简历库自动选出最匹配 JD 的简历

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseResume } from '@/lib/parseResume' // ✅ 修改：从共享 lib 导入

export async function POST(request: NextRequest) {
  try {
    const { jdText } = await request.json()

    if (!jdText?.trim()) {
      return NextResponse.json({ error: '请提供 JD 内容' }, { status: 400 })
    }

    const apiKey = process.env.DOUBAO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 LLM API Key' }, { status: 500 })
    }

    // 读取所有简历
    const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' } })
    if (resumes.length === 0) {
      return NextResponse.json({ error: '简历库为空，请先上传简历' }, { status: 400 })
    }

    // 解析每份简历的文本
    const parsedResumes: { id: string; name: string; text: string }[] = []
    for (const resume of resumes) {
      try {
        const text = await parseResume(resume.filepath, resume.mimetype)
        parsedResumes.push({ id: resume.id, name: resume.name, text: text.slice(0, 2000) })
      } catch {
        // 跳过无法解析的简历
      }
    }

    if (parsedResumes.length === 0) {
      return NextResponse.json({ error: '所有简历均无法解析，请确认文件格式为 PDF 或 DOCX' }, { status: 400 })
    }

    // 构造包含所有简历的 prompt，单次 LLM 调用完成排名
    const resumeList = parsedResumes
      .map((r, i) => `【简历${i + 1}】ID: ${r.id}\n名称: ${r.name}\n内容:\n${r.text}`)
      .join('\n\n---\n\n')

    const prompt = `你是一个招聘匹配评估系统。

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
${resumeList}`

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
          { role: 'system', content: '你是一个专业的简历匹配排名引擎，只输出JSON。' },
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
    const ranking = parsed.ranking ?? []
    const best = ranking[0]

    return NextResponse.json({
      bestResumeId: best?.resumeId ?? null,
      bestResumeName: best?.resumeName ?? null,
      bestScore: best?.score ?? null,
      ranking,
    })
  } catch (error) {
    console.error('POST /api/resume-match error:', error)
    return NextResponse.json({ error: '简历排名失败，请重试' }, { status: 500 })
  }
}
