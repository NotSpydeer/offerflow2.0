'use client'

// 自动选最优简历弹窗
import { useState, useEffect } from 'react'
import { X, Loader2, Trophy, Star } from 'lucide-react'
import type { Application } from '@/types'

interface RankItem {
  resumeId: string
  resumeName: string
  score: number
  reason: string
}

interface RankResult {
  bestResumeId: string
  bestResumeName: string
  bestScore: number
  ranking: RankItem[]
}

interface ResumeRankModalProps {
  application: Application
  onClose: () => void
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  )
}

export function ResumeRankModal({ application, onClose }: ResumeRankModalProps) {
  const jdText = [application.jdRequire, application.jdDesc].filter(Boolean).join('\n\n')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<RankResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jdText.trim()) {
      setError('该岗位暂无 JD 内容，请先在编辑中填写')
      setLoading(false)
      return
    }

    fetch('/api/resume-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jdText }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '分析失败')
        }
        return res.json()
      })
      .then((data: RankResult) => setResult(data))
      .catch((e) => setError(e.message || '分析失败，请重试'))
      .finally(() => setLoading(false))
  }, [jdText])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              自动选最优简历
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* 加载中 */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm text-gray-500">正在分析简历库，请稍候...</p>
            </div>
          )}

          {/* 错误 */}
          {!loading && error && (
            <p className="text-sm text-red-500 py-4">{error}</p>
          )}

          {/* 结果 */}
          {!loading && result && (
            <div className="space-y-4">
              {/* 推荐卡 */}
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">推荐使用</span>
                </div>
                <p className="text-base font-semibold text-gray-900">{result.bestResumeName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ScoreBar score={result.bestScore} />
                </div>
                {result.ranking[0]?.reason && (
                  <p className="text-xs text-gray-500 mt-2">{result.ranking[0].reason}</p>
                )}
              </div>

              {/* 其余排名 */}
              {result.ranking.length > 1 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">其他简历</h4>
                  <div className="space-y-2">
                    {result.ranking.slice(1).map((item) => (
                      <div key={item.resumeId} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-700 flex-1 truncate">{item.resumeName}</span>
                        <ScoreBar score={item.score} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
