import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import rehypeRaw from 'rehype-raw'
import { 
  Copy, 
  Check, 
  Edit3, 
  GitPullRequest, 
  BookOpen, 
  Clock, 
  FileText,
  Maximize2,
  Minimize2,
  Type
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CreatePullRequestModal } from '@/components/github/CreatePullRequestModal'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeProvider'
import { useGitHub as useGitHubContext } from '@/contexts/GitHubProvider'
import type { MarkdownSettings } from '@/types'

// Light theme for syntax highlighting
const lightCodeTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#1f2937',
    background: 'none',
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none' as const,
  },
  'pre[class*="language-"]': {
    color: '#1f2937',
    background: 'transparent',
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none' as const,
    padding: '1.25rem',
    margin: 0,
    overflow: 'auto',
  },
  comment: { color: '#6b7280', fontStyle: 'italic' },
  prolog: { color: '#6b7280' },
  doctype: { color: '#6b7280' },
  cdata: { color: '#6b7280' },
  punctuation: { color: '#374151' },
  '.namespace': { opacity: 0.7 },
  property: { color: '#059669' },
  tag: { color: '#dc2626' },
  constant: { color: '#7c3aed' },
  symbol: { color: '#7c3aed' },
  deleted: { color: '#dc2626' },
  boolean: { color: '#7c3aed' },
  number: { color: '#7c3aed' },
  selector: { color: '#059669' },
  'attr-name': { color: '#059669' },
  string: { color: '#d97706' },
  char: { color: '#d97706' },
  builtin: { color: '#0ea5e9' },
  inserted: { color: '#059669' },
  operator: { color: '#dc2626' },
  entity: { color: '#d97706' },
  url: { color: '#d97706' },
  variable: { color: '#374151' },
  atrule: { color: '#0ea5e9' },
  'attr-value': { color: '#d97706' },
  function: { color: '#0ea5e9' },
  'class-name': { color: '#0ea5e9' },
  keyword: { color: '#dc2626', fontWeight: 'bold' },
  regex: { color: '#d97706' },
  important: { color: '#dc2626', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
}

// Custom syntax highlighting theme without line highlighting
const customCodeTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#f8f8f2',
    background: 'none',
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none' as const,
  },
  'pre[class*="language-"]': {
    color: '#f8f8f2',
    background: 'transparent',
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none' as const,
    padding: '1.25rem',
    margin: 0,
    overflow: 'auto',
  },
  comment: { color: '#6272a4' },
  prolog: { color: '#6272a4' },
  doctype: { color: '#6272a4' },
  cdata: { color: '#6272a4' },
  punctuation: { color: '#f8f8f2' },
  '.namespace': { opacity: 0.7 },
  property: { color: '#50fa7b' },
  tag: { color: '#ff79c6' },
  constant: { color: '#bd93f9' },
  symbol: { color: '#bd93f9' },
  deleted: { color: '#ff5555' },
  boolean: { color: '#bd93f9' },
  number: { color: '#bd93f9' },
  selector: { color: '#50fa7b' },
  'attr-name': { color: '#50fa7b' },
  string: { color: '#f1fa8c' },
  char: { color: '#f1fa8c' },
  builtin: { color: '#8be9fd' },
  inserted: { color: '#50fa7b' },
  operator: { color: '#ff79c6' },
  entity: { color: '#f1fa8c' },
  url: { color: '#f1fa8c' },
  variable: { color: '#f8f8f2' },
  atrule: { color: '#8be9fd' },
  'attr-value': { color: '#f1fa8c' },
  function: { color: '#8be9fd' },
  'class-name': { color: '#8be9fd' },
  keyword: { color: '#ff79c6' },
  regex: { color: '#f1fa8c' },
  important: { color: '#ff5555', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
}

interface MarkdownViewerProps {
  content: string
  onContentChange?: (content: string) => void
  editable?: boolean
  className?: string
  filePath?: string
  useGitHub?: boolean
  onFileSelect?: (filePath: string) => void
  settings?: MarkdownSettings
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

export function MarkdownViewer({ 
  content, 
  onContentChange, 
  editable = false,
  className,
  filePath = '',
  useGitHub = false,
  onFileSelect,
  settings = defaultSettings
}: MarkdownViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [showPRModal, setShowPRModal] = useState(false)
  const [originalContent] = useState(content)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [readingTime, setReadingTime] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  
  // GitHub integration
  const canCreatePR = useGitHub && filePath
  const { hasWriteAccess } = useGitHubContext()
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set())
  const [showLineNumbers, setShowLineNumbers] = useState(settings.showLineNumbers)
  const { theme } = useTheme()

  // Sync showLineNumbers with settings
  useEffect(() => {
    setShowLineNumbers(settings.showLineNumbers)
  }, [settings.showLineNumbers])

  // Calculate reading time and word count
  useState(() => {
    const words = content.trim().split(/\s+/).length
    const readingTimeMinutes = Math.ceil(words / 200) // Average reading speed
    setWordCount(words)
    setReadingTime(readingTimeMinutes)
  })

  // Helper function to generate clean IDs from heading text
  const generateId = (children: any): string => {
    const text = Array.isArray(children) 
      ? children.map(child => typeof child === 'string' ? child : child?.props?.children || '').join('')
      : typeof children === 'string' 
        ? children 
        : String(children || '')
    
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const handleSave = () => {
    onContentChange?.(editContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(content)
    setIsEditing(false)
  }

  const copyToClipboard = async (text: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedBlocks(prev => new Set([...prev, blockId]))
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev)
          newSet.delete(blockId)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (isEditing) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Edit Note</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {hasWriteAccess && canCreatePR && (
              <Button variant="outline" onClick={() => setShowPRModal(true)}>
                <GitPullRequest className="w-4 h-4 mr-2" />
                Create PR
              </Button>
            )}
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="h-full resize-none font-mono text-sm"
            placeholder="Write your markdown here..."
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50 bg-background",
      className
    )}>
      {editable && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            
            {/* Reading stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div 
          className={cn(
            "p-6 prose-custom transition-all duration-200 mx-auto",
            // Font size
            settings.fontSize === 'small' && "text-sm",
            settings.fontSize === 'medium' && "text-base",
            settings.fontSize === 'large' && "text-lg",
            // Line height
            settings.lineHeight === 'compact' && "leading-tight",
            settings.lineHeight === 'comfortable' && "leading-normal",
            settings.lineHeight === 'relaxed' && "leading-relaxed",
            // Max width
            settings.maxWidth === 'narrow' && "max-w-2xl",
            settings.maxWidth === 'content' && "max-w-4xl",
            settings.maxWidth === 'wide' && "max-w-6xl",
            settings.maxWidth === 'full' && "max-w-none"
          )}
        >
          <ReactMarkdown
            remarkPlugins={[
              remarkGfm, // Always include GitHub Flavored Markdown
              remarkEmoji // Always include emoji support
            ]}
            rehypePlugins={[
              ...(settings.enableRawHtml ? [rehypeRaw] : [])
            ]}
            components={{
              pre({ children }) {
                return <>{children}</>
              },
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : ''
                
                // Get the raw text content properly
                const codeString = Array.isArray(children) 
                  ? children.join('') 
                  : String(children || '').replace(/\n$/, '')
                
                const blockId = `code-${Math.random().toString(36).substr(2, 9)}`

                // Check if it's a code block by checking for language class
                if (match && language) {
                  return (
                    <div className={cn(
                      "code-block group relative",
                      showLineNumbers && "show-line-numbers"
                    )}>
                      <div className="code-header bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-3">
                            {/* macOS-style window controls */}
                            <div className="flex space-x-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500 hover:brightness-110 transition-all duration-200 cursor-pointer"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:brightness-110 transition-all duration-200 cursor-pointer"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500 hover:brightness-110 transition-all duration-200 cursor-pointer"></div>
                            </div>
                            
                            {/* Language label with icon */}
                            <div className="flex items-center space-x-2 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                              <span className="code-language text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                {language}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Line numbers toggle */}
                            <button
                              onClick={() => setShowLineNumbers(!showLineNumbers)}
                              className={cn(
                                "line-numbers-toggle px-2 py-1 text-xs rounded transition-all duration-200",
                                "bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-slate-600",
                                "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300",
                                showLineNumbers && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600"
                              )}
                              aria-label="Toggle line numbers"
                              title="Toggle line numbers"
                            >
                              <div className="flex items-center gap-1">
                                <Type className="w-3 h-3" />
                                <span>{showLineNumbers ? '#' : '1'}</span>
                              </div>
                            </button>
                            
                            {/* Copy button */}
                            <button
                              onClick={() => copyToClipboard(codeString, blockId)}
                              className={cn(
                                "copy-button px-3 py-1 text-xs rounded transition-all duration-200 flex items-center gap-1.5",
                                "bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-slate-600",
                                "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300",
                                "group-hover:opacity-100 md:opacity-0 transition-opacity duration-200",
                                copiedBlocks.has(blockId) && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
                              )}
                              data-copied={copiedBlocks.has(blockId)}
                              aria-label="Copy code"
                            >
                              {copiedBlocks.has(blockId) ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative overflow-hidden">
                        {settings.enableSyntaxHighlighting ? (
                          <SyntaxHighlighter
                            style={
                              settings.codeTheme === 'light' ? lightCodeTheme :
                              settings.codeTheme === 'dark' ? customCodeTheme :
                              (theme === 'dark' ? customCodeTheme : lightCodeTheme)
                            }
                            language={language}
                            PreTag="div"
                            showLineNumbers={settings.showLineNumbers}
                            showInlineLineNumbers={false}
                            wrapLines={false}
                            wrapLongLines={true}
                            lineNumberStyle={{
                              minWidth: '3rem',
                              paddingRight: '1rem',
                              marginRight: '1rem',
                              color: theme === 'dark' ? 'hsl(210 20% 50%)' : 'hsl(220 8.9% 46.1%)',
                              borderRight: `1px solid ${theme === 'dark' ? 'hsl(215 27.9% 25%)' : 'hsl(214.3 31.8% 91.4%)'}`,
                              userSelect: 'none',
                              fontSize: '0.75rem',
                              opacity: 0.6,
                              textAlign: 'right'
                            }}
                            customStyle={{
                              margin: 0,
                              fontSize: settings.fontSize === 'small' ? '0.75rem' : 
                                       settings.fontSize === 'large' ? '1rem' : '0.875rem',
                              lineHeight: settings.lineHeight === 'compact' ? '1.4' :
                                         settings.lineHeight === 'relaxed' ? '1.8' : '1.6',
                              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                              background: 'transparent',
                              padding: '1.5rem',
                              borderRadius: '0'
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        ) : (
                          <pre className={cn(
                            "p-6 text-sm font-mono bg-transparent overflow-x-auto",
                            "whitespace-pre-wrap"
                          )}>
                            <code>{codeString}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  )
                }

                // For inline code
                return (
                  <code className={cn(
                    "inline-code px-1.5 py-0.5 rounded-md text-sm font-medium",
                    "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
                    "border border-slate-200 dark:border-slate-700",
                    "hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150"
                  )} {...props}>
                    {children}
                  </code>
                )
              },
              
              // Enhanced headings with better styling
              h1: ({ children }) => {
                const id = generateId(children)
                return (
                  <h1 id={id} className={cn(
                    "flex items-center gap-2 scroll-mt-20 group",
                    "text-3xl font-bold mb-6 mt-8 pb-2",
                    "border-b border-slate-200 dark:border-slate-700",
                    "text-slate-900 dark:text-slate-100"
                  )}>
                    {children}
                    <a 
                      href={`#${id}`} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label="Link to this section"
                    >
                      #
                    </a>
                  </h1>
                )
              },
              h2: ({ children }) => {
                const id = generateId(children)
                return (
                  <h2 id={id} className={cn(
                    "flex items-center gap-2 scroll-mt-20 group",
                    "text-2xl font-semibold mb-4 mt-8",
                    "text-slate-800 dark:text-slate-200"
                  )}>
                    {children}
                    <a 
                      href={`#${id}`} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label="Link to this section"
                    >
                      #
                    </a>
                  </h2>
                )
              },
              h3: ({ children }) => {
                const id = generateId(children)
                return (
                  <h3 id={id} className={cn(
                    "flex items-center gap-2 scroll-mt-20 group",
                    "text-xl font-semibold mb-3 mt-6",
                    "text-slate-700 dark:text-slate-300"
                  )}>
                    {children}
                    <a 
                      href={`#${id}`} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label="Link to this section"
                    >
                      #
                    </a>
                  </h3>
                )
              },
              
              // Enhanced table with better responsive design
              table: ({ children }) => (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 my-6 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-slate-200 dark:divide-slate-700">
                      {children}
                    </table>
                  </div>
                </div>
              ),
              
              // Enhanced images with zoom and caption support
              img: ({ src, alt, title }) => (
                <div className="my-8 text-center">
                  <img 
                    src={src} 
                    alt={alt}
                    title={title}
                    className={cn(
                      "max-w-full h-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-700",
                      "hover:shadow-xl transition-shadow duration-300 cursor-zoom-in"
                    )}
                    onClick={() => {
                      // Simple image zoom functionality
                      if (src) {
                        window.open(src, '_blank')
                      }
                    }}
                  />
                  {(alt || title) && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">
                      {title || alt}
                    </p>
                  )}
                </div>
              ),
              a: ({ href, children }) => {
                // Handle internal markdown file links
                const isInternalMarkdownLink = href && (
                  href.endsWith('.md') || 
                  href.includes('.md#') ||
                  (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#'))
                )
                
                // Handle hash-only links (internal page anchors)
                const isHashLink = href && href.startsWith('#')
                
                if (isHashLink) {
                  return (
                    <a 
                      href={href}
                      className="text-brand-600 dark:text-brand-400 hover:underline"
                      onClick={(e) => {
                        // Let the browser handle the scrolling for hash links
                        const element = document.getElementById(href.substring(1))
                        if (element) {
                          e.preventDefault()
                          element.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      {children}
                    </a>
                  )
                }
                
                if (isInternalMarkdownLink && onFileSelect) {
                  // Extract the file path and hash fragment
                  const [cleanPath, hash] = href.split('#')
                  
                  return (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        onFileSelect(cleanPath)
                        
                        // If there's a hash, scroll to it after a short delay to allow content to load
                        if (hash) {
                          setTimeout(() => {
                            const element = document.getElementById(hash)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' })
                            }
                          }, 100)
                        }
                      }}
                      className="text-brand-600 dark:text-brand-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
                    >
                      {children}
                    </button>
                  )
                }
                
                // Regular external links
                return (
                  <a 
                    href={href} 
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {children}
                  </a>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* Pull Request Modal */}
      <CreatePullRequestModal
        isOpen={showPRModal}
        onClose={() => setShowPRModal(false)}
        filePath={filePath}
        content={editContent}
        originalContent={originalContent}
      />
    </div>
  )
}
