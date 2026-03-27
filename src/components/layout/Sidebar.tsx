'use client'

// 侧边栏导航组件
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: '数据统计',
  },
  {
    href: '/applications',
    label: '岗位投递',
    icon: Briefcase,
    description: '投递管理',
  },
  {
    href: '/resumes',
    label: '简历管理',
    icon: FileText,
    description: '版本管理',
  },
  {
    href: '/interviews',
    label: '面试记录',
    icon: CalendarCheck,
    description: '面试流程',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Logo区域 */}
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none">OfferFlow</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">求职管理系统</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150 group',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-gray-400" />}
            </Link>
          )
        })}
      </nav>

      {/* 底部版本信息 */}
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">OfferFlow v0.1.0</p>
      </div>
    </aside>
  )
}
