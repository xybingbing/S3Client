// 文件操作：上传、下载、新建文件夹、删除、复制、重命名
import { useCallback } from 'react'
import { bridge, isWailsRuntime } from '@/lib/bridge'
import { uid } from '@/lib/format'
import { useBrowseStore } from '@/store/useBrowseStore'
import { useConnectionStore } from '@/store/useConnectionStore'
import { useTransferStore } from '@/store/useTransferStore'
import { useUiStore } from '@/store/useUiStore'
import type { ObjectItem } from '@/types'

/** 取路径中的文件名，兼容 Windows 与 Unix 分隔符 */
function baseName(path: string): string {
  return path.split(/[\\/]/).pop() || path
}

export function useFileActions(refresh: () => void) {
  const connections = useConnectionStore((state) => state.connections)
  const activeId = useConnectionStore((state) => state.preferences.activeConnectionId)
  const addTask = useTransferStore((state) => state.addTask)
  const updateTask = useTransferStore((state) => state.updateTask)
  const pushToast = useUiStore((state) => state.pushToast)

  const getConnection = useCallback(
    () => connections.find((item) => item.id === activeId),
    [connections, activeId],
  )

  /** 上传：选择本地文件后创建上传任务 */
  const upload = useCallback(async () => {
    const connection = getConnection()
    const { bucket, prefix } = useBrowseStore.getState()
    if (!connection || !bucket) {
      pushToast('info', '请先选择存储桶')
      return
    }
    const paths = await bridge.pickFiles()
    if (paths.length === 0) return

    const taskId = uid('task')
    const name = paths.length === 1 ? baseName(paths[0]) : `上传 ${paths.length} 个文件`
    addTask({
      id: taskId,
      type: 'upload',
      bucket,
      name,
      total: 0,
      loaded: 0,
      status: 'pending',
      startedAt: Date.now(),
    })
    try {
      await bridge.startUpload(taskId, connection, bucket, prefix, paths, 12 * 1024 * 1024)
    } catch (error) {
      updateTask(taskId, { status: 'error', error: (error as Error)?.message ?? String(error) })
      pushToast('error', `上传失败：${(error as Error)?.message ?? error}`)
    }
  }, [getConnection, addTask, updateTask, pushToast])

  /** 下载：选择保存目录后创建下载任务 */
  const download = useCallback(
    async (targets: ObjectItem[]) => {
      const connection = getConnection()
      const { bucket } = useBrowseStore.getState()
      if (!connection || !bucket) return


      const files = targets.filter((item) => !item.isFolder)
      if (files.length === 0) {
        pushToast('info', '请选择要下载的文件')
        return
      }
      let saveDir = await bridge.pickSaveDir()
      if (!saveDir) {
        if (isWailsRuntime) return
        saveDir = '/Users/demo/Downloads'
      }

      const taskId = uid('task')
      const name = files.length === 1 ? baseName(files[0].key) : `下载 ${files.length} 个文件`
      const total = files.reduce((sum, item) => sum + item.size, 0)
      addTask({
        id: taskId,
        type: 'download',
        bucket,
        name,
        total,
        loaded: 0,
        status: 'pending',
        startedAt: Date.now(),
      })
      try {
        await bridge.startDownload(
          taskId,
          connection,
          bucket,
          files.map((item) => item.key),
          saveDir,
          total || 8 * 1024 * 1024,
        )
      } catch (error) {
        updateTask(taskId, { status: 'error', error: (error as Error)?.message ?? String(error) })
        pushToast('error', `下载失败：${(error as Error)?.message ?? error}`)
      }
    },
    [getConnection, addTask, updateTask, pushToast],
  )

  /** 新建文件夹 */
  const createFolder = useCallback(
    async (name: string) => {
      const connection = getConnection()
      const { bucket, prefix } = useBrowseStore.getState()
      if (!connection || !bucket || !name.trim()) return
      try {
        await bridge.createFolder(connection, bucket, prefix, name.trim())
        pushToast('success', `已创建文件夹「${name.trim()}」`)
        refresh()
      } catch (error) {
        pushToast('error', `创建失败：${(error as Error)?.message ?? error}`)
      }
    },
    [getConnection, refresh, pushToast],
  )

  /** 删除对象 */
  const removeObjects = useCallback(
    async (targets: ObjectItem[]) => {
      const connection = getConnection()
      const { bucket } = useBrowseStore.getState()
      if (!connection || !bucket || targets.length === 0) return
      try {
        await bridge.deleteObjects(
          connection,
          bucket,
          targets.map((item) => item.key),
        )
        pushToast('success', `已删除 ${targets.length} 项`)
        refresh()
      } catch (error) {
        pushToast('error', `删除失败：${(error as Error)?.message ?? error}`)
      }
    },
    [getConnection, refresh, pushToast],
  )

  /** 复制到指定目录前缀 */
  const copyObjects = useCallback(
    async (targets: ObjectItem[], destDir: string) => {
      const connection = getConnection()
      const { bucket } = useBrowseStore.getState()
      if (!connection || !bucket) return
      const base = destDir.trim()
      const normalized = base && !base.endsWith('/') ? `${base}/` : base
      try {
        for (const item of targets) {
          await bridge.copyObject(connection, bucket, item.key, `${normalized}${item.name}`)
        }
        pushToast('success', `已复制 ${targets.length} 项到 ${normalized || '根目录'}`)
        refresh()
      } catch (error) {
        pushToast('error', `复制失败：${(error as Error)?.message ?? error}`)
      }
    },
    [getConnection, refresh, pushToast],
  )

  /** 重命名（复制后删除原对象） */
  const renameObject = useCallback(
    async (target: ObjectItem, newName: string) => {
      const connection = getConnection()
      const { bucket, prefix } = useBrowseStore.getState()
      if (!connection || !bucket || !newName.trim()) return
      const destKey = `${prefix}${newName.trim()}`
      try {
        await bridge.copyObject(connection, bucket, target.key, destKey)
        await bridge.deleteObjects(connection, bucket, [target.key])
        pushToast('success', '重命名完成')
        refresh()
      } catch (error) {
        pushToast('error', `重命名失败：${(error as Error)?.message ?? error}`)
      }
    },
    [getConnection, refresh, pushToast],
  )

  return { upload, download, createFolder, removeObjects, copyObjects, renameObject }
}