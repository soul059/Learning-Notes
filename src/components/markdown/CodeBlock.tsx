import { useState, useCallback, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  WrapText,
  Type,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarkdownSettings } from '@/types'

// Light theme for syntax highlighting
export const lightCodeTheme: { [key: string]: React.CSSProperties } = {
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

// Dark theme for syntax highlighting
export const darkCodeTheme: { [key: string]: React.CSSProperties } = {
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

interface CodeBlockProps {
  code: string
  language: string
  settings: MarkdownSettings
  theme: string
}

const COLLAPSE_THRESHOLD = 15 // Lines before showing collapse option

export function CodeBlock({ code, language, settings, theme }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [wrapLines, setWrapLines] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(settings.showLineNumbers)
  const [expanded, setExpanded] = useState(false)

  const lineCount = useMemo(() => code.split('\n').length, [code])
  const canCollapse = lineCount > COLLAPSE_THRESHOLD

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [code])

  const displayedCode = useMemo(() => {
    if (collapsed && canCollapse) {
      const lines = code.split('\n')
      return lines.slice(0, 5).join('\n') + '\n// ... ' + (lines.length - 5) + ' more lines'
    }
    return code
  }, [code, collapsed, canCollapse])

  const codeTheme = settings.codeTheme === 'light' ? lightCodeTheme :
                    settings.codeTheme === 'dark' ? darkCodeTheme :
                    (theme === 'dark' ? darkCodeTheme : lightCodeTheme)

  return (
    <div className={cn(
      "code-block group relative rounded-lg overflow-hidden",
      "border border-border",
      "bg-muted",
      expanded && "fixed inset-4 z-50 shadow-2xl"
    )}>
      {/* Header */}
      <div className="code-header flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
        <div className="flex items-center gap-3">
          {/* macOS-style window controls */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:brightness-110 transition-all cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:brightness-110 transition-all cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-green-500 hover:brightness-110 transition-all cursor-pointer" />
          </div>
          
          {/* Language badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-border">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {language}
            </span>
          </div>

          {/* Line count */}
          <span className="text-xs text-muted-foreground">
            {lineCount} lines
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Collapse toggle */}
          {canCollapse && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                "hover:bg-accent",
                "text-muted-foreground"
              )}
              title={collapsed ? "Expand code" : "Collapse code"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}

          {/* Wrap toggle */}
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              "hover:bg-accent",
              wrapLines ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}
            title="Toggle word wrap"
          >
            <WrapText className="h-4 w-4" />
          </button>

          {/* Line numbers toggle */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              "hover:bg-accent",
              showLineNumbers ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}
            title="Toggle line numbers"
          >
            <Type className="h-4 w-4" />
          </button>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              "hover:bg-accent",
              "text-muted-foreground"
            )}
            title={expanded ? "Exit fullscreen" : "Fullscreen"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
              "hover:bg-accent",
              copied ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30" : "text-muted-foreground"
            )}
            title="Copy code"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className={cn(
        "relative overflow-auto",
        expanded && "h-[calc(100%-48px)]",
        collapsed && "max-h-40"
      )}>
        {settings.enableSyntaxHighlighting ? (
          <SyntaxHighlighter
            style={codeTheme}
            language={language}
            PreTag="div"
            showLineNumbers={showLineNumbers}
            wrapLines={wrapLines}
            wrapLongLines={wrapLines}
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
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Consolas, monospace",
              background: 'transparent',
              padding: '1.5rem',
              borderRadius: '0'
            }}
          >
            {displayedCode}
          </SyntaxHighlighter>
        ) : (
          <pre className={cn(
            "p-6 text-sm font-mono bg-transparent overflow-x-auto",
            wrapLines ? "whitespace-pre-wrap" : "whitespace-pre"
          )}>
            <code>{displayedCode}</code>
          </pre>
        )}

        {/* Collapse overlay */}
        {collapsed && canCollapse && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted to-transparent flex items-end justify-center pb-2">
            <button
              onClick={() => setCollapsed(false)}
              className="px-4 py-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
            >
              Show all {lineCount} lines
            </button>
          </div>
        )}
      </div>

      {/* Expanded backdrop */}
      {expanded && (
        <div 
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  )
}

// Inline code component
export function InlineCode({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        "inline-code px-1.5 py-0.5 rounded-md text-sm font-medium",
        "bg-muted text-foreground",
        "border border-border",
        "hover:bg-accent transition-colors duration-150"
      )}
      {...props}
    >
      {children}
    </code>
  )
}
