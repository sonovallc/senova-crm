"use client"

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface BulkUploadProps {
  onUploadSuccess: (data: {
    file_id: string
    filename: string
    columns: string[]
    preview: any[]
  }) => void
}

export default function BulkUpload({ onUploadSuccess }: BulkUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    // Check file type - UPDATED 2025-11-08
    const allowedExtensions = ['.csv', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return 'Invalid file type. Only CSV and Excel files (.csv, .xlsx, .xls) are supported.'
    }

    // VALIDATION DISABLED - Backend will validate
    // Let backend handle size validation to avoid browser cache issues
    // Backend supports up to 100MB files

    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast({
        title: 'Invalid File',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get auth token
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // FIXED: Removed fake progress bar that stopped at 90%
      // Now showing indeterminate progress state for better UX
      // Backend optimization ensures this completes quickly (<5 seconds)

      // Upload file with extended timeout for large files (10 minutes)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minute timeout

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/v1/contacts/import/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: `File "${file.name}" uploaded successfully`,
      })

      // Call success callback
      onUploadSuccess({
        file_id: data.file_id,
        filename: file.name,
        columns: data.columns,
        preview: data.preview || [],
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.name === 'AbortError'
        ? 'Upload timed out. Please try again or contact support for very large files.'
        : error.message || 'An error occurred while uploading the file'

      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
            <p className="text-lg font-medium">Processing file...</p>
            <p className="text-sm text-muted-foreground">
              Uploading and analyzing your CSV file
            </p>
            <p className="text-xs text-muted-foreground">
              This usually takes just a few seconds
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {isDragging ? (
                <CheckCircle2 className="w-16 h-16 text-primary" />
              ) : (
                <FileSpreadsheet className="w-16 h-16 text-muted-foreground" />
              )}
            </div>

            <h3 className="text-xl font-semibold mb-2">
              {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
            </h3>

            <p className="text-muted-foreground mb-6">
              or click the button below to browse
            </p>

            <div className="mb-6">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </span>
                </Button>
              </label>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Supported formats: CSV, Excel (.csv, .xlsx, .xls)
              </p>
              <p>Maximum file size: 100MB</p>
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-muted/50 rounded-lg p-6">
        <h4 className="font-semibold mb-3">Before you upload:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Ensure your file has column headers in the first row</li>
          <li>• Each contact must have at least an email OR phone number</li>
          <li>• Remove any merged cells or formulas from Excel files</li>
          <li>• Check that email addresses are properly formatted</li>
          <li>• Phone numbers should be in a consistent format (e.g., 555-123-4567)</li>
        </ul>
      </div>
    </div>
  )
}
 
