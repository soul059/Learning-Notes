import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Clock, Users, FileText, Database } from 'lucide-react'
import { useGitHub } from '@/contexts/GitHubProvider'
import { CacheService } from '@/lib/cache'
import { cn } from '@/lib/utils'

interface StatusBarProps {
  className?: string
  currentFile?: string
}

export function StatusBar({ className, currentFile }: StatusBarProps) {
  const { isConnected, files, isLoading, config } = useGitHub()
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [cacheStats, setCacheStats] = useState({
    memoryCache: { size: 0, maxSize: 0 },
    localStorage: { size: 0, itemCount: 0 },
    sessionStorage: { size: 0, itemCount: 0 }
  })
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine)

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(CacheService.getStats())
    }

    updateStats()
    const interval = setInterval(updateStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Track network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true)
    const handleOffline = () => setNetworkStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update last sync time when connected state changes
  useEffect(() => {
    if (isConnected) {
      setLastSync(new Date())
    }
  }, [isConnected])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={cn(
      'h-6 bg-muted/50 border-t border-border flex items-center justify-between px-3 text-xs text-muted-foreground',
      'backdrop-blur-sm transition-all duration-200',
      className
    )}>
      {/* Left side - File info */}
      <div className="flex items-center gap-4">
        {currentFile && (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span className="font-mono">{currentFile}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{files.length} files</span>
        </div>
      </div>

      {/* Right side - Status indicators */}
      <div className="flex items-center gap-4">
        {/* Cache status */}
        <div className="flex items-center gap-1" title={`Cache: ${cacheStats.localStorage.itemCount + cacheStats.sessionStorage.itemCount} items (${formatFileSize(cacheStats.localStorage.size + cacheStats.sessionStorage.size)})`}>
          <Database className="w-3 h-3" />
          <span>{formatFileSize(cacheStats.localStorage.size + cacheStats.sessionStorage.size)}</span>
        </div>

        {/* Last sync */}
        {isConnected && lastSync && (
          <div className="flex items-center gap-1" title={`Last synced: ${lastSync.toLocaleString()}`}>
            <Clock className="w-3 h-3" />
            <span>{formatTime(lastSync)}</span>
          </div>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-1">
          {networkStatus ? (
            <>
              {isLoading ? (
                <>
                  <div className="w-3 h-3 animate-spin border border-blue-600 border-t-transparent rounded-full" />
                  <span className="text-blue-600">
                    {config.owner && config.repo ? `Loading ${config.owner}/${config.repo}...` : 'Loading...'}
                  </span>
                </>
              ) : isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">GitHub Connected</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-600">Local Mode</span>
                </>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-600" />
              <span className="text-red-600">Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
