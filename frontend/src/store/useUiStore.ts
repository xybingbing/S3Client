// 全局提示（Toast）状态
import { create } from 'zustand'
import { uid } from '@/lib/format'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface UiState {
  toasts: Toast[]
  pushToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],

  pushToast: (type, message) => {
    const id = uid('toast')
    set({ toasts: [...get().toasts, { id, type, message }] })
    window.setTimeout(() => {
      set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
    }, 3600)
  },

  removeToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}))