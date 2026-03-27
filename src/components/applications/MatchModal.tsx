'use client'

// JD × 简历匹配分析弹窗（从简历库选择）
import { useState, useEffect } from 'react'
import { X, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { Application, Resume } from '@/types'

interface MatchResult {
  score: number
  matchLevel: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
  strategy: string
}

interface MatchModalProps {
  application: Application
  onClose: () => void
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500'
  const bg = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-red-50'
  return (
    <div className={`w-20 h-20 rounded-full ${bg} flex flex-col items-center justify-center shrink-0`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-gray-400">分</span>
    </div>
  )
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items?.length) return null
  return (
    <div>
      <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${color}`}>{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex gap-2">
            <span className="text-gray-300 shrink-0">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MatchModal({ application, onClose }: MatchModalProps) {
  const jdText = [application.jdRequire, application.jdDesc].filter(Boolean).join('\n\n')

  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumeId, setResumeId] = useState<string>(application.resumeId || '')
  const [loading, setLoading] = useState(false)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState('')
  const [showJd, setShowJd] = useState(false)

  // 加载简历列表
  useEffect(() => {
    fetch('/api/resumes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data)
      })
      .catch(console.error)
      .finally(() => setLoadingResumes(false))
  }, [])

  const handleAnalyze = async () => {
    if (!resumeId) {
      setError('请选择一份简历')
      return
    }
    if (!jdText.trim()) {
      setError('该岗位暂无 JD 内容，请先在编辑中填写')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText, resumeId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '分析失败')
      }

      const data: MatchResult = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const levelColor =
    result?.matchLevel === '高匹配'
      ? 'text-green-600 bg-green-50'
      : result?.matchLevel === '中匹配'
      ? 'text-yellow-600 bg-yellow-50'
      : 'text-red-600 bg-red-50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              AI 匹配分析
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{application.company} · {application.position}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* JD 预览（可折叠） */}
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowJd(!showJd)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <span>JD 内容（{jdText ? `${jdText.length} 字` : '未填写'}）</span>
              {showJd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showJd && (
              <div className="px-4 pb-3 max-h-40 overflow-y-auto">
                {jdText ? (
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{jdText}</p>
                ) : (
                  <p className="text-xs text-gray-400">暂无 JD 内容，请先在编辑中填写岗位要求/描述字段。</p>
                )}
              </div>
            )}
          </div>

          {/* 简历选择 */}
          {!result && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                选择简历 <span className="text-red-500">*</span>
              </label>
              {loadingResumes ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  加载简历库...
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
                    <option key={r.id} value={r.id}>
                      {r.name}（{r.filename}）
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* 分析按钮 */}
          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={loading || !resumeId || loadingResumes}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  开始匹配分析
                </>
              )}
            </button>
          )}

          {/* 分析结果 */}
          {result && (
            <div className="space-y-4">
              {/* 评分卡 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <ScoreRing score={result.score} />
                <div className="min-w-0">
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${levelColor}`}>
                    {result.matchLevel}
                  </span>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{result.strategy}</p>
                </div>
              </div>

              {/* 详细分析 */}
              <div className="space-y-4">
                <Section title="匹配优势" items={result.strengths} color="text-green-600" />
                <Section title="能力缺口" items={result.gaps} color="text-red-500" />
                <Section title="简历优化建议" items={result.suggestions} color="text-violet-600" />
              </div>

              {/* 重新分析 */}
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
