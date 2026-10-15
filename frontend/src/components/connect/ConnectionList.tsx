// 已保存连接列表：选择、编辑、删除
import clsx from 'clsx'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import type { ConnectionConfig } from '@/types'

interface ConnectionListProps {
  connections: ConnectionConfig[]
  activeId: string
  editingId: string
  onOpen: (cfg: ConnectionConfig) => void
  onEdit: (cfg: ConnectionConfig) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export function ConnectionList({
  connections,
  activeId,
  editingId,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}: ConnectionListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          已保存的连接
        </span>
        <button className="toolbar-btn" onClick={onCreate} title="新建连接">
          <Plus size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-auto px-3 pb-3 pt-1">
        {connections.length === 0 && (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-zinc-400">
            暂无连接配置
            <br />
            点击右上角 + 新建
          </p>
        )}

        {connections.map((cfg) => {
          const editing = cfg.id === editingId
          const active = cfg.id === activeId
          return (
            <div
              key={cfg.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(cfg)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(cfg)
                }
              }}
              className={clsx(
                'group flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition',
                editing
                  ? 'bg-accent-500/10 ring-1 ring-accent-500/40'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70',
              )}
            >
              <span
                className={clsx(
                  'flex h-8 w-8 flex-none items-center justify-center rounded-lg text-sm font-semibold text-white',
                  active ? 'bg-accent-500' : 'bg-zinc-400 dark:bg-zinc-600',
                )}
              >
                {(cfg.name || '?').slice(0, 1).toUpperCase()}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {cfg.name || '未命名连接'}
                  </span>
                  {active && <Check size={13} className="flex-none text-accent-600 dark:text-accent-400" />}
                </span>
                <span className="block truncate font-mono text-[11px] text-zinc-400">
                  {cfg.endpoint || '未填写地址'}
                </span>
              </span>

              <span className="flex flex-none items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  className="toolbar-btn h-7 w-7"
                  title="编辑"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(cfg)
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="toolbar-btn h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="删除"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(cfg.id)
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
