/**
 * Cache service for storing GitHub API responses
 * Uses localStorage for persistent caching, sessionStorage for temporary data,
 * and in-memory cache for frequently accessed items
 */

export interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export class CacheService {
  private static readonly PREFIX = 'learning-notes-'
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private static memoryCache = new Map<string, CacheItem<any>>()
  private static readonly MEMORY_CACHE_SIZE = 50 // Max items in memory cache

  /**
   * Set item in cache with TTL
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL, persistent: boolean = true): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    // Always store in memory cache for fast access
    this.setMemory(key, cacheItem)

    const storage = persistent ? localStorage : sessionStorage
    const cacheKey = this.PREFIX + key

    try {
      storage.setItem(cacheKey, JSON.stringify(cacheItem))
      console.log(`💾 Cached ${persistent ? 'persistent' : 'session'}:`, { key, size: JSON.stringify(data).length, ttl })
    } catch (error) {
      console.warn('⚠️ Cache storage failed:', error)
      // If storage is full, clear old items and try again
      this.clearExpired()
      try {
        storage.setItem(cacheKey, JSON.stringify(cacheItem))
      } catch (secondError) {
        console.error('❌ Cache storage failed after cleanup:', secondError)
      }
    }
  }

  /**
   * Set item in memory cache only
   */
  private static setMemory<T>(key: string, cacheItem: CacheItem<T>): void {
    // If memory cache is full, remove oldest item
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey) {
        this.memoryCache.delete(firstKey)
      }
    }
    
    this.memoryCache.set(key, cacheItem)
  }

  /**
   * Get item from cache if not expired (checks memory first, then storage)
   */
  static get<T>(key: string, persistent: boolean = true): T | null {
    const now = Date.now()

    // Check memory cache first
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && now - memoryItem.timestamp <= memoryItem.ttl) {
      return memoryItem.data
    }

    // Remove expired memory item
    if (memoryItem) {
      this.memoryCache.delete(key)
    }

    // Check storage cache
    const storage = persistent ? localStorage : sessionStorage
    const cacheKey = this.PREFIX + key

    try {
      const item = storage.getItem(cacheKey)
      if (!item) return null

      const cacheItem: CacheItem<T> = JSON.parse(item)

      // Check if expired
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        storage.removeItem(cacheKey)
        return null
      }

      // Store in memory cache for next time
      this.setMemory(key, cacheItem)

      return cacheItem.data
    } catch (error) {
      console.warn('⚠️ Cache read failed:', error)
      storage.removeItem(cacheKey)
      return null
    }
  }

  /**
   * Get item from cache even if expired (for instant loading fallback)
   */
  static getStale<T>(key: string, persistent: boolean = true): T | null {
    // Check memory cache first (even if expired)
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem) {
      return memoryItem.data
    }

    // Check storage cache (even if expired)
    const storage = persistent ? localStorage : sessionStorage
    const cacheKey = this.PREFIX + key

    try {
      const item = storage.getItem(cacheKey)
      if (!item) return null

      const cacheItem: CacheItem<T> = JSON.parse(item)
      
      // Store in memory cache for next time
      this.setMemory(key, cacheItem)
      
      return cacheItem.data
    } catch (error) {
      return null
    }
  }

  /**
   * Check if item exists and is not expired
   */
  static has(key: string, persistent: boolean = true): boolean {
    return this.get(key, persistent) !== null
  }

  /**
   * Check if item exists (even if expired) - useful for instant loading
   */
  static hasStale(key: string, persistent: boolean = true): boolean {
    return this.getStale(key, persistent) !== null
  }

  /**
   * Get cache info for a key (exists, expired, age)
   */
  static getCacheInfo(key: string, persistent: boolean = true): {
    exists: boolean
    expired: boolean
    age: number
    hasStale: boolean
  } {
    const now = Date.now()
    
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem) {
      const age = now - memoryItem.timestamp
      const expired = age > memoryItem.ttl
      return {
        exists: !expired,
        expired,
        age,
        hasStale: true
      }
    }

    // Check storage cache
    const storage = persistent ? localStorage : sessionStorage
    const cacheKey = this.PREFIX + key

    try {
      const item = storage.getItem(cacheKey)
      if (!item) {
        return { exists: false, expired: false, age: 0, hasStale: false }
      }

      const cacheItem: CacheItem<any> = JSON.parse(item)
      const age = now - cacheItem.timestamp
      const expired = age > cacheItem.ttl

      return {
        exists: !expired,
        expired,
        age,
        hasStale: true
      }
    } catch (error) {
      return { exists: false, expired: false, age: 0, hasStale: false }
    }
  }

  /**
   * Remove specific item from cache
   */
  static remove(key: string, persistent: boolean = true): void {
    const storage = persistent ? localStorage : sessionStorage
    const cacheKey = this.PREFIX + key
    storage.removeItem(cacheKey)
    console.log('🗑️ Cache removed:', key)
  }

  /**
   * Clear all expired cache items
   */
  static clearExpired(): void {
    const storages = [localStorage, sessionStorage]
    let removedCount = 0

    storages.forEach(storage => {
      const keys = Object.keys(storage).filter(key => key.startsWith(this.PREFIX))
      
      keys.forEach(cacheKey => {
        try {
          const item = storage.getItem(cacheKey)
          if (item) {
            const cacheItem: CacheItem<any> = JSON.parse(item)
            const now = Date.now()

            if (now - cacheItem.timestamp > cacheItem.ttl) {
              storage.removeItem(cacheKey)
              removedCount++
            }
          }
        } catch (error) {
          // Remove corrupted cache items
          storage.removeItem(cacheKey)
          removedCount++
        }
      })
    })

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired cache items`)
    }
  }

  /**
   * Clear all cache items
   */
  static clearAll(): void {
    const storages = [localStorage, sessionStorage]
    let removedCount = 0

    storages.forEach(storage => {
      const keys = Object.keys(storage).filter(key => key.startsWith(this.PREFIX))
      keys.forEach(key => {
        storage.removeItem(key)
        removedCount++
      })
    })

    console.log(`🧹 Cleared all cache (${removedCount} items)`)
  }

  /**
   * Generate cache key for GitHub file content
   */
  static fileContentKey(owner: string, repo: string, path: string, branch: string = 'main'): string {
    return `file-content:${owner}/${repo}:${branch}:${path}`
  }

  /**
   * Generate cache key for GitHub file list
   */
  static fileListKey(owner: string, repo: string, path: string = '', branch: string = 'main'): string {
    return `file-list:${owner}/${repo}:${branch}:${path || 'root'}`
  }

  /**
   * Generate cache key for GitHub file tree
   */
  static fileTreeKey(owner: string, repo: string, path: string = '', branch: string = 'main'): string {
    return `file-tree:${owner}/${repo}:${branch}:${path || 'root'}`
  }

  /**
   * Generate cache key for repository info
   */
  static repositoryKey(owner: string, repo: string): string {
    return `repository:${owner}/${repo}`
  }

  /**
   * Generate cache key for folder contents
   */
  static folderContentsKey(owner: string, repo: string, folderPath: string, branch: string = 'main'): string {
    return `folder-contents:${owner}/${repo}:${branch}:${folderPath}`
  }

  /**
   * Generate cache key for search results
   */
  static searchKey(query: string, source: string = 'all'): string {
    return `search:${source}:${query.toLowerCase().replace(/\s+/g, '-')}`
  }

  /**
   * Generate cache key for GitHub commits
   */
  static commitsKey(owner: string, repo: string, branch: string = 'main'): string {
    return `commits:${owner}/${repo}:${branch}`
  }

  /**
   * Generate cache key for user permissions
   */
  static permissionsKey(owner: string, repo: string, user?: string): string {
    return `permissions:${owner}/${repo}:${user || 'anonymous'}`
  }

  /**
   * Generate cache key for file metadata
   */
  static fileMetaKey(owner: string, repo: string, path: string, branch: string = 'main'): string {
    return `file-meta:${owner}/${repo}:${branch}:${path}`
  }

  /**
   * Bulk cache operation - set multiple items at once
   */
  static setMultiple<T>(items: Array<{ key: string; data: T; ttl?: number; persistent?: boolean }>): void {
    const failed: string[] = []
    
    items.forEach(({ key, data, ttl = this.DEFAULT_TTL, persistent = true }) => {
      try {
        this.set(key, data, ttl, persistent)
      } catch (error) {
        failed.push(key)
        console.warn(`Failed to cache item: ${key}`, error)
      }
    })
    
    if (failed.length > 0) {
      console.warn(`Failed to cache ${failed.length} items:`, failed)
    }
  }

  /**
   * Bulk cache operation - get multiple items at once
   */
  static getMultiple<T>(keys: string[], persistent: boolean = true): Record<string, T | null> {
    const results: Record<string, T | null> = {}
    
    keys.forEach(key => {
      results[key] = this.get<T>(key, persistent)
    })
    
    return results
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    memoryCache: { size: number; maxSize: number }
    localStorage: { size: number; itemCount: number }
    sessionStorage: { size: number; itemCount: number }
  } {
    // Memory cache stats
    const memorySize = this.memoryCache.size
    const maxMemorySize = this.MEMORY_CACHE_SIZE

    // Storage stats
    let localSize = 0
    let localCount = 0
    let sessionSize = 0
    let sessionCount = 0

    try {
      // Count localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.PREFIX)) {
          localCount++
          const value = localStorage.getItem(key)
          if (value) localSize += new Blob([value]).size
        }
      }

      // Count sessionStorage items
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith(this.PREFIX)) {
          sessionCount++
          const value = sessionStorage.getItem(key)
          if (value) sessionSize += new Blob([value]).size
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error)
    }

    return {
      memoryCache: { size: memorySize, maxSize: maxMemorySize },
      localStorage: { size: localSize, itemCount: localCount },
      sessionStorage: { size: sessionSize, itemCount: sessionCount }
    }
  }

  /**
   * Optimize cache by removing old/large items
   */
  static optimizeCache(): void {
    console.log('🧹 Optimizing cache...')
    
    // Clear expired items first
    this.clearExpired()
    
    // Clear memory cache if it's getting too large
    if (this.memoryCache.size > this.MEMORY_CACHE_SIZE * 0.8) {
      console.log('🗑️ Clearing memory cache due to size')
      this.memoryCache.clear()
    }
    
    // Check storage usage and clean if needed
    const stats = this.getStats()
    console.log('📊 Cache stats:', stats)
    
    // If localStorage is getting large, remove oldest items
    if (stats.localStorage.size > 2 * 1024 * 1024) { // 2MB threshold
      this.clearOldestItems('localStorage', 10)
    }
    
    if (stats.sessionStorage.size > 1 * 1024 * 1024) { // 1MB threshold
      this.clearOldestItems('sessionStorage', 5)
    }
  }

  /**
   * Clear oldest cache items from storage
   */
  private static clearOldestItems(storageType: 'localStorage' | 'sessionStorage', count: number): void {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    const items: Array<{ key: string; timestamp: number }> = []
    
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(this.PREFIX)) {
          const value = storage.getItem(key)
          if (value) {
            try {
              const item = JSON.parse(value)
              if (item.timestamp) {
                items.push({ key, timestamp: item.timestamp })
              }
            } catch {
              // Invalid format, mark for removal
              items.push({ key, timestamp: 0 })
            }
          }
        }
      }
      
      // Sort by timestamp (oldest first) and remove oldest items
      items.sort((a, b) => a.timestamp - b.timestamp)
      const toRemove = items.slice(0, count)
      
      toRemove.forEach(({ key }) => {
        storage.removeItem(key)
        console.log(`🗑️ Removed old cache item: ${key.replace(this.PREFIX, '')}`)
      })
      
      console.log(`✅ Cleaned ${toRemove.length} old items from ${storageType}`)
    } catch (error) {
      console.error(`❌ Failed to clean ${storageType}:`, error)
    }
  }

  /**
   * Preload cache with commonly accessed items
   */
  static preloadCache(keys: string[]): Promise<void> {
    return new Promise((resolve) => {
      const loadedCount = { value: 0 }
      
      keys.forEach(key => {
        // Try to get item to trigger memory cache loading
        const item = this.get(key)
        if (item) {
          console.log(`💾 Preloaded: ${key}`)
        }
        
        loadedCount.value++
        if (loadedCount.value === keys.length) {
          console.log(`✅ Preloaded ${keys.length} cache items`)
          resolve()
        }
      })
      
      if (keys.length === 0) {
        resolve()
      }
    })
  }
}

// Auto-cleanup expired items on load
CacheService.clearExpired()
