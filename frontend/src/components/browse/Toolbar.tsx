// 顶部工具栏：导航、面包屑、搜索、视图与主题切换
import clsx from 'clsx'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  LayoutGrid,
  List,
  Moon,
  RefreshCw,
  Search,
  Sun,
  X,
} from 'lucide-react'
import { Breadcrumb } from '@/components/browse/Breadcrumb'
import { useBrowseStore } from '@/store/useBrowseStore'
import { useConnectionStore } from '@/store/useConnectionStore'
import { useTransferStore } from '@/store/useTransferStore'

interface ToolbarProps {
  onRefresh: () => void
  onOpenTransfers: () => void
}

export function Toolbar({ onRefresh, onOpenTransfers }: ToolbarProps) {
  const { history, historyIndex, keyword, setKeyword, goBack, goForward, goUp } = useBrowseStore()
  const viewMode = useConnectionStore((state) => state.preferences.viewMode)
  const theme = useConnectionStore((state) => state.preferences.theme)
  const updatePreferences = useConnectionStore((state) => state.updatePreferences)
  const tasks = useTransferStore((state) => state.tasks)

  const canBack = historyIndex > 0
  const canForward = historyIndex < history.length - 1
  const activeCount = tasks.filter(
    (task) => task.status === 'running' || task.status === 'pending',
  ).length

  return (
    <div className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <button className="toolbar-btn" disabled={!canBack} onClick={goBack} title="后退">
        <ArrowLeft size={16} />
      </button>
      <button className="toolbar-btn" disabled={!canForward} onClick={goForward} title="前进">
        <ArrowRight size={16} />
      </button>
      <button className="toolbar-btn" onClick={goUp} title="上一级">
        <ArrowUp size={16} />
      </button>
      <button className="toolbar-btn" onClick={onRefresh} title="刷新">
        <RefreshCw size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <Breadcrumb />

      <div className="relative flex-none">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          className="field h-8 w-52 pl-8 pr-7 text-[13px]"
          placeholder="搜索当前目录"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        {keyword && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            onClick={() => setKeyword('')}
            title="清除"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <button
        className="toolbar-btn"
        onClick={() => updatePreferences({ viewMode: viewMode === 'list' ? 'grid' : 'list' })}
        title={viewMode === 'list' ? '切换为网格视图' : '切换为列表视图'}
      >
        {viewMode === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
      </button>
      <button
        className="toolbar-btn"
        onClick={() => updatePreferences({ theme: theme === 'dark' ? 'light' : 'dark' })}
        title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        className={clsx('toolbar-btn relative', activeCount > 0 && 'text-accent-600 dark:text-accent-400')}
        onClick={onOpenTransfers}
        title="传输中心"
      >
        <ArrowUpDown size={16} />
        {activeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  )
}
