import { useState } from 'react'
import { Database, Github, Folder, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SourceSelectorProps {
  currentSource: 'local' | 'github'
  onSourceChange: (source: 'local' | 'github') => void
  className?: string
}

export function SourceSelector({ currentSource, onSourceChange, className }: SourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sources = [
    {
      id: 'local' as const,
      name: 'Local Files',
      description: 'Files from public/notes directory',
      icon: Folder,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'github' as const,
      name: 'GitHub Repository',
      description: 'Files from GitHub repository',
      icon: Github,
      color: 'text-green-600 dark:text-green-400'
    }
  ]

  const currentSourceInfo = sources.find(s => s.id === currentSource)

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs"
      >
        {currentSourceInfo && (
          <>
            <currentSourceInfo.icon className={cn("w-3 h-3", currentSourceInfo.color)} />
            <span className="hidden sm:inline">{currentSourceInfo.name}</span>
          </>
        )}
        <Settings className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Data Source
              </div>
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => {
                    onSourceChange(source.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    currentSource === source.id && "bg-accent/50"
                  )}
                >
                  <source.icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", source.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{source.name}</span>
                      {currentSource === source.id && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {source.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="border-t border-border p-3">
              <div className="flex items-start gap-2">
                <Database className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">Current: {currentSourceInfo?.name}</p>
                  <p className="mt-1">{currentSourceInfo?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
