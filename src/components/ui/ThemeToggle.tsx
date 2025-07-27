import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeProvider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'inline'
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ variant = 'button', showLabel = false, className }: ThemeToggleProps) {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme()
  const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const themes = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' }
  ] as const

  const currentTheme = themes.find(t => t.value === theme) || themes[2]

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    if (isChanging || newTheme === theme) return
    
    setIsChanging(true)
    
    // Brief delay to show changing state
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setTheme(newTheme)
    setIsOpen(false)
    
    // Wait for theme to apply before removing changing state
    setTimeout(() => {
      setIsChanging(false)
    }, 400)
    
    // Show enhanced toast notification
    const themeLabel = newTheme === 'system' 
      ? `system (${systemTheme})` 
      : newTheme
    
    addToast({
      title: 'Theme updated',
      description: `Switched to ${themeLabel} mode`,
      type: 'success',
      duration: 2000
    })
  }

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.value === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    handleThemeChange(themes[nextIndex].value)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Simple button toggle (cycles through themes)
  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
        disabled={isChanging}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200", 
          isChanging && "opacity-50 cursor-not-allowed",
          className
        )}
        title={`Current: ${currentTheme.label} (${resolvedTheme}) • Click to switch`}
      >
        <currentTheme.icon className={cn(
          "h-4 w-4 transition-all duration-200", 
          isChanging ? "scale-90 opacity-50" : "hover:scale-110"
        )} />
      </Button>
    )
  }

  // Inline theme options (horizontal pills)
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground mr-2 flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Theme:
          </span>
        )}
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.value
          
          return (
            <Button
              key={themeOption.value}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleThemeChange(themeOption.value)}
              disabled={isChanging}
              className={cn(
                "h-7 px-2 text-xs gap-1.5 transition-all duration-200",
                isActive && "bg-accent border shadow-sm",
                isChanging && "opacity-50 cursor-not-allowed"
              )}
              title={themeOption.description}
            >
              <Icon className="h-3 w-3" />
              {themeOption.label}
              {isActive && <Check className="h-3 w-3 text-primary" />}
            </Button>
          )
        })}
      </div>
    )
  }

  // Dropdown variant
  return (
    <div className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={cn(
          "h-8 gap-2 transition-colors duration-200",
          showLabel ? "px-3" : "w-8 p-0",
          isChanging && "opacity-50 cursor-not-allowed"
        )}
        title={`Current: ${currentTheme.label} (${resolvedTheme})`}
      >
        <currentTheme.icon className={cn(
          "h-4 w-4 transition-all duration-200",
          isChanging && "scale-90 opacity-50"
        )} />
        {showLabel && <span className="text-sm">{currentTheme.label}</span>}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-background border border-border rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-2">
            <div className="p-1">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon
                const isActive = theme === themeOption.value
                
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => handleThemeChange(themeOption.value)}
                    disabled={isChanging}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors duration-150",
                      "hover:bg-accent focus:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                      isActive && "bg-accent/50 text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{themeOption.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {themeOption.description}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* System preference indicator */}
            {theme === 'system' && (
              <div className="border-t border-border p-2 bg-muted/30">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Monitor className="h-3 w-3" />
                  <span>
                    Following system: {systemTheme} mode
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Export individual theme option for use in other components
export function ThemeOption({ 
  theme, 
  isActive, 
  onClick, 
  className 
}: { 
  theme: 'light' | 'dark' | 'system'
  isActive: boolean
  onClick: () => void
  className?: string
}) {
  const themeData = {
    light: { icon: Sun, label: 'Light' },
    dark: { icon: Moon, label: 'Dark' },
    system: { icon: Monitor, label: 'System' }
  }[theme]

  const Icon = themeData.icon

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <Icon className="h-4 w-4" />
      {themeData.label}
    </Button>
  )
}
