'use client'

// 岗位新增/编辑表单组件（含OCR上传入口）
import { useState, useEffect } from 'react'
import { X, Upload, Loader2, Sparkles } from 'lucide-react'
import { STATUS_LIST, CHANNEL_LIST, formatDate } from '@/lib/utils'
import type { ApplicationFormData, Resume } from '@/types'

interface ApplicationFormProps {
  initialData?: Partial<ApplicationFormData>
  onSubmit: (data: ApplicationFormData) => Promise<void>
  onClose: () => void
  title?: string
}

const DEFAULT_FORM: ApplicationFormData = {
  company: '',
  position: '',
  channel: 'BOSS',
  appliedDate: new Date().toISOString().split('T')[0],
  status: '已投递',
  jdText: '',
  jdRequire: '',
  jdDesc: '',
  notes: '',
  resumeId: '',
}

export function ApplicationForm({
  initialData,
  onSubmit,
  onClose,
  title = '新增岗位',
}: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  })
  const [resumes, setResumes] = useState<Resume[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'jd' | 'notes'>('basic')

  useEffect(() => {
    // 加载简历列表（用于选择关联简历）
    fetch('/api/resumes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data)
      })
      .catch(console.error)
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company.trim() || !form.position.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  // OCR 上传处理
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('OCR失败')

      const result = await res.json()

      // 自动填入识别结果
      setForm((prev) => ({
        ...prev,
        company: result.company || prev.company,
        position: result.position || prev.position,
        jdText: result.rawText || prev.jdText,
        jdRequire: result.requirements || prev.jdRequire,
        jdDesc: result.description || prev.jdDesc,
      }))

      // 自动切换到JD tab 查看识别结果
      if (result.rawText) setActiveTab('jd')
    } catch (error) {
      console.error('OCR error:', error)
      alert('OCR识别失败，请手动填写')
    } finally {
      setOcrLoading(false)
      // 清空文件输入
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* 表单弹窗 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            {/* OCR 上传按钮 */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOcrUpload}
                disabled={ocrLoading}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
                {ocrLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {ocrLoading ? 'OCR识别中...' : '上传JD截图'}
              </span>
            </label>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-gray-100 px-6">
          {[
            { key: 'basic', label: '基本信息' },
            { key: 'jd', label: 'JD内容' },
            { key: 'notes', label: '备注' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {/* 基本信息 Tab */}
            {activeTab === 'basic' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      公司名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="如：字节跳动"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      职位名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                      placeholder="如：产品经理"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      投递渠道
                    </label>
                    <select
                      name="channel"
                      value={form.channel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                    >
                      {CHANNEL_LIST.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      投递日期
                    </label>
                    <input
                      type="date"
                      name="appliedDate"
                      value={form.appliedDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      当前状态
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                    >
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    关联简历版本
                  </label>
                  <select
                    name="resumeId"
                    value={form.resumeId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                  >
                    <option value="">不关联简历</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* JD内容 Tab */}
            {activeTab === 'jd' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    JD原文（OCR自动填入）
                  </label>
                  <textarea
                    name="jdText"
                    value={form.jdText || ''}
                    onChange={handleChange}
                    placeholder="招聘JD全文..."
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    岗位要求
                  </label>
                  <textarea
                    name="jdRequire"
                    value={form.jdRequire || ''}
                    onChange={handleChange}
                    placeholder="岗位任职要求..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    岗位描述
                  </label>
                  <textarea
                    name="jdDesc"
                    value={form.jdDesc || ''}
                    onChange={handleChange}
                    placeholder="岗位工作内容..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50 resize-none"
                  />
                </div>
              </>
            )}

            {/* 备注 Tab */}
            {activeTab === 'notes' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  备注信息
                </label>
                <textarea
                  name="notes"
                  value={form.notes || ''}
                  onChange={handleChange}
                  placeholder="任何补充信息，如薪资范围、内推人等..."
                  rows={8}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50 resize-none"
                />
              </div>
            )}
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
              disabled={submitting || !form.company || !form.position}
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
