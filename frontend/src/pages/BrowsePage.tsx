// 文件管理器主界面
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCopy,
  Copy,
  Database,
  Download,
  FolderOpen,
  FolderPlus,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { ActionBar } from '@/components/browse/ActionBar'
import { BrowseModals, type DialogState } from '@/components/browse/BrowseModals'
import { ContextMenu, type MenuEntry } from '@/components/browse/ContextMenu'
import { FileGridView } from '@/components/browse/FileGridView'
import { FileTableView } from '@/components/browse/FileTableView'
import { Sidebar } from '@/components/browse/Sidebar'
import { StatusBar } from '@/components/browse/StatusBar'
import { Toolbar } from '@/components/browse/Toolbar'
import { TransferCenter } from '@/components/browse/TransferCenter'
import { useFileActions } from '@/hooks/useFileActions'
import { useObjectLoader } from '@/hooks/useObjectLoader'
import { useTransferBridge } from '@/hooks/useTransferBridge'
import { bridge } from '@/lib/bridge'
import { useBrowseStore, useSortedItems } from '@/store/useBrowseStore'
import { useConnectionStore } from '@/store/useConnectionStore'
import { useTransferStore } from '@/store/useTransferStore'
import { useUiStore } from '@/store/useUiStore'
import type { BucketInfo, ObjectItem } from '@/types'

export function BrowsePage() {
  const navigate = useNavigate()
  const [refreshToken, setRefreshToken] = useState(0)
  const refresh = useCallback(() => setRefreshToken((value) => value + 1), [])
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [bucketsLoading, setBucketsLoading] = useState(false)
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [menu, setMenu] = useState<{ x: number; y: number; entries: MenuEntry[] } | null>(null)

  const activeConnection = useObjectLoader(refreshToken)
  useTransferBridge()
  const actions = useFileActions(refresh)

  const bucket = useBrowseStore((state) => state.bucket)
  const prefix = useBrowseStore((state) => state.prefix)
  const selected = useBrowseStore((state) => state.selected)
  const anchorIndex = useBrowseStore((state) => state.anchorIndex)
  const keyword = useBrowseStore((state) => state.keyword)
  const sort = useBrowseStore((state) => state.sort)
  const loading = useBrowseStore((state) => state.loading)
  const error = useBrowseStore((state) => state.error)
  const toggleSort = useBrowseStore((state) => state.toggleSort)
  const setSelected = useBrowseStore((state) => state.setSelected)
  const setAnchor = useBrowseStore((state) => state.setAnchor)
  const navigateTo = useBrowseStore((state) => state.navigate)

  const viewMode = useConnectionStore((state) => state.preferences.viewMode)
  const activeId = useConnectionStore((state) => state.preferences.activeConnectionId)
  const favorites = useConnectionStore((state) => state.preferences.favorites)
  const toggleFavorite = useConnectionStore((state) => state.toggleFavorite)

  const panelOpen = useTransferStore((state) => state.panelOpen)
  const setPanelOpen = useTransferStore((state) => state.setPanelOpen)
  const pushToast = useUiStore((state) => state.pushToast)

  const { items, folders, files } = useSortedItems()

  // 无激活连接时回到连接页
  useEffect(() => {
    if (!activeConnection) navigate('/connect', { replace: true })
  }, [activeConnection, navigate])

  // 进入文件管理页（或切换连接）时，默认选中连接配置的存储桶
  useEffect(() => {
    const name = activeConnection?.bucket
    if (name) navigateTo(name, '')
  }, [activeConnection?.id, activeConnection?.bucket, navigateTo])

  // 加载存储桶
  useEffect(() => {
    if (!activeConnection) return
    let canceled = false
    setBucketsLoading(true)
    bridge
      .listBuckets(activeConnection)
      .then((list) => {
        if (!canceled) setBuckets(list)
      })
      .catch((error) => {
        if (!canceled) {
          pushToast(
            'error',
            `无法列出存储桶（可能缺少 ListBuckets 权限），请在左侧手动输入名称：${
              (error as Error)?.message ?? error
            }`,
          )
        }
      })
      .finally(() => {
        if (!canceled) setBucketsLoading(false)
      })
    return () => {
      canceled = true
    }
  }, [activeConnection, refreshToken, pushToast])

  // 关键字过滤
  const visibleItems = useMemo(() => {
    if (!keyword) return items
    const lower = keyword.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(lower))
  }, [items, keyword])

  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.key)),
    [items, selected],
  )

  const favorited = favorites.some(
    (fav) => fav.connectionId === activeId && fav.bucket === bucket && fav.prefix === prefix,
  )

  const copyPath = useCallback(
    async (targets: ObjectItem[]) => {
      try {
        await navigator.clipboard.writeText(targets.map((item) => item.key).join('\n'))
        pushToast('success', '路径已复制到剪贴板')
      } catch {
        pushToast('error', '复制失败')
      }
    },
    [pushToast],
  )

  const handleItemOpen = useCallback(
    (item: ObjectItem) => {
      if (item.isFolder) navigateTo(bucket, item.key)
      else void actions.download([item])
    },
    [bucket, navigateTo, actions],
  )

  const handleItemClick = useCallback(
    (item: ObjectItem, index: number, event: React.MouseEvent) => {
      if (event.shiftKey && anchorIndex >= 0 && anchorIndex < visibleItems.length) {
        const start = Math.min(anchorIndex, index)
        const end = Math.max(anchorIndex, index)
        setSelected(visibleItems.slice(start, end + 1).map((entry) => entry.key))
        return
      }
      if (event.metaKey || event.ctrlKey) {
        setSelected(
          selected.includes(item.key)
            ? selected.filter((key) => key !== item.key)
            : [...selected, item.key],
        )
        setAnchor(index)
        return
      }
      setSelected([item.key])
      setAnchor(index)
    },
    [anchorIndex, visibleItems, selected, setSelected, setAnchor],
  )

  const handleItemContextMenu = useCallback(
    (item: ObjectItem, index: number, event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const targets = selected.includes(item.key) ? selectedItems : [item]
      if (!selected.includes(item.key)) {
        setSelected([item.key])
        setAnchor(index)
      }
      const singleFile = targets.length === 1 && !targets[0].isFolder
      setMenu({
        x: event.clientX,
        y: event.clientY,
        entries: [
          {
            label: '打开',
            icon: FolderOpen,
            disabled: !item.isFolder,
            onClick: () => handleItemOpen(item),
          },
          { label: '下载', icon: Download, onClick: () => void actions.download(targets) },
          {
            label: '重命名',
            icon: Pencil,
            disabled: !singleFile,
            onClick: () => setDialog({ type: 'rename', target: targets[0] }),
          },
          { label: '复制到', icon: Copy, onClick: () => setDialog({ type: 'copy', targets }) },
          { label: '复制路径', icon: ClipboardCopy, onClick: () => void copyPath(targets) },
          {
            label: '删除',
            icon: Trash2,
            danger: true,
            onClick: () => setDialog({ type: 'delete', targets }),
          },
        ],
      })
    },
    [selected, selectedItems, setSelected, setAnchor, handleItemOpen, actions, copyPath],
  )

  const handleBlankContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      setMenu({
        x: event.clientX,
        y: event.clientY,
        entries: [
          {
            label: '新建文件夹',
            icon: FolderPlus,
            disabled: !bucket,
            onClick: () => setDialog({ type: 'newFolder' }),
          },
          {
            label: '上传文件',
            icon: Upload,
            disabled: !bucket,
            onClick: () => void actions.upload(),
          },
          { label: '刷新', icon: RefreshCw, onClick: refresh },
          {
            label: favorited ? '取消收藏当前目录' : '收藏当前目录',
            icon: Star,
            disabled: !bucket,
            onClick: () =>
              toggleFavorite({ connectionId: activeId, bucket, prefix, label: prefix || bucket }),
          },
        ],
      })
    },
    [bucket, prefix, activeId, favorited, refresh, actions, toggleFavorite],
  )

  // 快捷键：全选、删除、重命名、刷新
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        setSelected(visibleItems.map((item) => item.key))
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedItems.length > 0) setDialog({ type: 'delete', targets: selectedItems })
      } else if (event.key === 'F2') {
        if (selectedItems.length === 1 && !selectedItems[0].isFolder) {
          setDialog({ type: 'rename', target: selectedItems[0] })
        }
      } else if (event.key === 'F5') {
        event.preventDefault()
        refresh()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visibleItems, selectedItems, setSelected, refresh])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-900">
      <div className="flex min-h-0 flex-1">
        <Sidebar
          connection={activeConnection}
          buckets={buckets}
          loading={bucketsLoading}
          onGoConnect={() => navigate('/connect')}
        />

        <main
          className="flex min-w-0 flex-1 flex-col"
          onContextMenu={handleBlankContextMenu}
        >
          <Toolbar onRefresh={refresh} onOpenTransfers={() => setPanelOpen(true)} />
          <ActionBar
            selected={selectedItems}
            onUpload={() => void actions.upload()}
            onNewFolder={() => setDialog({ type: 'newFolder' })}
            onDownload={() => void actions.download(selectedItems)}
            onCopy={() => setDialog({ type: 'copy', targets: selectedItems })}
            onRename={() => setDialog({ type: 'rename', target: selectedItems[0] })}
            onDelete={() => setDialog({ type: 'delete', targets: selectedItems })}
          />

          {bucket ? (
            viewMode === 'list' ? (
              <FileTableView
                items={visibleItems}
                keyword={keyword}
                selected={new Set(selected)}
                loading={loading}
                error={error}
                sort={sort}
                onSort={toggleSort}
                onItemClick={handleItemClick}
                onItemOpen={handleItemOpen}
                onItemContextMenu={handleItemContextMenu}
                onBlankClick={() => setSelected([])}
              />
            ) : (
              <FileGridView
                items={visibleItems}
                keyword={keyword}
                selected={new Set(selected)}
                loading={loading}
                error={error}
                onItemClick={handleItemClick}
                onItemOpen={handleItemOpen}
                onItemContextMenu={handleItemContextMenu}
                onBlankClick={() => setSelected([])}
              />
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400">
              <Database size={40} className="text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm">从左侧选择一个存储桶开始浏览</p>
            </div>
          )}

          <StatusBar
            connection={activeConnection}
            folderCount={folders.length}
            fileCount={files.length}
            onOpenTransfers={() => setPanelOpen(true)}
          />
        </main>

      </div>

      <TransferCenter open={panelOpen} onClose={() => setPanelOpen(false)} />

      <BrowseModals
        dialog={dialog}
        prefix={prefix}
        onClose={() => setDialog({ type: 'none' })}
        onSubmitNewFolder={(name) => {
          setDialog({ type: 'none' })
          void actions.createFolder(name)
        }}
        onSubmitRename={(name) => {
          if (dialog.type === 'rename') void actions.renameObject(dialog.target, name)
          setDialog({ type: 'none' })
        }}
        onSubmitCopy={(dest) => {
          if (dialog.type === 'copy') void actions.copyObjects(dialog.targets, dest)
          setDialog({ type: 'none' })
        }}
        onConfirmDelete={() => {
          if (dialog.type === 'delete') void actions.removeObjects(dialog.targets)
          setSelected([])
          setDialog({ type: 'none' })
        }}
      />

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} entries={menu.entries} onClose={() => setMenu(null)} />
      )}
    </div>
  )
}
