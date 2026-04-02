'use client'

// ✅ 新增 - 客户端路由守卫
// 未登录 → redirect /login；已登录 → 渲染 children

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      // 未登录，跳转到登录页（replace 不留历史记录）
      router.replace('/login')
    } else {
      setVerified(true)
    }
  }, [router])

  // 验证完成前不渲染内容，防止闪烁
  if (!verified) return null

  return <>{children}</>
}
