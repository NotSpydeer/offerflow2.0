// API: POST /api/resume-optimize - 基于 JD 自动优化简历文本

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

async function parseResume(filepath: string, mimetype: string): Promise<string> {
  const absPath = path.join(process.cwd(), 'public', filepath)
  const buffer = await readFile(absPath)

  if (mimetype === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const result = await pdfParse(buffer)
    return result.text
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`不支持的简历格式：${mimetype}`)
}

export async function POST(request: NextRequest) {
  try {
    const { jdText, resumeId } = await request.json()

    if (!jdText?.trim()) {
      return NextResponse.json({ error: '请提供 JD 内容' }, { status: 400 })
    }
    if (!resumeId) {
      return NextResponse.json({ error: '请提供简历 ID' }, { status: 400 })
    }

    const apiKey = process.env.DOUBAO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 LLM API Key' }, { status: 500 })
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
    if (!resume) {
      return NextResponse.json({ error: '简历不存在' }, { status: 404 })
    }

    let resumeText: string
    try {
      resumeText = await parseResume(resume.filepath, resume.mimetype)
    } catch (e) {
      console.error('简历解析失败:', e)
      return NextResponse.json({ error: '简历文件解析失败，请确认文件格式为 PDF 或 DOCX' }, { status: 500 })
    }

    const prompt = `你是一个顶级求职顾问。

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
${resumeText.slice(0, 3000)}`

    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v3-2-251201',
        temperature: 0.3,
        messages: [
          { role: 'system', content: '你是一个专业的简历优化引擎，只输出JSON。' },
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
    return NextResponse.json({
      optimizedResume: parsed.optimizedResume ?? '',
      changes: parsed.changes ?? [],
      originalName: resume.name,
    })
  } catch (error) {
    console.error('POST /api/resume-optimize error:', error)
    return NextResponse.json({ error: '简历优化失败，请重试' }, { status: 500 })
  }
}
