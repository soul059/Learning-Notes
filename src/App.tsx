import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { FileTree } from '@/components/layout/FileTree'
import { MarkdownViewer } from '@/components/markdown/MarkdownViewer'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { GitHubProvider, useGitHub } from '@/contexts/GitHubProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FullPageLoading } from '@/components/ui/LoadingSpinner'
import { UserStateDebug } from '@/components/ui/UserStateDebug'
import { CacheDebug } from '@/components/ui/CacheDebug'
import { loadMarkdownFile, normalizeFilePath } from '@/lib/fileLoader'
import { useFileDiscovery } from '@/hooks/useFileDiscovery'
import { useUserState, useScrollRestore } from '@/hooks/useUserState'
import { Button } from '@/components/ui/button'
import { CacheService } from '@/lib/cache'
import type { FileSystemItem, MarkdownSettings } from '@/types'
const defaultMarkdownSettings: MarkdownSettings = {
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
}

// Convert flat file paths to hierarchical tree structure
function buildFileTree(files: string[]): FileSystemItem[] {
  const tree: { [key: string]: any } = {}
  
  // Build the tree structure
  files.forEach(filePath => {
    const parts = filePath.split('/')
    let current = tree
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      
      if (!current[part]) {
        current[part] = isFile ? null : {}
      }
      
      if (!isFile) {
        current = current[part]
      }
    })
  })
  
  // Convert tree to FileSystemItem array
  const convertToItems = (node: any, parentPath = ''): FileSystemItem[] => {
    return Object.entries(node)
      .map(([name, value]) => {
        const path = parentPath ? `${parentPath}/${name}` : name
        const isFile = value === null
        
        return {
          name,
          path,
          type: isFile ? 'file' : 'directory',
          lastModified: new Date(),
          children: isFile ? undefined : convertToItems(value, path)
        } as FileSystemItem
      })
      .sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
  }
  
  return convertToItems(tree)
}

const sampleMarkdown = `# Welcome to Learning Notes

🎉 **Your Learning Notes website is now running!**

## 🚀 Getting Started

Learning Notes is a modern, React-powered platform for organizing and sharing your learning materials. You can:

- 📝 **Browse Content**: Explore the welcome pages to learn about all features
- 🔍 **Search Everything**: Press \`Cmd+K\` (Mac) or \`Ctrl+K\` (Windows/Linux) to search
- 🌙 **Switch Themes**: Toggle between light and dark modes in the sidebar
- ✏️ **Edit Files**: Click any file and hit the edit button to modify content
- 🔄 **GitHub Integration**: Connect your repository for collaborative editing

## 📁 Your Content Structure

Content is now organized in the \`public/welcome/\` directory:

- **\`home.md\`** - Complete product showcase and feature overview
- **\`quick-start.md\`** - Installation guide and first steps
- **\`features.md\`** - Detailed feature descriptions and examples

## 🎯 Next Steps

1. **� Explore**: Click on "Features" in the sidebar to see what's possible
2. **⚡ Quick Start**: Follow the Quick Start guide for customization tips
3. **📝 Add Content**: Create your own markdown files in the welcome folder
4. **🤝 Collaborate**: Connect GitHub for team editing and pull requests

## ✨ Key Features to Try Right Now

### **Smart Search**
\`\`\`
Press Cmd+K or Ctrl+K and type:
- "features" to see all capabilities
- "github" to learn about collaboration
- "theme" to find customization options
\`\`\`

### **Live Editing**
Click the edit button (✏️) on any file to experience the real-time editor with syntax highlighting.

### **GitHub Integration** 
Connect your repository to:
- Create pull requests directly from the editor
- Collaborate with team members
- Track changes and version history

---

**Ready to start your learning journey?** Click on any file in the sidebar or use the search function to explore! 🚀`

function AppContent() {
  // User state management
  const userState = useUserState()
  
  // State for selected file and content
  const [selectedFile, setSelectedFile] = useState('')
  const [markdownContent, setMarkdownContent] = useState(sampleMarkdown)
  const [loading, setLoading] = useState(false)
  
  // Markdown settings state
  const [markdownSettings, setMarkdownSettings] = useState<MarkdownSettings>(() => {
    // Load settings from localStorage on startup
    const saved = localStorage.getItem('markdown-settings')
    if (saved) {
      try {
        return { ...defaultMarkdownSettings, ...JSON.parse(saved) }
      } catch (error) {
        console.error('Failed to load markdown settings:', error)
        return defaultMarkdownSettings
      }
    }
    return defaultMarkdownSettings
  })
  
  // Scroll restoration for current file
  useScrollRestore(selectedFile)

  // Handle markdown settings changes
  const handleMarkdownSettingsChange = (settings: MarkdownSettings) => {
    setMarkdownSettings(settings)
    localStorage.setItem('markdown-settings', JSON.stringify(settings))
    console.log('💾 Markdown settings updated:', settings)
  }
  
  // Initialize cache optimization on app start
  useEffect(() => {
    // Run cache optimization on startup
    setTimeout(() => {
      CacheService.optimizeCache()
      console.log('🚀 App started with cache optimization')
    }, 1000) // Delay to not block initial render
  }, [])
  
  // Get GitHub context
  const { isConnected, fileTree: githubFileTree, files: githubFiles, loadFiles, error, githubService, config } = useGitHub()
  
  // Get local files as fallback only when not connected
  const { files: localFiles } = useFileDiscovery()
  
  // Determine which files and tree to use - FORCE GitHub when connected
  const useGitHubFiles = isConnected
  const fileTree = useGitHubFiles ? githubFileTree : buildFileTree(localFiles)

  // Debug logging
  useEffect(() => {
    console.log('GitHub Status:', { 
      isConnected, 
      githubFilesCount: githubFiles.length, 
      githubFileTree: githubFileTree.length,
      error,
      useGitHubFiles,
      lazyLoadingActive: isConnected
    })
    if (githubFiles.length > 0) {
      console.log('📂 GitHub files with content:', githubFiles.filter(f => f.content).map(f => f.path))
      console.log('📄 GitHub files without content:', githubFiles.filter(f => !f.content).map(f => f.path))
      console.log('🌳 Current file tree structure:', githubFileTree)
    }
    if (githubFileTree.length > 0) {
      console.log('GitHub file tree (lazy):', githubFileTree)
    }
  }, [isConnected, githubFiles, githubFileTree, error, useGitHubFiles])
  
  // Sync selectedFile with user state currentFile
  useEffect(() => {
    if (userState.currentFile && userState.currentFile !== selectedFile) {
      console.log('🔄 Syncing selectedFile with user state:', { 
        userStateFile: userState.currentFile, 
        currentSelectedFile: selectedFile 
      })
      setSelectedFile(userState.currentFile)
    }
  }, [userState.currentFile, selectedFile])
  
  // Load GitHub files when connected
  useEffect(() => {
    if (isConnected && githubFileTree.length === 0) {
      console.log('Connected to GitHub, loading lazy file structure...')
      loadFiles()
    }
  }, [isConnected, loadFiles, githubFileTree.length])

  // Watch for repository configuration changes
  useEffect(() => {
    if (config && githubService) {
      console.log('🔄 Repository configuration changed:', config)
      
      // Check if current file exists in the new repository
      const currentFile = userState.currentFile
      if (currentFile && githubFiles.length > 0) {
        const fileExists = githubFiles.some((f: any) => f.path === currentFile)
        if (!fileExists) {
          console.log('📂 Current file does not exist in new repository, clearing:', currentFile)
          userState.setCurrentFile('')
          setSelectedFile('')
          setMarkdownContent(sampleMarkdown)
        }
      } else {
        // Reset current file when repository changes if no files loaded yet
        console.log('📂 Repository changed, clearing current file')
        setSelectedFile('')
        setMarkdownContent(sampleMarkdown)
      }
    }
  }, [config.owner, config.repo, config.branch, githubFiles])
  
  // Update default file when GitHub files are loaded or repository changes
  useEffect(() => {
    if (useGitHubFiles && githubFiles.length > 0) {
      // First check if user has a previously selected file that exists in the current repo
      const savedFile = userState.currentFile
      const savedFileExists = savedFile && githubFiles.some((f: any) => f.path === savedFile)
      
      if (savedFileExists) {
        console.log('🔄 Restoring user\'s last selected file:', savedFile)
        setSelectedFile(savedFile)
        handleFileSelect(savedFile)
        return
      }
      
      // Try to find README.md first, then any markdown file
      const readmeFile = githubFiles.find((f: any) => 
        f.name.toLowerCase() === 'readme.md' || f.path.toLowerCase() === 'readme.md'
      )
      const firstMarkdownFile = githubFiles.find((f: any) => f.name.endsWith('.md'))
      const defaultFile = readmeFile ? readmeFile.path : (firstMarkdownFile ? firstMarkdownFile.path : githubFiles[0].path)
      
      console.log('🏠 Setting default file from GitHub:', { defaultFile, totalFiles: githubFiles.length, repo: `${config.owner}/${config.repo}` })
      setSelectedFile(defaultFile)
      handleFileSelect(defaultFile)
    } else if (!useGitHubFiles && localFiles.length > 0) {
      // For local files, check for saved file first
      const savedFile = userState.currentFile
      const savedFileExists = savedFile && localFiles.includes(savedFile)
      
      if (savedFileExists) {
        console.log('🔄 Restoring user\'s last selected local file:', savedFile)
        setSelectedFile(savedFile)
        handleFileSelect(savedFile)
        return
      }
      
      // Default to welcome/home.md
      const welcomeHome = 'welcome/home.md'
      console.log('🏠 Setting default file from local:', welcomeHome)
      setSelectedFile(welcomeHome)
      handleFileSelect(welcomeHome)
    }
  }, [githubFiles, useGitHubFiles, localFiles, config.owner, config.repo, userState.currentFile])

  const handleFileSelect = async (filePath: string) => {
    console.log('🔍 File selection started:', { filePath, selectedFile, isConnected })
    setSelectedFile(filePath)
    
    // Save current file to user state
    console.log('💾 Saving current file to user state:', filePath)
    userState.setCurrentFile(filePath)
    
    // Also save repository info if connected to GitHub
    if (isConnected && config) {
      console.log('🔄 Saving repository info to user state:', config)
      userState.setRepository(config.owner, config.repo, config.branch)
    }
    
    setLoading(true)
    
    try {
      // Resolve relative paths based on current file location
      let resolvedPath = filePath
      
      // If it's a relative path (doesn't start with / and doesn't contain folder structure)
      if (!filePath.includes('/') && !filePath.startsWith('/') && selectedFile && selectedFile.includes('/')) {
        const currentDir = selectedFile.substring(0, selectedFile.lastIndexOf('/'))
        resolvedPath = `${currentDir}/${filePath}`
        console.log('📁 Resolved relative path:', { original: filePath, resolved: resolvedPath })
      }
      
      // Clean up path (remove ./ and resolve ../)
      resolvedPath = resolvedPath
        .replace(/^\.\//, '') // Remove leading ./
        .replace(/\/\.\//g, '/') // Remove middle ./
        .split('/')
        .reduce((acc: string[], part: string) => {
          if (part === '..') {
            acc.pop() // Go up one directory
          } else if (part !== '.' && part !== '') {
            acc.push(part)
          }
          return acc
        }, [])
        .join('/')
      
      const normalizedPath = normalizeFilePath(resolvedPath)
      
      console.log('📝 Path processing:', { 
        originalPath: filePath, 
        resolvedPath, 
        normalizedPath,
        currentFile: selectedFile,
        useGitHub: isConnected 
      })
      
      // Check if file has content already loaded
      const existingFile = githubFiles.find(f => f.path === normalizedPath)
      
      if (existingFile && existingFile.content) {
        console.log('💾 Using cached content for:', normalizedPath)
        setMarkdownContent(existingFile.content)
      } else if (isConnected && githubService) {
        // Load content from GitHub on-demand
        console.log('🌐 Loading content from GitHub for:', normalizedPath)
        const content = await githubService.getFileContent(normalizedPath)
        setMarkdownContent(content)
        console.log('✅ Successfully loaded from GitHub:', normalizedPath)
      } else {
        // Fallback to local file loading
        console.log('💿 Loading from local files:', normalizedPath)
        const content = await loadMarkdownFile(normalizedPath, false)
        setMarkdownContent(content)
        console.log('✅ Successfully loaded from local:', normalizedPath)
      }
    } catch (error) {
      console.error('❌ Failed to load file:', error)
      setMarkdownContent(`# Error Loading File

Failed to load the file at path: \`${filePath}\`

**Error Details:**
${error instanceof Error ? error.message : 'Unknown error'}

**Debug Info:**
- Original path: \`${filePath}\`
- GitHub connected: ${isConnected}
- Available files: ${githubFiles.length} GitHub files, ${localFiles.length} local files

Please check if the file exists and try again.`)
    } finally {
      setLoading(false)
    }
  }

    // Load default file on mount
  useEffect(() => {
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }, [])

  const handleContentChange = (newContent: string) => {
    setMarkdownContent(newContent)
    // TODO: Save content to file
  }

  const handleCreateFile = (parentPath: string) => {
    // TODO: Implement file creation
    console.log('Create file in:', parentPath)
  }

  const handleCreateFolder = (parentPath: string) => {
    // TODO: Implement folder creation
    console.log('Create folder in:', parentPath)
  }

  const handleCollapseAll = () => {
    // Force re-render of the file tree to show collapsed state
    // This will work in combination with the FileTree component's handleCollapseAll
    console.log('🗂️ Collapsing all folders')
    
    // Force a re-render by triggering a small state change
    // The FileTree component will handle the actual collapsing via GitHub context
    setSelectedFile(prevFile => prevFile) // Trigger re-render
  }

  const sidebar = (
    <div>
      {/* GitHub Connection Status */}
      {!isConnected ? (
        <div className="px-4 py-3 mb-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mx-2">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">🔗 Connect to GitHub</div>
            <div className="text-xs text-blue-600 dark:text-blue-300 mb-2">
              Click "Connect" to load files from your repository: soul059/Learning
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log('Manual connection attempt...')
                try {
                  await loadFiles()
                  console.log('Manual connection successful!')
                } catch (err) {
                  console.error('Manual connection failed:', err)
                }
              }}
              className="text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              🔄 Try Connect Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 mb-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mx-2">
          <div className="text-sm text-green-800 dark:text-green-200">
            <div className="font-medium mb-1">✅ Connected to GitHub</div>
            <div className="text-xs text-green-600 dark:text-green-300">
              Showing files from: soul059/Learning
              {githubFiles.length > 0 && ` (${githubFiles.length} files found)`}
            </div>
          </div>
        </div>
      )}
      
      {/* Show connection error if any */}
      {error && (
        <div className="px-4 py-3 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mx-2">
          <div className="text-sm text-red-800 dark:text-red-200">
            <div className="font-medium mb-1">⚠️ Connection Error</div>
            <div className="text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          </div>
        </div>
      )}
      
      <FileTree
        items={fileTree}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onCollapseAll={handleCollapseAll}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Layout 
        sidebar={sidebar} 
        onFileSelect={handleFileSelect}
        isLoading={loading}
        currentFile={selectedFile}
        markdownSettings={markdownSettings}
        onMarkdownSettingsChange={handleMarkdownSettingsChange}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <FullPageLoading message="Loading your content..." />
          </div>
        ) : (
          <MarkdownViewer
            content={markdownContent}
            onContentChange={handleContentChange}
            editable={true}
            filePath={selectedFile}
            useGitHub={useGitHubFiles}
            onFileSelect={handleFileSelect}
            settings={markdownSettings}
          />
        )}
      </Layout>
      
      {/* Debug panels in development */}
      {import.meta.env.DEV && (
        <>
          <UserStateDebug />
          <CacheDebug />
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="learning-notes-theme">
        <ToastProvider>
          <GitHubProvider>
            <AppContent />
          </GitHubProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
