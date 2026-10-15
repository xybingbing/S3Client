// 传输任务状态（仅内存，不做持久化）
import { create } from 'zustand'
import type { TransferTask } from '@/types'

interface TransferState {
  tasks: TransferTask[]
  panelOpen: boolean
  addTask: (task: TransferTask) => void
  updateTask: (id: string, patch: Partial<TransferTask>) => void
  removeTask: (id: string) => void
  clearFinished: () => void
  setPanelOpen: (open: boolean) => void
}

export const useTransferStore = create<TransferState>((set, get) => ({
  tasks: [],
  panelOpen: false,

  addTask: (task) => set({ tasks: [task, ...get().tasks] }),

  updateTask: (id, patch) =>
    set({ tasks: get().tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)) }),

  removeTask: (id) => set({ tasks: get().tasks.filter((task) => task.id !== id) }),

  clearFinished: () =>
    set({
      tasks: get().tasks.filter(
        (task) => task.status === 'running' || task.status === 'pending',
      ),
    }),

  setPanelOpen: (open) => set({ panelOpen: open }),
}))

/** 是否还有进行中的任务 */
export function hasActiveTasks(tasks: TransferTask[]): boolean {
  return tasks.some((task) => task.status === 'running' || task.status === 'pending')
}