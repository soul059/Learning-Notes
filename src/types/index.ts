export interface Note {
  id: string
  title: string
  content: string
  filePath: string
  lastModified: Date
  category?: string
  tags?: string[]
  source?: 'local' | 'github'
  sha?: string // GitHub file SHA for updates
}

export interface Category {
  id: string
  name: string
  path: string
  children?: Category[]
  notes?: Note[]
  source?: 'local' | 'github'
}

export interface FileSystemItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileSystemItem[]
  lastModified?: Date
  source?: 'local' | 'github'
  sha?: string // GitHub file SHA
  loaded?: boolean // Track if directory contents have been loaded from GitHub
}

export interface SearchResult {
  note: Note
  matches: {
    title?: boolean
    content?: string[]
  }
}

export interface EditMode {
  isEditing: boolean
  noteId?: string
}

export interface GitHubConfig {
  owner: string
  repo: string
  token?: string
  branch?: string
}

export interface Theme {
  mode: 'light' | 'dark' | 'system'
}

export interface AppSettings {
  theme: Theme
  githubConfig?: GitHubConfig
  autoSave: boolean
  showLineNumbers: boolean
  fontSize: 'sm' | 'base' | 'lg'
}

export interface MarkdownSettings {
  // Display settings
  fontSize: 'small' | 'medium' | 'large'
  lineHeight: 'compact' | 'comfortable' | 'relaxed'
  maxWidth: 'narrow' | 'content' | 'wide' | 'full'
  
  // Code highlighting
  codeTheme: 'auto' | 'light' | 'dark'
  enableSyntaxHighlighting: boolean
  showLineNumbers: boolean
  
  // Content features
  enableTableOfContents: boolean
  enableMath: boolean
  enableMermaid: boolean
  enableRawHtml: boolean
}
