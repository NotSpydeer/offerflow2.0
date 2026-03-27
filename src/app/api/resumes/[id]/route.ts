// API: GET /api/resumes/[id] - 获取单个简历
// API: PUT /api/resumes/[id] - 更新简历信息
// API: DELETE /api/resumes/[id] - 删除简历

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

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

    // 删除实际文件（忽略文件不存在的错误）
    try {
      const filePath = path.join(process.cwd(), 'public', resume.filepath)
      await unlink(filePath)
    } catch {
      // 文件可能已不存在，忽略错误
    }

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error(`DELETE /api/resumes/${params.id} error:`, error)
    return NextResponse.json({ error: '删除简历失败' }, { status: 500 })
  }
}
