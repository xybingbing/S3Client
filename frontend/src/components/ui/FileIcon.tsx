// 文件类型图标与配色映射
import {
  File as FileBase,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  type LucideIcon,
} from 'lucide-react'
import type { ObjectItem } from '@/types'

interface ExtGroup {
  exts: string[]
  color: string
  Icon: LucideIcon
}

const EXT_GROUPS: ExtGroup[] = [
  { exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'heic', 'tiff'], color: 'text-emerald-500', Icon: FileImage },
  { exts: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'm4v', 'wmv'], color: 'text-rose-500', Icon: FileVideo },
  { exts: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'], color: 'text-violet-500', Icon: FileAudio },
  { exts: ['zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz', 'tgz'], color: 'text-orange-500', Icon: FileArchive },
  {
    exts: ['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'scss', 'go', 'py', 'java', 'rs', 'c', 'cpp', 'sh', 'yml', 'yaml', 'xml', 'sql'],
    color: 'text-sky-500',
    Icon: FileCode,
  },
  { exts: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'md'], color: 'text-blue-500', Icon: FileText },
  { exts: ['pdf'], color: 'text-red-500', Icon: FileText },
]

const IMAGE_EXTS = EXT_GROUPS[0].exts

/** 返回文件对应的图标组件与颜色 */
export function fileVisual(name: string, isFolder: boolean): { Icon: LucideIcon; color: string } {
  if (isFolder) return { Icon: Folder, color: 'text-amber-500' }
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  for (const group of EXT_GROUPS) {
    if (group.exts.includes(ext)) return { Icon: group.Icon, color: group.color }
  }
  return { Icon: FileBase, color: 'text-zinc-400' }
}

/** 是否为可预览的图片 */
export function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_EXTS.includes(ext)
}

interface FileTypeIconProps {
  item: Pick<ObjectItem, 'name' | 'isFolder'>
  size?: number
  className?: string
}

export function FileTypeIcon({ item, size = 18, className = '' }: FileTypeIconProps) {
  const { Icon, color } = fileVisual(item.name, item.isFolder)
  return <Icon size={size} strokeWidth={1.75} className={`${color} ${className}`} />
}