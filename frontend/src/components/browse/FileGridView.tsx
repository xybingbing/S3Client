// 文件网格视图（图标卡片）
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { FileTypeIcon } from '@/components/ui/FileIcon'
import { formatSize, highlightSegments } from '@/lib/format'
import type { ObjectItem } from '@/types'

interface FileGridViewProps {
  items: ObjectItem[]
  keyword: string
  selected: Set<string>
  loading: boolean
  error: string
  onItemClick: (item: ObjectItem, index: number, event: MouseEvent) => void
  onItemOpen: (item: ObjectItem) => void
  onItemContextMenu: (item: ObjectItem, index: number, event: MouseEvent) => void
  onBlankClick: () => void
}

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  const segments = highlightSegments(text, keyword)
  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded bg-accent-200 px-0.5 text-accent-900 dark:bg-accent-500/40 dark:text-accent-100">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}

export function FileGridView({
  items,
  keyword,
  selected,
  loading,
  error,
  onItemClick,
  onItemOpen,
  onItemContextMenu,
  onBlankClick,
}: FileGridViewProps) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-zinc-400">
        <Loader2 size={16} className="animate-spin" />
        正在加载…
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-zinc-400">
        {keyword ? '没有匹配的项目' : '此处暂无内容'}
      </div>
    )
  }

  return (
    <div
      className="min-h-0 flex-1 overflow-auto p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBlankClick()
      }}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
        {items.map((item, index) => (
          <button
            key={item.key}
            onClick={(event) => onItemClick(item, index, event)}
            onDoubleClick={() => onItemOpen(item)}
            onContextMenu={(event) => onItemContextMenu(item, index, event)}
            className={clsx(
              'flex select-none flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition',
              selected.has(item.key)
                ? 'border-accent-500/50 bg-accent-500/10'
                : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
            )}
          >
            <FileTypeIcon item={item} size={40} />
            <span className="w-full truncate text-xs text-zinc-700 dark:text-zinc-200" title={item.name}>
              <Highlight text={item.name} keyword={keyword} />
            </span>
            <span className="text-[11px] text-zinc-400">
              {item.isFolder ? '文件夹' : formatSize(item.size)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}