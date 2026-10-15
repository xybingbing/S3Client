// 前端与 Go 后端的统一桥接层；在浏览器预览模式下自动降级为模拟数据
import * as AppApi from '@wailsjs/go/main/App'
import { EventsOff, EventsOn } from '@wailsjs/runtime/runtime'
import type { BucketCheckResult, BucketInfo, ConnectionConfig, ListResult, ObjectItem, TestResult } from '@/types'
import * as mock from '@/lib/mock'

export interface TransferProgressPayload {
  id: string
  loaded: number
  total: number
}

export interface TransferDonePayload {
  id: string
}

export interface TransferErrorPayload {
  id: string
  message: string
}

type WindowWithWails = { go?: { main?: { App?: unknown } } }

export const isWailsRuntime: boolean =
  typeof window !== 'undefined' && Boolean((window as unknown as WindowWithWails).go?.main?.App)

// ---- 浏览器预览模式下的模拟传输 ----
const mockTimers = new Map<string, number>()
const progressHandlers = new Set<(payload: TransferProgressPayload) => void>()
const doneHandlers = new Set<(payload: TransferDonePayload) => void>()
const errorHandlers = new Set<(payload: TransferErrorPayload) => void>()

function simulateTransfer(id: string, total: number): void {
  const step = Math.max(Math.floor(total / 36), 64 * 1024)
  let loaded = 0
  const timer = window.setInterval(() => {
    loaded += step
    if (loaded >= total) {
      window.clearInterval(timer)
      mockTimers.delete(id)
      progressHandlers.forEach((handler) => handler({ id, loaded: total, total }))
      doneHandlers.forEach((handler) => handler({ id }))
      return
    }
    progressHandlers.forEach((handler) => handler({ id, loaded, total }))
  }, 110)
  mockTimers.set(id, timer)
}

export function onTransferProgress(handler: (payload: TransferProgressPayload) => void): () => void {
  if (isWailsRuntime) {
    EventsOn('transfer:progress', handler as (...args: unknown[]) => void)
    return () => EventsOff('transfer:progress')
  }
  progressHandlers.add(handler)
  return () => progressHandlers.delete(handler)
}

export function onTransferDone(handler: (payload: TransferDonePayload) => void): () => void {
  if (isWailsRuntime) {
    EventsOn('transfer:done', handler as (...args: unknown[]) => void)
    return () => EventsOff('transfer:done')
  }
  doneHandlers.add(handler)
  return () => doneHandlers.delete(handler)
}

export function onTransferError(handler: (payload: TransferErrorPayload) => void): () => void {
  if (isWailsRuntime) {
    EventsOn('transfer:error', handler as (...args: unknown[]) => void)
    return () => EventsOff('transfer:error')
  }
  errorHandlers.add(handler)
  return () => errorHandlers.delete(handler)
}

// ---- 后端操作 ----
export const bridge = {
  async testConnection(cfg: ConnectionConfig): Promise<TestResult> {
    if (isWailsRuntime) return AppApi.TestConnection(cfg)
    const names = mock.mockListBuckets().map((item) => item.name)
    return { buckets: names.length, canListBuckets: true, bucketNames: names }
  },

  async listBuckets(cfg: ConnectionConfig): Promise<BucketInfo[]> {
    if (isWailsRuntime) return AppApi.ListBuckets(cfg)
    return mock.mockListBuckets()
  },

  async checkBucket(cfg: ConnectionConfig, bucket: string): Promise<BucketCheckResult> {
    if (isWailsRuntime) return AppApi.CheckBucket(cfg, bucket)
    const exists = mock.mockListBuckets().some((item) => item.name === bucket)
    return exists
      ? { exists: true, accessible: true, message: '存储桶存在，可正常访问' }
      : { exists: false, accessible: false, message: '存储桶不存在' }
  },

  async listObjects(cfg: ConnectionConfig, bucket: string, prefix: string, token: string): Promise<ListResult> {
    if (isWailsRuntime) return AppApi.ListObjects(cfg, bucket, prefix, token)
    return mock.mockListObjects(bucket, prefix)
  },

  async headObject(cfg: ConnectionConfig, bucket: string, key: string): Promise<ObjectItem> {
    if (isWailsRuntime) return AppApi.HeadObject(cfg, bucket, key)
    const result = mock.mockListObjects(bucket, key.replace(/[^/]*$/, ''))
    const found = result.files.find((item) => item.key === key)
    return (
      found ?? {
        key,
        name: key.split('/').pop() ?? key,
        isFolder: false,
        size: 0,
        lastModified: new Date().toISOString(),
        storageClass: 'STANDARD',
      }
    )
  },

  async createFolder(cfg: ConnectionConfig, bucket: string, prefix: string, name: string): Promise<void> {
    if (isWailsRuntime) return AppApi.CreateFolder(cfg, bucket, prefix, name)
    mock.mockCreateFolder(bucket, prefix, name)
  },

  async deleteObjects(cfg: ConnectionConfig, bucket: string, keys: string[]): Promise<void> {
    if (isWailsRuntime) return AppApi.DeleteObjects(cfg, bucket, keys)
    mock.mockDeleteObjects(bucket, keys)
  },

  async copyObject(cfg: ConnectionConfig, bucket: string, srcKey: string, dstKey: string): Promise<void> {
    if (isWailsRuntime) return AppApi.CopyObject(cfg, bucket, srcKey, dstKey)
    mock.mockCopyObject(bucket, srcKey, dstKey)
  },

  async getPresignedUrl(cfg: ConnectionConfig, bucket: string, key: string, expiresIn = 3600): Promise<string> {
    if (isWailsRuntime) return AppApi.GetPresignedURL(cfg, bucket, key, expiresIn)
    return ''
  },

  async pickFiles(): Promise<string[]> {
    if (isWailsRuntime) return AppApi.PickFiles()
    // 预览模式返回示例路径，便于演示上传流程
    return ['/Users/demo/Pictures/cover.jpg', '/Users/demo/Downloads/report.pdf']
  },

  async pickFolder(): Promise<string> {
    if (isWailsRuntime) return AppApi.PickFolder()
    return '/Users/demo/Documents'
  },

  async pickSaveDir(): Promise<string> {
    if (isWailsRuntime) return AppApi.PickSaveDir()
    return '/Users/demo/Downloads'
  },

  async getHomeDir(): Promise<string> {
    if (isWailsRuntime) return AppApi.GetHomeDir()
    return ''
  },

  async startUpload(
    taskId: string,
    cfg: ConnectionConfig,
    bucket: string,
    prefix: string,
    paths: string[],
    mockTotal: number,
  ): Promise<void> {
    if (isWailsRuntime) return AppApi.StartUpload(taskId, cfg, bucket, prefix, paths)
    simulateTransfer(taskId, mockTotal)
  },

  async startDownload(
    taskId: string,
    cfg: ConnectionConfig,
    bucket: string,
    keys: string[],
    saveDir: string,
    mockTotal: number,
  ): Promise<void> {
    if (isWailsRuntime) return AppApi.StartDownload(taskId, cfg, bucket, keys, saveDir)
    simulateTransfer(taskId, mockTotal)
  },

  async cancelTransfer(taskId: string): Promise<boolean> {
    if (isWailsRuntime) return AppApi.CancelTransfer(taskId)
    const timer = mockTimers.get(taskId)
    if (timer) {
      window.clearInterval(timer)
      mockTimers.delete(taskId)
    }
    errorHandlers.forEach((handler) => handler({ id: taskId, message: '任务已取消' }))
    return true
  },
}