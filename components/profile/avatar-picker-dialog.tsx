"use client"

import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

const PRESET_AVATAR_URLS = Array.from(
  { length: 35 },
  (_, i) => `https://api.dicebear.com/7.x/avataaars/png?seed=${i + 1}`
)

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024

export interface AvatarPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPreset: (url: string) => void
  onFileSelected: (file: File) => void
  onValidationError?: (message: string) => void
  isUploading: boolean
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
  onSelectPreset,
  onFileSelected,
  onValidationError,
  isUploading,
}: AvatarPickerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      onValidationError?.("Please upload a JPEG, PNG, GIF, or WebP image")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      onValidationError?.("Image must be under 2MB")
      return
    }
    onFileSelected(file)
    e.target.value = ""
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile photo</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="presets">Preset avatars</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4 min-h-[420px]">
            <div className="flex flex-col items-center justify-center gap-4 py-4 min-h-[420px]">
              <p className="text-sm text-[--af-text-secondary] text-center">
                Upload your own photo. You can crop it before saving.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choose file
                  </span>
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="presets" className="mt-4 min-h-[420px]">
            <div className="flex flex-col gap-4 min-h-[420px]">
              <p className="text-sm text-[--af-text-secondary]">
                Choose a preset avatar below.
              </p>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_AVATAR_URLS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      onSelectPreset(url)
                      onOpenChange(false)
                    }}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-[--af-border-default] hover:border-foreground dark:hover:border-white transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[--af-border-focus] focus:ring-offset-2"
                  >
                    <img
                      src={url}
                      alt="Preset avatar"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
