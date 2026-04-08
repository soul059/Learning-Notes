import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function TableOfContents({ content, isOpen, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  // Parse headings from markdown content
  const headings = useMemo(() => {
    const items: TocItem[] = []
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].replace(/[*_`\[\]]/g, '') // Clean markdown formatting
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      items.push({ id, text, level })
    }

    return items
  }, [content])

  // Track active heading on scroll
  useEffect(() => {
    if (!isOpen) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
      }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings, isOpen])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  if (!isOpen || headings.length === 0) return null

  return (
    <nav className={cn("h-full p-4", className)} aria-label="Table of contents">
      <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">
        On this page
      </h3>
      <ul className="space-y-1">
        {headings.map((heading, index) => (
          <li
            key={`${heading.id}-${index}`}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors truncate",
                "hover:bg-accent",
                activeId === heading.id
                  ? "text-primary bg-primary/10 font-medium"
                  : "text-muted-foreground"
              )}
              title={heading.text}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
