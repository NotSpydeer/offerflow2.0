// API: PUT /api/interviews/[id] - 更新面试记录
// API: DELETE /api/interviews/[id] - 删除面试记录

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      round,
      scheduledAt,
      interviewer,
      location,
      questions,
      reflection,
      result,
    } = body

    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: {
        ...(round && { round }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(interviewer !== undefined && { interviewer }),
        ...(location !== undefined && { location }),
        ...(questions !== undefined && { questions }),
        ...(reflection !== undefined && { reflection }),
        ...(result !== undefined && { result }),
      },
      include: {
        application: {
          select: { id: true, company: true, position: true },
        },
      },
    })

    return NextResponse.json(interview)
  } catch (error) {
    console.error(`PUT /api/interviews/${params.id} error:`, error)
    return NextResponse.json({ error: '更新面试记录失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.interview.delete({ where: { id: params.id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error(`DELETE /api/interviews/${params.id} error:`, error)
    return NextResponse.json({ error: '删除面试记录失败' }, { status: 500 })
  }
}
