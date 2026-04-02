'use client'

// ✅ 新增 - 登录页
// 假登录：admin / 123456 → localStorage token → 跳转 /dashboard
// 已登录访问此页 → 自动跳 /dashboard

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, isAuthenticated } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 已登录 → 跳回 dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 模拟网络延迟，增加真实感
    await new Promise((r) => setTimeout(r, 600))

    const token = login(username, password)
    if (token) {
      router.replace('/dashboard')
    } else {
      setError('用户名或密码错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* 卡片 */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-8 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold tracking-tight">OF</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-none">OfferFlow</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">AI求职决策引擎</p>
            </div>
          </div>

          {/* 标题 */}
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-gray-900 leading-snug">
              用 AI 做更聪明的<br />求职决策
            </h2>
            <p className="text-sm text-gray-400 mt-1.5">登录你的账户继续使用</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors disabled:opacity-60"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors disabled:opacity-60"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* 提示 */}
          <p className="text-center text-xs text-gray-300 mt-6">
            演示账号：admin / 123456
          </p>
        </div>
      </div>
    </div>
  )
}
