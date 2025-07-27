import { useEffect } from 'react'
import { SearchBar } from './SearchBar'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onFileSelect: (path: string) => void
}

export function SearchModal({ isOpen, onClose, onFileSelect }: SearchModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      document.body.classList.add('search-modal-open')
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.classList.remove('search-modal-open')
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleFileSelect = (path: string) => {
    onFileSelect(path)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] px-4 search-modal-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[299]"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-3xl bg-background border border-border rounded-lg shadow-2xl z-[300]",
        "animate-in fade-in-0 zoom-in-95 duration-200 search-modal",
        "isolation-auto"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Search Notes</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <SearchBar onFileSelect={handleFileSelect} onClose={onClose} className="search-modal-bar" />
        </div>
        
        <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border">
          <div className="flex items-center gap-4 pt-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border rounded">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
