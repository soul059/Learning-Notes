import { githubService } from './github'

// File loader utility for fetching markdown content
export async function loadMarkdownFile(filePath: string, useGitHub: boolean = false): Promise<string> {
  try {
    if (useGitHub) {
      // Load from GitHub
      return await githubService.getFileContent(filePath)
    } else {
      // Load from local public directory
      let publicPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
      
      // Create the proper URL - don't add /welcome/ if it's already in the path
      const url = publicPath.startsWith('welcome/') ? `/${publicPath}` : `/welcome/${publicPath}`
      
      console.log('Loading file from:', url) // Debug log
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }
      
      const content = await response.text()
      return content
    }
  } catch (error) {
    console.error('Error loading markdown file:', error)
    return `# Error Loading File

Sorry, we couldn't load the file at path: \`${filePath}\`

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please check:
- The file exists ${useGitHub ? 'in the GitHub repository' : 'in the `public/welcome` directory'}
- The file path is correct
- The file has the correct extension (.md)
${useGitHub ? '' : `\n**Attempted URL:** \`/welcome/${filePath}\``}

---

*This is a placeholder message. The actual file content should appear here when the file is successfully loaded.*`
  }
}

// Helper function to get all markdown files from the file tree
export function getMarkdownFiles(items: any[]): string[] {
  const files: string[] = []
  
  function traverse(items: any[]) {
    for (const item of items) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        files.push(item.path)
      } else if (item.type === 'directory' && item.children) {
        traverse(item.children)
      }
    }
  }
  
  traverse(items)
  return files
}

// Function to normalize file paths for consistent handling
export function normalizeFilePath(path: string): string {
  // Remove leading slash and ensure proper structure
  let cleanPath = path.replace(/^\/+/, '')
  
  // For GitHub integration, keep the original path structure
  // For local files, ensure they're in the welcome directory if not already
  return cleanPath
}
