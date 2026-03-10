import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  X, 
  Eye, 
  Code, 
  FileText,
  RotateCcw,
  Check,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemePreview } from '@/components/ui/ThemePreview'
import { cn } from '@/lib/utils'
import type { MarkdownSettings } from '@/types'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: MarkdownSettings
  onSettingsChange: (settings: MarkdownSettings) => void
}

const defaultSettings: MarkdownSettings = {
  fontSize: 'medium',
  lineHeight: 'comfortable',
  maxWidth: 'content',
  codeTheme: 'auto',
  enableSyntaxHighlighting: true,
  showLineNumbers: false,
  enableTableOfContents: true,
  enableMath: false,
  enableMermaid: false,
  enableRawHtml: true
}

export function SettingsPanel({ isOpen, onClose, settings: propsSettings, onSettingsChange }: SettingsPanelProps) {
  const [settings, setSettings] = useState<MarkdownSettings>(propsSettings || defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('markdown-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (err) {
        console.error('Failed to parse saved settings:', err)
      }
    }
  }, [])

  // Sync with props settings when they change
  useEffect(() => {
    if (propsSettings) {
      setSettings(propsSettings)
      setHasChanges(false)
    }
  }, [propsSettings])

  // Save settings to localStorage and notify parent
  const saveSettings = () => {
    localStorage.setItem('markdown-settings', JSON.stringify(settings))
    onSettingsChange(settings)
    setHasChanges(false)
  }

  const updateSetting = <K extends keyof MarkdownSettings>(
    key: K,
    value: MarkdownSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Auto-save immediately
    try {
      localStorage.setItem('markdown-settings', JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
    
    onSettingsChange(newSettings)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const SettingSection = ({ 
    title, 
    children, 
    icon: Icon 
  }: { 
    title: string
    children: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
  }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      <div className="space-y-3 pl-6">
        {children}
      </div>
    </div>
  )

  const OptionButton = ({ 
    label, 
    selected, 
    onClick 
  }: { 
    label: string
    selected: boolean
    onClick: () => void
  }) => (
    <Button
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={() => {
        onClick()
      }}
      onPointerDown={() => {
        // Pointer interaction for desktop
      }}
      onPointerUp={() => {
        // Pointer interaction for desktop
      }}
      className={cn(
        "justify-start text-xs cursor-pointer transition-all duration-200",
        "hover:scale-105 active:scale-95 hover:shadow-lg", // More visible hover effects
        "relative z-[320]", // Even higher z-index
        "select-none user-select-none", // Prevent text selection on desktop
        "border-2", // More prominent border
        selected && "bg-primary text-primary-foreground border-primary",
        !selected && "border-gray-300 hover:border-blue-500" // Clear hover state
      )}
    >
      {selected && <Check className="w-3 h-3 mr-1" />}
      {label}
    </Button>
  )

  const ToggleSwitch = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      <Button
        variant={checked ? "default" : "outline"}
        size="sm"
        onClick={() => {
          onChange(!checked)
        }}
        onPointerDown={() => {
          // Pointer interaction for desktop
        }}
        onPointerUp={() => {
          // Pointer interaction for desktop
        }}
        className={cn(
          "ml-3 px-3 cursor-pointer transition-all duration-200",
          "hover:scale-105 active:scale-95 hover:shadow-lg", // More visible hover effects
          "relative z-[320]", // Even higher z-index
          "select-none user-select-none", // Prevent text selection on desktop
          "border-2", // More prominent border
          checked ? "bg-green-600 hover:bg-green-700 border-green-600" : "border-gray-300 hover:border-blue-500"
        )}
      >
        {checked ? "On" : "Off"}
      </Button>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex">
      {/* Backdrop - don't capture clicks, let them pass through */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[301] pointer-events-none"
      />
      
      {/* Click area for closing - only on the left side */}
      <div 
        className="absolute inset-0 z-[301] pointer-events-auto"
        onClick={onClose}
        style={{ right: '24rem' }} // Don't cover the panel area
      />
      
      {/* Panel */}
      <div className={cn(
        "relative ml-auto w-full max-w-md h-full bg-background border-l border-border shadow-2xl z-[302]",
        "animate-in slide-in-from-right duration-300 ease-out",
        "pointer-events-auto" // Ensure panel can receive clicks
      )}>
        <div className="flex flex-col h-full pointer-events-auto z-[303]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Markdown Settings</h2>
                <p className="text-xs text-muted-foreground">Customize your reading experience</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pointer-events-auto relative z-[310]"
               onClick={(e) => e.stopPropagation()}>
            {/* Theme Settings */}
            <SettingSection title="Appearance" icon={Palette}>
              <ThemePreview />
            </SettingSection>

            {/* Display Settings */}
            <SettingSection title="Display" icon={Eye}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Font Size</label>
                  <div className="flex gap-2">
                    <OptionButton 
                      label="Small" 
                      selected={settings.fontSize === 'small'}
                      onClick={() => updateSetting('fontSize', 'small')}
                    />
                    <OptionButton 
                      label="Medium" 
                      selected={settings.fontSize === 'medium'}
                      onClick={() => updateSetting('fontSize', 'medium')}
                    />
                    <OptionButton 
                      label="Large" 
                      selected={settings.fontSize === 'large'}
                      onClick={() => updateSetting('fontSize', 'large')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Line Height</label>
                  <div className="flex gap-2">
                    <OptionButton 
                      label="Compact" 
                      selected={settings.lineHeight === 'compact'}
                      onClick={() => updateSetting('lineHeight', 'compact')}
                    />
                    <OptionButton 
                      label="Normal" 
                      selected={settings.lineHeight === 'comfortable'}
                      onClick={() => updateSetting('lineHeight', 'comfortable')}
                    />
                    <OptionButton 
                      label="Relaxed" 
                      selected={settings.lineHeight === 'relaxed'}
                      onClick={() => updateSetting('lineHeight', 'relaxed')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Content Width</label>
                  <div className="grid grid-cols-2 gap-2">
                    <OptionButton 
                      label="Narrow" 
                      selected={settings.maxWidth === 'narrow'}
                      onClick={() => updateSetting('maxWidth', 'narrow')}
                    />
                    <OptionButton 
                      label="Medium" 
                      selected={settings.maxWidth === 'content'}
                      onClick={() => updateSetting('maxWidth', 'content')}
                    />
                    <OptionButton 
                      label="Wide" 
                      selected={settings.maxWidth === 'wide'}
                      onClick={() => updateSetting('maxWidth', 'wide')}
                    />
                    <OptionButton 
                      label="Full" 
                      selected={settings.maxWidth === 'full'}
                      onClick={() => updateSetting('maxWidth', 'full')}
                    />
                  </div>
                </div>
              </div>
            </SettingSection>

            {/* Code Theme */}
            <SettingSection title="Code Highlighting" icon={Code}>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Code Theme</label>
                <div className="flex gap-2">
                  <OptionButton 
                    label="Auto" 
                    selected={settings.codeTheme === 'auto'}
                    onClick={() => updateSetting('codeTheme', 'auto')}
                  />
                  <OptionButton 
                    label="Light" 
                    selected={settings.codeTheme === 'light'}
                    onClick={() => updateSetting('codeTheme', 'light')}
                  />
                  <OptionButton 
                    label="Dark" 
                    selected={settings.codeTheme === 'dark'}
                    onClick={() => updateSetting('codeTheme', 'dark')}
                  />
                </div>
              </div>

              <ToggleSwitch
                label="Syntax Highlighting"
                description="Enable syntax highlighting for code blocks"
                checked={settings.enableSyntaxHighlighting}
                onChange={(checked) => updateSetting('enableSyntaxHighlighting', checked)}
              />

              <ToggleSwitch
                label="Line Numbers"
                description="Show line numbers in code blocks"
                checked={settings.showLineNumbers}
                onChange={(checked) => updateSetting('showLineNumbers', checked)}
              />
            </SettingSection>

            {/* Content Features */}
            <SettingSection title="Content Features" icon={FileText}>
              <ToggleSwitch
                label="Table of Contents"
                description="Show table of contents for headings"
                checked={settings.enableTableOfContents}
                onChange={(checked) => updateSetting('enableTableOfContents', checked)}
              />

              <ToggleSwitch
                label="Math Rendering"
                description="Render LaTeX math expressions"
                checked={settings.enableMath}
                onChange={(checked) => updateSetting('enableMath', checked)}
              />

              <ToggleSwitch
                label="Mermaid Diagrams"
                description="Render Mermaid diagrams"
                checked={settings.enableMermaid}
                onChange={(checked) => updateSetting('enableMermaid', checked)}
              />

              <ToggleSwitch
                label="Raw HTML"
                description="Allow raw HTML in markdown"
                checked={settings.enableRawHtml}
                onChange={(checked) => updateSetting('enableRawHtml', checked)}
              />
            </SettingSection>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={saveSettings}
                disabled={!hasChanges}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={resetSettings}
                className="px-3"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {hasChanges && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                You have unsaved changes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export type { MarkdownSettings }
