import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { GitHubService, defaultGitHubConfig } from '@/lib/github'
import type { GitHubConfig, GitHubFile } from '@/lib/github'
import type { FileSystemItem } from '@/types'
import { CacheService } from '@/lib/cache'
import { UserStateService } from '@/lib/userState'

interface GitHubContextType {
  // Service and config
  githubService: GitHubService | null
  config: GitHubConfig
  isConnected: boolean
  hasWriteAccess: boolean
  
  // Data
  files: GitHubFile[]
  fileTree: any[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setToken: (token: string) => void
  setRepository: (owner: string, repo: string, branch?: string) => void
  onRepositoryChange?: (config: GitHubConfig) => void
  loadFiles: () => Promise<void>
  expandFolder: (folderPath: string) => Promise<any[]>
  getFileContent: (path: string) => Promise<string>
  createPullRequest: (title: string, content: string, filePath: string, commitMessage: string) => Promise<{ number: number; html_url: string }>
  clearError: () => void
  saveExpandedState: (folderPath: string, expanded: boolean) => void
  getExpandedState: (folderPath: string) => boolean
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined)

interface GitHubProviderProps {
  children: ReactNode
  config?: GitHubConfig
}

export function GitHubProvider({ children, config = defaultGitHubConfig }: GitHubProviderProps) {
  const [githubService, setGithubService] = useState<GitHubService | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasWriteAccess, setHasWriteAccess] = useState(false)
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [fileTree, setFileTree] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState(config)

  // Initialize GitHub service
  useEffect(() => {
    const service = new GitHubService(currentConfig)
    setGithubService(service)
    
    // Clear cache when repository config changes, but only for different repositories
    const newRepoKey = `${currentConfig.owner}/${currentConfig.repo}`
    const prevRepoKey = localStorage.getItem('current-repo-key')
    
    if (prevRepoKey && prevRepoKey !== newRepoKey) {
      console.log('🧹 Repository changed, clearing cache:', { from: prevRepoKey, to: newRepoKey })
      CacheService.clearAll()
    }
    
    localStorage.setItem('current-repo-key', newRepoKey)
    
    // Auto-check connection for public repositories
    console.log('Initializing GitHub service for:', currentConfig)
    checkConnection(service)
  }, [currentConfig])

  const checkConnection = async (service: GitHubService) => {
    try {
      setIsLoading(true)
      console.log('Attempting to connect to GitHub repository:', currentConfig)
      await service.getRepository()
      setIsConnected(true)
      console.log('Successfully connected to GitHub repository')
      
      // Check write access if token is provided
      if (currentConfig.token) {
        const writeAccess = await service.checkWriteAccess()
        setHasWriteAccess(writeAccess)
        console.log('Write access:', writeAccess)
      }
      
      setError(null)
    } catch (err) {
      console.error('GitHub connection error:', err)
      setIsConnected(false)
      setHasWriteAccess(false)
      setError(err instanceof Error ? err.message : 'Failed to connect to GitHub')
    } finally {
      setIsLoading(false)
    }
  }

  const setToken = (token: string) => {
    const newConfig = { ...currentConfig, token }
    setCurrentConfig(newConfig)
    
    // Store token in localStorage for persistence
    localStorage.setItem('github_token', token)
  }

  const setRepository = (owner: string, repo: string, branch: string = 'main') => {
    console.log('🔄 Setting repository:', `${owner}/${repo}`)
    
    const newConfig = { 
      ...currentConfig, 
      owner, 
      repo, 
      branch 
    }
    
    // Set loading state
    setIsLoading(true)
    
    // Clear current state
    setFiles([])
    setFileTree([])
    setError(null)
    setIsConnected(false)
    setHasWriteAccess(false)
    
    setCurrentConfig(newConfig)
    
    // Save repository configuration to user state
    UserStateService.setRepository(owner, repo, branch)
    
    // Clear cache for the new repository
    CacheService.clearAll()
    
    // Store repository configuration in localStorage (for backward compatibility)
    localStorage.setItem('github_repository', JSON.stringify({ owner, repo, branch }))
    
    console.log('✅ Repository configuration updated:', newConfig)
  }

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token')
    if (savedToken && !currentConfig.token) {
      setCurrentConfig(prev => ({ ...prev, token: savedToken }))
    }
    
    // Load repository configuration from user state first, then localStorage as fallback
    const userStateRepo = UserStateService.getRepository()
    const savedRepo = localStorage.getItem('github_repository')
    
    let repoConfig = null
    
    if (userStateRepo) {
      console.log('📥 Loading repository from user state:', userStateRepo)
      repoConfig = userStateRepo
    } else if (savedRepo) {
      try {
        const parsed = JSON.parse(savedRepo)
        console.log('📥 Loading repository from localStorage:', parsed)
        repoConfig = parsed
      } catch (err) {
        console.error('Failed to parse saved repository config:', err)
      }
    }
    
    if (repoConfig) {
      const { owner, repo, branch } = repoConfig
      if (owner && repo && (owner !== currentConfig.owner || repo !== currentConfig.repo)) {
        setCurrentConfig(prev => ({ ...prev, owner, repo, branch: branch || 'main' }))
      }
    }
  }, [])

  // Auto-load files when connected
  useEffect(() => {
    if (isConnected && githubService && files.length === 0) {
      console.log('Auto-loading files after connection...')
      loadFiles()
    }
  }, [isConnected, githubService, files.length])

  const loadFiles = async () => {
    if (!githubService) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Loading lazy file structure...')
      
      // Check if we have cached file tree first
      const cacheKey = `file-tree-${currentConfig.owner}-${currentConfig.repo}-${currentConfig.branch}`
      const cachedTree = CacheService.get<any[]>(cacheKey)
      
      if (cachedTree && cachedTree.length > 0) {
        console.log('💾 Using cached file tree:', { treeNodes: cachedTree.length })
        setFileTree(cachedTree)
        
        // Restore expanded state for cached folders
        const expandedStateKey = `expanded-folders-${currentConfig.owner}-${currentConfig.repo}-${currentConfig.branch}`
        const expandedFolders = JSON.parse(localStorage.getItem(expandedStateKey) || '{}')
        const expandedPaths = Object.keys(expandedFolders).filter(path => expandedFolders[path])
        
        if (expandedPaths.length > 0) {
          console.log('🔄 Restoring expanded folders:', expandedPaths)
          // Note: The FileTree component will handle the expanded state via getExpandedState
        }
        
        // Also load any cached files list
        const filesCacheKey = `files-list-${currentConfig.owner}-${currentConfig.repo}-${currentConfig.branch}`
        const cachedFiles = CacheService.get<GitHubFile[]>(filesCacheKey)
        if (cachedFiles) {
          setFiles(cachedFiles)
          console.log('💾 Using cached files list:', { filesCount: cachedFiles.length })
        }
      } else {
        // Load initial structure (folders + README files only)
        const [initialStructure, lazyTree] = await Promise.all([
          githubService.getFolderStructure(), // Get folders and README files
          githubService.getLazyFileTree()     // Get lazy-loading tree structure
        ])
        
        setFiles(initialStructure)
        setFileTree(lazyTree)
        
        // Cache the initial tree and files for 1 hour (structure changes infrequently)
        CacheService.set(cacheKey, lazyTree, 60 * 60 * 1000) // 1 hour
        CacheService.set(`files-list-${currentConfig.owner}-${currentConfig.repo}-${currentConfig.branch}`, initialStructure, 60 * 60 * 1000) // 1 hour
        
        console.log('✅ Lazy file structure loaded and cached:', { 
          files: initialStructure.length, 
          treeNodes: lazyTree.length 
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
      setFiles([])
      setFileTree([])
    } finally {
      setIsLoading(false)
    }
  }

  // New method to expand a folder and load its contents
  const expandFolder = async (folderPath: string): Promise<any[]> => {
    if (!githubService) {
      throw new Error('GitHub service not initialized')
    }

    try {
      console.log('🔍 Expanding folder:', folderPath)
      
      // Check if folder contents are already cached
      const folderCacheKey = CacheService.folderContentsKey(currentConfig.owner, currentConfig.repo, folderPath, currentConfig.branch)
      const cachedContents = CacheService.get<any[]>(folderCacheKey)
      
      if (cachedContents) {
        console.log('💾 Folder contents cache hit:', folderPath)
        return cachedContents
      }
      
      const contents = await githubService.getFolderContents(folderPath)
      console.log('📁 Folder contents received:', { folderPath, count: contents.length, contents: contents.map(c => c.name) })
      
      // Convert to tree format
      const children: FileSystemItem[] = contents.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'directory' as const : 'file' as const,
        children: item.type === 'dir' ? [] : undefined,
        lastModified: new Date(),
        source: 'github' as const
      }))

      // Cache folder contents for 30 minutes
      CacheService.set(folderCacheKey, children, 30 * 60 * 1000)

      // Update the files list to include newly discovered files
      setFiles(prevFiles => {
        const existingPaths = new Set(prevFiles.map(f => f.path))
        const newFiles = contents.filter(content => !existingPaths.has(content.path))
        const updatedFiles = [...prevFiles, ...newFiles]
        
        // Cache updated files list for 1 hour
        const filesCacheKey = `files-list-${currentConfig.owner}-${currentConfig.repo}-${currentConfig.branch}`
        CacheService.set(filesCacheKey, updatedFiles, 60 * 60 * 1000) // 1 hour
        console.log('📋 Adding new files to list and cache:', { newCount: newFiles.length, newFiles: newFiles.map(f => f.path) })
        
        return updatedFiles
      })

      // Update the file tree to include the loaded children and mark as loaded
      const updateTreeNode = (nodes: FileSystemItem[]): FileSystemItem[] => {
        return nodes.map(node => {
          if (node.path === folderPath && node.type === 'directory') {
            console.log('🌳 Updating tree node:', { folderPath, childrenCount: children.length })
            return {
              ...node,
              children,
              loaded: true // Mark as loaded from GitHub
            }
          } else if (node.children) {
            return {
              ...node,
              children: updateTreeNode(node.children)
            }
          }
          return node
        })
      }

      setFileTree(prevTree => {
        const updatedTree = updateTreeNode(prevTree)
        
        // Cache the updated tree structure for 1 hour (expanded folders change less frequently)
        const cacheKey = `file-tree-${currentConfig.owner}-${currentConfig.repo}-${currentConfig.branch}`
        CacheService.set(cacheKey, updatedTree, 60 * 60 * 1000) // 1 hour
        console.log('💾 Updated file tree cached')
        
        return updatedTree
      })

      if (contents.length === 0) {
        console.log('📂 Folder is genuinely empty:', folderPath)
      } else {
        console.log('✅ Folder expanded successfully:', { 
          folderPath, 
          children: children.length,
          newFiles: contents.length 
        })
      }
      return children
    } catch (err: any) {
      console.error('❌ Error expanding folder:', err)
      throw new Error(`Failed to load folder contents: ${folderPath}`)
    }
  }

  const getFileContent = async (path: string): Promise<string> => {
    if (!githubService) {
      throw new Error('GitHub service not initialized')
    }
    
    // Check cache first
    const cacheKey = CacheService.fileContentKey(currentConfig.owner, currentConfig.repo, path, currentConfig.branch)
    const cachedContent = CacheService.get<string>(cacheKey)
    
    if (cachedContent) {
      console.log('💾 File content cache hit:', path)
      return cachedContent
    }
    
    try {
      console.log('📁 Fetching file content from GitHub:', path)
      const content = await githubService.getFileContent(path)
      
      // Cache file content for 10 minutes (allows for quick navigation while still being fresh)
      CacheService.set(cacheKey, content, 10 * 60 * 1000)
      
      return content
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch file content')
    }
  }

  const createPullRequest = async (
    title: string, 
    content: string, 
    filePath: string, 
    commitMessage: string
  ): Promise<{ number: number; html_url: string }> => {
    if (!githubService) {
      throw new Error('GitHub service not initialized')
    }
    
    if (!currentConfig.token) {
      throw new Error('GitHub token required for creating pull requests')
    }

    try {
      setIsLoading(true)
      
      // Create a unique branch name
      const timestamp = new Date().getTime()
      const branchName = `edit-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`
      
      // Create branch
      await githubService.createBranch(branchName)
      
      // Update file
      await githubService.updateFile(filePath, content, commitMessage, branchName)
      
      // Create pull request
      const pr = await githubService.createPullRequest(
        title,
        `This pull request updates \`${filePath}\`\n\n${commitMessage}`,
        branchName,
        currentConfig.branch
      )
      
      return pr
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create pull request')
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)

  // Save expanded folder state using UserStateService
  const saveExpandedState = (folderPath: string, expanded: boolean) => {
    if (expanded) {
      UserStateService.addExpandedFolder(folderPath)
    } else {
      UserStateService.removeExpandedFolder(folderPath)
    }
    console.log('💾 Saved folder expanded state:', { folderPath, expanded })
  }

  // Get expanded folder state from UserStateService
  const getExpandedState = (folderPath: string): boolean => {
    const expandedFolders = UserStateService.getExpandedFolders()
    return expandedFolders.includes(folderPath)
  }

  const value: GitHubContextType = {
    githubService,
    config: currentConfig,
    isConnected,
    hasWriteAccess,
    files,
    fileTree,
    isLoading,
    error,
    setToken,
    setRepository,
    loadFiles,
    expandFolder,
    getFileContent,
    createPullRequest,
    clearError,
    saveExpandedState,
    getExpandedState
  }

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  )
}

export function useGitHub() {
  const context = useContext(GitHubContext)
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider')
  }
  return context
}

// Custom hook for GitHub authentication status
export function useGitHubAuth() {
  const { isConnected, hasWriteAccess, setToken, config } = useGitHub()
  
  return {
    isAuthenticated: !!config.token,
    isConnected,
    hasWriteAccess,
    setToken,
    logout: () => {
      localStorage.removeItem('github_token')
      window.location.reload()
    }
  }
}
