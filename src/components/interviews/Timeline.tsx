'use client'

// 面试记录时间线组件
import { useState } from 'react'
import { CalendarDays, User, MapPin, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import type { Interview } from '@/types'
import ReactMarkdown from 'react-markdown'

interface TimelineProps {
  interviews: Interview[]
  onEdit: (interview: Interview) => void
  onDelete: (id: string) => void
}

const ROUND_COLORS: Record<string, string> = {
  一面: 'bg-yellow-400',
  二面: 'bg-orange-400',
  三面: 'bg-red-400',
  HR面: 'bg-purple-400',
  终面: 'bg-pink-400',
  笔试: 'bg-blue-400',
  其他: 'bg-gray-400',
}

const RESULT_ICON = {
  通过: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
  未通过: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  待定: <Clock className="w-3.5 h-3.5 text-amber-500" />,
}

export function InterviewTimeline({ interviews, onEdit, onDelete }: TimelineProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        暂无面试记录
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 时间线竖线 */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {interviews.map((interview) => {
          const isExpanded = expanded[interview.id]
          const dotColor = ROUND_COLORS[interview.round] || 'bg-gray-400'

          return (
            <div key={interview.id} className="relative pl-10">
              {/* 圆点 */}
              <div className={cn('absolute left-3 top-3 w-2.5 h-2.5 rounded-full border-2 border-white', dotColor)} />

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                {/* 头部 */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => toggle(interview.id)}
                >
                  {/* 轮次标签 */}
                  <span className={cn(
                    'flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-white rounded',
                    dotColor
                  )}>
                    {interview.round}
                  </span>

                  {/* 时间 */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 flex-1">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {formatDate(interview.scheduledAt)}
                    {interview.interviewer && (
                      <>
                        <span className="text-gray-300 mx-1">·</span>
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">{interview.interviewer}</span>
                      </>
                    )}
                    {interview.location && (
                      <>
                        <span className="text-gray-300 mx-1">·</span>
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">{interview.location}</span>
                      </>
                    )}
                  </div>

                  {/* 结果 */}
                  {interview.result && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 mr-2">
                      {RESULT_ICON[interview.result as keyof typeof RESULT_ICON] || null}
                      {interview.result}
                    </span>
                  )}

                  {/* 展开图标 */}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* 详情展开区 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* 面试题目 */}
                    {interview.questions && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">面试题目</h4>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {interview.questions}
                        </div>
                      </div>
                    )}

                    {/* 面试复盘 */}
                    {interview.reflection && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">面试复盘</h4>
                        <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-3">
                          <ReactMarkdown>{interview.reflection}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => onEdit(interview)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        编辑
                      </button>
                      {deleteConfirm === interview.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { onDelete(interview.id); setDeleteConfirm(null) }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            确认删除
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(interview.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
