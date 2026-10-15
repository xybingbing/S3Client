// 操作栏：上传、新建文件夹与针对选中项的批量操作
import { Copy, Download, FolderPlus, Pencil, Trash2, Upload } from 'lucide-react'
import type { ObjectItem } from '@/types'

interface ActionBarProps {
  selected: ObjectItem[]
  onUpload: () => void
  onNewFolder: () => void
  onDownload: () => void
  onCopy: () => void
  onRename: () => void
  onDelete: () => void
}

export function ActionBar({
  selected,
  onUpload,
  onNewFolder,
  onDownload,
  onCopy,
  onRename,
  onDelete,
}: ActionBarProps) {
  const count = selected.length
  const hasSelection = count > 0
  // 仅支持单个文件重命名
  const single = count === 1 && !selected[0].isFolder

  return (
    <div className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
      <button className="btn-primary h-8 px-3 text-[13px]" onClick={onUpload}>
        <Upload size={15} />
        上传
      </button>
      <button className="btn-ghost h-8 px-3 text-[13px]" onClick={onNewFolder}>
        <FolderPlus size={15} />
        新建文件夹
      </button>

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <button
        className="btn-ghost h-8 px-3 text-[13px]"
        disabled={!hasSelection}
        onClick={onDownload}
      >
        <Download size={15} />
        下载
      </button>
      <button className="btn-ghost h-8 px-3 text-[13px]" disabled={!hasSelection} onClick={onCopy}>
        <Copy size={15} />
        复制到
      </button>
      <button
        className="btn-ghost h-8 px-3 text-[13px]"
        disabled={!single}
        onClick={onRename}
      >
        <Pencil size={15} />
        重命名
      </button>
      <button
        className="btn-ghost h-8 px-3 text-[13px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        disabled={!hasSelection}
        onClick={onDelete}
      >
        <Trash2 size={15} />
        删除
      </button>

      <span className="ml-auto text-xs text-zinc-400">
        {hasSelection ? `已选择 ${count} 项` : '未选择任何项目'}
      </span>
    </div>
  )
}