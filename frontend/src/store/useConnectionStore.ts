// 连接配置与用户偏好：持久化到 localStorage
import { create } from 'zustand'
import type { ConnectionConfig, Favorite, Preferences } from '@/types'
import { uid } from '@/lib/format'

const CONNECTIONS_KEY = 's3c.connections'
const PREFERENCES_KEY = 's3c.preferences'

export const defaultPreferences: Preferences = {
  theme: 'light',
  viewMode: 'list',
  activeConnectionId: '',
  favorites: [],
  lastSaveDir: '',
}

function loadConnections(): ConnectionConfig[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 兼容旧版本数据：将 buckets 数组迁移为单个 bucket 字段
    return (parsed as (Partial<ConnectionConfig> & { buckets?: string[] })[]).map(
      ({ buckets, ...item }) => ({
        ...item,
        bucket: item.bucket ?? buckets?.[0] ?? '',
      }),
    ) as ConnectionConfig[]
  } catch {
    return []
  }
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    if (!raw) return defaultPreferences
    return { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) }
  } catch {
    return defaultPreferences
  }
}

function saveConnections(list: ConnectionConfig[]): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(list))
}

function savePreferences(prefs: Preferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
}

/** 生成一个新的空连接配置 */
export function createEmptyConnection(): ConnectionConfig {
  return {
    id: uid('conn'),
    name: '',
    endpoint: '',
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',
    pathStyle: true,
    forceSSL: true,
    bucket: '',
  }
}

interface ConnectionState {
  connections: ConnectionConfig[]
  preferences: Preferences
  addConnection: (cfg: ConnectionConfig) => void
  updateConnection: (id: string, patch: Partial<ConnectionConfig>) => void
  removeConnection: (id: string) => void
  setActiveConnection: (id: string) => void
  updatePreferences: (patch: Partial<Preferences>) => void
  toggleFavorite: (favorite: Omit<Favorite, 'id'>) => void
  removeFavorite: (id: string) => void
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: loadConnections(),
  preferences: loadPreferences(),

  addConnection: (cfg) => {
    const next = [...get().connections, cfg]
    saveConnections(next)
    set({ connections: next })
    if (!get().preferences.activeConnectionId) {
      const prefs = { ...get().preferences, activeConnectionId: cfg.id }
      savePreferences(prefs)
      set({ preferences: prefs })
    }
  },

  updateConnection: (id, patch) => {
    const next = get().connections.map((item) => (item.id === id ? { ...item, ...patch } : item))
    saveConnections(next)
    set({ connections: next })
  },

  removeConnection: (id) => {
    const next = get().connections.filter((item) => item.id !== id)
    saveConnections(next)
    const prefs = { ...get().preferences }
    if (prefs.activeConnectionId === id) prefs.activeConnectionId = next[0]?.id ?? ''
    prefs.favorites = prefs.favorites.filter((fav) => fav.connectionId !== id)
    savePreferences(prefs)
    set({ connections: next, preferences: prefs })
  },

  setActiveConnection: (id) => {
    const prefs = { ...get().preferences, activeConnectionId: id }
    savePreferences(prefs)
    set({ preferences: prefs })
  },

  updatePreferences: (patch) => {
    const prefs = { ...get().preferences, ...patch }
    savePreferences(prefs)
    set({ preferences: prefs })
  },

  toggleFavorite: (favorite) => {
    const prefs = { ...get().preferences }
    const exists = prefs.favorites.find(
      (fav) =>
        fav.connectionId === favorite.connectionId &&
        fav.bucket === favorite.bucket &&
        fav.prefix === favorite.prefix,
    )
    if (exists) {
      prefs.favorites = prefs.favorites.filter((fav) => fav.id !== exists.id)
    } else {
      prefs.favorites = [...prefs.favorites, { ...favorite, id: uid('fav') }]
    }
    savePreferences(prefs)
    set({ preferences: prefs })
  },

  removeFavorite: (id) => {
    const prefs = { ...get().preferences, favorites: get().preferences.favorites.filter((f) => f.id !== id) }
    savePreferences(prefs)
    set({ preferences: prefs })
  },
}))

/** 读取当前激活的连接配置 */
export function getActiveConnection(): ConnectionConfig | undefined {
  const { connections, preferences } = useConnectionStore.getState()
  return connections.find((item) => item.id === preferences.activeConnectionId)
}
