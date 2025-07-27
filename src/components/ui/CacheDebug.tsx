import { useState, useEffect } from 'react'
import { CacheService } from '@/lib/cache'
import { UserStateService } from '@/lib/userState'

export function CacheDebug() {
  const [cacheStats, setCacheStats] = useState({
    memoryCache: { size: 0, maxSize: 0 },
    localStorage: { size: 0, itemCount: 0 },
    sessionStorage: { size: 0, itemCount: 0 }
  })
  const [userState, setUserState] = useState<any>({})
  const [storageStats, setStorageStats] = useState({
    size: 0,
    maxSize: 0,
    usage: 0,
    itemCount: 0
  })

  const updateStats = () => {
    try {
      // Get cache statistics
      const stats = CacheService.getStats()
      setCacheStats(stats)

      // Get user state
      const state = UserStateService.loadState()
      setUserState(state)

      // Get storage statistics
      const storage = UserStateService.getStorageStats()
      setStorageStats(storage)
    } catch (error) {
      console.warn('Error updating cache stats:', error)
    }
  }

  useEffect(() => {
    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleClearCache = () => {
    CacheService.clearAll()
    updateStats()
  }

  const handleOptimizeCache = () => {
    CacheService.optimizeCache()
    UserStateService.optimizeStorage()
    updateStats()
  }

  const handleTestUserState = () => {
    const testData = {
      currentFile: '/test/file.md',
      lastSearch: 'test query',
      timestamp: new Date().toISOString()
    }
    
    UserStateService.setLastFile(testData.currentFile)
    UserStateService.setLastSearch(testData.lastSearch)
    
    console.log('Test data saved:', testData)
    updateStats()
  }

  const handleExportState = () => {
    const backup = UserStateService.backupState()
    const blob = new Blob([backup], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-notes-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold text-sm mb-2">Cache & State Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Cache Items:</strong>
          <ul className="ml-2 text-xs">
            <li>localStorage: {cacheStats.localStorage.itemCount} items ({Math.round(cacheStats.localStorage.size / 1024)}KB)</li>
            <li>sessionStorage: {cacheStats.sessionStorage.itemCount} items ({Math.round(cacheStats.sessionStorage.size / 1024)}KB)</li>
            <li>memory: {cacheStats.memoryCache.size}/{cacheStats.memoryCache.maxSize}</li>
          </ul>
        </div>
        
        <div>
          <strong>User Storage:</strong>
          <div className="ml-2 text-xs text-muted-foreground">
            <div>Usage: {storageStats.usage.toFixed(1)}% ({Math.round(storageStats.size / 1024)}KB)</div>
            <div>Items: {storageStats.itemCount}</div>
          </div>
        </div>
        
        <div>
          <strong>User State:</strong>
          <div className="ml-2 text-xs text-muted-foreground">
            <div>Current File: {userState.currentFile || 'None'}</div>
            <div>Last Search: {userState.lastSearch || 'None'}</div>
            <div>Repository: {userState.repository ? `${userState.repository.owner}/${userState.repository.repo}` : 'None'}</div>
          </div>
        </div>
        
        <div className="flex gap-1 pt-2 flex-wrap">
          <button
            onClick={handleClearCache}
            className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded"
            title="Clear all cache"
          >
            Clear Cache
          </button>
          <button
            onClick={handleOptimizeCache}
            className="px-2 py-1 text-xs bg-orange-500 text-white rounded"
            title="Optimize cache and storage"
          >
            Optimize
          </button>
          <button
            onClick={handleTestUserState}
            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
            title="Test state saving"
          >
            Test State
          </button>
          <button
            onClick={handleExportState}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded"
            title="Export state backup"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
