'use client'

// 顶部 Header 组件
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: '求职数据总览' },
  '/applications': { title: '岗位投递', subtitle: '管理所有投递记录' },
  '/resumes': { title: '简历管理', subtitle: '多版本简历管理' },
  '/interviews': { title: '面试记录', subtitle: '面试流程和复盘' },
}

export function Header() {
  const pathname = usePathname()

  // 匹配当前路径
  const pageKey = Object.keys(PAGE_TITLES).find(
    (key) => pathname === key || pathname.startsWith(key + '/')
  )
  const pageInfo = pageKey ? PAGE_TITLES[pageKey] : { title: 'OfferFlow', subtitle: '' }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 leading-none">
          {pageInfo.title}
        </h2>
        {pageInfo.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{pageInfo.subtitle}</p>
        )}
      </div>
    </header>
  )
}
