// API: GET /api/applications - 获取岗位列表
// API: POST /api/applications - 新建岗位

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - 获取岗位列表，支持筛选和搜索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')   // 按状态筛选
    const search = searchParams.get('search')   // 按公司/职位搜索
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    // 状态筛选
    if (status && status !== 'all') {
      where.status = status
    }

    // 搜索过滤（公司名或职位名）
    if (search) {
      where.OR = [
        { company: { contains: search } },
        { position: { contains: search } },
      ]
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          resume: {
            select: { id: true, name: true },
          },
          interviews: {
            select: { id: true, round: true, scheduledAt: true, result: true },
            orderBy: { scheduledAt: 'asc' },
          },
        },
        orderBy: { appliedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where }),
    ])

    return NextResponse.json({ applications, total, page, limit })
  } catch (error) {
    console.error('GET /api/applications error:', error)
    return NextResponse.json({ error: '获取岗位列表失败' }, { status: 500 })
  }
}

// POST - 新建岗位
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company,
      position,
      channel = '其他',
      department,
      appliedDate,
      status = '已投递',
      jdText,
      jdRequire,
      jdDesc,
      notes,
      resumeId,
    } = body

    // 基本校验
    if (!company || !position) {
      return NextResponse.json(
        { error: '公司名称和职位名称不能为空' },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        company,
        position,
        channel,
        department: department || null,
        appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
        status,
        jdText,
        jdRequire,
        jdDesc,
        notes,
        resumeId: resumeId || null,
      },
      include: {
        resume: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('POST /api/applications error:', error)
    return NextResponse.json({ error: '创建岗位失败' }, { status: 500 })
  }
}
