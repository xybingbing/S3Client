// 侧边栏：连接信息、收藏夹、存储桶列表
import clsx from 'clsx'
import { ChevronDown, Database, HardDrive, Loader2, Settings2, Star } from 'lucide-react'
import { useState } from 'react'
import { useBrowseStore } from '@/store/useBrowseStore'
import { useConnectionStore } from '@/store/useConnectionStore'
import type { BucketInfo, ConnectionConfig } from '@/types'

interface SidebarProps {
  connection?: ConnectionConfig
  buckets: BucketInfo[]
  loading: boolean
  onGoConnect: () => void
}

interface BucketRowProps {
  name: string
  active: boolean
  onOpen: (name: string) => void
}

function BucketRow({ name, active, onOpen }: BucketRowProps) {
  return (
    <button
      onClick={() => onOpen(name)}
      className={clsx(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition',
        active
          ? 'bg-accent-500/10 text-accent-700 dark:text-accent-400'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70',
      )}
    >
      <Database size={14} className="flex-none text-zinc-400" />
      <span className="truncate font-mono">{name}</span>
    </button>
  )
}

export function Sidebar({ connection, buckets, loading, onGoConnect }: SidebarProps) {
  const bucket = useBrowseStore((state) => state.bucket)
  const navigate = useBrowseStore((state) => state.navigate)
  const favorites = useConnectionStore((state) => state.preferences.favorites)

  const [bucketsOpen, setBucketsOpen] = useState(true)

  return (
    <aside className="panel flex w-60 flex-none flex-col border-r">
      {/* 当前连接 */}
      <div className="p-3">
        <button
          className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 px-3 py-2.5 text-left transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
          onClick={onGoConnect}
          title="切换连接"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent-500 text-sm font-semibold text-white">
            {(connection?.name || '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {connection?.name || '未选择连接'}
            </span>
            <span className="block truncate font-mono text-[11px] text-zinc-400">
              {connection?.endpoint || '—'}
            </span>
          </span>
          <Settings2 size={14} className="flex-none text-zinc-400" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        {/* 收藏夹 */}
        {favorites.length > 0 && (
          <div className="mb-4">
            <p className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Star size={12} />
              收藏
            </p>
            <div className="space-y-0.5">
              {favorites.map((fav) => {
                const active = bucket === fav.bucket
                return (
                  <button
                    key={fav.id}
                    onClick={() => navigate(fav.bucket, fav.prefix)}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition',
                      active
                        ? 'bg-accent-500/10 text-accent-700 dark:text-accent-400'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70',
                    )}
                  >
                    <Star size={14} className="flex-none text-amber-400" />
                    <span className="truncate">{fav.label || fav.prefix || fav.bucket}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 存储桶 */}
        <div>
          <div className="mb-1 flex items-center">
            <button
              className="flex flex-1 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400"
              onClick={() => setBucketsOpen((prev) => !prev)}
            >
              <ChevronDown
                size={12}
                className={clsx('transition-transform', !bucketsOpen && '-rotate-90')}
              />
              存储桶
              {loading && <Loader2 size={12} className="animate-spin" />}
            </button>
          </div>

          {bucketsOpen && (
            <div className="space-y-0.5">
              {buckets.length === 0 && !loading && (
                <p className="px-2.5 py-3 text-xs leading-relaxed text-zinc-400">
                  未能列出存储桶，请在连接设置中配置默认存储桶
                </p>
              )}

              {buckets.map((item) => (
                <BucketRow
                  key={item.name}
                  name={item.name}
                  active={bucket === item.name}
                  onOpen={(name) => navigate(name, '')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-zinc-100 px-3 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-800">
        <HardDrive size={12} />
        {buckets.length} 个存储桶
      </div>
    </aside>
  )
}