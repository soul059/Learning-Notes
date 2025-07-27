/**
 * User State Management Service
 * Handles saving and restoring user's session state including:
 * - Current file selection
 * - Expanded folders in file tree
 * - Scroll position
 * - Panel states (GitHub, Settings, Search)
 * - Theme preferences
 * - Repository configuration
 */

export interface UserSessionState {
  // File navigation state
  currentFile?: string
  expandedFolders: string[]
  
  // UI state
  scrollPosition: {
    file?: string
    position: number
  }
  
  // Panel states
  panels: {
    github: boolean
    settings: boolean
    search: boolean
  }
  
  // Repository state
  repository?: {
    owner: string
    repo: string
    branch: string
  }
  
  // Theme state
  theme: 'light' | 'dark' | 'system'
  
  // Last activity timestamp
  lastActivity: number
  
  // Search state
  lastSearch?: string
}

const DEFAULT_STATE: UserSessionState = {
  expandedFolders: [],
  scrollPosition: { position: 0 },
  panels: {
    github: false,
    settings: false,
    search: false
  },
  theme: 'system',
  lastActivity: Date.now()
}

const STORAGE_KEY = 'learning-notes-user-state'
const MAX_STATE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

export class UserStateService {
  /**
   * Save current user state to localStorage
   */
  static saveState(state: Partial<UserSessionState>): void {
    try {
      const currentState = this.loadState()
      const updatedState: UserSessionState = {
        ...currentState,
        ...state,
        lastActivity: Date.now()
      }
      
      const serializedState = JSON.stringify(updatedState)
      
      // Check if state has actually changed to avoid unnecessary writes
      const existing = localStorage.getItem(STORAGE_KEY)
      if (existing === serializedState) {
        // console.log('⏭️ User state unchanged, skipping save')
        return
      }
      
      localStorage.setItem(STORAGE_KEY, serializedState)
      
      console.log('💾 User state saved successfully:', {
        key: STORAGE_KEY,
        updatedFields: Object.keys(state),
        stateSize: serializedState.length,
        timestamp: new Date().toISOString()
      })
      
      // Verify the save worked
      const verification = localStorage.getItem(STORAGE_KEY)
      if (!verification) {
        console.error('❌ User state save verification failed!')
        this.testStorage()
      } else if (verification !== serializedState) {
        console.warn('⚠️ User state save verification mismatch!')
      }
    } catch (error) {
      console.error('❌ Failed to save user state:', error)
      this.testStorage()
      
      // Try to recover by clearing potentially corrupted state
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('📦 Storage quota exceeded, attempting cleanup...')
        this.clearState()
        // Try saving again with just the essential data
        try {
          const essentialState = {
            currentFile: state.currentFile || this.loadState().currentFile,
            theme: state.theme || this.loadState().theme,
            lastActivity: Date.now()
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_STATE, ...essentialState }))
          console.log('✅ Essential state saved after cleanup')
        } catch (retryError) {
          console.error('❌ Failed to save even essential state:', retryError)
        }
      }
    }
  }
  
  /**
   * Load user state from localStorage
   */
  static loadState(): UserSessionState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        console.log('📭 No stored user state found, using defaults')
        return DEFAULT_STATE
      }
      
      const parsed = JSON.parse(stored) as UserSessionState
      
      // Check if state is too old
      if (Date.now() - parsed.lastActivity > MAX_STATE_AGE) {
        console.log('🗑️ User state expired, using defaults')
        this.clearState()
        return DEFAULT_STATE
      }
      
      console.log('📥 User state loaded successfully:', {
        key: STORAGE_KEY,
        lastActivity: new Date(parsed.lastActivity).toLocaleString(),
        state: parsed
      })
      return { ...DEFAULT_STATE, ...parsed }
    } catch (error) {
      console.error('❌ Failed to load user state:', error)
      return DEFAULT_STATE
    }
  }
  
  /**
   * Clear stored user state
   */
  static clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log('🧹 User state cleared')
    } catch (error) {
      console.error('Failed to clear user state:', error)
    }
  }
  
  /**
   * Update current file selection
   */
  static setCurrentFile(filePath: string): void {
    this.saveState({ currentFile: filePath })
  }
  
  /**
   * Update expanded folders
   */
  static setExpandedFolders(folders: string[]): void {
    this.saveState({ expandedFolders: folders })
  }
  
  /**
   * Add expanded folder
   */
  static addExpandedFolder(folderPath: string): void {
    const state = this.loadState()
    if (!state.expandedFolders.includes(folderPath)) {
      const updatedFolders = [...state.expandedFolders, folderPath]
      this.setExpandedFolders(updatedFolders)
    }
  }
  
  /**
   * Remove expanded folder
   */
  static removeExpandedFolder(folderPath: string): void {
    const state = this.loadState()
    const updatedFolders = state.expandedFolders.filter(f => f !== folderPath)
    this.setExpandedFolders(updatedFolders)
  }
  
  /**
   * Update scroll position for a file
   */
  static setScrollPosition(filePath: string, position: number): void {
    this.saveState({
      scrollPosition: {
        file: filePath,
        position
      }
    })
  }
  
  /**
   * Update panel states
   */
  static setPanelState(panel: keyof UserSessionState['panels'], isOpen: boolean): void {
    const state = this.loadState()
    this.saveState({
      panels: {
        ...state.panels,
        [panel]: isOpen
      }
    })
  }
  
  /**
   * Update theme preference
   */
  static setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.saveState({ theme })
  }
  
  /**
   * Update repository configuration
   */
  static setRepository(owner: string, repo: string, branch: string = 'main'): void {
    this.saveState({
      repository: { owner, repo, branch }
    })
  }
  
  /**
   * Update last search query
   */
  static setLastSearch(query: string): void {
    this.saveState({ lastSearch: query })
  }
  
  /**
   * Get current file from state
   */
  static getCurrentFile(): string | undefined {
    return this.loadState().currentFile
  }
  
  /**
   * Get expanded folders from state
   */
  static getExpandedFolders(): string[] {
    return this.loadState().expandedFolders
  }
  
  /**
   * Get scroll position for current file
   */
  static getScrollPosition(): { file?: string; position: number } {
    return this.loadState().scrollPosition
  }
  
  /**
   * Get panel states
   */
  static getPanelStates(): UserSessionState['panels'] {
    return this.loadState().panels
  }
  
  /**
   * Get theme preference
   */
  static getTheme(): 'light' | 'dark' | 'system' {
    return this.loadState().theme
  }
  
  /**
   * Get repository configuration
   */
  static getRepository(): { owner: string; repo: string; branch: string } | undefined {
    return this.loadState().repository
  }
  
  /**
   * Get last search query
   */
  static getLastSearch(): string | undefined {
    return this.loadState().lastSearch
  }
  
  /**
   * Check if state exists and is valid
   */
  static hasValidState(): boolean {
    const state = this.loadState()
    return state.lastActivity > 0 && (Date.now() - state.lastActivity) < MAX_STATE_AGE
  }
  
  /**
   * Export state for debugging
   */
  static exportState(): UserSessionState {
    return this.loadState()
  }
  
  /**
   * Import state for debugging/migration
   */
  static importState(state: UserSessionState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  
  /**
   * Test localStorage functionality
   */
  static testStorage(): boolean {
    try {
      const testKey = 'test-storage'
      const testValue = 'test-value'
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      const works = retrieved === testValue
      console.log('🧪 localStorage test:', works ? 'PASSED' : 'FAILED')
      return works
    } catch (error) {
      console.error('🧪 localStorage test FAILED:', error)
      return false
    }
  }

  /**
   * Convenience method to set current file
   */
  static setLastFile(filePath: string): void {
    const state = this.loadState()
    state.currentFile = filePath
    this.saveState(state)
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    size: number
    maxSize: number
    usage: number
    itemCount: number
  } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const size = stored ? new Blob([stored]).size : 0
      
      // Estimate localStorage quota (usually 5-10MB per origin)
      const maxSize = 5 * 1024 * 1024 // 5MB estimate
      const usage = (size / maxSize) * 100
      
      // Count all learning-notes items in localStorage
      let itemCount = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('learning-notes')) {
          itemCount++
        }
      }
      
      return { size, maxSize, usage, itemCount }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return { size: 0, maxSize: 0, usage: 0, itemCount: 0 }
    }
  }

  /**
   * Optimize storage by removing unnecessary data
   */
  static optimizeStorage(): void {
    try {
      const state = this.loadState()
      
      // Clean up expanded folders - remove duplicates and sort
      const uniqueFolders = [...new Set(state.expandedFolders)].sort()
      
      // Clean up scroll position - only keep if it's for current file
      const cleanScrollPosition = state.scrollPosition.file === state.currentFile 
        ? state.scrollPosition 
        : { position: 0 }
      
      const optimizedState: UserSessionState = {
        ...state,
        expandedFolders: uniqueFolders,
        scrollPosition: cleanScrollPosition,
        lastActivity: Date.now()
      }
      
      this.saveState(optimizedState)
      console.log('🧹 Storage optimized')
    } catch (error) {
      console.error('❌ Storage optimization failed:', error)
    }
  }

  /**
   * Backup state to a JSON string for export
   */
  static backupState(): string {
    try {
      const state = this.loadState()
      return JSON.stringify({
        ...state,
        backupTimestamp: Date.now(),
        version: '1.0'
      }, null, 2)
    } catch (error) {
      console.error('❌ State backup failed:', error)
      return '{}'
    }
  }

  /**
   * Restore state from backup JSON string
   */
  static restoreState(backupJson: string): boolean {
    try {
      const backup = JSON.parse(backupJson)
      if (backup.version && backup.lastActivity) {
        // Remove backup metadata
        delete backup.backupTimestamp
        delete backup.version
        
        this.importState(backup)
        console.log('✅ State restored from backup')
        return true
      } else {
        console.error('❌ Invalid backup format')
        return false
      }
    } catch (error) {
      console.error('❌ State restore failed:', error)
      return false
    }
  }
}
