import { useState } from 'react'
import { Sun, Moon, Monitor, Eye } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemePreviewProps {
  className?: string
}

export function ThemePreview({ className }: ThemePreviewProps) {
  const { theme, systemTheme, setTheme } = useTheme()
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'system' | null>(null)

  const themes = [
    { 
      value: 'light' as const, 
      label: 'Light', 
      icon: Sun,
      colors: {
        bg: 'bg-white',
        surface: 'bg-gray-50',
        text: 'text-gray-900',
        muted: 'text-gray-600',
        border: 'border-gray-200'
      }
    },
    { 
      value: 'dark' as const, 
      label: 'Dark', 
      icon: Moon,
      colors: {
        bg: 'bg-gray-900',
        surface: 'bg-gray-800',
        text: 'text-white',
        muted: 'text-gray-400',
        border: 'border-gray-700'
      }
    },
    { 
      value: 'system' as const, 
      label: 'System', 
      icon: Monitor,
      colors: systemTheme === 'dark' ? {
        bg: 'bg-gray-900',
        surface: 'bg-gray-800',
        text: 'text-white',
        muted: 'text-gray-400',
        border: 'border-gray-700'
      } : {
        bg: 'bg-white',
        surface: 'bg-gray-50',
        text: 'text-gray-900',
        muted: 'text-gray-600',
        border: 'border-gray-200'
      }
    }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span>Theme Preview</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.value
          const isPreviewing = previewTheme === themeOption.value
          
          return (
            <div key={themeOption.value} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{themeOption.label}</span>
                  {isActive && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                  {themeOption.value === 'system' && (
                    <span className="text-xs text-muted-foreground">
                      ({systemTheme})
                    </span>
                  )}
                </div>
                <Button
                  variant={isActive ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTheme(themeOption.value)}
                  className="text-xs"
                >
                  {isActive ? 'Active' : 'Apply'}
                </Button>
              </div>
              
              {/* Theme preview card */}
              <div 
                className={cn(
                  "relative overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer",
                  themeOption.colors.border,
                  isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isPreviewing && "scale-105 shadow-lg"
                )}
                onMouseEnter={() => setPreviewTheme(themeOption.value)}
                onMouseLeave={() => setPreviewTheme(null)}
                onClick={() => setTheme(themeOption.value)}
              >
                <div className={cn("p-4", themeOption.colors.bg)}>
                  {/* Mock header */}
                  <div className={cn("flex items-center justify-between mb-3 pb-2 border-b", themeOption.colors.border)}>
                    <div className={cn("h-2 w-16 rounded", themeOption.colors.surface)} />
                    <div className="flex gap-1">
                      <div className={cn("h-2 w-2 rounded-full", themeOption.colors.surface)} />
                      <div className={cn("h-2 w-2 rounded-full", themeOption.colors.surface)} />
                      <div className={cn("h-2 w-2 rounded-full", themeOption.colors.surface)} />
                    </div>
                  </div>
                  
                  {/* Mock content */}
                  <div className="space-y-2">
                    <div className={cn("h-3 w-3/4 rounded", themeOption.colors.text, "opacity-90")} 
                         style={{ backgroundColor: 'currentColor' }} />
                    <div className={cn("h-2 w-full rounded", themeOption.colors.muted, "opacity-60")} 
                         style={{ backgroundColor: 'currentColor' }} />
                    <div className={cn("h-2 w-2/3 rounded", themeOption.colors.muted, "opacity-60")} 
                         style={{ backgroundColor: 'currentColor' }} />
                  </div>
                  
                  {/* Mock sidebar */}
                  <div className={cn("mt-3 p-2 rounded", themeOption.colors.surface)}>
                    <div className="space-y-1">
                      <div className={cn("h-1.5 w-12 rounded", themeOption.colors.muted, "opacity-80")} 
                           style={{ backgroundColor: 'currentColor' }} />
                      <div className={cn("h-1.5 w-8 rounded", themeOption.colors.muted, "opacity-60")} 
                           style={{ backgroundColor: 'currentColor' }} />
                      <div className={cn("h-1.5 w-10 rounded", themeOption.colors.muted, "opacity-60")} 
                           style={{ backgroundColor: 'currentColor' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
        <div>• Themes sync across all devices</div>
        <div>• System theme follows your OS preference</div>
        <div>• Changes apply instantly with smooth transitions</div>
      </div>
    </div>
  )
}
