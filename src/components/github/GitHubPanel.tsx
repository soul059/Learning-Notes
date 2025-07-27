import { useState, useEffect } from 'react'
import { 
  Github, 
  X, 
  GitPullRequest, 
  Database, 
  Trash2, 
  Wifi, 
  WifiOff, 
  Lock,
  Unlock,
  ExternalLink,
  User,
  Star,
  GitBranch,
  Clock,
  AlertCircle,
  Search,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGitHub, useGitHubAuth } from '@/contexts/GitHubProvider'
import { GitHubAuthModal } from './GitHubAuthModal'
import { CreatePullRequestModal } from './CreatePullRequestModal'
import { CacheService } from '@/lib/cache'
import { cn } from '@/lib/utils'

interface GitHubPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function GitHubPanel({ isOpen, onClose }: GitHubPanelProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPRModal, setShowPRModal] = useState(false)
  const [cacheStats, setCacheStats] = useState(CacheService.getStats())
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const [repoInput, setRepoInput] = useState('')
  const [isChangingRepo, setIsChangingRepo] = useState(false)
  
  const { 
    config, 
    isConnected, 
    hasWriteAccess, 
    error, 
    githubService,
    clearError,
    setRepository 
  } = useGitHub()
  const { isAuthenticated, logout } = useGitHubAuth()

  // Fetch repository information when panel opens
  useEffect(() => {
    if (isOpen && githubService && isConnected) {
      fetchRepoInfo()
    }
  }, [isOpen, githubService, isConnected])

  const fetchRepoInfo = async () => {
    try {
      if (githubService) {
        const info = await githubService.getRepository()
        setRepoInfo(info)
      }
    } catch (err) {
      console.error('Failed to fetch repository info:', err)
    }
  }

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

  const handleChangeRepository = async () => {
    if (!repoInput.trim()) return
    
    const parts = repoInput.trim().split('/')
    if (parts.length !== 2) {
      clearError()
      // Show error toast or message
      return
    }
    
    const [owner, repo] = parts
    setIsChangingRepo(true)
    
    try {
      console.log('🔄 Switching to repository:', `${owner}/${repo}`)
      setRepository(owner, repo)
      setRepoInput('')
      setRepoInfo(null) // Clear old repo info
      
      // Close the panel to show the loading state
      onClose()
      
      console.log('✅ Repository switched successfully')
    } catch (err) {
      console.error('Failed to change repository:', err)
    } finally {
      setIsChangingRepo(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
    if (isConnected && hasWriteAccess) return 'Connected with Write Access'
    if (isConnected) return 'Connected (Read Only)'
    return 'Disconnected'
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[300] flex">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Panel */}
        <div className={cn(
          "relative ml-auto w-full max-w-md h-full bg-background border-l border-border shadow-2xl",
          "animate-in slide-in-from-right duration-300 ease-out"
        )}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Github className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">GitHub Integration</h2>
                  <p className="text-xs text-muted-foreground">Repository Management</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Connection Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon()}
                  Connection Status
                </h3>
                <div className="p-3 bg-card rounded-lg border">
                  <div className={`flex items-center gap-2 text-sm font-medium ${getStatusColor()}`}>
                    {hasWriteAccess ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {getStatusText()}
                  </div>
                  {error && (
                    <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        <span>{error}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="mt-1 h-6 text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Repository Selector */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Browse Repository
                </h3>
                <div className="p-3 bg-card rounded-lg border space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Enter any public GitHub repository to browse
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="owner/repository"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleChangeRepository()
                        }
                      }}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChangeRepository}
                      disabled={!repoInput.trim() || isChangingRepo}
                      className="px-3"
                    >
                      {isChangingRepo ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Examples: microsoft/vscode, facebook/react, vercel/next.js
                  </div>
                </div>
              </div>

              {/* Repository Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  Repository Information
                </h3>
                <div className="p-3 bg-card rounded-lg border space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{config.owner}/{config.repo}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://github.com/${config.owner}/${config.repo}`, '_blank')}
                      className="h-6 px-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {repoInfo && (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {repoInfo.description && (
                        <p>{repoInfo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>{repoInfo.stargazers_count?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          <span>{repoInfo.forks_count?.toLocaleString() || 0}</span>
                        </div>
                        {repoInfo.language && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{repoInfo.language}</span>
                          </div>
                        )}
                      </div>
                      {repoInfo.updated_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Updated {formatDate(repoInfo.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              {isAuthenticated && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Account Status
                  </h3>
                  <div className="p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">GitHub Connected</div>
                        <div className="text-xs text-muted-foreground">
                          {hasWriteAccess ? 'Full repository access' : 'Read-only access'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cache Management */}
              {isConnected && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Cache Management
                  </h3>
                  <div className="p-3 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">
                        {cacheStats.localStorage.itemCount + cacheStats.sessionStorage.itemCount} items cached
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatBytes(cacheStats.localStorage.size + cacheStats.sessionStorage.size)}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>Persistent: {cacheStats.localStorage.itemCount}</span>
                      <span>Session: {cacheStats.sessionStorage.itemCount}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearCache}
                      className="w-full text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Actions</h3>
                <div className="space-y-2">
                  {!isAuthenticated ? (
                    <Button
                      variant="default"
                      onClick={() => setShowAuthModal(true)}
                      className="w-full"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Connect GitHub Account
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {hasWriteAccess && (
                        <Button
                          variant="default"
                          onClick={() => setShowPRModal(true)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <GitPullRequest className="w-4 h-4 mr-2" />
                          Create Pull Request
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={logout}
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GitHubAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      {showPRModal && (
        <CreatePullRequestModal
          isOpen={showPRModal}
          onClose={() => setShowPRModal(false)}
          filePath="README.md"
          content=""
          originalContent=""
        />
      )}
    </>
  )
}
