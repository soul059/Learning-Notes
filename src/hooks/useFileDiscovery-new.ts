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
      // Fallback to known files
      setFiles([
        'getting-started/introduction.md',
        'getting-started/setup.md',
        'programming/javascript/react-hooks.md',
        'guides/search-guide.md'
      ])
    } finally {
      setLoading(false)
    }
  }

  return { files, loading, refreshFiles: discoverFiles }
}

// Discover markdown files by attempting to fetch from common paths
export async function getAllMarkdownFiles(): Promise<string[]> {
  const files: string[] = []
  
  // Common directory structures to check
  const commonPaths = [
    'getting-started',
    'programming',
    'programming/javascript',
    'programming/python',
    'programming/typescript',
    'tutorials',
    'guides',
    'reference',
    'examples',
    'docs',
    'notes',
    'learning'
  ]

  // Common file names to check
  const commonFiles = [
    'introduction.md',
    'setup.md',
    'getting-started.md',
    'readme.md',
    'index.md',
    'overview.md',
    'search-guide.md'
  ]

  // Try to fetch files from common paths
  for (const path of commonPaths) {
    for (const fileName of commonFiles) {
      const fullPath = `${path}/${fileName}`
      try {
        const response = await fetch(`/notes/${fullPath}`, { method: 'HEAD' })
        if (response.ok) {
          files.push(fullPath)
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  }

  // Also check root level files
  for (const fileName of commonFiles) {
    try {
      const response = await fetch(`/notes/${fileName}`, { method: 'HEAD' })
      if (response.ok) {
        files.push(fileName)
      }
    } catch (error) {
      // File doesn't exist, continue
    }
  }

  // Check for specific known files
  const knownFiles = [
    'programming/javascript/react-hooks.md',
    'programming/javascript/javascript-basics.md',
    'programming/typescript/typescript-guide.md',
    'getting-started/introduction.md',
    'getting-started/setup.md',
    'tutorials/first-project.md',
    'guides/best-practices.md',
    'guides/search-guide.md',
    'reference/api-reference.md'
  ]

  for (const file of knownFiles) {
    try {
      const response = await fetch(`/notes/${file}`, { method: 'HEAD' })
      if (response.ok && !files.includes(file)) {
        files.push(file)
      }
    } catch (error) {
      // File doesn't exist, continue
    }
  }

  return [...new Set(files)] // Remove duplicates
}
