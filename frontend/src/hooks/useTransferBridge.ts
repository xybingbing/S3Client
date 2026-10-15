// 订阅后端传输事件并更新传输任务状态
import { useEffect } from 'react'
import { onTransferDone, onTransferError, onTransferProgress } from '@/lib/bridge'
import { useTransferStore } from '@/store/useTransferStore'

export function useTransferBridge() {
  const updateTask = useTransferStore((state) => state.updateTask)

  useEffect(() => {
    const offProgress = onTransferProgress((payload) => {
      updateTask(payload.id, { loaded: payload.loaded, total: payload.total, status: 'running' })
    })
    const offDone = onTransferDone((payload) => {
      updateTask(payload.id, { status: 'success', finishedAt: Date.now() })
    })
    const offError = onTransferError((payload) => {
      updateTask(payload.id, { status: 'error', error: payload.message })
    })
    return () => {
      offProgress()
      offDone()
      offError()
    }
  }, [updateTask])
}