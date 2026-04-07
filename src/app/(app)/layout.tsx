'use client'

// (app) 路由组专属 layout
// 所有内部页面（dashboard/applications/resumes/interviews）均走此 layout
// 包含：AuthGuard（路由守卫）+ Sidebar + Header

import { AuthGuard } from '@/components/auth/AuthGuard'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { usePathname } from 'next/navigation'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50/50" key={pathname}>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
