import { useState, useEffect } from 'react'

/**
 * Theme utilities for better coordination and consistency
 */

export class ThemeManager {
  private static isChanging = false
  private static listeners: Set<() => void> = new Set()

  /**
   * Mark the start of a theme change
   */
  static startThemeChange() {
    this.isChanging = true
    document.documentElement.classList.add('theme-changing')
    this.notifyListeners()
  }

  /**
   * Mark the end of a theme change
   */
  static endThemeChange() {
    this.isChanging = false
    document.documentElement.classList.remove('theme-changing')
    this.notifyListeners()
  }

  /**
   * Check if a theme change is in progress
   */
  static isThemeChanging() {
    return this.isChanging
  }

  /**
   * Subscribe to theme change events
   */
  static subscribe(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of theme change state
   */
  private static notifyListeners() {
    this.listeners.forEach(callback => callback())
  }

  /**
   * Apply theme with proper coordination
   */
  static applyTheme(theme: 'light' | 'dark') {
    const root = document.documentElement
    
    // Start coordinated theme change
    this.startThemeChange()
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Apply new theme
    requestAnimationFrame(() => {
      root.classList.add(theme)
      
      // End theme change after brief delay
      setTimeout(() => {
        this.endThemeChange()
      }, 150)
    })
  }
}

/**
 * Hook to use theme change state
 */
export function useThemeChanging() {
  const [isChanging, setIsChanging] = useState(ThemeManager.isThemeChanging())
  
  useEffect(() => {
    const unsubscribe = ThemeManager.subscribe(() => {
      setIsChanging(ThemeManager.isThemeChanging())
    })
    
    return () => {
      unsubscribe()
    }
  }, [])
  
  return isChanging
}
