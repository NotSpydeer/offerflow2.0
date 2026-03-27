// 工具函数集合

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日期格式化
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd', { locale: zhCN })
}

// 相对时间（如"3天前"）
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN })
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 状态颜色映射
export const STATUS_COLORS: Record<string, string> = {
  未投递: 'bg-gray-100 text-gray-600',
  已投递: 'bg-blue-100 text-blue-700',
  简历通过: 'bg-cyan-100 text-cyan-700',
  一面: 'bg-yellow-100 text-yellow-700',
  二面: 'bg-orange-100 text-orange-700',
  HR面: 'bg-purple-100 text-purple-700',
  Offer: 'bg-green-100 text-green-700',
  已拒: 'bg-red-100 text-red-600',
  无回复: 'bg-slate-100 text-slate-500',
}

// 状态列表（用于下拉）
export const STATUS_LIST = [
  '未投递',
  '已投递',
  '简历通过',
  '一面',
  '二面',
  'HR面',
  'Offer',
  '已拒',
  '无回复',
]

// 渠道列表
export const CHANNEL_LIST = ['官网', 'BOSS', '猎聘', '内推', '其他']

// 面试轮次
export const ROUND_LIST = ['一面', '二面', '三面', 'HR面', '终面', '笔试', '其他']

// 看板列分组
export const KANBAN_COLUMNS = [
  { id: 'pending', label: '待投递', statuses: ['未投递'] },
  { id: 'applied', label: '已投递', statuses: ['已投递', '简历通过', '无回复'] },
  { id: 'interviewing', label: '面试中', statuses: ['一面', '二面', '三面', 'HR面'] },
  { id: 'offer', label: 'Offer', statuses: ['Offer'] },
  { id: 'rejected', label: '已拒', statuses: ['已拒'] },
]

// 渠道颜色
export const CHANNEL_COLORS: Record<string, string> = {
  官网: '#6366f1',
  BOSS: '#f59e0b',
  猎聘: '#10b981',
  内推: '#3b82f6',
  其他: '#94a3b8',
}
