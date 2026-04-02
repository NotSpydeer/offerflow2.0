// 🔧 修改 - 根 layout 剥为纯壳
// Sidebar / Header 已移至 src/app/(app)/layout.tsx
// 登录页和 Landing Page 不需要 Sidebar

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OfferFlow - AI求职决策引擎',
  description: '用 AI 做更聪明的求职决策',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white">
        {children}
      </body>
    </html>
  )
}
