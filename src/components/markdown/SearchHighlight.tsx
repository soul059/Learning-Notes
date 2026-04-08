import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchHighlightProps {
  isOpen: boolean
  onClose: () => void
  contentRef: React.RefObject<HTMLDivElement | null>
}

interface MatchInfo {
  node: Text
  startOffset: number
  endOffset: number
  text: string
}

export function SearchHighlight({ isOpen, onClose, contentRef }: SearchHighlightProps) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<MatchInfo[]>([])
  const [currentMatch, setCurrentMatch] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const highlightOverlayRef = useRef<HTMLDivElement | null>(null)
  const matchesRef = useRef<MatchInfo[]>([])
  
  // Keep matchesRef in sync
  useEffect(() => {
    matchesRef.current = matches
  }, [matches])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Clear state on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setMatches([])
      setCurrentMatch(0)
      clearHighlightOverlay()
    }
  }, [isOpen])

  const clearHighlightOverlay = useCallback(() => {
    if (highlightOverlayRef.current) {
      highlightOverlayRef.current.remove()
      highlightOverlayRef.current = null
    }
  }, [])

  const findMatches = useCallback((searchQuery: string): MatchInfo[] => {
    if (!contentRef.current || !searchQuery.trim()) {
      return []
    }

    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    )

    const foundMatches: MatchInfo[] = []
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let node: Text | null

    while ((node = walker.nextNode() as Text | null)) {
      const parent = node.parentElement
      // Skip script tags only, allow code blocks and pre elements
      if (parent && !parent.closest('script') && !parent.closest('style')) {
        const text = node.textContent || ''
        let match: RegExpExecArray | null
        
        while ((match = regex.exec(text)) !== null) {
          foundMatches.push({
            node,
            startOffset: match.index,
            endOffset: match.index + match[0].length,
            text: match[0]
          })
        }
      }
    }

    return foundMatches
  }, [contentRef])

  const createHighlightOverlay = useCallback((matchList: MatchInfo[], activeIndex: number) => {
    clearHighlightOverlay()
    
    if (!contentRef.current || matchList.length === 0) return

    // Create overlay container
    const overlay = document.createElement('div')
    overlay.className = 'search-highlight-overlay pointer-events-none fixed inset-0 z-40'
    overlay.style.position = 'absolute'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.overflow = 'hidden'
    overlay.style.pointerEvents = 'none'
    
    const containerRect = contentRef.current.getBoundingClientRect()
    const scrollTop = contentRef.current.scrollTop
    const scrollLeft = contentRef.current.scrollLeft

    matchList.forEach((match, index) => {
      try {
        const range = document.createRange()
        range.setStart(match.node, match.startOffset)
        range.setEnd(match.node, match.endOffset)
        
        const rects = range.getClientRects()
        
        for (const rect of rects) {
          const highlight = document.createElement('div')
          highlight.style.position = 'absolute'
          highlight.style.left = `${rect.left - containerRect.left + scrollLeft}px`
          highlight.style.top = `${rect.top - containerRect.top + scrollTop}px`
          highlight.style.width = `${rect.width}px`
          highlight.style.height = `${rect.height}px`
          highlight.style.backgroundColor = index === activeIndex ? 'rgba(251, 191, 36, 0.6)' : 'rgba(253, 224, 71, 0.4)'
          highlight.style.borderRadius = '2px'
          highlight.style.pointerEvents = 'none'
          if (index === activeIndex) {
            highlight.style.outline = '2px solid rgb(59, 130, 246)'
            highlight.style.outlineOffset = '1px'
          }
          overlay.appendChild(highlight)
        }
      } catch {
        // Range might be invalid if DOM changed
      }
    })

    contentRef.current.style.position = 'relative'
    contentRef.current.appendChild(overlay)
    highlightOverlayRef.current = overlay
  }, [contentRef, clearHighlightOverlay])

  const scrollToMatch = useCallback((index: number, matchList?: MatchInfo[]) => {
    const list = matchList || matchesRef.current
    if (list.length === 0 || !contentRef.current) return

    const match = list[index]
    if (match) {
      try {
        const range = document.createRange()
        range.setStart(match.node, match.startOffset)
        range.setEnd(match.node, match.endOffset)
        
        const rect = range.getBoundingClientRect()
        const containerRect = contentRef.current.getBoundingClientRect()
        
        // Check if element is out of view
        if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
          const scrollTarget = contentRef.current.scrollTop + (rect.top - containerRect.top) - (containerRect.height / 2)
          contentRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' })
        }
        
        // Update highlights after scroll
        setTimeout(() => {
          createHighlightOverlay(list, index)
        }, 100)
      } catch {
        // Range might be invalid
      }
    }
  }, [contentRef, createHighlightOverlay])

  const goToNext = useCallback(() => {
    const list = matchesRef.current
    if (list.length === 0) return
    setCurrentMatch(prev => {
      const next = (prev + 1) % list.length
      scrollToMatch(next, list)
      return next
    })
  }, [scrollToMatch])

  const goToPrevious = useCallback(() => {
    const list = matchesRef.current
    if (list.length === 0) return
    setCurrentMatch(prev => {
      const next = (prev - 1 + list.length) % list.length
      scrollToMatch(next, list)
      return next
    })
  }, [scrollToMatch])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          goToPrevious()
        } else {
          goToNext()
        }
      } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
        e.preventDefault()
        if (e.shiftKey) {
          goToPrevious()
        } else {
          goToNext()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goToNext, goToPrevious])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newMatches = findMatches(query)
      setMatches(newMatches)
      setCurrentMatch(0)
      
      if (newMatches.length > 0) {
        createHighlightOverlay(newMatches, 0)
        scrollToMatch(0, newMatches)
      } else {
        clearHighlightOverlay()
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, findMatches, createHighlightOverlay, scrollToMatch, clearHighlightOverlay])

  // Update overlay on scroll
  useEffect(() => {
    if (!isOpen || !contentRef.current || matches.length === 0) return

    const container = contentRef.current
    const handleScroll = () => {
      createHighlightOverlay(matches, currentMatch)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isOpen, contentRef, matches, currentMatch, createHighlightOverlay])

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg shadow-lg border",
        "bg-card border-border"
      )}>
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in page..."
          className={cn(
            "w-48 px-2 py-1 text-sm bg-transparent border-none outline-none",
            "text-foreground placeholder:text-muted-foreground"
          )}
        />
        
        {query && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {matches.length > 0 ? `${currentMatch + 1} / ${matches.length}` : 'No results'}
          </span>
        )}

        <div className="flex items-center gap-1 border-l border-border pl-2">
          <button
            onClick={goToPrevious}
            disabled={matches.length === 0}
            className="p-1 rounded hover:bg-accent disabled:opacity-50"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={matches.length === 0}
            className="p-1 rounded hover:bg-accent disabled:opacity-50"
            title="Next match (Enter)"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
