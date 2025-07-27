import { useState } from 'react'
import { Github, Eye, EyeOff, ExternalLink, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGitHub } from '@/contexts/GitHubProvider'
import { cn } from '@/lib/utils'

interface GitHubAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GitHubAuthModal({ isOpen, onClose }: GitHubAuthModalProps) {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setToken: setGithubToken, config, isConnected, hasWriteAccess, error, clearError } = useGitHub()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    setIsLoading(true)
    clearError()
    
    try {
      setGithubToken(token.trim())
      // Small delay to allow the provider to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      onClose()
    } catch (err) {
      console.error('Authentication error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-md bg-background border border-border rounded-lg shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Github className="w-6 h-6 text-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Connect to GitHub</h2>
              <p className="text-sm text-muted-foreground">
                Authenticate to create pull requests
              </p>
            </div>
          </div>

          {/* Repository Info */}
          <div className="mb-6 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Github className="w-4 h-4" />
              <span className="font-medium">{config.owner}/{config.repo}</span>
              {isConnected && (
                <span className="ml-auto text-green-600 dark:text-green-400 text-xs">
                  ✓ Connected
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Public repository - read access available without token
            </p>
          </div>

          {/* Token Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="github-token" className="block text-sm font-medium mb-2">
                Personal Access Token
              </label>
              <div className="relative">
                <Input
                  id="github-token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Required for creating pull requests and editing files
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success Display */}
            {isConnected && hasWriteAccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Successfully authenticated with write access
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!token.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">How to get a Personal Access Token:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to GitHub Settings → Developer settings</li>
                  <li>Click "Personal access tokens" → "Tokens (classic)"</li>
                  <li>Generate new token with "repo" scope</li>
                  <li>Copy and paste the token here</li>
                </ol>
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-primary hover:underline"
                >
                  Open GitHub Settings
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
