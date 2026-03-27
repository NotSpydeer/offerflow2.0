// API: POST /api/interviews - 新建面试记录

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      applicationId,
      round,
      scheduledAt,
      interviewer,
      location,
      questions,
      reflection,
      result,
    } = body

    if (!applicationId || !round || !scheduledAt) {
      return NextResponse.json(
        { error: '岗位ID、面试轮次和面试时间不能为空' },
        { status: 400 }
      )
    }

    // 验证岗位是否存在
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json({ error: '关联岗位不存在' }, { status: 404 })
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        round,
        scheduledAt: new Date(scheduledAt),
        interviewer,
        location,
        questions,
        reflection,
        result,
      },
      include: {
        application: {
          select: { id: true, company: true, position: true },
        },
      },
    })

    // 自动更新岗位状态（如果面试轮次更新）
    const roundStatusMap: Record<string, string> = {
      一面: '一面',
      二面: '二面',
      三面: '二面',
      HR面: 'HR面',
      终面: 'HR面',
    }

    if (roundStatusMap[round]) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: roundStatusMap[round] },
      })
    }

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    console.error('POST /api/interviews error:', error)
    return NextResponse.json({ error: '创建面试记录失败' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')

    const interviews = await prisma.interview.findMany({
      where: applicationId ? { applicationId } : undefined,
      include: {
        application: {
          select: { id: true, company: true, position: true, status: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json(interviews)
  } catch (error) {
    console.error('GET /api/interviews error:', error)
    return NextResponse.json({ error: '获取面试记录失败' }, { status: 500 })
  }
}
