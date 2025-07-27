import React, { createContext, useContext, useEffect, useState } from 'react'
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
  const getSystemTheme = (): 'dark' | 'light' => 
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to get theme from user state first, then localStorage as fallback
    const userStateTheme = UserStateService.getTheme()
    const localStorageTheme = localStorage.getItem(storageKey) as Theme
    return userStateTheme || localStorageTheme || defaultTheme
  })
  
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme)

  // Calculate the resolved theme (what's actually applied)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
      console.log('🎨 System theme changed to:', newSystemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement

    // Add transition class for smooth theme changes
    if (enableTransitions) {
      root.classList.add('theme-transition')
    }

    // Remove all theme classes
    root.classList.remove('light', 'dark')
    
    // Add the resolved theme class
    root.classList.add(resolvedTheme)

    // Remove transition class after animation completes
    if (enableTransitions) {
      const timer = setTimeout(() => {
        root.classList.remove('theme-transition')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [resolvedTheme, enableTransitions])

  const setTheme = (newTheme: Theme) => {
    console.log('🎨 Theme changing from', theme, 'to', newTheme)
    
    // Save to both localStorage (backward compatibility) and user state
    localStorage.setItem(storageKey, newTheme)
    UserStateService.setTheme(newTheme)
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(nextTheme)
  }

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
