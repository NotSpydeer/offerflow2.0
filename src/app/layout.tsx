import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'OfferFlow - 求职管理系统',
  description: '系统化管理求职投递记录、简历版本和面试流程',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white">
        <div className="flex h-screen overflow-hidden">
          {/* 侧边栏 */}
          <Sidebar />

          {/* 主内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-gray-50/50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
