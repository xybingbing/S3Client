// 浏览页的各类操作弹窗
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { ObjectItem } from '@/types'

export type DialogState =
  | { type: 'none' }
  | { type: 'newFolder' }
  | { type: 'rename'; target: ObjectItem }
  | { type: 'copy'; targets: ObjectItem[] }
  | { type: 'delete'; targets: ObjectItem[] }

interface TextModalProps {
  title: string
  label?: string
  hint?: string
  initial: string
  mono?: boolean
  confirmText: string
  onClose: () => void
  onSubmit: (value: string) => void
}

function TextModal({
  title,
  label,
  hint,
  initial,
  mono,
  confirmText,
  onClose,
  onSubmit,
}: TextModalProps) {
  const [value, setValue] = useState(initial)
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={() => onSubmit(value)}>
            {confirmText}
          </button>
        </>
      }
    >
      {label && <label className="mb-1.5 block text-xs text-zinc-500 dark:text-zinc-400">{label}</label>}
      <input
        className={`field ${mono ? 'font-mono' : ''}`}
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit(value)
        }}
      />
      {hint && <p className="mt-2 text-[11px] text-zinc-400">{hint}</p>}
    </Modal>
  )
}

interface BrowseModalsProps {
  dialog: DialogState
  prefix: string
  onClose: () => void
  onSubmitNewFolder: (name: string) => void
  onSubmitRename: (name: string) => void
  onSubmitCopy: (destDir: string) => void
  onConfirmDelete: () => void
}

export function BrowseModals({
  dialog,
  prefix,
  onClose,
  onSubmitNewFolder,
  onSubmitRename,
  onSubmitCopy,
  onConfirmDelete,
}: BrowseModalsProps) {
  if (dialog.type === 'newFolder') {
    return (
      <TextModal
        title="新建文件夹"
        label="文件夹名称"
        initial="新建文件夹"
        confirmText="创建"
        onClose={onClose}
        onSubmit={onSubmitNewFolder}
      />
    )
  }

  if (dialog.type === 'rename') {
    return (
      <TextModal
        key={dialog.target.key}
        title="重命名"
        label="新名称"
        initial={dialog.target.name}
        confirmText="确定"
        onClose={onClose}
        onSubmit={onSubmitRename}
      />
    )
  }

  if (dialog.type === 'copy') {
    return (
      <TextModal
        key={dialog.targets.map((item) => item.key).join('|')}
        title="复制到"
        label="目标目录前缀"
        hint={`共 ${dialog.targets.length} 项，将复制到指定前缀下`}
        initial={prefix}
        mono
        confirmText="复制"
        onClose={onClose}
        onSubmit={onSubmitCopy}
      />
    )
  }

  if (dialog.type === 'delete') {
    return (
      <Modal
        open
        title="确认删除"
        width="max-w-sm"
        onClose={onClose}
        footer={
          <>
            <button className="btn-ghost" onClick={onClose}>
              取消
            </button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={onConfirmDelete}>
              删除
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          即将删除{' '}
          <span className="font-semibold text-red-600 dark:text-red-400">{dialog.targets.length}</span>{' '}
          项，此操作不可撤销。
        </p>
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto">
          {dialog.targets.slice(0, 8).map((item) => (
            <li key={item.key} className="truncate font-mono text-xs text-zinc-400">
              {item.key}
            </li>
          ))}
          {dialog.targets.length > 8 && (
            <li className="text-xs text-zinc-400">…等共 {dialog.targets.length} 项</li>
          )}
        </ul>
      </Modal>
    )
  }

  return null
}