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
      console.log('⚡ Memory cache hit:', key)
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
        console.log('🗑️ Cache expired:', key)
        return null
      }

      // Store in memory cache for next time
      this.setMemory(key, cacheItem)

      console.log('💾 Cache hit:', { key, age: now - cacheItem.timestamp })
      return cacheItem.data
    } catch (error) {
      console.warn('⚠️ Cache read failed:', error)
      storage.removeItem(cacheKey)
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
   * Get cache statistics
   */
  static getStats(): { persistent: number; session: number; totalSize: number } {
    const persistentKeys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX))
    const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(this.PREFIX))
    
    let totalSize = 0
    
    // Calculate storage size
    persistentKeys.forEach(key => {
      const item = localStorage.getItem(key)
      if (item) totalSize += item.length
    })
    
    sessionKeys.forEach(key => {
      const item = sessionStorage.getItem(key)
      if (item) totalSize += item.length
    })

    return {
      persistent: persistentKeys.length,
      session: sessionKeys.length,
      totalSize
    }
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
}

// Auto-cleanup expired items on load
CacheService.clearExpired()
