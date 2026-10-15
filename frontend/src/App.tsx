// 应用根组件：路由 + 主题同步 + 全局提示
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastHost } from '@/components/ui/ToastHost'
import { ConnectPage } from '@/pages/ConnectPage'
import { BrowsePage } from '@/pages/BrowsePage'
import { useConnectionStore } from '@/store/useConnectionStore'

/** 根据用户偏好同步浅色/深色主题到根元素 */
function useThemeSync() {
  const theme = useConnectionStore((state) => state.preferences.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
}

/** 入口重定向：已有连接进入浏览页，否则进入连接页 */
function EntryRedirect() {
  const hasConnection = useConnectionStore((state) => state.connections.length > 0)
  return <Navigate to={hasConnection ? '/browse' : '/connect'} replace />
}

export default function App() {
  useThemeSync()

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<EntryRedirect />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </HashRouter>
  )
}