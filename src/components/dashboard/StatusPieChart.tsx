'use client'

// 状态分布饼图
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Stats } from '@/types'

interface StatusPieChartProps {
  data: Stats['statusDistribution']
}

// 状态对应颜色
const STATUS_CHART_COLORS: Record<string, string> = {
  未投递: '#94a3b8',
  已投递: '#60a5fa',
  简历通过: '#34d399',
  一面: '#fbbf24',
  二面: '#f97316',
  HR面: '#a78bfa',
  Offer: '#10b981',
  已拒: '#f87171',
  无回复: '#d1d5db',
}

const DEFAULT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#f87171',
  '#a78bfa', '#34d399', '#fbbf24', '#94a3b8',
]

export function StatusPieChart({ data }: StatusPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
        暂无数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="count"
          nameKey="status"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.status}
              fill={STATUS_CHART_COLORS[entry.status] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} 条`, name]}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
