"use client"

import { Download, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GalleryImage {
  id: string
  name: string
  url: string
}

interface ProjectImageGalleryProps {
  images: GalleryImage[]
  selectedIndex: number
  onImageSelect: (index: number) => void
  onFullscreen: () => void
}

export function ProjectImageGallery({
  images,
  selectedIndex,
  onImageSelect,
  onFullscreen,
}: ProjectImageGalleryProps) {
  const selectedImage = images[selectedIndex]

  if (images.length === 0) return null

  return (
    <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-4 sticky top-6">
      <h3 className="font-semibold mb-3 text-sm">Image Gallery</h3>

      {/* Selected image preview */}
      {selectedImage && (
        <div className="relative group mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.url}
            alt={selectedImage.name}
            className="w-full aspect-[4/3] object-cover rounded-lg cursor-pointer"
            onClick={onFullscreen}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-[--af-text-muted] mt-1.5 truncate">{selectedImage.name}</p>
        </div>
      )}

      {/* Action buttons */}
      {selectedImage && (
        <div className="flex gap-2 mb-3">
          <a
            href={selectedImage.url}
            download={selectedImage.name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={onFullscreen}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => onImageSelect(index)}
              className={`w-full flex items-center gap-2 p-1.5 rounded-md transition-colors hover:bg-[--af-bg-surface-alt] ${
                index === selectedIndex
                  ? "ring-2 ring-[--af-brand] bg-[--af-bg-surface-alt]"
                  : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.name}
                className="w-[80px] h-[60px] object-cover rounded flex-shrink-0"
              />
              <span className="text-xs text-[--af-text-secondary] truncate text-left">
                {image.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
