// 通用模态框
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export function Modal({ open, title, onClose, children, footer, width = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${width} animate-scale-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
          <button className="toolbar-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}