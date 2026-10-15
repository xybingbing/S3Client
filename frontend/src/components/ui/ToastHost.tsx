// 全局提示容器
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import type { ToastType } from '@/store/useUiStore'

const STYLES: Record<ToastType, { Icon: typeof Info; cls: string }> = {
  success: { Icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400' },
  error: { Icon: AlertCircle, cls: 'text-red-600 dark:text-red-400' },
  info: { Icon: Info, cls: 'text-sky-600 dark:text-sky-400' },
}

export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts)
  const removeToast = useUiStore((state) => state.removeToast)

  return (
    <div className="pointer-events-none fixed bottom-14 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((toast) => {
        const { Icon, cls } = STYLES[toast.type]
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-fade-up items-start gap-2.5 rounded-xl border border-zinc-200 bg-white/95 px-3.5 py-3 text-sm shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
          >
            <Icon size={16} className={`mt-0.5 flex-none ${cls}`} />
            <span className="flex-1 leading-snug text-zinc-700 dark:text-zinc-200">{toast.message}</span>
            <button
              className="text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
              onClick={() => removeToast(toast.id)}
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}