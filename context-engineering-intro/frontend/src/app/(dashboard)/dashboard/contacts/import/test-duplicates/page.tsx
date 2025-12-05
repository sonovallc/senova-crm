"use client"

/**
 * MILESTONE 2 TEST PAGE - Internal + External Duplicate Detection
 *
 * This page tests and demonstrates both stages of duplicate detection:
 * - Stage 1: Internal duplicates (within CSV)
 * - Stage 2: External duplicates (CSV vs existing database contacts)
 *
 * Features:
 * - Upload CSV file
 * - Detect both internal and external duplicates
 * - Display duplicate groups visually
 * - User actions: Skip, Keep, or Merge
 * - Side-by-side comparison for external duplicates
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, AlertCircle, CheckCircle2, Users, Database, FileText } from "lucide-react"
import { api } from "@/lib/api"

interface InternalDuplicateGroup {
  group_id: string
  field: string
  value: string
  row_ids: number[]
  row_count: number
  rows: Array<{
    row_id: number
    data: Record<string, any>
  }>
}

interface ExternalDuplicateGroup {
  duplicate_group_id: string
  duplicate_type: string
  duplicate_field: string
  duplicate_value: string
  csv_rows: Array<{
    csv_row_index: number
    data: Record<string, any>
  }>
  existing_contacts: Array<{
    contact_id: string
    data: Record<string, any>
    last_updated: string | null
  }>
}

interface DuplicateResult {
  validation_id: string
  file_id: string
  total_groups: number
  total_duplicates: number
  duplicates: {
    internal: InternalDuplicateGroup[]
    external: ExternalDuplicateGroup[]
  }
}

export default function TestDuplicatesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileId, setFileId] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [detectError, setDetectError] = useState<string | null>(null)
  const [duplicateResult, setDuplicateResult] = useState<DuplicateResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [decisions, setDecisions] = useState<Map<string, string>>(new Map())
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadError(null)
      setDuplicateResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.post("/v1/contacts/import/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      setFileId(response.data.file_id)

      // Auto-generate field mapping (CSV column name -> lowercase)
      const autoMapping: Record<string, string> = {}
      response.data.columns.forEach((col: string) => {
        autoMapping[col] = col.toLowerCase()
      })
      setMapping(autoMapping)

      // Automatically detect duplicates after upload
      await detectDuplicates(response.data.file_id, autoMapping)

    } catch (error: any) {
      console.error("Upload error:", error)
      setUploadError(error.message || "Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const detectDuplicates = async (uploadedFileId: string, fieldMapping: Record<string, string>) => {
    setIsDetecting(true)
    setDetectError(null)

    try {
      const response = await api.post("/v1/contacts/import/validate-duplicates", {
        file_id: uploadedFileId,
        field_mapping: fieldMapping
      })

      setDuplicateResult(response.data)

    } catch (error: any) {
      console.error("Detection error:", error)
      setDetectError(error.message || "Failed to detect duplicates")
    } finally {
      setIsDetecting(false)
    }
  }

  const handleAction = (groupId: string, action: 'skip' | 'keep' | 'merge') => {
    setDecisions(prev => {
      const newDecisions = new Map(prev)
      newDecisions.set(groupId, action)
      return newDecisions
    })
    console.log(`Action set for group ${groupId}: ${action}`)
  }

  const handleBulkAction = (action: 'skip' | 'keep' | 'merge', type: 'internal' | 'external') => {
    if (!duplicateResult) return

    const groups = type === 'internal'
      ? duplicateResult.duplicates.internal
      : duplicateResult.duplicates.external

    setDecisions(prev => {
      const newDecisions = new Map(prev)
      groups.forEach(group => {
        const groupId = type === 'internal'
          ? (group as InternalDuplicateGroup).group_id
          : (group as ExternalDuplicateGroup).duplicate_group_id
        newDecisions.set(groupId, action)
      })
      return newDecisions
    })

    console.log(`Bulk action ${action} applied to ${groups.length} ${type} groups`)
  }

  const handleImportWithDecisions = async () => {
    if (!duplicateResult) return

    try {
      setImporting(true)

      // Build decisions list from all selected actions
      const decisionsList = Array.from(decisions.entries()).map(([groupId, action]) => {
        // Find the group in internal or external duplicates to get actual row indices
        let rowIndices: number[] = []

        const internalGroup = duplicateResult.duplicates.internal.find(g => g.group_id === groupId)
        if (internalGroup) {
          rowIndices = internalGroup.row_ids
        } else {
          const externalGroup = duplicateResult.duplicates.external.find(g => g.duplicate_group_id === groupId)
          if (externalGroup) {
            rowIndices = externalGroup.csv_rows.map(row => row.csv_row_index)
          }
        }

        return {
          duplicate_group_id: groupId,
          csv_row_indices: rowIndices, // Actual row indices from duplicate detection
          action: action,
          existing_contact_id: null // TODO: populate for merge action
        }
      })

      console.log('Submitting decisions:', decisionsList)

      // Save decisions first
      await api.post('/v1/contacts/import/duplicate-decisions', {
        validation_id: duplicateResult.validation_id,
        decisions: decisionsList
      })

      // Execute import with decisions
      const response = await api.post('/v1/contacts/import/import-with-decisions', {
        validation_id: duplicateResult.validation_id,
        file_id: duplicateResult.file_id,
        field_mapping: mapping
      })

      setImportResults(response.data)
      console.log('✅ Import completed:', response.data)
    } catch (error: any) {
      console.error('❌ Import failed:', error)
      alert(`Import failed: ${error.message || 'Unknown error'}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Duplicate Detection Test (Milestone 2)</h1>
        <p className="text-muted-foreground">
          Stage 1: Internal duplicates (within CSV) + Stage 2: External duplicates (CSV vs Database)
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Step 1: Upload CSV File
          </CardTitle>
          <CardDescription>
            Select a CSV file to analyze for internal duplicates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1"
              disabled={isUploading || isDetecting}
            />
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading || isDetecting}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Detect
                </>
              )}
            </Button>
          </div>

          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadError}</span>
            </div>
          )}

          {detectError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{detectError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {duplicateResult && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{duplicateResult.total_groups}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Internal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{duplicateResult.duplicates.internal.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  External
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{duplicateResult.duplicates.external.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Validation ID
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-mono truncate">{duplicateResult.validation_id}</div>
              </CardContent>
            </Card>
          </div>

          {/* Internal Duplicates */}
          {duplicateResult.duplicates.internal.length > 0 && (
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                  Internal Duplicates (Within CSV)
                </h2>

                {/* Bulk Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('skip', 'internal')}
                  >
                    Skip All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('keep', 'internal')}
                  >
                    Keep All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('merge', 'internal')}
                  >
                    Merge All
                  </Button>
                </div>
              </div>

              {duplicateResult.duplicates.internal.map((group, groupIndex) => (
                <Card key={group.group_id} className="border-orange-200" data-testid="internal-duplicate-group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Internal Group {groupIndex + 1}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-orange-50">
                              <span className="font-semibold">{group.field}</span>
                            </Badge>
                            <Badge variant="secondary">
                              {group.value}
                            </Badge>
                            <Badge variant="destructive">
                              {group.row_count} rows
                            </Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        variant={decisions.get(group.group_id) === 'skip' ? 'default' : 'outline'}
                        onClick={() => handleAction(group.group_id, 'skip')}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        variant={decisions.get(group.group_id) === 'keep' ? 'default' : 'outline'}
                        onClick={() => handleAction(group.group_id, 'keep')}
                      >
                        Keep
                      </Button>
                      <Button
                        size="sm"
                        variant={decisions.get(group.group_id) === 'merge' ? 'default' : 'outline'}
                        onClick={() => handleAction(group.group_id, 'merge')}
                      >
                        Merge
                      </Button>
                    </div>

                    {/* Rows */}
                    <div className="space-y-3">
                      {group.rows.map((row) => (
                        <div key={row.row_id} className="p-3 bg-muted rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>Row {row.row_id}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {Object.entries(row.data).slice(0, 6).map(([key, value]) => (
                              <div key={key} className="truncate">
                                <span className="text-muted-foreground">{key}:</span>{" "}
                                <span className="font-medium">{value || "(empty)"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* External Duplicates */}
          {duplicateResult.duplicates.external.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-600" />
                External Duplicates (CSV vs Database)
              </h2>

              {duplicateResult.duplicates.external.map((group, groupIndex) => (
                <Card key={group.duplicate_group_id} className="border-blue-200" data-testid="external-duplicate-group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          External Group {groupIndex + 1}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-blue-50">
                              <span className="font-semibold">{group.duplicate_field}</span>
                            </Badge>
                            <Badge variant="secondary">
                              {group.duplicate_value}
                            </Badge>
                            <Badge className="bg-blue-600">
                              external
                            </Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        variant={decisions.get(group.duplicate_group_id) === 'skip' ? 'default' : 'outline'}
                        onClick={() => handleAction(group.duplicate_group_id, 'skip')}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        variant={decisions.get(group.duplicate_group_id) === 'keep' ? 'default' : 'outline'}
                        onClick={() => handleAction(group.duplicate_group_id, 'keep')}
                      >
                        Keep
                      </Button>
                      <Button
                        size="sm"
                        variant={decisions.get(group.duplicate_group_id) === 'merge' ? 'default' : 'outline'}
                        onClick={() => handleAction(group.duplicate_group_id, 'merge')}
                      >
                        Merge
                      </Button>
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CSV Data */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV Data (New)
                        </div>
                        {group.csv_rows.map((csvRow, idx) => (
                          <div key={idx} className="space-y-2">
                            <Badge variant="outline">Row {csvRow.csv_row_index}</Badge>
                            <div className="grid gap-1 text-sm mt-2">
                              {Object.entries(csvRow.data).slice(0, 8).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-muted-foreground text-xs uppercase">{key}:</span>{" "}
                                  <span className="font-medium">{value || "(empty)"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Existing Contact Data */}
                      <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Existing Contact
                        </div>
                        {group.existing_contacts.map((contact, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex gap-2">
                              <Badge variant="outline">ID: {contact.contact_id.slice(0, 8)}...</Badge>
                              {contact.last_updated && (
                                <Badge variant="secondary" className="text-xs">
                                  Updated: {new Date(contact.last_updated).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                            <div className="grid gap-1 text-sm mt-2">
                              {Object.entries(contact.data).slice(0, 8).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-muted-foreground text-xs uppercase">{key}:</span>{" "}
                                  <span className="font-medium">{value || "(empty)"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Import Execution Button */}
          {duplicateResult.total_groups > 0 && decisions.size > 0 && !importResults && (
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Ready to Import</h3>
                  <p className="text-sm text-muted-foreground">
                    {decisions.size} group{decisions.size !== 1 ? 's have' : ' has'} actions selected
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleImportWithDecisions}
                  disabled={importing || decisions.size === 0}
                  data-testid="import-execute-button"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import with Decisions
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Import Results Display */}
          {importResults && (
            <Card className="mt-6 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-700">{importResults.new_contacts || 0}</div>
                    <div className="text-sm text-muted-foreground">New Contacts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-700">{importResults.merged || 0}</div>
                    <div className="text-sm text-muted-foreground">Merged</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-700">{importResults.skipped || 0}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-700">{importResults.errors || 0}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Duplicates Found */}
          {duplicateResult.total_groups === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>No duplicates found! All rows are unique.</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
