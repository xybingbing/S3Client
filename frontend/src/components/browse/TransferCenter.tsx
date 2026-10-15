// 传输中心：展示上传/下载任务进度
import clsx from 'clsx'
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { bridge } from '@/lib/bridge'
import { formatSize } from '@/lib/format'
import { useTransferStore } from '@/store/useTransferStore'
import type { TransferTask } from '@/types'

interface TransferCenterProps {
  open: boolean
  onClose: () => void
}

function StatusIcon({ status }: { status: TransferTask['status'] }) {
  if (status === 'success') return <CheckCircle2 size={16} className="text-emerald-500" />
  if (status === 'error') return <AlertCircle size={16} className="text-red-500" />
  if (status === 'canceled') return <Ban size={16} className="text-zinc-400" />
  return <Loader2 size={16} className="animate-spin text-accent-500" />
}

function TaskRow({ task, now }: { task: TransferTask; now: number }) {
  const removeTask = useTransferStore((state) => state.removeTask)

  const percent = task.total > 0 ? Math.min(100, Math.round((task.loaded / task.total) * 100)) : 0
  const elapsed = (now - task.startedAt) / 1000
  const speed = task.status === 'running' && elapsed > 0 ? task.loaded / elapsed : 0
  const isActive = task.status === 'running' || task.status === 'pending'
  const TypeIcon = task.type === 'upload' ? ArrowUpFromLine : ArrowDownToLine

  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-2.5">
        <TypeIcon
          size={16}
          className={clsx('flex-none', task.type === 'upload' ? 'text-sky-500' : 'text-emerald-500')}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-100">
            {task.name}
          </div>
          <div className="truncate font-mono text-[11px] text-zinc-400">{task.bucket}</div>
        </div>
        <StatusIcon status={task.status} />
        <button
          className="toolbar-btn h-6 w-6"
          title={isActive ? '取消' : '移除'}
          onClick={() => {
            if (isActive) void bridge.cancelTransfer(task.id)
            else removeTask(task.id)
          }}
        >
          <X size={13} />
        </button>
      </div>

      <div className="mt-2.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              task.status === 'error'
                ? 'bg-red-500'
                : task.status === 'success'
                  ? 'bg-emerald-500'
                  : 'bg-accent-500',
            )}
            style={{ width: `${isActive && task.total === 0 ? 40 : percent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-mono">
            {formatSize(task.loaded)}
            {task.total > 0 ? ` / ${formatSize(task.total)}` : ''}
          </span>
          <span>
            {task.status === 'error'
              ? task.error || '传输失败'
              : task.status === 'success'
                ? '已完成'
                : task.status === 'canceled'
                  ? '已取消'
                  : speed > 0
                    ? `${formatSize(speed)}/s · ${percent}%`
                    : '等待中'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function TransferCenter({ open, onClose }: TransferCenterProps) {
  const tasks = useTransferStore((state) => state.tasks)
  const clearFinished = useTransferStore((state) => state.clearFinished)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-96 animate-slide-up flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">传输中心</h3>
          <div className="flex items-center gap-1">
            <button
              className="toolbar-btn w-auto px-2 text-xs"
              onClick={clearFinished}
              disabled={!tasks.some((task) => task.status !== 'running' && task.status !== 'pending')}
              title="清除已完成"
            >
              清除已完成
            </button>
            <button className="toolbar-btn" onClick={onClose} title="关闭">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-auto p-4">
          {tasks.length === 0 && (
            <div className="py-16 text-center text-sm text-zinc-400">暂无传输任务</div>
          )}
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} now={now} />
          ))}
        </div>
      </div>
    </div>
  )
}