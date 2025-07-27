import { Octokit } from '@octokit/rest'
import { CacheService } from './cache'

export interface GitHubConfig {
  owner: string
  repo: string
  token?: string
  branch?: string
}

export interface GitHubFile {
  name: string
  path: string
  content: string
  sha: string
  type: 'file' | 'dir'
  download_url?: string
}

export interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
}

export class GitHubService {
  private octokit: Octokit
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = {
      branch: 'main',
      ...config
    }
    
    this.octokit = new Octokit({
      auth: config.token,
      userAgent: 'Learning-Notes-Website'
    })
  }

  /**
   * Get repository information and test connectivity
   */
  async getRepository() {
    const cacheKey = CacheService.repositoryKey(this.config.owner, this.config.repo)
    
    // Try cache first
    const cachedRepo = CacheService.get<any>(cacheKey)
    if (cachedRepo) {
      console.log('💾 Repository info from cache:', cachedRepo.name)
      return cachedRepo
    }

    try {
      console.log('🔍 Attempting to fetch repository:', this.config)
      const { data } = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo
      })
      console.log('✅ Repository fetched successfully:', { name: data.name, private: data.private, default_branch: data.default_branch })
      
      // Cache repository info for 30 minutes
      CacheService.set(cacheKey, data, 30 * 60 * 1000)
      
      // Also test by getting root contents (don't cache this as it's just for testing)
      const { data: contents } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: '',
        ref: this.config.branch
      })
      
      console.log('📁 Root directory contents:', Array.isArray(contents) ? contents.map(c => ({ name: c.name, type: c.type })) : 'Not an array')
      
      return data
    } catch (error: any) {
      console.error('❌ Error fetching repository:', error)
      if (error.status === 403 && error.message.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please wait a moment or add a Personal Access Token.')
      }
      if (error.status === 404) {
        throw new Error(`Repository not found: ${this.config.owner}/${this.config.repo}`)
      }
      throw new Error(`Failed to fetch repository information: ${error.message}`)
    }
  }

  /**
   * Get folder structure only (no file contents, only README files)
   */
  async getFolderStructure(path: string = ''): Promise<GitHubFile[]> {
    const cacheKey = CacheService.fileListKey(this.config.owner, this.config.repo, `folders-${path}`, this.config.branch!)
    
    // Try cache first (cache for 15 minutes)
    const cachedStructure = CacheService.get<GitHubFile[]>(cacheKey)
    if (cachedStructure) {
      console.log('💾 Folder structure from cache:', { path, count: cachedStructure.length })
      return cachedStructure
    }

    try {
      console.log('🌐 Fetching folder structure from GitHub:', { path, owner: this.config.owner, repo: this.config.repo })
      
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: this.config.branch
      })

      const structure: GitHubFile[] = []
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        if (item.type === 'dir') {
          // Add all directories
          structure.push({
            name: item.name,
            path: item.path,
            content: '',
            sha: item.sha,
            type: 'dir',
            download_url: undefined
          })
        } else if (item.type === 'file' && item.name.toLowerCase().includes('readme')) {
          // Only add README files initially
          structure.push({
            name: item.name,
            path: item.path,
            content: '',
            sha: item.sha,
            type: 'file',
            download_url: item.download_url || undefined
          })
        }
      }

      // Cache for 15 minutes
      CacheService.set(cacheKey, structure, 15 * 60 * 1000)
      console.log('✅ Folder structure cached:', { path, count: structure.length })

      return structure
    } catch (error) {
      console.error('❌ Error fetching folder structure:', error)
      throw new Error('Failed to fetch folder structure from repository')
    }
  }

  /**
   * Get all files in a specific folder (called when folder is expanded)
   */
  async getFolderContents(folderPath: string): Promise<GitHubFile[]> {
    const cacheKey = CacheService.fileListKey(this.config.owner, this.config.repo, `contents-${folderPath}`, this.config.branch!)
    
    // Try cache first (cache for 10 minutes)
    const cachedContents = CacheService.get<GitHubFile[]>(cacheKey)
    if (cachedContents) {
      console.log('💾 Folder contents from cache:', { folderPath, count: cachedContents.length })
      return cachedContents
    }

    console.log('🌐 Cache miss - fetching folder contents from GitHub API:', { folderPath, owner: this.config.owner, repo: this.config.repo })

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: folderPath,
        ref: this.config.branch
      })

      const contents: GitHubFile[] = []
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        contents.push({
          name: item.name,
          path: item.path,
          content: '', // Empty - will load on demand
          sha: item.sha,
          type: item.type as 'file' | 'dir',
          download_url: item.download_url || undefined
        })
      }

      // Cache for 10 minutes
      CacheService.set(cacheKey, contents, 10 * 60 * 1000)
      console.log('✅ Folder contents fetched from GitHub and cached:', { folderPath, count: contents.length, files: contents.map(c => c.name) })

      return contents
    } catch (error) {
      console.error('❌ Error fetching folder contents from GitHub:', { folderPath, error })
      throw new Error(`Failed to fetch contents for folder: ${folderPath}`)
    }
  }

  /**
   * Get content of a specific file
   */
  async getFileContent(path: string): Promise<string> {
    const cacheKey = CacheService.fileContentKey(this.config.owner, this.config.repo, path, this.config.branch!)
    
    // Try cache first (cache for 15 minutes for content)
    const cachedContent = CacheService.get<string>(cacheKey)
    if (cachedContent) {
      console.log('💾 File content from cache:', { path, size: cachedContent.length })
      return cachedContent
    }

    try {
      console.log('🌐 GitHub API: Fetching file content for:', path)
      console.log('🔧 Using config:', { owner: this.config.owner, repo: this.config.repo, branch: this.config.branch })
      
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: this.config.branch
      })

      if (Array.isArray(data) || data.type !== 'file') {
        console.error('❌ Path does not point to a file:', { path, dataType: Array.isArray(data) ? 'array' : data.type })
        throw new Error('Path does not point to a file')
      }

      // Decode base64 content with proper UTF-8 support
      const base64Content = data.content.replace(/\s/g, '')
      
      // Convert base64 to bytes then decode as UTF-8
      const binaryString = atob(base64Content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const content = new TextDecoder('utf-8').decode(bytes)
      
      // Cache content for 15 minutes
      CacheService.set(cacheKey, content, 15 * 60 * 1000)
      
      console.log('✅ File content fetched and cached:', { path, size: data.size })
      return content
    } catch (error: any) {
      console.error('❌ Error fetching file content:', { path, error: error.message, status: error.status })
      
      if (error.status === 404) {
        throw new Error(`File not found: ${path}`)
      } else if (error.status === 403) {
        throw new Error('Access denied. Please check your GitHub token permissions.')
      } else if (error.message.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please wait a moment.')
      }
      
      throw new Error(`Failed to fetch file content: ${path} - ${error.message}`)
    }
  }

  /**
   * Get lazy-loading file tree structure (only folders and README files initially)
   */
  async getLazyFileTree(path: string = ''): Promise<any[]> {
    const cacheKey = CacheService.fileTreeKey(this.config.owner, this.config.repo, `lazy-${path}`, this.config.branch!)
    
    // Try cache first (cache for 15 minutes)
    const cachedTree = CacheService.get<any[]>(cacheKey)
    if (cachedTree) {
      console.log('💾 Lazy file tree from cache:', { path, nodes: cachedTree.length })
      return cachedTree
    }

    try {
      console.log('🌐 Fetching lazy file tree from GitHub:', { path, owner: this.config.owner, repo: this.config.repo })
      
      const structure = await this.getFolderStructure(path)
      const tree = []

      for (const item of structure) {
        if (item.type === 'dir') {
          tree.push({
            name: item.name,
            path: item.path,
            type: 'directory',
            children: [], // Empty initially - will be loaded on expand
            loaded: false, // Track if children have been loaded
            lastModified: new Date(),
            source: 'github'
          })
        } else if (item.type === 'file') {
          // Only README files are included initially
          tree.push({
            name: item.name,
            path: item.path,
            type: 'file',
            lastModified: new Date(),
            source: 'github'
          })
        }
      }

      // Cache tree for 15 minutes
      CacheService.set(cacheKey, tree, 15 * 60 * 1000)
      console.log('✅ Lazy file tree cached:', { path, nodes: tree.length })

      return tree
    } catch (error) {
      console.error('❌ Error fetching lazy file tree:', error)
      throw new Error('Failed to fetch lazy file tree from repository')
    }
  }

  /**
   * Create a new branch for editing
   */
  async createBranch(branchName: string): Promise<void> {
    try {
      // Get the latest commit SHA from the main branch
      const { data: ref } = await this.octokit.rest.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.branch}`
      })

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha
      })
    } catch (error) {
      console.error('Error creating branch:', error)
      throw new Error(`Failed to create branch: ${branchName}`)
    }
  }

  /**
   * Update file content and commit changes
   */
  async updateFile(
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<void> {
    try {
      // Get current file SHA if not provided
      if (!sha) {
        try {
          const { data } = await this.octokit.rest.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path,
            ref: branch
          })
          
          if (!Array.isArray(data) && data.type === 'file') {
            sha = data.sha
          }
        } catch (error) {
          // File doesn't exist, that's ok for new files
        }
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message,
        content: btoa(content), // Base64 encode
        branch,
        ...(sha && { sha })
      })

      // Invalidate cache for this file
      const cacheKey = CacheService.fileContentKey(this.config.owner, this.config.repo, path, branch)
      CacheService.remove(cacheKey)
      console.log('🗑️ Cache invalidated for updated file:', path)
    } catch (error) {
      console.error('Error updating file:', error)
      throw new Error(`Failed to update file: ${path}`)
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ): Promise<{ number: number; html_url: string }> {
    try {
      const { data } = await this.octokit.rest.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        head,
        base
      })

      return {
        number: data.number,
        html_url: data.html_url
      }
    } catch (error) {
      console.error('Error creating pull request:', error)
      throw new Error('Failed to create pull request')
    }
  }

  /**
   * Get recent commits
   */
  async getCommits(limit: number = 10): Promise<GitHubCommit[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: this.config.branch,
        per_page: limit
      })

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || ''
        }
      }))
    } catch (error) {
      console.error('Error fetching commits:', error)
      throw new Error('Failed to fetch repository commits')
    }
  }

  /**
   * Check if user has write access to repository
   */
  async checkWriteAccess(): Promise<boolean> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo
      })
      
      return data.permissions?.push || false
    } catch (error) {
      console.error('Error checking write access:', error)
      return false
    }
  }

  /**
   * Clear all cache for this repository
   */
  clearCache(): void {
    const patterns = [
      CacheService.repositoryKey(this.config.owner, this.config.repo),
      `file-content:${this.config.owner}/${this.config.repo}:`,
      `file-list:${this.config.owner}/${this.config.repo}:`,
      `file-tree:${this.config.owner}/${this.config.repo}:`
    ]

    // Remove items that start with our patterns
    const storages = [localStorage, sessionStorage]
    let removedCount = 0

    storages.forEach(storage => {
      const keys = Object.keys(storage).filter(key => 
        patterns.some(pattern => key.includes(pattern))
      )
      
      keys.forEach(key => {
        storage.removeItem(key)
        removedCount++
      })
    })

    console.log(`🧹 Cleared ${removedCount} cache items for ${this.config.owner}/${this.config.repo}`)
  }
}

// Default configuration for the Learning repository
export const defaultGitHubConfig: GitHubConfig = {
  owner: 'soul059',
  repo: 'Learning',
  branch: 'main'
}

// Create default GitHub service instance
export const githubService = new GitHubService(defaultGitHubConfig)
