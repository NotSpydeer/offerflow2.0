'use client'

// 状态标签组件
import { cn, STATUS_COLORS } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        STATUS_COLORS[status] || 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {status}
    </span>
  )
}
