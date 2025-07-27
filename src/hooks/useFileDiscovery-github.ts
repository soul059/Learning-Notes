import { useState, useEffect } from 'react'
import { useGitHub as useGitHubContext } from '@/contexts/GitHubProvider'

export interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileItem[]
}

export function useFileDiscovery(useGitHub: boolean = false) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const github = useGitHubContext()

  useEffect(() => {
    if (useGitHub && github.isConnected) {
      // Load files from GitHub
      loadGitHubFiles()
    } else {
      // Load files from local directory
      loadLocalFiles()
    }
  }, [useGitHub, github.isConnected])

  useEffect(() => {
    if (useGitHub && github.fileTree.length > 0) {
      setFiles(github.fileTree)
      setIsLoading(false)
    }
  }, [github.fileTree, useGitHub])

  const loadGitHubFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await github.loadFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GitHub files')
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadLocalFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const discoveredFiles = await getAllMarkdownFiles()
      
      // Convert flat file list to tree structure
      const tree = buildFileTree(discoveredFiles)
      setFiles(tree)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local files')
      // Fallback to known files
      const fallbackFiles = [
        'getting-started/introduction.md',
        'getting-started/setup.md',
        'programming/javascript/react-hooks.md',
        'guides/search-guide.md'
      ]
      const tree = buildFileTree(fallbackFiles)
      setFiles(tree)
    } finally {
      setIsLoading(false)
    }
  }

  return { 
    files, 
    isLoading, 
    error,
    refreshFiles: useGitHub ? loadGitHubFiles : loadLocalFiles
  }
}

// Convert flat file list to tree structure
function buildFileTree(filePaths: string[]): FileItem[] {
  const tree: FileItem[] = []
  const pathMap = new Map<string, FileItem>()

  for (const filePath of filePaths) {
    const parts = filePath.split('/')
    let currentPath = ''
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (!pathMap.has(currentPath)) {
        const item: FileItem = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : []
        }
        
        pathMap.set(currentPath, item)
        
        // Add to parent or root
        if (i === 0) {
          tree.push(item)
        } else {
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
          const parent = pathMap.get(parentPath)
          if (parent && parent.children) {
            parent.children.push(item)
          }
        }
      }
    }
  }

  return tree
}

// Discover markdown files by attempting to fetch from common paths
export async function getAllMarkdownFiles(): Promise<string[]> {
  const files: string[] = []
  
  // Common directory structures to check
  const commonPaths = [
    'getting-started',
    'programming',
    'programming/javascript',
    'programming/python',
    'programming/typescript',
    'tutorials',
    'guides',
    'reference',
    'examples',
    'docs',
    'notes',
    'learning'
  ]

  // Common filenames to check
  const commonFiles = [
    'README.md',
    'index.md',
    'introduction.md',
    'setup.md',
    'overview.md',
    'getting-started.md'
  ]

  // Check for files in root directory
  for (const filename of commonFiles) {
    try {
      const response = await fetch(`/notes/${filename}`, { method: 'HEAD' })
      if (response.ok) {
        files.push(filename)
      }
    } catch {
      // Ignore errors for non-existent files
    }
  }

  // Check for files in common directories
  for (const dir of commonPaths) {
    for (const filename of commonFiles) {
      try {
        const filePath = `${dir}/${filename}`
        const response = await fetch(`/notes/${filePath}`, { method: 'HEAD' })
        if (response.ok) {
          files.push(filePath)
        }
      } catch {
        // Ignore errors for non-existent files
      }
    }

    // Check for specific known files
    const knownFiles = [
      `${dir}/react-hooks.md`,
      `${dir}/basics.md`,
      `${dir}/advanced.md`,
      `${dir}/guide.md`,
      `${dir}/tutorial.md`,
      `${dir}/reference.md`
    ]

    for (const filePath of knownFiles) {
      try {
        const response = await fetch(`/notes/${filePath}`, { method: 'HEAD' })
        if (response.ok && !files.includes(filePath)) {
          files.push(filePath)
        }
      } catch {
        // Ignore errors for non-existent files
      }
    }
  }

  return files.sort()
}
