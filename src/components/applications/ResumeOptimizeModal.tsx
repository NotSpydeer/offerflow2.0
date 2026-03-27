'use client'

// 简历优化弹窗：基于 JD 自动优化选定简历
import { useState, useEffect } from 'react'
import { X, Loader2, Wand2, Copy, Check } from 'lucide-react'
import type { Application, Resume } from '@/types'

interface OptimizeResult {
  optimizedResume: string
  changes: string[]
  originalName: string
}

interface ResumeOptimizeModalProps {
  application: Application
  onClose: () => void
}

export function ResumeOptimizeModal({ application, onClose }: ResumeOptimizeModalProps) {
  const jdText = [application.jdRequire, application.jdDesc].filter(Boolean).join('\n\n')

  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumeId, setResumeId] = useState<string>(application.resumeId || '')
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/resumes')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResumes(data) })
      .catch(console.error)
      .finally(() => setLoadingResumes(false))
  }, [])

  const handleOptimize = async () => {
    if (!resumeId) { setError('请选择一份简历'); return }
    if (!jdText.trim()) { setError('该岗位暂无 JD 内容，请先在编辑中填写'); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/resume-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText, resumeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '优化失败')
      }
      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : '优化失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.optimizedResume) return
    await navigator.clipboard.writeText(result.optimizedResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-violet-500" />
              优化简历
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{application.company} · {application.position}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* 简历选择（未出结果时显示） */}
          {!result && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                选择要优化的简历 <span className="text-red-500">*</span>
              </label>
              {loadingResumes ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />加载简历库...
                </div>
              ) : resumes.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">简历库为空，请先在「简历管理」中上传简历。</p>
              ) : (
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-gray-50/50"
                >
                  <option value="">— 请选择简历 —</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}（{r.filename}）</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* 优化按钮 */}
          {!result && (
            <button
              onClick={handleOptimize}
              disabled={loading || !resumeId || loadingResumes}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />优化中，请稍候...</>
              ) : (
                <><Wand2 className="w-4 h-4" />开始优化</>
              )}
            </button>
          )}

          {/* 优化结果 */}
          {result && (
            <div className="space-y-4">
              {/* 修改点 */}
              <div>
                <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">优化要点</h4>
                <ul className="space-y-1">
                  {result.changes.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-violet-300 shrink-0">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 优化后简历 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">优化后简历</h4>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-500" />已复制</> : <><Copy className="w-3.5 h-3.5" />复制</>}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result.optimizedResume}
                  rows={14}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 resize-none focus:outline-none"
                />
              </div>

              <button
                onClick={() => setResult(null)}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                重新选择简历
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
