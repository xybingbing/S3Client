// 前后端共享的数据类型定义（与 Go 端结构体保持一致）

export interface ConnectionConfig {
  id: string
  name: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  pathStyle: boolean
  forceSSL: boolean
  /** 默认选中的存储桶（进入文件管理页时自动选中） */
  bucket: string
}

export interface BucketInfo {
  name: string
  creationDate?: string
}

/** 存储桶可用性检查结果 */
export interface BucketCheckResult {
  exists: boolean
  accessible: boolean
  message: string
}

export interface ObjectItem {
  key: string
  name: string
  isFolder: boolean
  size: number
  lastModified?: string
  storageClass?: string
  etag?: string
  contentType?: string
}

export interface ListResult {
  folders: ObjectItem[]
  files: ObjectItem[]
  isTruncated: boolean
  nextToken?: string
}

export interface TestResult {
  buckets: number
  /** 当前凭证是否具备列出存储桶的权限 */
  canListBuckets: boolean
  /** 可列出的存储桶名称（无权限时返回手动配置的名称） */
  bucketNames: string[]
}

export type TransferType = 'upload' | 'download'
export type TransferStatus = 'pending' | 'running' | 'success' | 'error' | 'canceled'

export interface TransferTask {
  id: string
  type: TransferType
  bucket: string
  name: string
  total: number
  loaded: number
  status: TransferStatus
  error?: string
  startedAt: number
  finishedAt?: number
  speed?: number
}

export interface Favorite {
  id: string
  connectionId: string
  bucket: string
  prefix: string
  label: string
}

export type ThemeMode = 'light' | 'dark'
export type ViewMode = 'list' | 'grid'

export interface Preferences {
  theme: ThemeMode
  viewMode: ViewMode
  activeConnectionId: string
  favorites: Favorite[]
  lastSaveDir: string
}

export type SortField = 'name' | 'size' | 'lastModified'
export type SortOrder = 'asc' | 'desc'

export interface SortState {
  field: SortField
  order: SortOrder
}
