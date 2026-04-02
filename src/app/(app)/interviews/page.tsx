'use client'

// 面试记录页面
// 按岗位分组展示所有面试时间线

import { useState, useEffect } from 'react'
import { Plus, CalendarCheck, Building2, ChevronRight } from 'lucide-react'
import { InterviewTimeline } from '@/components/interviews/Timeline'
import { InterviewForm } from '@/components/interviews/InterviewForm'
import { StatusBadge } from '@/components/applications/StatusBadge'
import { cn } from '@/lib/utils'
import type { Application, Interview, InterviewFormData } from '@/types'

interface AppWithInterviews extends Application {
  interviews: Interview[]
}

export default function InterviewsPage() {
  const [applications, setApplications] = useState<AppWithInterviews[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 获取有面试记录的岗位（含interviews）
      const res = await fetch('/api/applications?limit=200')
      if (res.ok) {
        const data = await res.json()
        // 只显示有面试记录的岗位
        const appsWithInterviews = data.applications.filter(
          (a: AppWithInterviews) => a.interviews && a.interviews.length > 0
        )
        setApplications(appsWithInterviews)

        // 默认展开第一个
        if (appsWithInterviews.length > 0) {
          setExpandedApps({ [appsWithInterviews[0].id]: true })
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInterview = async (data: InterviewFormData) => {
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '创建失败')
    }

    setShowForm(false)
    fetchData()
  }

  const handleUpdateInterview = async (data: InterviewFormData) => {
    if (!editingInterview) return

    const res = await fetch(`/api/interviews/${editingInterview.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '更新失败')
    }

    setEditingInterview(null)
    fetchData()
  }

  const handleDeleteInterview = async (id: string) => {
    const res = await fetch(`/api/interviews/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const toggleApp = (appId: string) => {
    setExpandedApps((prev) => ({ ...prev, [appId]: !prev[appId] }))
  }

  const totalInterviews = applications.reduce((sum, a) => sum + a.interviews.length, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-gray-400">
          共 {applications.length} 家公司 · {totalInterviews} 次面试
        </p>
        <button
          onClick={() => { setSelectedAppId(''); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加面试记录
        </button>
      </div>

      {/* 内容区 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20">
          <CalendarCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">暂无面试记录</p>
          <p className="text-xs text-gray-300">
            先在「岗位投递」中添加岗位，然后添加面试记录
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedApps[app.id]

            return (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* 岗位标题栏 */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleApp(app.id)}
                >
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{app.company}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{app.position}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {app.interviews.length} 轮
                    </span>
                    <StatusBadge status={app.status} />
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </div>
                </button>

                {/* 时间线内容 */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <div className="mt-4">
                      <InterviewTimeline
                        interviews={app.interviews}
                        onEdit={setEditingInterview}
                        onDelete={handleDeleteInterview}
                      />
                    </div>
                    {/* 快速添加面试按钮 */}
                    <button
                      onClick={() => { setSelectedAppId(app.id); setShowForm(true) }}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      为此岗位添加面试记录
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 添加面试表单 */}
      {showForm && (
        <InterviewForm
          title="添加面试记录"
          applicationId={selectedAppId || undefined}
          onSubmit={handleCreateInterview}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* 编辑面试表单 */}
      {editingInterview && (
        <InterviewForm
          title="编辑面试记录"
          applicationId={editingInterview.applicationId}
          initialData={{
            applicationId: editingInterview.applicationId,
            round: editingInterview.round,
            scheduledAt: editingInterview.scheduledAt?.slice(0, 16),
            interviewer: editingInterview.interviewer || '',
            location: editingInterview.location || '',
            questions: editingInterview.questions || '',
            reflection: editingInterview.reflection || '',
            result: editingInterview.result || '',
          }}
          onSubmit={handleUpdateInterview}
          onClose={() => setEditingInterview(null)}
        />
      )}
    </div>
  )
}
