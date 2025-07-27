import { useState, useEffect } from 'react'

export function useFileDiscovery() {
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    discoverFiles()
  }, [])

  const discoverFiles = async () => {
    try {
      setLoading(true)
      const discoveredFiles = await getAllMarkdownFiles()
      setFiles(discoveredFiles)
    } catch (error) {
      console.error('Error discovering files:', error)
      // Fallback to only files that actually exist
      setFiles([
        'welcome/home.md',
        'welcome/quick-start.md',
        'welcome/features.md',
        'welcome/index.md'
      ])
    } finally {
      setLoading(false)
    }
  }

  return { files, loading, refreshFiles: discoverFiles }
}

// Discover markdown files by checking what actually exists
export async function getAllMarkdownFiles(): Promise<string[]> {
  const files: string[] = []
  
  // Only check for files that we know exist in our welcome directory
  const actualFiles = [
    'welcome/home.md',
    'welcome/index.md',
    'welcome/quick-start.md',
    'welcome/features.md'
  ]

  // Check each file to make sure it exists
  for (const file of actualFiles) {
    try {
      const response = await fetch(`/${file}`, { method: 'HEAD' })
      if (response.ok) {
        files.push(file)
      }
    } catch (error) {
      console.warn(`File not found: ${file}`)
    }
  }

  return files
}
