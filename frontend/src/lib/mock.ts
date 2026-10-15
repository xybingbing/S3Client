// 浏览器预览模式下的模拟数据，仅在未运行于 Wails 环境时启用
import type { BucketInfo, ListResult, ObjectItem } from '@/types'

interface MockObject {
  key: string
  size: number
  lastModified: string
}

const buckets: string[] = ['demo-media', 'team-backup', 'web-static', 'warehouse-logs']

const objects: Record<string, MockObject[]> = {
  'demo-media': [
    { key: 'photos/cover.jpg', size: 248_320, lastModified: '2026-09-18T08:12:00Z' },
    { key: 'photos/skyline.png', size: 1_842_000, lastModified: '2026-09-20T11:04:00Z' },
    { key: 'photos/portrait.webp', size: 512_400, lastModified: '2026-09-21T15:32:00Z' },
    { key: 'videos/promo.mp4', size: 84_221_000, lastModified: '2026-08-30T09:00:00Z' },
    { key: 'audio/theme.mp3', size: 4_512_000, lastModified: '2026-08-12T19:20:00Z' },
    { key: 'docs/readme.md', size: 3_120, lastModified: '2026-09-25T10:10:00Z' },
    { key: 'archive/assets.zip', size: 22_331_000, lastModified: '2026-07-02T06:45:00Z' },
    { key: 'logo.svg', size: 8_640, lastModified: '2026-06-15T13:00:00Z' },
  ],
  'team-backup': [
    { key: '2026-09/db.sql.gz', size: 154_231_000, lastModified: '2026-09-30T02:00:00Z' },
    { key: '2026-08/db.sql.gz', size: 149_002_000, lastModified: '2026-08-31T02:00:00Z' },
    { key: 'config/nginx.conf', size: 2_048, lastModified: '2026-05-01T07:30:00Z' },
  ],
  'web-static': [
    { key: 'index.html', size: 4_210, lastModified: '2026-09-29T12:00:00Z' },
    { key: 'assets/app.js', size: 182_400, lastModified: '2026-09-29T12:00:00Z' },
    { key: 'assets/app.css', size: 24_800, lastModified: '2026-09-29T12:00:00Z' },
    { key: 'favicon.ico', size: 15_086, lastModified: '2026-01-11T08:00:00Z' },
  ],
  'warehouse-logs': [
    { key: '2026/09/28/access.log', size: 88_120_000, lastModified: '2026-09-28T23:59:00Z' },
    { key: '2026/09/29/access.log', size: 91_320_000, lastModified: '2026-09-29T23:59:00Z' },
    { key: '2026/09/30/access.log', size: 79_540_000, lastModified: '2026-09-30T23:59:00Z' },
  ],
}

function ensure(bucket: string): MockObject[] {
  if (!objects[bucket]) objects[bucket] = []
  return objects[bucket]
}

export function mockListBuckets(): BucketInfo[] {
  return buckets.map((name) => ({ name, creationDate: '2025-04-02T09:30:00Z' }))
}

export function mockListObjects(bucket: string, prefix: string): ListResult {
  const list = ensure(bucket)
  const folders = new Map<string, ObjectItem>()
  const files: ObjectItem[] = []

  for (const obj of list) {
    if (!obj.key.startsWith(prefix)) continue
    const rest = obj.key.slice(prefix.length)
    if (!rest) continue
    const slash = rest.indexOf('/')
    if (slash !== -1) {
      const folderName = rest.slice(0, slash)
      const folderKey = `${prefix}${folderName}/`
      if (!folders.has(folderKey)) {
        folders.set(folderKey, { key: folderKey, name: folderName, isFolder: true, size: 0 })
      }
      continue
    }
    files.push({
      key: obj.key,
      name: rest,
      isFolder: false,
      size: obj.size,
      lastModified: obj.lastModified,
      storageClass: 'STANDARD',
      etag: obj.key.length.toString(16).padStart(32, '0'),
    })
  }

  return {
    folders: Array.from(folders.values()),
    files,
    isTruncated: false,
    nextToken: '',
  }
}

export function mockCreateFolder(bucket: string, prefix: string, name: string): void {
  ensure(bucket).push({ key: `${prefix}${name}/`, size: 0, lastModified: new Date().toISOString() })
}

export function mockDeleteObjects(bucket: string, keys: string[]): void {
  const set = new Set(keys)
  objects[bucket] = ensure(bucket).filter((obj) => !set.has(obj.key))
}

export function mockCopyObject(bucket: string, srcKey: string, dstKey: string): void {
  const list = ensure(bucket)
  const source = list.find((obj) => obj.key === srcKey)
  if (source) {
    list.push({ key: dstKey, size: source.size, lastModified: new Date().toISOString() })
  }
}