// API: GET /api/resumes - 获取简历列表
// API: POST /api/resumes - 上传简历文件

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob' // ✅ 修改：本地文件写入 → Vercel Blob 存储

// GET - 获取所有简历版本
export async function GET() {
  try {
    const resumes = await prisma.resume.findMany({
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(resumes)
  } catch (error) {
    console.error('GET /api/resumes error:', error)
    return NextResponse.json({ error: '获取简历列表失败' }, { status: 500 })
  }
}

// POST - 上传简历文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const tags = formData.get('tags') as string || '[]'

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: '请填写简历名称' }, { status: 400 })
    }

    // 校验文件类型
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '只支持 PDF 或 DOCX 格式' }, { status: 400 })
    }

    // ✅ 修改：上传到 Vercel Blob，filepath 存储为公开 URL
    const blob = await put(
      `resumes/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      file,
      { access: 'public' }
    )

    // 保存到数据库
    const resume = await prisma.resume.create({
      data: {
        name,
        filename: file.name,
        filepath: blob.url, // ✅ 修改：存储 Blob URL 而非本地路径
        filesize: file.size,
        mimetype: file.type,
        tags,
      },
    })

    return NextResponse.json(resume, { status: 201 })
  } catch (error) {
    console.error('POST /api/resumes error:', error)
    return NextResponse.json({ error: '上传简历失败' }, { status: 500 })
  }
}
