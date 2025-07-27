import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UserStateService } from '@/lib/userState'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableTransitions?: boolean
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: 'dark' | 'light' // The actual theme being used
  systemTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  systemTheme: 'light',
  setTheme: () => null,
  toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  enableTransitions = true,
  ...props
}: ThemeProviderProps) {
  // Get system preference
  const getSystemTheme = useCallback((): 'dark' | 'light' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    
    // Try to get theme from user state first, then localStorage as fallback
    const userStateTheme = UserStateService.getTheme()
    const localStorageTheme = localStorage.getItem(storageKey) as Theme
    return userStateTheme || localStorageTheme || defaultTheme
  })
  
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => getSystemTheme())
  const [isInitialized, setIsInitialized] = useState(false)

  // Calculate the resolved theme (what's actually applied)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
      console.log('🎨 System theme changed to:', newSystemTheme)
    }

    // Set initial system theme
    setSystemTheme(getSystemTheme())
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [getSystemTheme])

  // Apply theme to document with better coordination and timing
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const root = window.document.documentElement
    
    // For initial load - apply theme without transitions
    if (!isInitialized) {
      root.classList.remove('light', 'dark', 'theme-transition')
      root.classList.add('theme-changing', resolvedTheme)
      
      const initTimer = setTimeout(() => {
        root.classList.remove('theme-changing')
        setIsInitialized(true)
      }, 100)
      
      return () => clearTimeout(initTimer)
    }
    
    // For theme changes after initialization
    const applyThemeChange = () => {
      // Step 1: Start theme change (disable transitions)
      root.classList.add('theme-changing')
      root.classList.remove('theme-transition', 'light', 'dark')
      
      // Step 2: Apply new theme immediately
      root.classList.add(resolvedTheme)
      
      if (enableTransitions) {
        // Step 3: Enable smooth transitions after a short delay
        const enableTransitionsTimer = setTimeout(() => {
          root.classList.remove('theme-changing')
          root.classList.add('theme-transition')
          
          // Step 4: Remove transition class after animation
          const cleanupTimer = setTimeout(() => {
            root.classList.remove('theme-transition')
          }, 300)
          
          return () => clearTimeout(cleanupTimer)
        }, 100)
        
        return () => clearTimeout(enableTransitionsTimer)
      } else {
        // No transitions - just remove changing class
        const cleanupTimer = setTimeout(() => {
          root.classList.remove('theme-changing')
        }, 50)
        
        return () => clearTimeout(cleanupTimer)
      }
    }
    
    return applyThemeChange()
  }, [resolvedTheme, enableTransitions, isInitialized])

  const setTheme = useCallback((newTheme: Theme) => {
    console.log('🎨 Theme changing from', theme, 'to', newTheme)
    
    // Save to both localStorage (backward compatibility) and user state
    localStorage.setItem(storageKey, newTheme)
    UserStateService.setTheme(newTheme)
    setThemeState(newTheme)
  }, [theme, storageKey])

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(nextTheme)
  }, [theme, setTheme])

  const value = {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
