import React, { useState } from 'react'
import { SettingsPanel } from './SettingsPanel'
import type { MarkdownSettings } from '../../types'

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

export const SettingsTest: React.FC = () => {
  const [settings, setSettings] = useState<MarkdownSettings>(defaultSettings)
  const [isOpen, setIsOpen] = useState(true)

  const handleSettingsChange = (newSettings: MarkdownSettings) => {
    console.log('Settings changed in test:', newSettings)
    setSettings(newSettings)
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Settings Panel Test</h2>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isOpen ? 'Close' : 'Open'} Settings Panel
      </button>
      
      <div className="mt-4">
        <h3 className="font-medium mb-2">Current Settings:</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      <SettingsPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}
