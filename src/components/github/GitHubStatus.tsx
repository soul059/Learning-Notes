import { useState } from 'react'
import { Github, Wifi, WifiOff, GitPullRequest, Settings, Database, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGitHub, useGitHubAuth } from '@/contexts/GitHubProvider'
import { GitHubAuthModal } from './GitHubAuthModal'
import { CacheService } from '@/lib/cache'

interface GitHubStatusProps {
  className?: string
}

export function GitHubStatus({ className }: GitHubStatusProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [cacheStats, setCacheStats] = useState(CacheService.getStats())
  const { config, isConnected, hasWriteAccess, error, githubService } = useGitHub()
  const { isAuthenticated, logout } = useGitHubAuth()

  // Debug logging
  console.log('GitHubStatus render:', { isAuthenticated, isConnected, hasWriteAccess, error })

  const handleClearCache = () => {
    if (githubService) {
      githubService.clearCache()
      setCacheStats(CacheService.getStats())
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = () => {
    if (error) return 'text-destructive'
    if (isConnected && hasWriteAccess) return 'text-green-600 dark:text-green-400'
    if (isConnected) return 'text-blue-600 dark:text-blue-400'
    return 'text-muted-foreground'
  }

  const getStatusIcon = () => {
    if (error) return <WifiOff className="w-4 h-4" />
    if (isConnected) return <Wifi className="w-4 h-4" />
    return <WifiOff className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (error) return 'Connection Error'
    if (isConnected && hasWriteAccess) return 'Connected (Write Access)'
    if (isConnected) return 'Connected (Read Only)'
    return 'Disconnected'
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Repository Info */}
        <div className="flex items-center gap-2 text-sm">
          <Github className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">
            {config.owner}/{config.repo}
          </span>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-1.5 text-sm ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </div>

        {/* Cache Status */}
        {isConnected && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>{cacheStats.persistent + cacheStats.session} cached</span>
            <span>({formatBytes(cacheStats.totalSize)})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCache}
              className="h-6 px-2 text-xs hover:text-destructive"
              title="Clear cache"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {hasWriteAccess && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs">
                  <GitPullRequest className="w-3 h-3" />
                  <span className="hidden sm:inline">PR Ready</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              <Settings className="w-3 h-3 mr-1" />
              Connect GitHub
            </Button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <GitHubAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}
