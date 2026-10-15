// 底部状态栏
import clsx from 'clsx'
import { Cloud, FolderTree, Loader2 } from 'lucide-react'
import { useBrowseStore } from '@/store/useBrowseStore'
import { useTransferStore } from '@/store/useTransferStore'
import type { ConnectionConfig } from '@/types'

interface StatusBarProps {
  connection?: ConnectionConfig
  folderCount: number
  fileCount: number
  onOpenTransfers: () => void
}

export function StatusBar({ connection, folderCount, fileCount, onOpenTransfers }: StatusBarProps) {
  const bucket = useBrowseStore((state) => state.bucket)
  const prefix = useBrowseStore((state) => state.prefix)
  const selected = useBrowseStore((state) => state.selected)
  const loading = useBrowseStore((state) => state.loading)
  const tasks = useTransferStore((state) => state.tasks)

  const activeCount = tasks.filter(
    (task) => task.status === 'running' || task.status === 'pending',
  ).length

  return (
    <div className="flex h-7 flex-none items-center gap-3 border-t border-zinc-200 bg-zinc-50 px-3 text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex items-center gap-1.5">
        <Cloud size={12} />
        {connection?.name || '未连接'}
      </span>

      <span className="flex min-w-0 items-center gap-1.5 font-mono">
        <FolderTree size={12} className="flex-none" />
        <span className="truncate">
          {bucket ? `${bucket}/${prefix}` : '未选择存储桶'}
        </span>
      </span>

      <span className="ml-auto flex items-center gap-3">
        {loading && (
          <span className="flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" />
            加载中
          </span>
        )}
        <span>
          {folderCount} 个文件夹 · {fileCount} 个文件
        </span>
        {selected.length > 0 && <span className="text-accent-600 dark:text-accent-400">已选 {selected.length} 项</span>}
        <button
          className={clsx(
            'transition hover:text-zinc-600 dark:hover:text-zinc-200',
            activeCount > 0 && 'text-accent-600 dark:text-accent-400',
          )}
          onClick={onOpenTransfers}
        >
          {activeCount > 0 ? `${activeCount} 个任务传输中` : '传输中心'}
        </button>
      </span>
    </div>
  )
}