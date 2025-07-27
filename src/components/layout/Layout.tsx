import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Settings, 
  FileText, 
  FolderOpen, 
  Menu,
  X,
  Github
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchModal } from '@/components/search/SearchModal'
import { GitHubPanel } from '@/components/github/GitHubPanel'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatusBar } from '@/components/ui/StatusBar'
import { useUserState } from '@/hooks/useUserState'
import { cn } from '@/lib/utils'
import type { MarkdownSettings } from '@/types'

interface LayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  onFileSelect?: (path: string) => void
  isLoading?: boolean
  currentFile?: string
  markdownSettings?: MarkdownSettings
  onMarkdownSettingsChange?: (settings: MarkdownSettings) => void
}

export function Layout({ 
  children, 
  sidebar, 
  onFileSelect, 
  isLoading, 
  currentFile, 
  markdownSettings, 
  onMarkdownSettingsChange 
}: LayoutProps) {
  const userState = useUserState()
  
  // Initialize panel states from user state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [githubPanelOpen, setGithubPanelOpen] = useState(userState.panels.github)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(userState.panels.settings)
  const { addToast } = useToast()

  // Handle settings changes
  const handleSettingsChange = (settings: MarkdownSettings) => {
    if (onMarkdownSettingsChange) {
      onMarkdownSettingsChange(settings)
    }
    addToast({
      title: 'Settings saved',
      description: 'Markdown view settings have been updated',
      type: 'success',
      duration: 2000
    })
  }
  
  // Update user state when panel states change
  useEffect(() => {
    userState.setPanelState('github', githubPanelOpen)
  }, [githubPanelOpen, userState])
  
  useEffect(() => {
    userState.setPanelState('settings', settingsPanelOpen)
  }, [settingsPanelOpen, userState])
  
  useEffect(() => {
    userState.setPanelState('search', searchOpen)
  }, [searchOpen, userState])

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      
      // Cmd+B or Ctrl+B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden" data-theme-target>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative z-50 lg:z-auto h-full",
        "transition-all duration-300 ease-in-out bg-card border-r border-border",
        "flex flex-col shadow-lg lg:shadow-none",
        sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0",
        "overflow-hidden"
      )} data-theme-target>
        <div className="h-full flex flex-col">
          {/* Enhanced Sidebar Header */}
          <div className="p-4 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-card-foreground">
                    Learning Notes
                  </h1>
                  <p className="text-xs text-muted-foreground">Knowledge Hub</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Enhanced Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <Input
                placeholder="Search notes... (⌘K)"
                className="pl-10 bg-background/50 border-input cursor-pointer hover:bg-background transition-colors focus:bg-background"
                readOnly
                onClick={() => setSearchOpen(true)}
              />
              <div className="absolute right-2 top-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                ⌘K
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sidebar}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <header className="h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="hover:bg-accent transition-colors"
                  title="Open sidebar (⌘B)"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Knowledge Hub</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 hover:bg-accent transition-colors"
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                  ⌘K
                </span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="sm:hidden hover:bg-accent transition-colors"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex items-center gap-2 hover:bg-accent transition-colors"
                onClick={() => setGithubPanelOpen(true)}
                title="GitHub Integration"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGithubPanelOpen(true)}
                className="md:hidden hover:bg-accent transition-colors"
                title="GitHub Integration"
              >
                <Github className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsPanelOpen(true)}
                className="hover:bg-accent transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <ThemeToggle variant="button" className="hover:bg-accent transition-colors" />
            </div>
          </div>
        </header>

        {/* Content Area with Loading State */}
        <main className="flex-1 overflow-hidden relative" data-theme-target>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <LoadingSpinner size="lg" text="Loading content..." />
            </div>
          )}
          
          <div className="h-full overflow-auto" data-theme-target>
            {children}
          </div>
        </main>

        {/* Status Bar */}
        <StatusBar currentFile={currentFile} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Search Modal */}
      <SearchModal 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onFileSelect={(path) => {
          onFileSelect?.(path)
          setSearchOpen(false)
          addToast({
            title: 'File opened',
            description: `Navigated to ${path}`,
            type: 'success',
            duration: 2000
          })
        }}
      />

      {/* GitHub Panel */}
      <GitHubPanel 
        isOpen={githubPanelOpen}
        onClose={() => setGithubPanelOpen(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        settings={markdownSettings || {
          fontSize: 'medium',
          lineHeight: 'comfortable',
          maxWidth: 'content',
          codeTheme: 'auto',
          enableSyntaxHighlighting: true,
          showLineNumbers: false,
          enableTableOfContents: true,
          enableMath: false,
          enableMermaid: false,
          enableRawHtml: true
        }}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}
