import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGitHub } from '@/contexts/GitHubProvider'
import { loadMarkdownFile } from '@/lib/fileLoader'
import { UserStateService } from '@/lib/userState'
import { CacheService } from '@/lib/cache'

interface SearchResult {
  id: string
  title: string
  path: string
  excerpt: string
  matches: number
  type: 'file' | 'heading' | 'content'
}

interface SearchBarProps {
  onFileSelect: (path: string) => void
  onClose?: () => void
  className?: string
}

export function SearchBar({ onFileSelect, onClose, className }: SearchBarProps) {
  // Initialize with last search query from user state
  const [query, setQuery] = useState(() => UserStateService.getLastSearch() || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // Get GitHub context for accessing all files
  const { files, isConnected, getFileContent } = useGitHub()

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setIsOpen(true)

    try {
      // Search in available files (GitHub + cached + local)
      const searchResults = await searchInFiles(searchQuery, files, isConnected, getFileContent)
      setResults(searchResults)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        performSearch(query)
        // Save search query to user state
        UserStateService.setLastSearch(query)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleResultSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  const handleResultSelect = (result: SearchResult) => {
    onFileSelect(result.path)
    handleClose()
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onClose?.()
  }

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800/50 px-0.5 rounded font-medium">
          {part}
        </mark>
      ) : part
    )
  }

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'heading':
        return <Hash className="w-4 h-4 text-green-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Search Input Container - Fixed z-index */}
      <div className="relative z-20">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes... (⌘K)"
          className="w-full pl-10 pr-10 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent relative z-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - Lower z-index to prevent overlap */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-xl overflow-hidden search-dropdown",
          className?.includes("search-modal-bar") ? "search-results-dropdown max-h-80 mt-3 relative z-10" : "z-10 max-h-96 mt-3"
        )}>
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin w-5 h-5 border-2 border-muted border-t-foreground rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div ref={resultsRef} className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 search-result-item",
                    index === selectedIndex && "bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start gap-2">
                        <h4 className="font-medium text-sm flex-1 leading-5">
                          {highlightText(result.title, query)}
                        </h4>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
                          {result.matches} match{result.matches !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground opacity-75 font-mono">
                        {result.path}
                      </p>
                      {result.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-4">
                          {highlightText(result.excerpt, query)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query && !isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Search implementation with caching
async function searchInFiles(
  query: string, 
  availableFiles: any[], 
  isConnected: boolean, 
  getFileContent: (path: string) => Promise<string>
): Promise<SearchResult[]> {
  const searchTerm = query.toLowerCase()
  const cacheKey = CacheService.searchKey(query, isConnected ? 'github' : 'local')
  
  // Check cache first
  const cachedResults = CacheService.get<SearchResult[]>(cacheKey)
  if (cachedResults) {
    console.log('🎯 Search cache hit for:', query)
    return cachedResults
  }

  console.log('🔍 Performing fresh search for:', query)
  const results: SearchResult[] = []

  // Get all searchable files - prioritize GitHub files if connected, fallback to local
  const filesToSearch = isConnected && availableFiles.length > 0 
    ? availableFiles.filter(file => file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.txt')))
    : await getLocalMarkdownFiles()

  console.log('🔍 Searching in files:', { 
    query, 
    filesCount: filesToSearch.length, 
    isConnected,
    source: isConnected ? 'GitHub' : 'Local' 
  })

  for (const file of filesToSearch) {
    try {
      let content: string
      let filePath: string
      
      if (isConnected && file.path) {
        // GitHub file - use file content caching
        filePath = file.path
        const fileContentKey = CacheService.fileContentKey('user', 'repo', file.path)
        
        let cachedContent = CacheService.get<string>(fileContentKey)
        if (cachedContent) {
          content = cachedContent
        } else {
          try {
            content = await getFileContent(file.path)
            // Cache file content for 10 minutes
            CacheService.set(fileContentKey, content, 10 * 60 * 1000)
          } catch (error) {
            console.warn('Failed to get content for:', file.path, error)
            continue
          }
        }
      } else {
        // Local file
        filePath = typeof file === 'string' ? file : file.path
        try {
          content = await loadMarkdownFile(filePath, false)
        } catch (error) {
          console.warn('Failed to load local file:', filePath, error)
          continue
        }
      }

      if (!content) continue

      const lines = content.split('\n')
      let matches = 0
      let excerpts: string[] = []
      
      // Search in content
      lines.forEach((line, lineIndex) => {
        const lowerLine = line.toLowerCase()
        if (lowerLine.includes(searchTerm)) {
          matches++
          
          // Get context around the match, but limit line length
          const start = Math.max(0, lineIndex - 1)
          const end = Math.min(lines.length, lineIndex + 2)
          const contextLines = lines.slice(start, end)
          
          // Clean up long lines and code blocks
          const cleanedLines = contextLines.map(line => {
            // Truncate very long lines
            if (line.length > 200) {
              const matchIndex = line.toLowerCase().indexOf(searchTerm)
              if (matchIndex !== -1) {
                const start = Math.max(0, matchIndex - 50)
                const end = Math.min(line.length, matchIndex + searchTerm.length + 50)
                return '...' + line.substring(start, end) + '...'
              }
              return line.substring(0, 150) + '...'
            }
            return line
          })
          
          const context = cleanedLines.join(' ').trim()
          
          if (context && excerpts.length < 2) {
            // Remove markdown syntax for cleaner display
            const cleanContext = context
              .replace(/```[\s\S]*?```/g, '[code block]')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/\*([^*]+)\*/g, '$1')
              .replace(/#{1,6}\s+/g, '')
            
            excerpts.push(cleanContext.substring(0, 120) + (cleanContext.length > 120 ? '...' : ''))
          }
        }
      })

      if (matches > 0) {
        // Extract title from filename or first heading
        const fileName = filePath.split('/').pop() || filePath
        let title = fileName.replace(/\.md$/, '').replace(/[-_]/g, ' ')
        
        // Try to get title from first heading
        const firstHeading = lines.find(line => line.trim().startsWith('#'))
        if (firstHeading) {
          title = firstHeading.replace(/^#+\s*/, '').trim()
        }

        results.push({
          id: filePath,
          title: title,
          path: filePath,
          excerpt: excerpts.join(' | ') || 'Match found in file content',
          matches,
          type: 'file'
        })
      }
    } catch (error) {
      console.warn('Error searching file:', file, error)
      continue
    }
  }

  // Sort by relevance (number of matches)
  const sortedResults = results.sort((a, b) => b.matches - a.matches)
  
  // Cache results for 5 minutes
  CacheService.set(cacheKey, sortedResults, 5 * 60 * 1000)
  
  return sortedResults
}

// Fallback function for local files when GitHub is not connected
async function getLocalMarkdownFiles(): Promise<string[]> {
  const localFiles = [
    'welcome/home.md',
    'welcome/index.md',
    'welcome/quick-start.md',
    'welcome/features.md'
  ]
  
  const existingFiles: string[] = []
  
  for (const file of localFiles) {
    try {
      const response = await fetch(`/${file}`, { method: 'HEAD' })
      if (response.ok) {
        existingFiles.push(file)
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }
  
  return existingFiles
}
