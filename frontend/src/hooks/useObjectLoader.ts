// 根据当前连接与目录位置加载对象列表
import { useEffect, useMemo } from 'react'
import { bridge } from '@/lib/bridge'
import { useBrowseStore } from '@/store/useBrowseStore'
import { useConnectionStore } from '@/store/useConnectionStore'

export function useObjectLoader(refreshToken: number) {
  const connections = useConnectionStore((state) => state.connections)
  const activeId = useConnectionStore((state) => state.preferences.activeConnectionId)
  const connection = useMemo(
    () => connections.find((item) => item.id === activeId),
    [connections, activeId],
  )

  const bucket = useBrowseStore((state) => state.bucket)
  const prefix = useBrowseStore((state) => state.prefix)
  const setData = useBrowseStore((state) => state.setData)
  const setLoading = useBrowseStore((state) => state.setLoading)
  const setError = useBrowseStore((state) => state.setError)

  useEffect(() => {
    if (!connection || !bucket) {
      setData([], [])
      return
    }
    let canceled = false
    setLoading(true)
    bridge
      .listObjects(connection, bucket, prefix, '')
      .then((result) => {
        if (canceled) return
        setData(result.folders, result.files)
      })
      .catch((error) => {
        if (canceled) return
        setError((error as Error)?.message ?? String(error))
      })
      .finally(() => {
        if (!canceled) setLoading(false)
      })
    return () => {
      canceled = true
    }
  }, [connection, bucket, prefix, refreshToken, setData, setLoading, setError])

  return connection
}