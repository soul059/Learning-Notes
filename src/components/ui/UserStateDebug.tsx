import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUserState } from '@/hooks/useUserState'
import { UserStateService } from '@/lib/userState'
import { Database, Download, Upload, Trash2, EyeOff, TestTube } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserStateDebugProps {
  className?: string
}

export function UserStateDebug({ className }: UserStateDebugProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const userState = useUserState()
  
  const runTests = () => {
    const results: string[] = []
    
    // Test 1: localStorage functionality
    const storageTest = UserStateService.testStorage()
    results.push(`localStorage test: ${storageTest ? 'PASSED' : 'FAILED'}`)
    
    // Test 2: Save and load state
    try {
      const testState = {
        currentFile: 'test-file.md',
        lastActivity: Date.now()
      }
      
      UserStateService.saveState(testState)
      const loadedState = UserStateService.loadState()
      
      const saveLoadTest = loadedState.currentFile === 'test-file.md'
      results.push(`Save/Load test: ${saveLoadTest ? 'PASSED' : 'FAILED'}`)
      
      if (!saveLoadTest) {
        results.push(`Expected: test-file.md, Got: ${loadedState.currentFile}`)
      }
    } catch (error) {
      results.push(`Save/Load test: FAILED - ${error}`)
    }
    
    // Test 3: Hook state update
    try {
      userState.setCurrentFile('hook-test.md')
      results.push('Hook update test: EXECUTED')
      
      // Check if it was actually saved
      setTimeout(() => {
        const reloadedState = UserStateService.loadState()
        const hookTest = reloadedState.currentFile === 'hook-test.md'
        setTestResults(prev => [...prev, `Hook persistence test: ${hookTest ? 'PASSED' : 'FAILED'}`])
        
        if (hookTest) {
          // Restore original file
          userState.setCurrentFile(userState.currentFile || '')
        }
      }, 500)
    } catch (error) {
      results.push(`Hook update test: FAILED - ${error}`)
    }
    
    // Test 4: Real state comparison
    const currentState = UserStateService.loadState()
    const hookState = {
      currentFile: userState.currentFile,
      expandedFolders: userState.expandedFolders,
      repository: userState.repository,
      theme: userState.theme
    }
    
    const statesMatch = JSON.stringify(currentState.currentFile) === JSON.stringify(hookState.currentFile) &&
                       JSON.stringify(currentState.repository) === JSON.stringify(hookState.repository)
    
    results.push(`Hook/Storage sync: ${statesMatch ? 'PASSED' : 'FAILED'}`)
    
    if (!statesMatch) {
      results.push(`Storage currentFile: ${currentState.currentFile}`)
      results.push(`Hook currentFile: ${hookState.currentFile}`)
      results.push(`Storage repo: ${JSON.stringify(currentState.repository)}`)
      results.push(`Hook repo: ${JSON.stringify(hookState.repository)}`)
    }
    
    setTestResults(results)
  }
  
  const handleExport = () => {
    const state = userState.exportState()
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-notes-state-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const state = JSON.parse(e.target?.result as string)
            userState.importState(state)
            alert('State imported successfully!')
          } catch (error) {
            alert('Failed to import state: Invalid JSON')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
  
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all saved state?')) {
      userState.clearState()
      alert('State cleared successfully!')
    }
  }
  
  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={cn("fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur-sm", className)}
        title="Show User State Debug Panel"
      >
        <Database className="w-4 h-4" />
      </Button>
    )
  }
  
  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 max-w-md shadow-lg",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" />
          User State Debug
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-3 text-xs">
        <div>
          <div className="font-medium text-muted-foreground mb-1">Current File:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs">
            {userState.currentFile || 'None'}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">Repository:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs">
            {userState.repository ? 
              `${userState.repository.owner}/${userState.repository.repo}@${userState.repository.branch}` : 
              'None'
            }
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">User State Raw Data:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs max-h-32 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify({
                currentFile: userState.currentFile,
                repository: userState.repository,
                expandedFolders: userState.expandedFolders,
                theme: userState.theme,
                lastActivity: userState.lastActivity ? new Date(userState.lastActivity).toLocaleString() : 'None',
                panels: userState.panels
              }, null, 2)}
            </pre>
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">Expanded Folders ({userState.expandedFolders.length}):</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs max-h-20 overflow-y-auto">
            {userState.expandedFolders.length > 0 ? (
              userState.expandedFolders.map(folder => (
                <div key={folder} className="truncate">{folder}</div>
              ))
            ) : (
              <div className="text-muted-foreground">None</div>
            )}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">Theme:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs">
            {userState.theme}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">Last Search:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs">
            {userState.lastSearch || 'None'}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">Panels:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs">
            GitHub: {userState.panels.github ? '✓' : '✗'} | 
            Settings: {userState.panels.settings ? '✓' : '✗'} | 
            Search: {userState.panels.search ? '✓' : '✗'}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-muted-foreground mb-1">Last Activity:</div>
          <div className="font-mono bg-muted/50 p-2 rounded text-xs">
            {new Date(userState.lastActivity).toLocaleString()}
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div>
            <div className="font-medium text-muted-foreground mb-1">Test Results:</div>
            <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={cn(
                    result.includes('FAILED') ? 'text-red-600 dark:text-red-400' : 
                    result.includes('PASSED') ? 'text-green-600 dark:text-green-400' : 
                    'text-muted-foreground'
                  )}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={runTests}
          className="flex-1"
        >
          <TestTube className="w-3 h-3 mr-1" />
          Test
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex-1"
        >
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          className="flex-1"
        >
          <Upload className="w-3 h-3 mr-1" />
          Import
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="flex-1"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  )
}
