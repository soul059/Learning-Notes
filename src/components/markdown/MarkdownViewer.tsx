import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import rehypeRaw from 'rehype-raw'
import { 
  Edit3, 
  GitPullRequest, 
  BookOpen, 
  Clock, 
  FileText,
  Maximize2,
  Minimize2,
  Search,
  List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CreatePullRequestModal } from '@/components/github/CreatePullRequestModal'
import { TableOfContents } from './TableOfContents'
import { ImageLightbox } from './ImageLightbox'
import { SearchHighlight } from './SearchHighlight'
import { CodeBlock, InlineCode } from './CodeBlock'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeProvider'
import { useGitHub as useGitHubContext } from '@/contexts/GitHubProvider'
import type { MarkdownSettings } from '@/types'

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
  
  // New features state
  const [showToc, setShowToc] = useState(settings.enableTableOfContents)
  const [showSearch, setShowSearch] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // GitHub integration
  const canCreatePR = useGitHub && filePath
  const { hasWriteAccess } = useGitHubContext()
  const { theme } = useTheme()

  // Sync TOC visibility with settings
  useEffect(() => {
    setShowToc(settings.enableTableOfContents)
  }, [settings.enableTableOfContents])

  // Calculate reading time and word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).length
    const readingTimeMinutes = Math.ceil(words / 200)
    setWordCount(words)
    setReadingTime(readingTimeMinutes)
  }, [content])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      // Escape to close search or lightbox
      if (e.key === 'Escape') {
        setShowSearch(false)
        setLightboxImage(null)
        if (isFullscreen) setIsFullscreen(false)
      }
      // Ctrl/Cmd + Shift + T for TOC
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setShowToc(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

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
    <>
      {/* Fullscreen overlay - covers entire screen including sidebar */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950"
          style={{ isolation: 'isolate' }}
        >
          <div className="h-full flex flex-col">
            {/* Fullscreen header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Fullscreen Preview</span>
                </div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-2"
              >
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </Button>
            </div>
            
            {/* Fullscreen content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className={cn(
                "p-8 prose-custom transition-all duration-200 mx-auto max-w-5xl",
                settings.fontSize === 'small' && "text-sm",
                settings.fontSize === 'medium' && "text-base",
                settings.fontSize === 'large' && "text-lg",
                settings.lineHeight === 'compact' && "leading-tight",
                settings.lineHeight === 'comfortable' && "leading-normal",
                settings.lineHeight === 'relaxed' && "leading-relaxed"
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkEmoji]}
                  rehypePlugins={[...(settings.enableRawHtml ? [rehypeRaw] : [])]}
                  components={{
                    pre({ children }) { return <>{children}</> },
                    code({ className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      const language = match ? match[1] : ''
                      const codeString = Array.isArray(children) 
                        ? children.join('') 
                        : String(children || '').replace(/\n$/, '')
                      if (match && language) {
                        return <CodeBlock code={codeString} language={language} settings={settings} theme={theme} />
                      }
                      return <InlineCode {...props}>{children}</InlineCode>
                    },
                    h1: ({ children }) => {
                      const id = generateId(children)
                      return <h1 id={id} className="text-3xl font-bold mb-6 mt-8 pb-2 border-b border-slate-200 dark:border-slate-700">{children}</h1>
                    },
                    h2: ({ children }) => {
                      const id = generateId(children)
                      return <h2 id={id} className="text-2xl font-semibold mb-4 mt-8">{children}</h2>
                    },
                    h3: ({ children }) => {
                      const id = generateId(children)
                      return <h3 id={id} className="text-xl font-semibold mb-3 mt-6">{children}</h3>
                    },
                    img: ({ src, alt, title }) => (
                      <div className="my-8 text-center">
                        <img src={src} alt={alt} title={title} className="max-w-full h-auto rounded-lg shadow-lg" />
                        {(alt || title) && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">{title || alt}</p>}
                      </div>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 my-6">
                        <div className="overflow-x-auto">
                          <table className="w-full divide-y divide-slate-200 dark:divide-slate-700">{children}</table>
                        </div>
                      </div>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} className="text-brand-600 dark:text-brand-400 hover:underline">{children}</a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Normal view */}
      <div className={cn(
        "h-full flex flex-col transition-all duration-300",
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
            {/* TOC toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToc(!showToc)}
              className={cn("h-8 w-8 p-0", showToc && "bg-accent")}
              title="Toggle Table of Contents (Ctrl+Shift+T)"
            >
              <List className="h-4 w-4" />
            </Button>
            
            {/* Search toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className={cn("h-8 w-8 p-0", showSearch && "bg-accent")}
              title="Search in document (Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
              title="Toggle fullscreen"
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
      
      {/* Search highlight bar */}
      <SearchHighlight
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        contentRef={contentRef}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Table of Contents sidebar - hidden in fullscreen */}
        {showToc && !isFullscreen && (
          <div className="w-64 border-r border-slate-200 dark:border-slate-700 overflow-y-auto hidden lg:block">
            <TableOfContents 
              content={content} 
              isOpen={showToc}
              onToggle={() => setShowToc(!showToc)}
            />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={contentRef}>
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
              // Max width - use full width in fullscreen
              isFullscreen && "max-w-5xl",
              !isFullscreen && settings.maxWidth === 'narrow' && "max-w-2xl",
              !isFullscreen && settings.maxWidth === 'content' && "max-w-4xl",
              !isFullscreen && settings.maxWidth === 'wide' && "max-w-6xl",
              !isFullscreen && settings.maxWidth === 'full' && "max-w-none"
            )}
          >
            <ReactMarkdown
              remarkPlugins={[
                remarkGfm,
                remarkEmoji
              ]}
              rehypePlugins={[
                ...(settings.enableRawHtml ? [rehypeRaw] : [])
              ]}
              components={{
                pre({ children }) {
                  return <>{children}</>
                },
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''
                  
                  const codeString = Array.isArray(children) 
                    ? children.join('') 
                    : String(children || '').replace(/\n$/, '')

                  // Code block (has language class)
                  if (match && language) {
                    return (
                      <CodeBlock
                        code={codeString}
                        language={language}
                        settings={settings}
                        theme={theme}
                      />
                    )
                  }

                  // Inline code
                  return <InlineCode {...props}>{children}</InlineCode>
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
              
              // Enhanced images with lightbox support
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
                      if (src) setLightboxImage(src)
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
      </div>
      
      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxImage || ''}
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
      
      {/* Pull Request Modal */}
      <CreatePullRequestModal
        isOpen={showPRModal}
        onClose={() => setShowPRModal(false)}
        filePath={filePath}
        content={editContent}
        originalContent={originalContent}
      />
    </div>
    </>
  )
}
