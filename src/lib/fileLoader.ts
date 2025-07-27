import { githubService } from './github'
import { CacheService } from './cache'

// File loader utility for fetching markdown content with instant loading
export async function loadMarkdownFile(filePath: string, useGitHub: boolean = false): Promise<string> {
  try {
    if (useGitHub) {
      // 🚀 INSTANT LOADING: GitHub file with caching
      const cacheKey = `github-file-${filePath}`
      const cacheInfo = CacheService.getCacheInfo(cacheKey)
      
      // If we have cached content (even stale), return it immediately
      if (cacheInfo.hasStale) {
        const cachedContent = CacheService.getStale<string>(cacheKey)
        if (cachedContent) {
          console.log('⚡ Instant GitHub file loaded from cache:', { 
            path: filePath, 
            expired: cacheInfo.expired,
            ageMinutes: Math.round(cacheInfo.age / (1000 * 60) * 10) / 10
          })
          
          // Track cache hit for debug panel
          if (cacheInfo.expired) {
            (window as any).cacheStaleHits = ((window as any).cacheStaleHits || 0) + 1
          } else {
            (window as any).cacheFreshHits = ((window as any).cacheFreshHits || 0) + 1
          }
          
          // If cache is fresh, return immediately
          if (!cacheInfo.expired) {
            return cachedContent
          }
          
          // Cache is stale - refresh in background
          githubService.getFileContent(filePath)
            .then(freshContent => {
              // Cache the fresh content for 30 minutes
              CacheService.set(cacheKey, freshContent, 30 * 60 * 1000)
              console.log('🔄 Background refresh completed for GitHub file:', filePath)
              // Track background refresh
              ;(window as any).backgroundRefreshes = ((window as any).backgroundRefreshes || 0) + 1
            })
            .catch(err => {
              console.warn('⚠️ Background refresh failed for GitHub file:', filePath, err.message)
            })
          
          return cachedContent // Return stale content immediately
        }
      }
      
      // No cache available - load fresh from GitHub
      console.log('🌐 Loading fresh GitHub file:', filePath)
      const content = await githubService.getFileContent(filePath)
      
      // Cache the fresh content for 30 minutes
      CacheService.set(cacheKey, content, 30 * 60 * 1000)
      
      console.log('✅ Fresh GitHub file loaded and cached:', { path: filePath, size: content.length })
      return content
      
    } else {
      // 🚀 INSTANT LOADING: Local file with caching
      let publicPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
      const url = publicPath.startsWith('welcome/') ? `/${publicPath}` : `/welcome/${publicPath}`
      
      const cacheKey = `local-file-${url}`
      const cacheInfo = CacheService.getCacheInfo(cacheKey)
      
      // If we have cached content (even stale), return it immediately for local files
      if (cacheInfo.hasStale) {
        const cachedContent = CacheService.getStale<string>(cacheKey)
        if (cachedContent) {
          console.log('⚡ Instant local file loaded from cache:', { 
            url, 
            expired: cacheInfo.expired,
            ageMinutes: Math.round(cacheInfo.age / (1000 * 60) * 10) / 10
          })
          
          // Track cache hit for debug panel
          if (cacheInfo.expired) {
            (window as any).cacheStaleHits = ((window as any).cacheStaleHits || 0) + 1
          } else {
            (window as any).cacheFreshHits = ((window as any).cacheFreshHits || 0) + 1
          }
          
          // Local files are more static, use cache for longer
          if (!cacheInfo.expired) {
            return cachedContent
          }
          
          // Refresh local file in background (in case it changed)
          fetch(url)
            .then(response => response.ok ? response.text() : Promise.reject(new Error(response.statusText)))
            .then(freshContent => {
              // Cache local files for 2 hours (they change less frequently)
              CacheService.set(cacheKey, freshContent, 2 * 60 * 60 * 1000)
              console.log('🔄 Background refresh completed for local file:', url)
              // Track background refresh
              ;(window as any).backgroundRefreshes = ((window as any).backgroundRefreshes || 0) + 1
            })
            .catch(err => {
              console.warn('⚠️ Background refresh failed for local file:', url, err.message)
            })
          
          return cachedContent // Return stale content immediately
        }
      }
      
      // No cache available - load fresh from local
      console.log('🌐 Loading fresh local file from:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }
      
      const content = await response.text()
      
      // Cache local files for 2 hours
      CacheService.set(cacheKey, content, 2 * 60 * 60 * 1000)
      
      console.log('✅ Fresh local file loaded and cached:', { url, size: content.length })
      return content
    }
    
  } catch (error) {
    // If network fails but we have stale cache, use it as fallback
    const cacheKey = useGitHub ? `github-file-${filePath}` : `local-file-${filePath.startsWith('/') ? filePath.slice(1) : filePath}`
    const staleContent = CacheService.getStale<string>(cacheKey)
    
    if (staleContent) {
      console.warn('⚠️ Network error, using stale cache as fallback:', filePath)
      // Track failure fallback
      ;(window as any).failureFallbacks = ((window as any).failureFallbacks || 0) + 1
      return staleContent
    }
    
    console.error('❌ Error loading markdown file:', error)
    return `# Error Loading File

Sorry, we couldn't load the file at path: \`${filePath}\`

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please check:
- The file exists ${useGitHub ? 'in the GitHub repository' : 'in the \`public/welcome\` directory'}
- The file path is correct
- The file has the correct extension (.md)
${useGitHub ? '' : `\n**Attempted URL:** \`/welcome/${filePath}\``}

---

*This is a placeholder message. The actual file content should appear here when the file is successfully loaded.*`
  }
}

// Helper function to get all markdown files from the file tree
export function getMarkdownFiles(items: any[]): string[] {
  const files: string[] = []
  
  function traverse(items: any[]) {
    for (const item of items) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        files.push(item.path)
      } else if (item.type === 'directory' && item.children) {
        traverse(item.children)
      }
    }
  }
  
  traverse(items)
  return files
}

// Function to normalize file paths for consistent handling
export function normalizeFilePath(path: string): string {
  // Remove leading slash and ensure proper structure
  let cleanPath = path.replace(/^\/+/, '')
  
  // For GitHub integration, keep the original path structure
  // For local files, ensure they're in the welcome directory if not already
  return cleanPath
}
