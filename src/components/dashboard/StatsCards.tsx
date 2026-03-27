'use client'

// Dashboard 统计卡片组件
import { TrendingUp, Send, Users, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Stats } from '@/types'

interface StatsCardsProps {
  stats: Stats | null
  loading?: boolean
}

const cards = [
  {
    key: 'total' as const,
    label: '总投递数',
    icon: Send,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    format: (s: Stats) => s.total,
    sub: (s: Stats) => `本月新增 ${s.recentApplications?.length || 0} 条`,
  },
  {
    key: 'replyRate' as const,
    label: '回复率',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    format: (s: Stats) => `${s.replyRate}%`,
    sub: (s: Stats) => `${s.replied} 家有回复`,
  },
  {
    key: 'interviewRate' as const,
    label: '面试率',
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    format: (s: Stats) => `${s.interviewRate}%`,
    sub: (s: Stats) => `${s.interviewing} 家面试中`,
  },
  {
    key: 'offerCount' as const,
    label: 'Offer 数',
    icon: Trophy,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    format: (s: Stats) => s.offerCount,
    sub: (s: Stats) => `Offer率 ${s.offerRate}%`,
  },
]

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
                <Icon className={cn('w-4 h-4', card.color)} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats ? card.format(stats) : '-'}
            </div>
            <div className="text-xs text-gray-400">
              {stats ? card.sub(stats) : '暂无数据'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
