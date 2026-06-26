'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  orgId: string
  onUpload: (file: File) => Promise<void>
  isLoading?: boolean
}

export function FileUpload({ orgId, onUpload, isLoading = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file)
    await onUpload(file)
    setUploadedFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <p className="mb-2 text-sm font-medium text-gray-700">
          {uploadedFile ? uploadedFile.name : 'Drag and drop your file here'}
        </p>
        <p className="mb-4 text-xs text-gray-500">
          or click to browse
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isLoading}
        >
          {isLoading ? 'Uploading...' : 'Select File'}
        </Button>
        <p className="mt-4 text-xs text-gray-500">
          Max 10MB. Supported: PDF, Images, Documents, Spreadsheets
        </p>
      </div>
    </div>
  )
}
