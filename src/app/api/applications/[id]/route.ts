// API: GET /api/applications/[id] - 获取单个岗位
// API: PUT /api/applications/[id] - 更新岗位
// API: DELETE /api/applications/[id] - 删除岗位

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

// GET - 获取单个岗位详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        resume: true,
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: '岗位不存在' }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error(`GET /api/applications/${params.id} error:`, error)
    return NextResponse.json({ error: '获取岗位详情失败' }, { status: 500 })
  }
}

// PUT - 更新岗位信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      company,
      position,
      channel,
      appliedDate,
      status,
      jdText,
      jdRequire,
      jdDesc,
      notes,
      resumeId,
    } = body

    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        ...(company && { company }),
        ...(position && { position }),
        ...(channel && { channel }),
        ...(appliedDate && { appliedDate: new Date(appliedDate) }),
        ...(status && { status }),
        ...(jdText !== undefined && { jdText }),
        ...(jdRequire !== undefined && { jdRequire }),
        ...(jdDesc !== undefined && { jdDesc }),
        ...(notes !== undefined && { notes }),
        resumeId: resumeId || null,
      },
      include: {
        resume: {
          select: { id: true, name: true },
        },
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error(`PUT /api/applications/${params.id} error:`, error)
    return NextResponse.json({ error: '更新岗位失败' }, { status: 500 })
  }
}

// DELETE - 删除岗位（级联删除关联的面试记录）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.application.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error(`DELETE /api/applications/${params.id} error:`, error)
    return NextResponse.json({ error: '删除岗位失败' }, { status: 500 })
  }
}
