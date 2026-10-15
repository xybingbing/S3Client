// 通用右键上下文菜单
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'

export interface MenuEntry {
  label: string
  icon?: LucideIcon
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  entries: MenuEntry[]
  onClose: () => void
}

export function ContextMenu({ x, y, entries, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    window.addEventListener('resize', close)
    window.addEventListener('wheel', close, { passive: true })
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('wheel', close)
    }
  }, [onClose])

  // 防止菜单溢出视口
  const width = 220
  const height = entries.length * 36 + 12
  const left = Math.min(x, window.innerWidth - width - 8)
  const top = Math.min(y, window.innerHeight - height - 8)

  return (
    <div
      ref={ref}
      className="fixed z-[70] w-[220px] animate-scale-in overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-1.5 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
      style={{ left, top }}
      onClick={(event) => event.stopPropagation()}
    >
      {entries.map((entry, index) => {
        const Icon = entry.icon
        return (
          <button
            key={`${entry.label}-${index}`}
            disabled={entry.disabled}
            onClick={() => {
              if (entry.disabled) return
              entry.onClick()
              onClose()
            }}
            className={clsx(
              'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition',
              entry.disabled
                ? 'cursor-not-allowed text-zinc-300 dark:text-zinc-600'
                : entry.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
            )}
          >
            {Icon && <Icon size={15} className="flex-none" />}
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}