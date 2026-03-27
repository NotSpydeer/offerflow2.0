'use client'

// 岗位列表视图（表格形式）
import { useState } from 'react'
import { Pencil, Trash2, ExternalLink, ChevronUp, ChevronDown, Sparkles, Trophy, Wand2 } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { MatchModal } from './MatchModal'
import { ResumeRankModal } from './ResumeRankModal'
import { ResumeOptimizeModal } from './ResumeOptimizeModal'
import { formatDate, cn } from '@/lib/utils'
import type { Application } from '@/types'

interface ApplicationTableProps {
  applications: Application[]
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}

type SortKey = 'company' | 'position' | 'appliedDate' | 'status'

export function ApplicationTable({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('appliedDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [matchingApp, setMatchingApp] = useState<Application | null>(null)
  const [rankingApp, setRankingApp] = useState<Application | null>(null)
  const [optimizeApp, setOptimizeApp] = useState<Application | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...applications].sort((a, b) => {
    let av: string = a[sortKey] as string
    let bv: string = b[sortKey] as string

    if (sortKey === 'appliedDate') {
      return sortDir === 'asc'
        ? new Date(av).getTime() - new Date(bv).getTime()
        : new Date(bv).getTime() - new Date(av).getTime()
    }

    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-gray-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-gray-600" />
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400">
        暂无投递记录
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {[
              { key: 'company' as SortKey, label: '公司' },
              { key: 'position' as SortKey, label: '职位' },
              { key: 'appliedDate' as SortKey, label: '投递时间' },
              { key: 'status' as SortKey, label: '状态' },
            ].map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600 select-none"
                onClick={() => handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  <SortIcon col={col.key} />
                </span>
              </th>
            ))}
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">简历版本</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">面试</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-400 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app, idx) => (
            <>
              <tr
                key={app.id}
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                className={cn(
                  'hover:bg-gray-50/70 transition-colors group cursor-pointer',
                  idx !== sorted.length - 1 && !expandedId && 'border-b border-gray-50',
                  expandedId === app.id && 'bg-gray-50/70'
                )}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.company}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{app.position}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{formatDate(app.appliedDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {app.resume?.name || (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {app.interviews?.length ? (
                    <span className="text-violet-600 font-medium">
                      {app.interviews.length} 轮
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-gray-300 transition-transform mr-1',
                        expandedId === app.id && 'rotate-180 text-gray-500'
                      )}
                    />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(app) }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === app.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(app.id); setDeleteConfirm(null) }}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                          >
                            确认
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null) }}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(app.id) }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
              {expandedId === app.id && (
                <tr key={`${app.id}-detail`} className="border-b border-gray-100">
                  <td colSpan={7} className="px-4 pb-4 pt-0">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 max-h-72 overflow-y-auto">
                      {app.jdDesc ? (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">岗位描述</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.jdDesc}</p>
                        </div>
                      ) : null}
                      {app.jdRequire ? (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">任职要求</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.jdRequire}</p>
                        </div>
                      ) : null}
                      {!app.jdDesc && !app.jdRequire && (
                        <p className="text-sm text-gray-400">暂无 JD 内容</p>
                      )}
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMatchingApp(app) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          AI 匹配分析
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setRankingApp(app) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          自动选最优简历
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOptimizeApp(app) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          优化简历
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {matchingApp && (
        <MatchModal application={matchingApp} onClose={() => setMatchingApp(null)} />
      )}
      {rankingApp && (
        <ResumeRankModal application={rankingApp} onClose={() => setRankingApp(null)} />
      )}
      {optimizeApp && (
        <ResumeOptimizeModal application={optimizeApp} onClose={() => setOptimizeApp(null)} />
      )}
    </div>
  )
}
