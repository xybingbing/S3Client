// 文件列表视图（表格）
import clsx from 'clsx'
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { FileTypeIcon } from '@/components/ui/FileIcon'
import { formatDate, formatSize, highlightSegments } from '@/lib/format'
import type { ObjectItem, SortField, SortState } from '@/types'

interface FileTableViewProps {
  items: ObjectItem[]
  keyword: string
  selected: Set<string>
  loading: boolean
  error: string
  sort: SortState
  onSort: (field: SortField) => void
  onItemClick: (item: ObjectItem, index: number, event: MouseEvent) => void
  onItemOpen: (item: ObjectItem) => void
  onItemContextMenu: (item: ObjectItem, index: number, event: MouseEvent) => void
  onBlankClick: () => void
}

const GRID_COLS = 'grid grid-cols-[minmax(0,1fr)_5.5rem_10.5rem_6rem]'

function SortHeader({
  field,
  label,
  sort,
  onSort,
  className,
}: {
  field: SortField
  label: string
  sort: SortState
  onSort: (field: SortField) => void
  className?: string
}) {
  const active = sort.field === field
  const Icon = !active ? ChevronsUpDown : sort.order === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      className={clsx(
        'flex items-center gap-1 transition hover:text-zinc-700 dark:hover:text-zinc-200',
        active ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400',
        className,
      )}
      onClick={() => onSort(field)}
    >
      {label}
      <Icon size={12} />
    </button>
  )
}

/** 高亮搜索结果中的匹配片段 */
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

export function FileTableView({
  items,
  keyword,
  selected,
  loading,
  error,
  sort,
  onSort,
  onItemClick,
  onItemOpen,
  onItemContextMenu,
  onBlankClick,
}: FileTableViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 表头 */}
      <div
        className={clsx(
          GRID_COLS,
          'flex-none items-center gap-3 border-b border-zinc-200 px-4 py-2 text-[11px] font-medium uppercase tracking-wide dark:border-zinc-800',
        )}
      >
        <SortHeader field="name" label="名称" sort={sort} onSort={onSort} />
        <SortHeader field="size" label="大小" sort={sort} onSort={onSort} className="justify-end" />
        <SortHeader field="lastModified" label="修改时间" sort={sort} onSort={onSort} />
        <span className="text-zinc-400">存储类别</span>
      </div>

      {/* 列表 */}
      <div
        className="min-h-0 flex-1 overflow-auto py-1"
        onClick={(event) => {
          if (event.target === event.currentTarget) onBlankClick()
        }}
      >
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            正在加载…
          </div>
        )}

        {!loading && error && (
          <div className="mx-4 my-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-16 text-center text-sm text-zinc-400">
            {keyword ? '没有匹配的项目' : '此处暂无内容'}
          </div>
        )}

        {!loading &&
          !error &&
          items.map((item, index) => (
            <div
              key={item.key}
              onClick={(event) => onItemClick(item, index, event)}
              onDoubleClick={() => onItemOpen(item)}
              onContextMenu={(event) => onItemContextMenu(item, index, event)}
              className={clsx(
                GRID_COLS,
                'cursor-default select-none items-center gap-3 px-4 py-1.5 text-[13px] transition',
                selected.has(item.key)
                  ? 'bg-accent-500/15 dark:bg-accent-500/20'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileTypeIcon item={item} size={17} className="flex-none" />
                <span className="truncate text-zinc-800 dark:text-zinc-100">
                  <Highlight text={item.name} keyword={keyword} />
                </span>
              </div>
              <span className="text-right font-mono text-xs text-zinc-400">
                {item.isFolder ? '—' : formatSize(item.size)}
              </span>
              <span className="truncate font-mono text-xs text-zinc-400">
                {item.isFolder ? '—' : formatDate(item.lastModified)}
              </span>
              <span className="truncate text-xs text-zinc-400">
                {item.isFolder ? '' : item.storageClass || '——'}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}