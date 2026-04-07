// API: POST /api/ocr - 上传截图进行OCR识别
// 使用 Tesseract.js 识别招聘截图中的文字，并提取关键信息
// Vercel 兼容：临时文件写到 /tmp（Vercel 唯一可写目录）

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: '请上传图片文件' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '只支持图片格式（PNG/JPG/WEBP）' }, { status: 400 })
    }

    // 写临时文件到系统 tmp 目录（Vercel 上 /tmp 可写）
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name) || '.png'
    tempFilePath = path.join(os.tmpdir(), `ocr-${Date.now()}${ext}`)
    await writeFile(tempFilePath, buffer)

    // 动态导入 Tesseract.js
    const Tesseract = await import('tesseract.js')

    // 语言包路径（打包时会包含在 .next/server 中）
    const langPath = path.join(process.cwd(), 'public', 'tessdata')

    const result = await Tesseract.default.recognize(
      tempFilePath,
      'chi_sim+eng',
      {
        langPath,
        gzip: true,
      }
    )

    const rawText = result.data.text

    const extracted = await extractJobInfoWithLLM(rawText)

    return NextResponse.json({
      rawText,
      ...extracted,
    })
  } catch (error) {
    console.error('POST /api/ocr error:', error)
    return NextResponse.json({ error: 'OCR识别失败，请重试' }, { status: 500 })
  } finally {
    if (tempFilePath) {
      try { await unlink(tempFilePath) } catch { /* ignore */ }
    }
  }
}

type JobInfo = {
  company?: string
  position?: string
  requirements?: string
  description?: string
}

/**
 * 用 DeepSeek LLM 解析 JD 文本，失败则 fallback 到正则
 */
async function extractJobInfoWithLLM(text: string): Promise<JobInfo> {
  const apiKey = process.env.DOUBAO_API_KEY
  console.log('DeepSeek KEY 是否存在:', !!apiKey)
  if (!apiKey) return extractJobInfo(text)

  try {
    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v3-2-251201',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的招聘JD解析引擎，只输出JSON，不允许输出任何解释或多余内容。',
          },
          {
            role: 'user',
            content: `请从以下招聘文本中提取结构化信息。

严格按照以下JSON格式输出：

{
  "company": string | null,
  "position": string | null,
  "requirements": string | null,
  "description": string | null
}

要求：
1、必须是合法JSON
2、不要使用 \`\`\`json 包裹
3、不要添加任何解释或前后文本
4、字段缺失返回 null
5、保持原文语义，不要编造

招聘文本：
${text.slice(0, 3000)}`,
          },
        ],
      }),
    })

    console.log('DeepSeek状态码:', res.status)

    if (!res.ok) {
      const errText = await res.text()
      console.error('DeepSeek报错:', errText)
      return extractJobInfo(text)
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    console.log('LLM原始返回:', raw)

    try {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error('没有匹配到JSON')
        return extractJobInfo(text)
      }

      const jsonStr = match[0]
      console.log('清洗后JSON:', jsonStr)

      const parsed = JSON.parse(jsonStr)
      console.log('解析成功:', parsed)

      return {
        company: parsed.company ?? undefined,
        position: parsed.position ?? undefined,
        requirements: parsed.requirements ?? undefined,
        description: parsed.description ?? undefined,
      }
    } catch (e) {
      console.error('JSON解析失败:', e)
      return extractJobInfo(text)
    }
  } catch (e) {
    console.error('DeepSeek请求失败:', e)
    return extractJobInfo(text)
  }
}

/**
 * 从OCR识别文本中提取招聘关键信息
 * 使用关键词匹配策略（作为 LLM 的 fallback）
 */
function extractJobInfo(text: string): JobInfo {
  // 过滤噪声行：纯数字/符号、单字符、常见平台标识
  const NOISE_RE = /^[\d\s\W]+$|^.{1}$|BOSS直聘|智联招聘|前程无忧|猎聘|拉勾|LinkedIn/i

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !NOISE_RE.test(l))

  let company: string | undefined
  let position: string | undefined
  const requirementLines: string[] = []
  const descriptionLines: string[] = []

  // 第一步：优先从"标签: 值"格式提取（如"公司名称：字节跳动"）
  for (const line of lines) {
    if (!company) {
      const m = line.match(/(?:公司名称|招聘方|发布者|企业名称)[：:]\s*(.+)/)
      if (m) { company = m[1].trim(); continue }
    }
    if (!position) {
      const m = line.match(/(?:职位名称|招聘职位|岗位名称|应聘职位)[：:]\s*(.+)/)
      if (m) { position = m[1].trim(); continue }
    }
  }

  let currentSection = ''

  // 第二步：逐行扫描识别
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 识别公司名：含常见企业后缀关键词
    if (!company && /公司|集团|科技|有限|股份|信息|网络|互联网|传媒|金融|咨询|Corp|Inc|Ltd/i.test(line) && line.length < 60) {
      company = line.replace(/[【】\[\]]/g, '').trim()
      continue
    }
    // 兜底：行尾为"有限公司"
    if (!company && /(股份)?有限公司$/.test(line) && line.length < 60) {
      company = line.replace(/[【】\[\]]/g, '').trim()
      continue
    }

    // 识别职位：扩展关键词
    if (!position && /工程师|产品经理|设计师|运营|销售|研发|架构师|经理|总监|专员|顾问|分析师|前端|后端|算法|测试|数据|UI|UX|开发/i.test(line) && line.length < 40) {
      position = line.replace(/[【】\[\]招聘]/g, '').trim()
      continue
    }

    // 识别岗位要求段落
    if (/任职要求|岗位要求|职位要求|你需要|我们希望|requirements/i.test(line)) {
      currentSection = 'requirements'
      continue
    }

    // 识别岗位职责段落
    if (/工作职责|岗位职责|工作内容|职位描述|你将|responsibilities/i.test(line)) {
      currentSection = 'description'
      continue
    }

    // 遇到其他section标题则停止当前采集
    if (/薪资|工资|福利|待遇|salary|关于我们|公司介绍/i.test(line)) {
      currentSection = ''
    }

    // 采集段落内容
    if (currentSection === 'requirements' && line.length > 5) {
      requirementLines.push(line)
    } else if (currentSection === 'description' && line.length > 5) {
      descriptionLines.push(line)
    }
  }

  return {
    company,
    position,
    requirements: requirementLines.slice(0, 20).join('\n') || undefined,
    description: descriptionLines.slice(0, 20).join('\n') || undefined,
  }
}
