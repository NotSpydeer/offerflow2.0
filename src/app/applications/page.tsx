'use client'

// 岗位管理主页面
// 支持：列表视图 / 看板视图 / 状态筛选 / 公司搜索 / 新增编辑删除

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, LayoutList, LayoutGrid, Filter } from 'lucide-react'
import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { KanbanBoard } from '@/components/applications/KanbanBoard'
import { ApplicationForm } from '@/components/applications/ApplicationForm'
import { cn, STATUS_LIST } from '@/lib/utils'
import type { Application, ApplicationFormData } from '@/types'

type ViewMode = 'list' | 'kanban'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [total, setTotal] = useState(0)

  // 加载岗位列表
  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('limit', '200')

      const res = await fetch(`/api/applications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    // 防抖搜索
    const timer = setTimeout(fetchApplications, 300)
    return () => clearTimeout(timer)
  }, [fetchApplications])

  // 新增岗位
  const handleCreate = async (data: ApplicationFormData) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '创建失败')
    }

    setShowForm(false)
    fetchApplications()
  }

  // 编辑岗位
  const handleEdit = async (data: ApplicationFormData) => {
    if (!editingApp) return

    const res = await fetch(`/api/applications/${editingApp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '更新失败')
    }

    setEditingApp(null)
    fetchApplications()
  }

  // 删除岗位
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    if (res.ok) fetchApplications()
  }

  // 更新状态（看板拖拽）
  const handleStatusChange = async (id: string, status: string) => {
    // 乐观更新
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )

    const res = await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!res.ok) {
      // 回滚
      fetchApplications()
    }
  }

  const openEdit = (app: Application) => {
    setEditingApp(app)
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-3 mb-6">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索公司或职位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          />
        </div>

        {/* 状态筛选 */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          >
            <option value="all">全部状态</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 总数显示 */}
        <span className="text-xs text-gray-400 whitespace-nowrap">
          共 {total} 条
        </span>

        <div className="flex-1" />

        {/* 视图切换 */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
            列表
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'kanban'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            看板
          </button>
        </div>

        {/* 新增按钮 */}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增岗位
        </button>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <ApplicationTable
            applications={applications}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
      ) : (
        <KanbanBoard
          applications={applications}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* 新增表单弹窗 */}
      {showForm && (
        <ApplicationForm
          title="新增岗位"
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* 编辑表单弹窗 */}
      {editingApp && (
        <ApplicationForm
          title="编辑岗位"
          initialData={{
            company: editingApp.company,
            position: editingApp.position,
            channel: editingApp.channel,
            appliedDate: editingApp.appliedDate?.split('T')[0],
            status: editingApp.status,
            jdText: editingApp.jdText || '',
            jdRequire: editingApp.jdRequire || '',
            jdDesc: editingApp.jdDesc || '',
            notes: editingApp.notes || '',
            resumeId: editingApp.resumeId || '',
          }}
          onSubmit={handleEdit}
          onClose={() => setEditingApp(null)}
        />
      )}
    </div>
  )
}
