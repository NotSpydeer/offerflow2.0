// API: GET /api/stats - 获取数据统计

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 并发获取所有统计数据
    const [
      total,
      statusGroups,
      channelGroups,
      recentApplications,
    ] = await Promise.all([
      // 总投递数
      prisma.application.count(),

      // 按状态分组统计
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
      }),

      // 按渠道分组统计
      prisma.application.groupBy({
        by: ['channel'],
        _count: { channel: true },
        orderBy: { _count: { channel: 'desc' } },
      }),

      // 最近10条投递记录
      prisma.application.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          resume: { select: { id: true, name: true } },
        },
      }),
    ])

    // 计算各种指标
    const statusMap = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count.status])
    )

    // 约面数量（获得面试邀请：一面/二面/HR面/Offer）
    const interviewInvitedStatuses = ['一面', '二面', 'HR面', 'Offer']
    const interviewInvited = interviewInvitedStatuses.reduce(
      (sum, s) => sum + (statusMap[s] || 0), 0
    )

    // 面试中的数量
    const interviewingStatuses = ['简历通过', '一面', '二面', 'HR面']
    const interviewing = interviewingStatuses.reduce(
      (sum, s) => sum + (statusMap[s] || 0),
      0
    )

    // Offer数
    const offerCount = statusMap['Offer'] || 0

    // 已投递总数（排除未投递状态）
    const applied = total - (statusMap['未投递'] || 0)

    return NextResponse.json({
      total,
      interviewInvited,
      interviewInvitedRate: applied > 0 ? Math.round((interviewInvited / applied) * 100) : 0,
      interviewing,
      interviewRate: applied > 0 ? Math.round((interviewing / applied) * 100) : 0,
      offerCount,
      offerRate: applied > 0 ? Math.round((offerCount / applied) * 100) : 0,
      statusDistribution: statusGroups.map((g) => ({
        status: g.status,
        count: g._count.status,
      })),
      channelDistribution: channelGroups.map((g) => ({
        channel: g.channel,
        count: g._count.channel,
      })),
      recentApplications,
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
