'use client'

// Dashboard 页面
import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { StatusPieChart } from '@/components/dashboard/StatusPieChart'
import { ChannelBarChart } from '@/components/dashboard/ChannelBarChart'
import { formatRelativeTime, STATUS_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Stats } from '@/types'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const pathname = usePathname()

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 每次进入 dashboard 页面都刷新数据
  useEffect(() => {
    fetchStats()
  }, [pathname, fetchStats])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 统计卡片 */}
      <StatsCards stats={stats} loading={loading} />

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 状态分布饼图 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">投递状态分布</h3>
          <p className="text-xs text-gray-400 mb-4">各阶段岗位数量占比</p>
          <StatusPieChart data={stats?.statusDistribution || []} />
        </div>

        {/* 渠道分布柱状图 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">投递渠道分布</h3>
          <p className="text-xs text-gray-400 mb-4">各平台投递数量统计</p>
          <ChannelBarChart data={stats?.channelDistribution || []} />
        </div>
      </div>

      {/* 最近投递记录 */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">最近投递</h3>
            <p className="text-xs text-gray-400 mt-0.5">最新10条投递记录</p>
          </div>
          <Link
            href="/applications"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            查看全部 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : stats?.recentApplications?.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            暂无投递记录，
            <Link href="/applications/new" className="text-gray-900 underline">
              立即添加
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">公司</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">职位</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">渠道</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">时间</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentApplications?.map((app, idx) => (
                <tr
                  key={app.id}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    idx !== (stats.recentApplications.length - 1) && 'border-b border-gray-50'
                  )}
                >
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{app.company}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{app.position}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{app.channel}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {formatRelativeTime(app.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
