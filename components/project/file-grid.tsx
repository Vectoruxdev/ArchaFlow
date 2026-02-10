"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Image, File, Download, Eye, Upload } from "lucide-react"

interface FileItem {
  id: string
  name: string
  type: "pdf" | "image" | "document"
  size: string
  uploadedBy: string
  uploadedAt: string
  version?: string
}

interface FileGridProps {
  files: FileItem[]
  onUpload?: (files: FileList) => void
}

export function FileGrid({ files, onUpload }: FileGridProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (onUpload && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />
      case "image":
        return <Image className="w-8 h-8 text-blue-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
            : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm font-medium mb-1">Drop files here or click to upload</p>
        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
        <Button variant="outline" size="sm" className="mt-4">
          Browse Files
        </Button>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.size}</p>
                </div>
              </div>
              {file.version && (
                <Badge variant="outline" className="text-xs">
                  v{file.version}
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              <p>Uploaded by {file.uploadedBy}</p>
              <p>{file.uploadedAt}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
