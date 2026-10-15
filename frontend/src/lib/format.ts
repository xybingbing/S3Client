// 通用格式化工具

/** 格式化字节数为易读字符串 */
export function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  const digits = value >= 100 || index === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[index]}`
}

/** 格式化 ISO 时间字符串 */
export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** 格式化相对时间，如“3 分钟前” */
export function formatRelative(iso?: string): string {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return '—'
  const diff = Date.now() - time
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(iso)
}

/** 格式化传输速度 */
export function formatSpeed(bytesPerSecond?: number): string {
  if (!bytesPerSecond || bytesPerSecond <= 0) return ''
  return `${formatSize(bytesPerSecond)}/s`
}

/** 格式化剩余时间 */
export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60) return `${Math.ceil(seconds)} 秒`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} 分钟`
  return `${(seconds / 3600).toFixed(1)} 小时`
}

/** 生成唯一 ID */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 拼接对象键路径，避免出现重复斜杠 */
export function joinKey(prefix: string, name: string): string {
  const base = prefix.endsWith('/') || prefix === '' ? prefix : `${prefix}/`
  return `${base}${name}`
}

/** 取对象的父级前缀 */
export function parentPrefix(prefix: string): string {
  const trimmed = prefix.replace(/\/$/, '')
  const index = trimmed.lastIndexOf('/')
  return index <= 0 ? '' : trimmed.slice(0, index + 1)
}

/** 计算相对路径层级，用于面包屑 */
export function splitPrefix(prefix: string): { label: string; prefix: string }[] {
  const parts = prefix.split('/').filter(Boolean)
  const crumbs: { label: string; prefix: string }[] = []
  let current = ''
  for (const part of parts) {
    current += `${part}/`
    crumbs.push({ label: part, prefix: current })
  }
  return crumbs
}

/** 高亮匹配关键字，返回切分后的片段 */
export function highlightSegments(text: string, keyword: string): { text: string; match: boolean }[] {
  if (!keyword) return [{ text, match: false }]
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const segments: { text: string; match: boolean }[] = []
  let cursor = 0
  let index = lowerText.indexOf(lowerKeyword, cursor)
  while (index !== -1) {
    if (index > cursor) segments.push({ text: text.slice(cursor, index), match: false })
    segments.push({ text: text.slice(index, index + keyword.length), match: true })
    cursor = index + keyword.length
    index = lowerText.indexOf(lowerKeyword, cursor)
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false })
  return segments
}