"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LightboxImage {
  url: string
  name: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageLightbox({ images, initialIndex, open, onOpenChange }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex)
  }, [open, initialIndex])

  const goNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }, [images.length])

  const goPrev = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }, [images.length])

  const close = useCallback(() => {
    onOpenChange(false)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [onOpenChange])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, goNext, goPrev, close])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Fullscreen not supported
    }
  }

  // Sync fullscreen state on external exit (e.g. Esc key exits fullscreen natively)
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  const currentImage = images[currentIndex]

  if (!open || !currentImage) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
            onClick={close}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Main image area */}
          <div className="relative flex items-center justify-center flex-1 w-full px-16">
            {/* Prev arrow */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 text-white hover:bg-white/10 w-10 h-10"
                onClick={goPrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}

            {/* Image with crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.url}
                  alt={currentImage.name}
                  className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Next arrow */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 text-white hover:bg-white/10 w-10 h-10"
                onClick={goNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="w-full px-6 py-4 flex items-center justify-between bg-black/50">
            <div className="text-white text-sm truncate max-w-[50%]">
              {currentImage.name}
            </div>
            <div className="flex items-center gap-3">
              {images.length > 1 && (
                <span className="text-white/60 text-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              )}
              <a href={currentImage.url} download={currentImage.name} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Download className="w-5 h-5" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
