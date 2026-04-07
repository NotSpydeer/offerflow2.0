// API: GET /api/resumes/[id] - 获取单个简历
// API: PUT /api/resumes/[id] - 更新简历信息
// API: DELETE /api/resumes/[id] - 删除简历

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob' // ✅ 修改：本地 unlink → Vercel Blob del

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          select: { id: true, company: true, position: true, status: true },
        },
      },
    })

    if (!resume) {
      return NextResponse.json({ error: '简历不存在' }, { status: 404 })
    }

    return NextResponse.json(resume)
  } catch (error) {
    console.error(`GET /api/resumes/${params.id} error:`, error)
    return NextResponse.json({ error: '获取简历失败' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, tags } = body

    const resume = await prisma.resume.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(tags !== undefined && { tags }),
      },
    })

    return NextResponse.json(resume)
  } catch (error) {
    console.error(`PUT /api/resumes/${params.id} error:`, error)
    return NextResponse.json({ error: '更新简历失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 先查找简历信息
    const resume = await prisma.resume.findUnique({
      where: { id: params.id },
    })

    if (!resume) {
      return NextResponse.json({ error: '简历不存在' }, { status: 404 })
    }

    // 删除数据库记录
    await prisma.resume.delete({ where: { id: params.id } })

    // ✅ 修改：从 Vercel Blob 删除文件（filepath 现在是 Blob URL）
    try {
      if (resume.filepath.startsWith('http')) {
        await del(resume.filepath)
      }
    } catch {
      // 文件可能已不存在，忽略错误
    }

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error(`DELETE /api/resumes/${params.id} error:`, error)
    return NextResponse.json({ error: '删除简历失败' }, { status: 500 })
  }
}
