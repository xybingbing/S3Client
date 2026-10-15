// 面包屑导航
import clsx from 'clsx'
import { ChevronRight, HardDrive } from 'lucide-react'
import { splitPrefix } from '@/lib/format'
import { useBrowseStore } from '@/store/useBrowseStore'

export function Breadcrumb() {
  const bucket = useBrowseStore((state) => state.bucket)
  const prefix = useBrowseStore((state) => state.prefix)
  const navigate = useBrowseStore((state) => state.navigate)
  const segments = splitPrefix(prefix)

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden font-mono text-[13px]">
      <button
        className="flex flex-none items-center gap-1.5 rounded-md px-2 py-1 text-zinc-500 transition hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
        onClick={() => navigate('', '')}
      >
        <HardDrive size={13} />
        存储桶
      </button>

      {bucket && (
        <>
          <ChevronRight size={13} className="flex-none text-zinc-300 dark:text-zinc-600" />
          <button
            className={clsx(
              'flex-none truncate rounded-md px-2 py-1 transition',
              segments.length === 0
                ? 'font-medium text-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
            )}
            onClick={() => navigate(bucket, '')}
          >
            {bucket}
          </button>
        </>
      )}

      {segments.map((segment, index) => {
        const last = index === segments.length - 1
        return (
          <span key={segment.prefix} className="flex min-w-0 items-center">
            <ChevronRight size={13} className="flex-none text-zinc-300 dark:text-zinc-600" />
            <button
              className={clsx(
                'max-w-[160px] truncate rounded-md px-2 py-1 transition',
                last
                  ? 'font-medium text-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
              )}
              onClick={() => navigate(bucket, segment.prefix)}
            >
              {segment.label}
            </button>
          </span>
        )
      })}
    </div>
  )
}