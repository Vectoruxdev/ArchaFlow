"use client"

import { useState, useRef, useEffect } from "react"
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
  type PercentCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

function cropToPixelCrop(crop: Crop, imgWidth: number, imgHeight: number): PixelCrop {
  if (crop.unit === "px") {
    return crop as PixelCrop
  }
  const p = crop as PercentCrop
  return {
    unit: "px",
    x: (p.x / 100) * imgWidth,
    y: (p.y / 100) * imgHeight,
    width: (p.width / 100) * imgWidth,
    height: (p.height / 100) * imgHeight,
  }
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  displayWidth: number,
  displayHeight: number
): Promise<Blob> {
  const scaleX = image.naturalWidth / displayWidth
  const scaleY = image.naturalHeight / displayHeight

  const canvas = document.createElement("canvas")
  const outputWidth = Math.floor(crop.width * scaleX)
  const outputHeight = Math.floor(crop.height * scaleY)
  if (outputWidth <= 0 || outputHeight <= 0) {
    throw new Error("Invalid crop dimensions")
  }
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No 2d context")

  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.95
    )
  })
}

export interface AvatarCropModalProps {
  file: File | null
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export function AvatarCropModal({ file, onConfirm, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [imgSrc, setImgSrc] = useState<string>("")
  const [isConfirming, setIsConfirming] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!file) {
      setImgSrc("")
      setCrop(undefined)
      return
    }
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "")
      setCrop(undefined)
    })
    reader.readAsDataURL(file)
  }, [file])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const measure = () => {
      const rect = img.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w > 0 && h > 0) {
        setCrop(centerAspectCrop(w, h, 1))
      } else {
        requestAnimationFrame(measure)
      }
    }
    requestAnimationFrame(measure)
  }

  const handleConfirm = async () => {
    const img = imgRef.current
    if (!img || !crop || !file) return
    const rect = img.getBoundingClientRect()
    const dw = Math.round(rect.width)
    const dh = Math.round(rect.height)
    if (dw <= 0 || dh <= 0) return
    const pixelCrop = cropToPixelCrop(crop, dw, dh)
    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) return
    setIsConfirming(true)
    try {
      const blob = await getCroppedImg(img, pixelCrop, dw, dh)
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      })
      onConfirm(croppedFile)
    } catch (err) {
      console.error("Crop failed:", err)
    } finally {
      setIsConfirming(false)
    }
  }

  const open = !!file

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop your photo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {imgSrc && (
            <div className="max-h-[60vh] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={1}
                circularCrop
                className="max-h-[50vh]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop"
                  style={{ display: "block", maxHeight: "50vh", width: "auto" }}
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!crop?.width || !crop?.height || isConfirming}
          >
            {isConfirming ? "Processing..." : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
