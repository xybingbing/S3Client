// 连接配置表单
import clsx from 'clsx'
import { ChevronDown, Eye, EyeOff, Loader2, PlugZap, Save } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { BucketCheckResult, ConnectionConfig, TestResult } from '@/types'

interface ConnectionFormProps {
  value: ConnectionConfig
  isNew: boolean
  testing: boolean
  testResult: TestResult | null
  onChange: (patch: Partial<ConnectionConfig>) => void
  onBucketChange: (bucket: string) => void
  onCheckBucket: (name: string) => Promise<BucketCheckResult>
  onQueryBuckets: () => Promise<TestResult>
  onTest: () => void
  onSave: () => void
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-400">{hint}</span>}
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition',
        checked
          ? 'border-accent-500/50 bg-accent-500/5'
          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60',
      )}
    >
      <span>
        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">{title}</span>
        <span className="mt-0.5 block text-[11px] text-zinc-400">{desc}</span>
      </span>
      <span
        className={clsx(
          'relative h-5 w-9 flex-none rounded-full transition',
          checked ? 'bg-accent-500' : 'bg-zinc-300 dark:bg-zinc-600',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}

// 默认存储桶：点击时检测 ListBuckets 权限，有权限则下拉选择，无权限则切换为手动输入
function BucketEditor({
  bucket,
  onChange,
  onCheck,
  onQuery,
}: {
  bucket: string
  onChange: (bucket: string) => void
  onCheck: (name: string) => Promise<BucketCheckResult>
  onQuery: () => Promise<TestResult>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'list' | 'manual'>('list')
  const [options, setOptions] = useState<string[]>([])
  const [probed, setProbed] = useState(false)
  const [probing, setProbing] = useState(false)
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // 点击组件外部时收起下拉
  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // 查询当前凭证是否具备列出存储桶的权限
  const probe = async () => {
    setProbing(true)
    try {
      const result = await onQuery()
      setProbed(true)
      if (result.canListBuckets) {
        setOptions(result.bucketNames)
        setMode('list')
        return true
      }
      setMode('manual')
      return false
    } catch {
      setMode('manual')
      return false
    } finally {
      setProbing(false)
    }
  }

  const handleTrigger = async () => {
    if (open) {
      setOpen(false)
      return
    }
    if (!probed) {
      const canList = await probe()
      if (!canList) return
    }
    setOpen(true)
  }

  // 手动输入：回车检查存储桶是否存在
  const verify = async () => {
    const name = bucket.trim()
    if (!name) return
    setChecking(true)
    setMessage(null)
    try {
      const result = await onCheck(name)
      setMessage({ ok: result.exists, text: result.message })
    } catch (error) {
      setMessage({ ok: false, text: (error as Error)?.message ?? String(error) })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">存储桶</span>
        <span className="text-[11px] text-zinc-400">
          {mode === 'manual' ? '当前凭证无法列出存储桶，请手动输入' : ''}
        </span>
      </div>
      
      {mode === 'manual' ? (
        <>
          <div className="relative">
            <input
              className="field h-[38px] px-2 pr-8 font-mono text-[12px]"
              placeholder="输入存储桶名称"
              value={bucket}
              disabled={checking}
              onChange={(event) => {
                onChange(event.target.value)
                setMessage(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void verify()
                }
              }}
            />
            {checking && (
              <Loader2
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
              />
            )}
          </div>
          {message && (
            <p
              className={clsx(
                'mt-1.5 text-[11px]',
                message.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500',
              )}
            >
              {message.text}
            </p>
          )}
        </>
      ) : (
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            className="field flex h-[38px] items-center justify-between gap-2 px-2 text-left"
            onClick={() => void handleTrigger()}
          >
            <span className={clsx('truncate font-mono text-[12px]', !bucket && 'text-zinc-400')}>
              {bucket || '选择存储桶'}
            </span>
            {probing ? (
              <Loader2 size={13} className="flex-none animate-spin text-zinc-400" />
            ) : (
              <ChevronDown
                size={14}
                className={clsx('flex-none text-zinc-400 transition-transform', open && 'rotate-180')}
              />
            )}
          </button>

          {open && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-left font-mono text-[12px] text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                不使用默认存储桶
              </button>
              {options.length === 0 ? (
                <p className="px-3 py-1.5 text-[12px] text-zinc-400">没有可选的存储桶</p>
              ) : (
                options.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={clsx(
                      'flex w-full items-center truncate px-3 py-1.5 text-left font-mono text-[12px] transition',
                      name === bucket
                        ? 'bg-accent-500/10 text-accent-700 dark:text-accent-400'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
                    )}
                    onClick={() => {
                      onChange(name)
                      setOpen(false)
                    }}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ConnectionForm({
  value,
  isNew,
  testing,
  testResult,
  onChange,
  onBucketChange,
  onCheckBucket,
  onQueryBuckets,
  onTest,
  onSave,
}: ConnectionFormProps) {
  const [showSecret, setShowSecret] = useState(false)
  const canSave = Boolean(value.name.trim() && value.endpoint.trim())

  return (
    <div className="space-y-4">
      <Field label="连接名称">
        <input
          className="field"
          placeholder="例如：生产环境 / 我的 MinIO"
          value={value.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="服务地址（Endpoint）" hint="支持 S3 兼容服务，如 MinIO、阿里云 OSS 等">
            <input
              className="field font-mono"
              placeholder="s3.amazonaws.com 或 minio.example.com:9000"
              value={value.endpoint}
              onChange={(event) => onChange({ endpoint: event.target.value })}
            />
          </Field>
        </div>
        <Field label="区域（Region）">
          <input
            className="field font-mono"
            placeholder="us-east-1"
            value={value.region}
            onChange={(event) => onChange({ region: event.target.value })}
          />
        </Field>
      </div>

      <Field label="Access Key ID">
        <input
          className="field font-mono"
          placeholder="AKIA..."
          autoComplete="off"
          value={value.accessKeyId}
          onChange={(event) => onChange({ accessKeyId: event.target.value })}
        />
      </Field>

      <Field label="Secret Access Key">
        <div className="relative">
          <input
            className="field pr-10 font-mono"
            type={showSecret ? 'text' : 'password'}
            placeholder="••••••••••••"
            autoComplete="off"
            value={value.secretAccessKey}
            onChange={(event) => onChange({ secretAccessKey: event.target.value })}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
            onClick={() => setShowSecret((prev) => !prev)}
            title={showSecret ? '隐藏' : '显示'}
          >
            {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <BucketEditor
        key={value.id}
        bucket={value.bucket}
        onChange={onBucketChange}
        onCheck={onCheckBucket}
        onQuery={onQueryBuckets}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Toggle
          checked={value.pathStyle}
          onChange={(next) => onChange({ pathStyle: next })}
          title="路径风格寻址"
          desc="MinIO 等自建服务通常需要开启"
        />
        <Toggle
          checked={value.forceSSL}
          onChange={(next) => onChange({ forceSSL: next })}
          title="强制 HTTPS"
          desc="使用加密连接访问对象存储"
        />
      </div>

      

      {testResult &&
        (testResult.canListBuckets ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            连通性正常，检测到 {testResult.buckets} 个存储桶
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            连接正常，但当前凭证无列出存储桶（ListBuckets）权限，请在上方「默认存储桶」中手动输入并检查桶名称。
          </div>
        ))}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button className="btn-ghost" onClick={onTest} disabled={testing || !canSave}>
          {testing ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
          测试连接
        </button>
        <button className="btn-primary" onClick={onSave} disabled={!canSave}>
          <Save size={15} />
          {isNew ? '保存并连接' : '保存修改'}
        </button>
      </div>
    </div>
  )
}
