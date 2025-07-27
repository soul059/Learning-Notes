import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  X, 
  Eye, 
  Code, 
  Type, 
  FileText,
  RotateCcw,
  Check,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemePreview } from '@/components/ui/ThemePreview'
import { cn } from '@/lib/utils'

interface MarkdownSettings {
  // Display settings
  fontSize: 'small' | 'medium' | 'large'
  lineHeight: 'compact' | 'normal' | 'relaxed'
  maxWidth: 'narrow' | 'medium' | 'wide' | 'full'
  
  // Theme settings
  codeTheme: 'auto' | 'light' | 'dark'
  renderEmojis: boolean
  renderMath: boolean
  
  // Content settings
  showTableOfContents: boolean
  enableMarkdownExtensions: boolean
  renderRawHtml: boolean
  enableSyntaxHighlighting: boolean
  
  // Editor settings
  showLineNumbers: boolean
  enableWordWrap: boolean
  enableSpellCheck: boolean
}

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: MarkdownSettings) => void
}

const defaultSettings: MarkdownSettings = {
  fontSize: 'medium',
  lineHeight: 'normal',
  maxWidth: 'medium',
  codeTheme: 'auto',
  renderEmojis: true,
  renderMath: false,
  showTableOfContents: true,
  enableMarkdownExtensions: true,
  renderRawHtml: true,
  enableSyntaxHighlighting: true,
  showLineNumbers: false,
  enableWordWrap: true,
  enableSpellCheck: true
}

export function SettingsPanel({ isOpen, onClose, onSettingsChange }: SettingsPanelProps) {
  const [settings, setSettings] = useState<MarkdownSettings>(defaultSettings)
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
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
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
      onClick={onClick}
      className={cn(
        "justify-start text-xs",
        selected && "bg-primary text-primary-foreground"
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
        onClick={() => onChange(!checked)}
        className={cn(
          "ml-3 px-3",
          checked ? "bg-green-600 hover:bg-green-700" : ""
        )}
      >
        {checked ? "On" : "Off"}
      </Button>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={cn(
        "relative ml-auto w-full max-w-md h-full bg-background border-l border-border shadow-2xl",
        "animate-in slide-in-from-right duration-300 ease-out"
      )}>
        <div className="flex flex-col h-full">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                      selected={settings.lineHeight === 'normal'}
                      onClick={() => updateSetting('lineHeight', 'normal')}
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
                      selected={settings.maxWidth === 'medium'}
                      onClick={() => updateSetting('maxWidth', 'medium')}
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
                checked={settings.showTableOfContents}
                onChange={(checked) => updateSetting('showTableOfContents', checked)}
              />

              <ToggleSwitch
                label="Emoji Rendering"
                description="Convert emoji codes to emoji characters"
                checked={settings.renderEmojis}
                onChange={(checked) => updateSetting('renderEmojis', checked)}
              />

              <ToggleSwitch
                label="Math Rendering"
                description="Render LaTeX math expressions"
                checked={settings.renderMath}
                onChange={(checked) => updateSetting('renderMath', checked)}
              />

              <ToggleSwitch
                label="Raw HTML"
                description="Allow raw HTML in markdown"
                checked={settings.renderRawHtml}
                onChange={(checked) => updateSetting('renderRawHtml', checked)}
              />

              <ToggleSwitch
                label="GitHub Extensions"
                description="Enable GitHub-flavored markdown extensions"
                checked={settings.enableMarkdownExtensions}
                onChange={(checked) => updateSetting('enableMarkdownExtensions', checked)}
              />
            </SettingSection>

            {/* Editor Settings */}
            <SettingSection title="Editor" icon={Type}>
              <ToggleSwitch
                label="Word Wrap"
                description="Wrap long lines in editor"
                checked={settings.enableWordWrap}
                onChange={(checked) => updateSetting('enableWordWrap', checked)}
              />

              <ToggleSwitch
                label="Spell Check"
                description="Enable spell checking in editor"
                checked={settings.enableSpellCheck}
                onChange={(checked) => updateSetting('enableSpellCheck', checked)}
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
