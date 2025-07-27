import { useState, useEffect, useCallback } from 'react'
import { UserStateService } from '@/lib/userState'
import type { UserSessionState } from '@/lib/userState'

export function useUserState() {
  const [state, setState] = useState<UserSessionState>(() => 
    UserStateService.loadState()
  )
  
  // Update state and persist to localStorage
  const updateState = useCallback((updates: Partial<UserSessionState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      // Save the complete new state, not just updates
      UserStateService.saveState(newState)
      console.log('💾 Saving user state:', newState)
      return newState
    })
  }, [])
  
  // Individual state setters - simplified to only use updateState
  const setCurrentFile = useCallback((filePath: string) => {
    console.log('🎯 useUserState.setCurrentFile called with:', filePath)
    updateState({ currentFile: filePath })
  }, [updateState])
  
  const setExpandedFolders = useCallback((folders: string[]) => {
    console.log('📁 useUserState.setExpandedFolders called with:', folders)
    updateState({ expandedFolders: folders })
  }, [updateState])
  
  const addExpandedFolder = useCallback((folderPath: string) => {
    if (!state.expandedFolders.includes(folderPath)) {
      const newFolders = [...state.expandedFolders, folderPath]
      console.log('➕ useUserState.addExpandedFolder:', folderPath, 'New total:', newFolders)
      updateState({ expandedFolders: newFolders })
    }
  }, [state.expandedFolders, updateState])
  
  const removeExpandedFolder = useCallback((folderPath: string) => {
    const newFolders = state.expandedFolders.filter(f => f !== folderPath)
    console.log('➖ useUserState.removeExpandedFolder:', folderPath, 'New total:', newFolders)
    updateState({ expandedFolders: newFolders })
  }, [state.expandedFolders, updateState])
  
  const setScrollPosition = useCallback((filePath: string, position: number) => {
    console.log('📍 useUserState.setScrollPosition:', { filePath, position })
    updateState({
      scrollPosition: { file: filePath, position }
    })
  }, [updateState])
  
  const setPanelState = useCallback((panel: keyof UserSessionState['panels'], isOpen: boolean) => {
    console.log('🔧 useUserState.setPanelState:', { panel, isOpen })
    updateState({
      panels: { ...state.panels, [panel]: isOpen }
    })
  }, [state.panels, updateState])
  
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    console.log('🎨 useUserState.setTheme:', theme)
    updateState({ theme })
  }, [updateState])
  
  const setRepository = useCallback((owner: string, repo: string, branch: string = 'main') => {
    console.log('🏗️ useUserState.setRepository:', { owner, repo, branch })
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
  
  // Auto-save activity timestamp periodically
  useEffect(() => {
    const interval = setInterval(() => {
      UserStateService.saveState({ lastActivity: Date.now() })
    }, 30000) // Save activity every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  // Load state on mount
  useEffect(() => {
    const savedState = UserStateService.loadState()
    setState(savedState)
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
  
  useEffect(() => {
    if (!filePath || isRestored) return
    
    const currentState = UserStateService.loadState()
    const scrollPosition = currentState.scrollPosition
    
    if (scrollPosition.file === filePath && scrollPosition.position > 0) {
      // Restore scroll position after a brief delay to ensure content is loaded
      setTimeout(() => {
        window.scrollTo(0, scrollPosition.position)
        setIsRestored(true)
        console.log('📍 Scroll position restored for', filePath, 'at', scrollPosition.position)
      }, 100)
    }
  }, [filePath, isRestored])
  
  // Save scroll position on scroll
  useEffect(() => {
    if (!filePath) return
    
    const handleScroll = () => {
      const currentState = UserStateService.loadState()
      const newState = {
        ...currentState,
        scrollPosition: { file: filePath, position: window.scrollY },
        lastActivity: Date.now()
      }
      UserStateService.saveState(newState)
    }
    
    const throttledScroll = throttle(handleScroll, 1000) // Save every second
    window.addEventListener('scroll', throttledScroll)
    
    return () => window.removeEventListener('scroll', throttledScroll)
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
