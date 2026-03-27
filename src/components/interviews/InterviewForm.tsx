'use client'

// 面试记录表单组件
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ROUND_LIST } from '@/lib/utils'
import type { Application, InterviewFormData } from '@/types'

interface InterviewFormProps {
  applicationId?: string
  initialData?: Partial<InterviewFormData>
  onSubmit: (data: InterviewFormData) => Promise<void>
  onClose: () => void
  title?: string
}

const DEFAULT_FORM: InterviewFormData = {
  applicationId: '',
  round: '一面',
  scheduledAt: new Date().toISOString().slice(0, 16),
  interviewer: '',
  location: '',
  questions: '',
  reflection: '',
  result: '',
}

export function InterviewForm({
  applicationId,
  initialData,
  onSubmit,
  onClose,
  title = '添加面试记录',
}: InterviewFormProps) {
  const [form, setForm] = useState<InterviewFormData>({
    ...DEFAULT_FORM,
    applicationId: applicationId || '',
    ...initialData,
  })
  const [applications, setApplications] = useState<Application[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // 若没有预设applicationId，加载岗位列表供选择
    if (!applicationId) {
      fetch('/api/applications?limit=100')
        .then((r) => r.json())
        .then((d) => setApplications(d.applications || []))
        .catch(console.error)
    }
  }, [applicationId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.applicationId || !form.round || !form.scheduledAt) return

    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {/* 关联岗位（仅在未预设applicationId时显示） */}
            {!applicationId && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  关联岗位 <span className="text-red-500">*</span>
                </label>
                <select
                  name="applicationId"
                  value={form.applicationId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                >
                  <option value="">请选择岗位</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company} - {app.position}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 面试轮次 + 时间 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  面试轮次 <span className="text-red-500">*</span>
                </label>
                <select
                  name="round"
                  value={form.round}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                >
                  {ROUND_LIST.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  面试时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={form.scheduledAt}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                />
              </div>
            </div>

            {/* 面试官 + 地点 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">面试官</label>
                <input
                  name="interviewer"
                  value={form.interviewer || ''}
                  onChange={handleChange}
                  placeholder="姓名或部门"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">面试地点</label>
                <input
                  name="location"
                  value={form.location || ''}
                  onChange={handleChange}
                  placeholder="线上/北京/上海..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                />
              </div>
            </div>

            {/* 面试结果 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">面试结果</label>
              <select
                name="result"
                value={form.result || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
              >
                <option value="">未填写</option>
                <option value="通过">通过</option>
                <option value="未通过">未通过</option>
                <option value="待定">待定</option>
              </select>
            </div>

            {/* 面试题目 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">面试题目</label>
              <textarea
                name="questions"
                value={form.questions || ''}
                onChange={handleChange}
                placeholder="记录面试中被问到的问题（每行一个）..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50 resize-none"
              />
            </div>

            {/* 面试复盘（Markdown） */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                面试复盘
                <span className="ml-1 text-gray-400 font-normal">（支持 Markdown）</span>
              </label>
              <textarea
                name="reflection"
                value={form.reflection || ''}
                onChange={handleChange}
                placeholder="面试总结和反思，例如：
## 表现亮点
-

## 待改进
-

## 下次准备重点
- "
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50 resize-none font-mono"
              />
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
