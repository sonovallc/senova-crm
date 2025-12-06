"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, AlertCircle, CheckCircle2, XCircle, Loader2, Tag as TagIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TagBadge } from "./tag-badge"
import { useTags } from "@/lib/queries/tags"
import { cn } from "@/lib/utils"

interface ImportPreviewProps {
  fileId: string
  mapping: Record<string, string>
  selectedTagIds: string[]
  mergeDecisions: any[]
  validationData: any
  onComplete: (results: any) => void
  onBack: () => void
  onEditTags: () => void
}

interface ValidationError {
  row_num: number
  field: string
  message: string
  row_data: Record<string, any>
}

export default function ImportPreview({
  fileId,
  mapping,
  selectedTagIds,
  mergeDecisions,
  validationData,
  onComplete,
  onBack,
  onEditTags,
}: ImportPreviewProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [showAllErrors, setShowAllErrors] = useState(false)
  const [conflictDetails, setConflictDetails] = useState<any | null>(null)
  const { toast } = useToast()
  const { data: tagsData, isLoading: tagsLoading } = useTags()

  const handleImport = async () => {
    if (!validationData) return
    setIsImporting(true)
    setConflictDetails(null)

    try {
      const token = sessionStorage.getItem("access_token")
      const validCount =
        (validationData.summary?.new || 0) +
        (validationData.summary?.duplicates || 0) +
        (validationData.summary?.conflicts || 0)

      toast({
        title: "Import Started",
        description: `Importing ${validCount} contacts. Large imports may take 10-15 minutes. Please do not close this page.`,
      })

      const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')

      // CRITICAL FIX: Add tag_ids to the request payload
      // The backend endpoint expects tag_ids in the request
      const response = await fetch(`${API_URL}/v1/contacts/import/execute`, {
        method: "POST",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: fileId,
          field_mapping: mapping,
          tag_ids: selectedTagIds,
          merge_decisions: mergeDecisions,
        }),
      })

      if (!response.ok) {
        let detailPayload: any = null
        try {
          detailPayload = await response.json()
        } catch (err) {
          detailPayload = null
        }
        const parsedDetail = detailPayload?.detail ?? detailPayload
        if (response.status === 409 && parsedDetail) {
          setConflictDetails(parsedDetail)
          const conflictSummary = (parsedDetail.conflicts || [])
            .slice(0, 3)
            .map(
              (conflict: any) =>
                `${conflict.field}: ${conflict.value} (owned by ${conflict.conflicting_contact_name})`,
            )
            .join("; ")
          toast({
            title: parsedDetail.message || "Identifier conflicts detected",
            description: conflictSummary || "Resolve the conflicts in the duplicates step and retry.",
            variant: "destructive",
          })
          return
        }
        throw new Error(parsedDetail?.message || parsedDetail?.detail || "Import failed")
      }

      const results = await response.json()
      setConflictDetails(null)

      toast({
        title: "Import Complete!",
        description: `Created ${results.imported} contacts, updated ${results.updated}.`,
      })

      onComplete(results)
    } catch (error: any) {
      console.error("Import error:", error)
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadErrors = () => {
    const errors = validationData?.errors || validationData?.invalid_rows || []
    if (errors.length === 0) return

    const firstError = errors[0]
    const rowDataKeys = firstError?.row_data ? Object.keys(firstError.row_data) : []

    const headers = ["Row", "Field", "Error", ...rowDataKeys]
    const csvLines = [headers.join(",")]

    errors.forEach((error: ValidationError) => {
      const rowData = error.row_data || {}
      const rowValues = rowDataKeys.map((key) => {
        const value = rowData[key] || ""
        const escaped = String(value).replace(/"/g, '""')
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
      })

      const errorMessage = String(error.message).replace(/"/g, '""')
      csvLines.push([
        error.row_num,
        `"${error.field}"`,
        `"${errorMessage}"`,
        ...rowValues,
      ].join(","))
    })

    const csvContent = csvLines.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "import-errors.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (!validationData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p>No validation summary found. Please go back and review duplicates.</p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const summary = validationData.summary || {
    new: validationData.new_rows?.length || 0,
    duplicates: validationData.duplicate_rows?.length || 0,
    conflicts: validationData.conflict_rows?.length || 0,
    invalid: validationData.invalid_rows?.length || 0,
  }

  const invalidRows =
    validationData.invalid_rows ||
    (Array.isArray(validationData.errors) ? validationData.errors : []) ||
    []
  const invalidCount = invalidRows.length || summary.invalid || 0

  // Calculate valid count based on what will actually be imported
  // - New rows are always imported
  // - Only duplicates with action="update" are imported (skip actions are excluded)
  const newRowsCount = summary.new || 0
  const duplicatesToImport = mergeDecisions?.filter((d: any) => d.action === "update").length || 0
  const validCount = newRowsCount + duplicatesToImport

  // Total rows for display purposes (includes all rows from file)
  const totalRows =
    validationData.total ??
    summary.new + summary.duplicates + summary.conflicts + summary.invalid
  const hasErrors = invalidCount > 0
  const canImport = validCount > 0
  const importDisabled = !canImport || isImporting
  const importButtonLabel = isImporting
    ? "Importing..."
    : canImport
      ? `Import ${validCount} Contacts`
      : "No valid rows to import"
  const errorsToShow = showAllErrors ? invalidRows : invalidRows.slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto">
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold">Importing Contacts...</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Processing {validCount} contacts. This may take several minutes for large files.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Step 5: Preview &amp; Confirm</h2>
        <p className="text-muted-foreground">
          Confirm the validation summary and start the import when ready.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Rows" value={totalRows} tone="primary" />
        <SummaryCard label="Valid Rows" value={validCount} tone="primary" />
        <SummaryCard label="Invalid Rows" value={invalidCount} tone="red" />
      </div>

      {conflictDetails && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4 mb-6 text-sm text-red-800">
          <p className="font-semibold mb-2">{conflictDetails.message || "Identifier conflicts detected."}</p>
          {(conflictDetails.conflicts || []).slice(0, 5).map((conflict: any, index: number) => (
            <div key={`${conflict.conflicting_contact_id}-${index}`} className="flex flex-col">
              <span>
                Row {conflict.row_id || "—"} • {conflict.field}: <strong>{conflict.value}</strong>
              </span>
              <span className="text-xs text-muted-foreground">
                Existing contact: {conflict.conflicting_contact_name} ({conflict.conflicting_contact_id})
              </span>
            </div>
          ))}
          {conflictDetails.conflicts?.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing first 5 conflicts. Please adjust duplicate decisions and retry.
            </p>
          )}
        </div>
      )}

      {hasErrors ? (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {invalidCount} row{invalidCount === 1 ? "" : "s"} need attention
              </p>
              <p className="text-sm text-amber-800">
                Fix invalid rows or continue to import {validCount} valid contact{validCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 mb-6 bg-red-50/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-700 font-semibold">
                <XCircle className="w-5 h-5" />
                <span>{invalidRows.length} row(s) have issues</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAllErrors(!showAllErrors)}>
                {showAllErrors ? "Show less" : "Show all errors"}
              </Button>
            </div>
            <div className="space-y-3 text-sm text-red-700 max-h-64 overflow-auto">
              {errorsToShow.map((error: ValidationError, index: number) => (
                <div key={index} className="border rounded-md p-3 bg-white">
                  <p className="font-semibold">Row {error.row_num}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
                    {error.field}
                  </p>
                  <p className="mt-1">{error.message}</p>
                </div>
              ))}
            </div>
            {invalidRows.length > errorsToShow.length && !showAllErrors && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing first {errorsToShow.length} errors.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">All rows are valid!</p>
            <p className="text-sm text-green-700">
              Ready to import {validCount} contact{validCount === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TagIcon className="w-5 h-5" />
              Tags to Apply
            </h3>
            <Button variant="link" size="sm" onClick={onEditTags}>
              Edit tags
            </Button>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            {tagsLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tags...
              </p>
            ) : selectedTagIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags selected. Contacts will be imported without additional tags.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedTagIds.map((tagId) => {
                  const tag = tagsData?.find((t) => t.id === tagId)
                  if (!tag) return null
                  return <TagBadge key={tagId} name={tag.name} color={tag.color} size="sm" />
                })}
              </div>
            )}
          </div>
        </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="font-semibold text-blue-900 mb-2">Important:</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All imported contacts will be automatically assigned to you</li>
          <li>• Duplicate email/phone rows are merged using the decisions you selected</li>
          <li>• You can download an error report for invalid rows</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {hasErrors && (
          <Button variant="outline" onClick={handleDownloadErrors}>
            Download Error Report
          </Button>
        )}

        <Button onClick={handleImport} disabled={importDisabled} className="flex-1">
          {importButtonLabel}
        </Button>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "primary" | "amber" | "red"
}) {
  const toneClasses =
    tone === "primary"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200"

  return (
    <div className={cn("rounded-lg p-4 border text-center", toneClasses)}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  )
}
