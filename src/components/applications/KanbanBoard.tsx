'use client'

// 看板视图组件（拖拽Kanban）
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { StatusBadge } from './StatusBadge'
import { formatDate, KANBAN_COLUMNS, cn } from '@/lib/utils'
import type { Application } from '@/types'
import { Pencil, Trash2, Building2, Calendar } from 'lucide-react'

interface KanbanBoardProps {
  applications: Application[]
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}

export function KanbanBoard({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanBoardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // 按看板列分组
  const getColumnApps = (columnId: string) => {
    const col = KANBAN_COLUMNS.find((c) => c.id === columnId)
    if (!col) return []
    return applications.filter((app) => col.statuses.includes(app.status))
  }

  // 拖拽结束处理
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination || destination.droppableId === source.droppableId) return

    // 找到目标列对应的第一个状态
    const targetCol = KANBAN_COLUMNS.find((c) => c.id === destination.droppableId)
    if (!targetCol) return

    const newStatus = targetCol.statuses[0]
    onStatusChange(draggableId, newStatus)
  }

  // 看板列颜色
  const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
    pending: { header: 'text-gray-600', dot: 'bg-gray-400' },
    applied: { header: 'text-blue-600', dot: 'bg-blue-400' },
    interviewing: { header: 'text-amber-600', dot: 'bg-amber-400' },
    offer: { header: 'text-emerald-600', dot: 'bg-emerald-400' },
    rejected: { header: 'text-red-500', dot: 'bg-red-400' },
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colApps = getColumnApps(col.id)
          const style = COLUMN_STYLES[col.id] || { header: 'text-gray-600', dot: 'bg-gray-400' }

          return (
            <div key={col.id} className="flex-shrink-0 w-64">
              {/* 列头 */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={cn('w-2 h-2 rounded-full', style.dot)} />
                <span className={cn('text-xs font-semibold', style.header)}>
                  {col.label}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">
                  {colApps.length}
                </span>
              </div>

              {/* 卡片区域 */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'min-h-[100px] rounded-xl p-2 space-y-2 transition-colors',
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-gray-100/50'
                    )}
                  >
                    {colApps.map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'bg-white rounded-lg p-3 border group cursor-grab active:cursor-grabbing transition-shadow',
                              snapshot.isDragging
                                ? 'shadow-lg border-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            )}
                          >
                            {/* 卡片内容 */}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {app.position}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-500 truncate">{app.company}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <StatusBadge status={app.status} />
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(app.appliedDate)}
                                </div>
                              </div>

                              {app.resume && (
                                <p className="text-xs text-gray-400 truncate">
                                  📄 {app.resume.name}
                                </p>
                              )}

                              {/* 操作按钮（悬停显示）*/}
                              <div className="flex items-center justify-end gap-1 pt-1 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit(app) }}
                                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {deleteConfirm === app.id ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onDelete(app.id); setDeleteConfirm(null) }}
                                      className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                                    >
                                      确认
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null) }}
                                      className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                      取消
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(app.id) }}
                                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {colApps.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-6 text-xs text-gray-300">
                        拖入或添加岗位
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
