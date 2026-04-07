import { useState, useEffect, useCallback, useRef } from 'react'
import { UserStateService } from '@/lib/userState'
import type { UserSessionState } from '@/lib/userState'
import { devLog } from '@/lib/utils'

export function useUserState() {
  const [state, setState] = useState<UserSessionState>(() => 
    UserStateService.loadState()
  )
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<string>('')
  const isMountedRef = useRef<boolean>(true)

  // Debounced save function to prevent excessive localStorage writes
  const debouncedSave = useCallback((stateToSave: UserSessionState) => {
    const serialized = JSON.stringify(stateToSave)
    
    // Skip if state hasn't actually changed
    if (serialized === lastSaveRef.current) {
      return
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // Don't save if component is unmounted
      if (!isMountedRef.current) return
      UserStateService.saveState(stateToSave)
      lastSaveRef.current = serialized
    }, 100) // 100ms debounce
  }, [])
  
  // Update state and persist to localStorage
  const updateState = useCallback((updates: Partial<UserSessionState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      debouncedSave(newState)
      return newState
    })
  }, [debouncedSave])
  
  // Individual state setters - simplified to only use updateState
  const setCurrentFile = useCallback((filePath: string) => {
    devLog.log('🎯 useUserState.setCurrentFile called with:', filePath)
    updateState({ currentFile: filePath })
  }, [updateState])
  
  const setExpandedFolders = useCallback((folders: string[]) => {
    devLog.log('📁 useUserState.setExpandedFolders called with:', folders)
    updateState({ expandedFolders: folders })
  }, [updateState])
  
  const addExpandedFolder = useCallback((folderPath: string) => {
    if (!state.expandedFolders.includes(folderPath)) {
      const newFolders = [...state.expandedFolders, folderPath]
      devLog.log('➕ useUserState.addExpandedFolder:', folderPath, 'New total:', newFolders)
      updateState({ expandedFolders: newFolders })
    }
  }, [state.expandedFolders, updateState])
  
  const removeExpandedFolder = useCallback((folderPath: string) => {
    const newFolders = state.expandedFolders.filter(f => f !== folderPath)
    devLog.log('➖ useUserState.removeExpandedFolder:', folderPath, 'New total:', newFolders)
    updateState({ expandedFolders: newFolders })
  }, [state.expandedFolders, updateState])
  
  const setScrollPosition = useCallback((filePath: string, position: number) => {
    devLog.log('📍 useUserState.setScrollPosition:', { filePath, position })
    updateState({
      scrollPosition: { file: filePath, position }
    })
  }, [updateState])
  
  const setPanelState = useCallback((panel: keyof UserSessionState['panels'], isOpen: boolean) => {
    devLog.log('🔧 useUserState.setPanelState:', { panel, isOpen })
    updateState({
      panels: { ...state.panels, [panel]: isOpen }
    })
  }, [state.panels, updateState])
  
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    devLog.log('🎨 useUserState.setTheme:', theme)
    updateState({ theme })
  }, [updateState])
  
  const setRepository = useCallback((owner: string, repo: string, branch: string = 'main') => {
    devLog.log('🏗️ useUserState.setRepository:', { owner, repo, branch })
    updateState({
      repository: { owner, repo, branch }
    })
  }, [updateState])
  
  const setLastSearch = useCallback((query: string) => {
    updateState({ lastSearch: query })
  }, [updateState])
  
  // Clear all state
  const clearState = useCallback(() => {
    UserStateService.clearState()
    setState(UserStateService.loadState())
  }, [])
  
  // Auto-save activity timestamp periodically and track mount state
  useEffect(() => {
    isMountedRef.current = true
    
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        UserStateService.saveState({ lastActivity: Date.now() })
      }
    }, 30000) // Save activity every 30 seconds
    
    return () => {
      isMountedRef.current = false
      clearInterval(interval)
      // Clear any pending save timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Load state on mount and set up periodic optimization
  useEffect(() => {
    const savedState = UserStateService.loadState()
    setState(savedState)
    
    // Optimize storage periodically
    const optimizeInterval = setInterval(() => {
      UserStateService.optimizeStorage()
    }, 5 * 60 * 1000) // Every 5 minutes
    
    return () => clearInterval(optimizeInterval)
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    setCurrentFile,
    setExpandedFolders,
    addExpandedFolder,
    removeExpandedFolder,
    setScrollPosition,
    setPanelState,
    setTheme,
    setRepository,
    setLastSearch,
    clearState,
    updateState,
    
    // Utilities
    hasValidState: UserStateService.hasValidState(),
    exportState: () => UserStateService.exportState(),
    importState: (importedState: UserSessionState) => {
      UserStateService.importState(importedState)
      setState(importedState)
    }
  }
}

// Hook for restoring scroll position
export function useScrollRestore(filePath?: string) {
  const [isRestored, setIsRestored] = useState(false)
  const throttledScrollRef = useRef<((e: Event) => void) | null>(null)
  
  // Reset restoration state when file changes
  useEffect(() => {
    setIsRestored(false)
  }, [filePath])
  
  useEffect(() => {
    if (!filePath || isRestored) return
    
    const currentState = UserStateService.loadState()
    const scrollPosition = currentState.scrollPosition
    
    if (scrollPosition.file === filePath && scrollPosition.position > 0) {
      // Restore scroll position after a brief delay to ensure content is loaded
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPosition.position)
        setIsRestored(true)
        devLog.log('📍 Scroll position restored for', filePath, 'at', scrollPosition.position)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [filePath, isRestored])
  
  // Save scroll position on scroll - with proper cleanup
  useEffect(() => {
    if (!filePath) return
    
    const handleScroll = throttle(() => {
      const currentState = UserStateService.loadState()
      const newState = {
        ...currentState,
        scrollPosition: { file: filePath, position: window.scrollY },
        lastActivity: Date.now()
      }
      UserStateService.saveState(newState)
    }, 1000) // Save every second
    
    throttledScrollRef.current = handleScroll
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      if (throttledScrollRef.current) {
        window.removeEventListener('scroll', throttledScrollRef.current)
      }
    }
  }, [filePath])
}

// Throttle utility
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}
