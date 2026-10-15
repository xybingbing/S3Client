// 连接配置页：管理 S3 连接并进入文件浏览
import { Moon, Sun, Cloud, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectionForm } from '@/components/connect/ConnectionForm'
import { ConnectionList } from '@/components/connect/ConnectionList'
import { bridge } from '@/lib/bridge'
import { createEmptyConnection, useConnectionStore } from '@/store/useConnectionStore'
import { useUiStore } from '@/store/useUiStore'
import type { ConnectionConfig, TestResult } from '@/types'

export function ConnectPage() {
  const navigate = useNavigate()
  const connections = useConnectionStore((state) => state.connections)
  const activeId = useConnectionStore((state) => state.preferences.activeConnectionId)
  const theme = useConnectionStore((state) => state.preferences.theme)
  const addConnection = useConnectionStore((state) => state.addConnection)
  const updateConnection = useConnectionStore((state) => state.updateConnection)
  const removeConnection = useConnectionStore((state) => state.removeConnection)
  const setActiveConnection = useConnectionStore((state) => state.setActiveConnection)
  const updatePreferences = useConnectionStore((state) => state.updatePreferences)
  const pushToast = useUiStore((state) => state.pushToast)

  const [editing, setEditing] = useState<ConnectionConfig>(() => {
    const active = connections.find((item) => item.id === activeId)
    return active ? { ...active } : connections[0] ? { ...connections[0] } : createEmptyConnection()
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const isNew = !connections.some((item) => item.id === editing.id)

  const handleChange = (patch: Partial<ConnectionConfig>) => {
    setEditing((prev) => ({ ...prev, ...patch }))
    setTestResult(null)
  }

  // 默认存储桶变更：仅更新编辑态，保存动作交由「保存修改」按钮
  const handleBucketChange = (bucket: string) => {
    setEditing((prev) => ({ ...prev, bucket }))
  }

  // 检查手动输入的存储桶是否存在
  const handleCheckBucket = (name: string) => bridge.checkBucket(editing, name)

  // 点击存储桶选择框时查询是否具备列出存储桶的权限
  const handleQueryBuckets = () => bridge.testConnection(editing)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await bridge.testConnection(editing)
      setTestResult(result)
      if (result.canListBuckets) {
        pushToast('success', `连接成功，检测到 ${result.buckets} 个存储桶`)
      } else {
        pushToast('info', '连接成功，但当前凭证无列出存储桶权限，请手动填写存储桶名称')
      }
    } catch (error) {
      pushToast('error', `连接失败：${(error as Error)?.message ?? error}`)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!editing.name.trim() || !editing.endpoint.trim()) return
    if (isNew) addConnection(editing)
    else updateConnection(editing.id, editing)
    setActiveConnection(editing.id)
    pushToast('success', '连接配置已保存')
    navigate('/browse')
  }

  const handleCreate = () => {
    setEditing(createEmptyConnection())
    setTestResult(null)
  }

  const handleDelete = (id: string) => {
    removeConnection(id)
    if (editing.id === id) {
      const rest = connections.filter((item) => item.id !== id)
      setEditing(rest[0] ? { ...rest[0] } : createEmptyConnection())
    }
    pushToast('info', '连接已删除')
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* 左侧：品牌与已保存连接 */}
      <aside className="panel flex w-[260px] flex-none flex-col border-r">
        <div className="flex items-center gap-3 px-4 pt-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-sm">
            <Cloud size={20} />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">S3 客户端</h1>
            <p className="text-[11px] text-zinc-400">对象存储文件管理器</p>
          </div>
        </div>

        <ConnectionList
          connections={connections}
          activeId={activeId}
          editingId={editing.id}
          onOpen={(cfg) => {
            setEditing({ ...cfg })
            setActiveConnection(cfg.id)
            navigate('/browse')
          }}
          onEdit={(cfg) => {
            setEditing({ ...cfg })
            setTestResult(null)
          }}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />

        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400">v1.0.0</span>
          <button
            className="toolbar-btn"
            title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
            onClick={() => updatePreferences({ theme: theme === 'dark' ? 'light' : 'dark' })}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      {/* 右侧：表单 */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
              {isNew ? '新建连接' : '编辑连接'}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              填写对象存储服务信息，凭证仅保存在本机
            </p>
          </div>
          {connections.length > 0 && (
            <button className="btn-ghost" onClick={() => navigate('/browse')}>
              进入浏览
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-8 py-7">
            <ConnectionForm
              value={editing}
              isNew={isNew}
              testing={testing}
              testResult={testResult}
              onChange={handleChange}
              onBucketChange={handleBucketChange}
              onCheckBucket={handleCheckBucket}
              onQueryBuckets={handleQueryBuckets}
              onTest={handleTest}
              onSave={handleSave}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
