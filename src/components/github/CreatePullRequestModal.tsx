import { useState } from 'react'
import { GitPullRequest, X, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useGitHub } from '@/contexts/GitHubProvider'
import { cn } from '@/lib/utils'

interface CreatePullRequestModalProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  content: string
  originalContent: string
}

export function CreatePullRequestModal({ 
  isOpen, 
  onClose, 
  filePath, 
  content, 
  originalContent 
}: CreatePullRequestModalProps) {
  const [title, setTitle] = useState(`Update ${filePath.split('/').pop()}`)
  const [description, setDescription] = useState('')
  const [commitMessage, setCommitMessage] = useState(`Update ${filePath}`)
  const [isLoading, setIsLoading] = useState(false)
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { createPullRequest, config, hasWriteAccess } = useGitHub()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !commitMessage.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const pr = await createPullRequest(
        title.trim(),
        content,
        filePath,
        commitMessage.trim()
      )
      
      setPullRequestUrl(pr.html_url)
      
      // Auto-close after a delay to show success
      setTimeout(() => {
        onClose()
        setPullRequestUrl(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pull request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  const hasChanges = content !== originalContent

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
        "relative w-full max-w-lg bg-background border border-border rounded-lg shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GitPullRequest className="w-6 h-6 text-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Create Pull Request</h2>
                <p className="text-sm text-muted-foreground">
                  Submit your changes for review
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Repository and File Info */}
          <div className="mb-6 p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{config.owner}/{config.repo}</span>
              </div>
              <div className="text-muted-foreground">
                File: <span className="font-mono text-xs">{filePath}</span>
              </div>
            </div>
          </div>

          {/* Access Check */}
          {!hasWriteAccess && (
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <p className="font-medium">Limited Access</p>
                  <p>You don't have write access to this repository. The pull request will be created from a fork.</p>
                </div>
              </div>
            </div>
          )}

          {/* Changes Check */}
          {!hasChanges && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p>No changes detected in the file content.</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {pullRequestUrl && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <GitPullRequest className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-green-700 dark:text-green-300 mb-2">
                  Pull Request Created!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                  Your changes have been submitted for review.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pullRequestUrl, '_blank')}
                  className="border-green-500/20 text-green-700 dark:text-green-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Pull Request
                </Button>
              </div>
            </div>
          )}

          {/* Form */}
          {!pullRequestUrl && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pr-title" className="block text-sm font-medium mb-2">
                  Title
                </label>
                <Input
                  id="pr-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of your changes"
                  required
                />
              </div>

              <div>
                <label htmlFor="commit-message" className="block text-sm font-medium mb-2">
                  Commit Message
                </label>
                <Input
                  id="commit-message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe what you changed"
                  required
                />
              </div>

              <div>
                <label htmlFor="pr-description" className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <Textarea
                  id="pr-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about your changes..."
                  rows={3}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim() || !commitMessage.trim() || isLoading || !hasChanges}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <>
                      <GitPullRequest className="w-4 h-4 mr-2" />
                      Create PR
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
