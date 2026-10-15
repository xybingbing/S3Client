// 文件浏览状态：位置、数据、选中、排序、导航历史
import { create } from 'zustand'
import type { ObjectItem, SortField, SortState } from '@/types'
import { parentPrefix } from '@/lib/format'

interface Location {
  bucket: string
  prefix: string
}

interface BrowseState {
  bucket: string
  prefix: string
  folders: ObjectItem[]
  files: ObjectItem[]
  loading: boolean
  error: string
  selected: string[]
  anchorIndex: number
  keyword: string
  sort: SortState
  history: Location[]
  historyIndex: number

  navigate: (bucket: string, prefix: string) => void
  setData: (folders: ObjectItem[], files: ObjectItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  setSelected: (keys: string[]) => void
  setAnchor: (index: number) => void
  setKeyword: (keyword: string) => void
  toggleSort: (field: SortField) => void
  goBack: () => void
  goForward: () => void
  goUp: () => void
  reset: () => void
}

export const useBrowseStore = create<BrowseState>((set, get) => ({
  bucket: '',
  prefix: '',
  folders: [],
  files: [],
  loading: false,
  error: '',
  selected: [],
  anchorIndex: -1,
  keyword: '',
  sort: { field: 'name', order: 'asc' },
  history: [{ bucket: '', prefix: '' }],
  historyIndex: 0,

  navigate: (bucket, prefix) => {
    const { bucket: currentBucket, prefix: currentPrefix, history, historyIndex } = get()
    if (currentBucket === bucket && currentPrefix === prefix) return
    const trimmed = history.slice(0, historyIndex + 1)
    const nextHistory = [...trimmed, { bucket, prefix }].slice(-50)
    set({
      bucket,
      prefix,
      selected: [],
      anchorIndex: -1,
      keyword: '',
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    })
  },

  setData: (folders, files) => set({ folders, files, error: '' }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setSelected: (keys) => set({ selected: keys }),
  setAnchor: (index) => set({ anchorIndex: index }),
  setKeyword: (keyword) => set({ keyword, selected: [], anchorIndex: -1 }),

  toggleSort: (field) => {
    const { sort } = get()
    if (sort.field === field) {
      set({ sort: { field, order: sort.order === 'asc' ? 'desc' : 'asc' } })
    } else {
      set({ sort: { field, order: 'asc' } })
    }
  },

  goBack: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const index = historyIndex - 1
    const target = history[index]
    set({ ...target, historyIndex: index, selected: [], anchorIndex: -1, keyword: '' })
  },

  goForward: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const index = historyIndex + 1
    const target = history[index]
    set({ ...target, historyIndex: index, selected: [], anchorIndex: -1, keyword: '' })
  },

  goUp: () => {
    const { bucket, prefix, navigate } = get()
    if (!prefix) return
    navigate(bucket, parentPrefix(prefix))
  },

  reset: () =>
    set({
      bucket: '',
      prefix: '',
      folders: [],
      files: [],
      loading: false,
      error: '',
      selected: [],
      anchorIndex: -1,
      keyword: '',
      history: [{ bucket: '', prefix: '' }],
      historyIndex: 0,
    }),
}))

/** 合并文件夹与文件，并按当前排序规则返回完整列表 */
export function useSortedItems(): { items: ObjectItem[]; folders: ObjectItem[]; files: ObjectItem[] } {
  const { folders, files, sort } = useBrowseStore()
  const compare = (a: ObjectItem, b: ObjectItem): number => {
    let result = 0
    if (sort.field === 'name') result = a.name.localeCompare(b.name, 'zh-CN')
    else if (sort.field === 'size') result = a.size - b.size
    else result = (a.lastModified ?? '').localeCompare(b.lastModified ?? '')
    return sort.order === 'asc' ? result : -result
  }
  const sortedFolders = [...folders].sort(compare)
  const sortedFiles = [...files].sort(compare)
  return { items: [...sortedFolders, ...sortedFiles], folders: sortedFolders, files: sortedFiles }
}