import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
  images?: string[] // For gallery navigation
  currentIndex?: number
  onNavigate?: (index: number) => void
}

export function ImageLightbox({
  src,
  alt,
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  onNavigate
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset on image change
  useEffect(() => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }, [src])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (images.length > 1 && onNavigate) {
            onNavigate((currentIndex - 1 + images.length) % images.length)
          }
          break
        case 'ArrowRight':
          if (images.length > 1 && onNavigate) {
            onNavigate((currentIndex + 1) % images.length)
          }
          break
        case '+':
        case '=':
          setScale(s => Math.min(s + 0.25, 4))
          break
        case '-':
          setScale(s => Math.max(s - 0.25, 0.5))
          break
        case 'r':
          setRotation(r => (r + 90) % 360)
          break
        case '0':
          setScale(1)
          setRotation(0)
          setPosition({ x: 0, y: 0 })
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, images.length, currentIndex, onNavigate])

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => Math.min(Math.max(s + delta, 0.5), 4))
  }, [])

  // Download image
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download image:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setScale(s => Math.min(s + 0.25, 4))}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Rotate (R)"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && onNavigate && (
        <>
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Previous (←)"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Next (→)"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 flex items-center justify-center overflow-hidden",
          isDragging ? "cursor-grabbing" : scale > 1 ? "cursor-grab" : "cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          draggable={false}
        />
      </div>

      {/* Image info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
        {alt && <span className="mr-4">{alt}</span>}
        <span className="text-white/60">{Math.round(scale * 100)}%</span>
        {images.length > 1 && (
          <span className="ml-4 text-white/60">
            {currentIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 right-4 text-white/40 text-xs">
        <span>Scroll to zoom • Drag to pan • R to rotate • 0 to reset</span>
      </div>
    </div>
  )
}
