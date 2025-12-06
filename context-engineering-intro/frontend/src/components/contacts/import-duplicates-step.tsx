"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import DuplicateBulkActions from "./duplicate-bulk-actions"

interface FieldDiff {
  field: string
  existing_value: string | null
  incoming_value: string | null
  is_equal: boolean
}

interface DuplicateRow {
  row_id: number
  existing_contact?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    company: string | null
  }
  existing_contact_id?: string
  incoming_data: Record<string, any>
  field_diffs?: FieldDiff[]
  candidates?: Array<Record<string, any>>
  duplicate_type?: "internal" | "external"  // internal = CSV duplicate, external = Database match
}

interface ValidationSummary {
  total: number
  invalid_rows: any[]
  duplicate_rows: DuplicateRow[]
  conflict_rows: DuplicateRow[]
  new_rows?: DuplicateRow[]
  errors?: any[]
  summary?: {
    new: number
    duplicates: number
    conflicts: number
    invalid: number
  }
}

interface DecisionState {
  action?: "skip" | "update" | "keep_first"
  existing_contact_id?: string
  field_overrides: Record<string, "existing" | "incoming">
}

interface ImportDuplicatesStepProps {
  fileId: string
  mapping: Record<string, string>
  onBack: () => void
  onComplete: (summary: ValidationSummary, decisions: any[]) => void
  initialSummary?: ValidationSummary | null
  onSummaryUpdate?: (summary: ValidationSummary) => void
}

const KEY_FIELDS = ["first_name", "last_name", "email", "phone", "company"]

// Utility function to format identifier display values
// CRITICAL FIX: Prevents displaying empty strings in UI
const formatIdentifier = (value: string | null | undefined, type: 'email' | 'phone'): string => {
  if (!value || !value.trim()) {
    return type === 'email' ? 'no email' : 'no phone'
  }
  return value.trim()
}

export default function ImportDuplicatesStep({
  fileId,
  mapping,
  onBack,
  onComplete,
  initialSummary,
  onSummaryUpdate,
}: ImportDuplicatesStepProps) {
  const normalizeSummary = (data: ValidationSummary | null | undefined) => {
    if (!data) return null
    return {
      ...data,
      errors: data.errors || data.invalid_rows || [],
    }
  }

  const [validationData, setValidationData] = useState<ValidationSummary | null>(normalizeSummary(initialSummary))
  const [decisions, setDecisions] = useState<Record<number, DecisionState>>({})
  const [isLoading, setIsLoading] = useState(!initialSummary)
  const [error, setError] = useState<string | null>(null)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  const initializeDecisions = (summary: ValidationSummary) => {
    const nextDecisions: Record<number, DecisionState> = {}
    summary.duplicate_rows?.forEach((row) => {
      nextDecisions[row.row_id] = {
        existing_contact_id: row.existing_contact_id || row.existing_contact?.id,
        field_overrides: {},
      }
    })
    summary.conflict_rows?.forEach((row) => {
      const defaultContact = row.candidates?.[0]
      nextDecisions[row.row_id] = {
        existing_contact_id: defaultContact?.id,
        field_overrides: {},
      }
    })
    setDecisions(nextDecisions)
  }

  useEffect(() => {
    if (initialSummary) {
      const normalized = normalizeSummary(initialSummary)
      if (normalized) {
        setValidationData(normalized)
        initializeDecisions(normalized)
      }
      return
    }

    const validate = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = sessionStorage.getItem("access_token")
        const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')
        const response = await fetch(`${API_URL}/v1/contacts/import/validate-duplicates`, {
          method: "POST",
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_id: fileId,
            field_mapping: mapping,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorDetail = errorData.detail || errorData.message || "Failed to validate import"

          // Provide more specific error messages for common issues
          if (errorDetail.includes("phone")) {
            throw new Error(`Phone validation issue: ${errorDetail}. Phone numbers should be 7-15 digits.`)
          } else if (errorDetail.includes("email")) {
            throw new Error(`Email validation issue: ${errorDetail}`)
          } else if (errorDetail.includes("Invalid") || errorDetail.includes("invalid")) {
            throw new Error(`Validation failed: ${errorDetail}. Please check your data format.`)
          } else {
            throw new Error(errorDetail)
          }
        }

        const data = await response.json()
        const normalized = normalizeSummary(data)
        setValidationData(normalized)
        if (normalized) {
          onSummaryUpdate?.(normalized)
          initializeDecisions(normalized)
        }
      } catch (err: any) {
        console.error("Validation error:", err)
        setError(err.message || "Failed to validate import")
      } finally {
        setIsLoading(false)
      }
    }

    validate()
  }, [fileId, mapping, initialSummary])

  useEffect(() => {
    if (!initialSummary) return
    const normalized = normalizeSummary(initialSummary)
    if (normalized) {
      setValidationData(normalized)
      initializeDecisions(normalized)
    }
  }, [initialSummary])

  const updateDecision = (rowId: number, field: string, choice: "existing" | "incoming") => {
    setDecisions((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        field_overrides: {
          ...(prev[rowId]?.field_overrides || {}),
          [field]: choice,
        },
      },
    }))
  }

  const updateSelectedContact = (rowId: number, contactId: string) => {
    setDecisions((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        existing_contact_id: contactId,
      },
    }))
  }

  const handleRowAction = (rowId: number, action: "skip" | "update" | "keep_first") => {
    setDecisions((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        action: action,
      },
    }))
  }

  const handleBulkAction = async (action: "skip_all" | "update_all" | "keep_first") => {
    if (!validationData) return

    setIsBulkActionLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("access_token")
      const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')

      const duplicateRows = [
        ...(validationData.duplicate_rows || []),
        ...(validationData.conflict_rows || []),
      ]

      const response = await fetch(`${API_URL}/v1/contacts/import/bulk-duplicate-action`, {
        method: "POST",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          duplicate_rows: duplicateRows.map(row => ({
            row_id: row.row_id,
            existing_contact_id: row.existing_contact_id || row.existing_contact?.id,
            field_diffs: row.field_diffs || [],
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to apply bulk action")
      }

      const data = await response.json()

      // Validate response structure
      if (!data || !Array.isArray(data.decisions)) {
        throw new Error("Invalid response from server")
      }

      // Merge new decisions with existing ones (don't overwrite)
      const newDecisions: Record<number, DecisionState> = { ...decisions }

      data.decisions.forEach((decision: any) => {
        newDecisions[decision.row_id] = {
          action: decision.action,
          existing_contact_id: decision.existing_contact_id,
          field_overrides: decision.field_overrides || {},
        }
      })

      setDecisions(newDecisions)

      // Show success message
      const actionLabel = action === "skip_all" ? "skipped" : action === "update_all" ? "set to update" : "set to keep first"
      toast({
        title: "Success",
        description: `Successfully ${actionLabel} ${data.decisions.length} duplicates`,
      })

    } catch (err: any) {
      console.error("Bulk action error:", err)
      const errorMessage = err.message || "Failed to apply bulk action"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const requiredRows = useMemo(() => {
    if (!validationData) return []
    return [
      ...(validationData.duplicate_rows || []),
      ...(validationData.conflict_rows || []),
    ]
  }, [validationData])

  const allResolved = useMemo(() => {
    if (!validationData) return false
    if (requiredRows.length === 0) return true
    return requiredRows.every((row) => {
      const decision = decisions[row.row_id]
      if (!decision) return false
      // Accept any valid action: skip, update, or keep_first
      if (decision.action === "skip" || decision.action === "update" || decision.action === "keep_first") {
        return true
      }
      // For other cases, require existing_contact_id
      return !!decision.existing_contact_id
    })
  }, [requiredRows, decisions, validationData])

  const handleNext = () => {
    if (!validationData) return
    // CRITICAL FIX: DO NOT filter out skipped rows - backend requires ALL decisions
    // The backend validates that decisions exist for ALL duplicate/conflict rows
    const resolvedDecisions = requiredRows
      .map((row) => ({
        row_id: row.row_id,
        action: decisions[row.row_id]?.action || "update",
        existing_contact_id: decisions[row.row_id]?.existing_contact_id,
        field_overrides: decisions[row.row_id]?.field_overrides || {},
        default_choice: "existing",
      }))
    onComplete(validationData, resolvedDecisions)
  }

  const renderFieldDiffRow = (
    rowId: number,
    field: string,
    existingValue: any,
    incomingValue: any,
  ) => {
    const choice = decisions[rowId]?.field_overrides?.[field] || "existing"
    return (
      <div
        key={`${rowId}-${field}`}
        className="grid grid-cols-4 gap-4 py-2 border-t text-sm"
        data-testid={`duplicate-field-${rowId}-${field}`}
      >
        <div className="font-medium">{field.replace(/_/g, " ")}</div>
        <div className="text-muted-foreground">{String(existingValue ?? "—")}</div>
        <div className="text-muted-foreground">{String(incomingValue ?? "—")}</div>
        <div className="flex gap-2">
          <Button
            variant={choice === "existing" ? "default" : "outline"}
            size="sm"
            data-testid={`field-choice-${rowId}-${field}-existing`}
            onClick={() => updateDecision(rowId, field, "existing")}
          >
            Keep existing
          </Button>
          <Button
            variant={choice === "incoming" ? "default" : "outline"}
            size="sm"
            data-testid={`field-choice-${rowId}-${field}-incoming`}
            onClick={() => updateDecision(rowId, field, "incoming")}
          >
            Use incoming
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p>Validating your import and checking for duplicates...</p>
      </div>
    )
  }

  if (error || !validationData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p>{error || "Failed to load duplicates"}</p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const summaryCounts = validationData.summary || {
    new: validationData.new_rows?.length || 0,
    duplicates: validationData.duplicate_rows?.length || 0,
    conflicts: validationData.conflict_rows?.length || 0,
    invalid: validationData.invalid_rows?.length || 0,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Step 4: Review Duplicates</h2>
        <p className="text-muted-foreground">
          Resolve duplicates by choosing which values to keep for each contact.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="New" value={summaryCounts.new} tone="primary" />
        <SummaryCard label="Duplicates" value={summaryCounts.duplicates} tone="amber" />
        <SummaryCard label="Conflicts" value={summaryCounts.conflicts} tone="amber" />
        <SummaryCard label="Invalid" value={summaryCounts.invalid} tone="red" />
      </div>

      <DuplicateBulkActions
        duplicateCount={requiredRows.length}
        onBulkAction={handleBulkAction}
        isLoading={isBulkActionLoading}
      />

      {requiredRows.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">No duplicates detected</p>
          <p className="text-muted-foreground">All rows are new. You can proceed to preview.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {validationData.duplicate_rows?.map((row) => (
            <DuplicateCard
              key={row.row_id}
              row={row}
              decisions={decisions}
              updateDecision={updateDecision}
              handleRowAction={handleRowAction}
            />
          ))}

          {validationData.conflict_rows?.map((row) => (
            <ConflictCard
              key={row.row_id}
              row={row}
              decisions={decisions}
              updateDecision={updateDecision}
              updateSelectedContact={updateSelectedContact}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          data-testid="duplicates-next"
          onClick={handleNext}
          disabled={!allResolved}
          className="flex-1"
        >
          Next: Preview &amp; Confirm
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

function DuplicateCard({
  row,
  decisions,
  updateDecision,
  handleRowAction,
}: {
  row: DuplicateRow
  decisions: Record<number, DecisionState>
  updateDecision: (rowId: number, field: string, choice: "existing" | "incoming") => void
  handleRowAction: (rowId: number, action: "skip" | "update" | "keep_first") => void
}) {
  const currentAction = decisions[row.row_id]?.action

  return (
    <div
      className="border rounded-lg p-4 shadow-sm"
      data-testid={`duplicate-card-${row.row_id}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Duplicate Row #{row.row_id}</h3>
          <Badge variant={row.duplicate_type === "internal" ? "secondary" : "default"}>
            {row.duplicate_type === "internal" ? "CSV Duplicate" : "Database Match"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Matched contact: {row.existing_contact?.first_name || "Existing"} {row.existing_contact?.last_name || ""} ({formatIdentifier(row.existing_contact?.email, 'email')})
        </p>
      </div>

      {/* Per-row action buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={currentAction === "skip" ? "default" : "outline"}
          size="sm"
          onClick={() => handleRowAction(row.row_id, "skip")}
          data-testid={`row-action-skip-${row.row_id}`}
        >
          Skip Row
        </Button>
        <Button
          variant={currentAction === "update" ? "default" : "outline"}
          size="sm"
          onClick={() => handleRowAction(row.row_id, "update")}
          data-testid={`row-action-update-${row.row_id}`}
        >
          Update Existing
        </Button>
        <Button
          variant={currentAction === "keep_first" ? "default" : "outline"}
          size="sm"
          onClick={() => handleRowAction(row.row_id, "keep_first")}
          data-testid={`row-action-keep-first-${row.row_id}`}
        >
          Keep First
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-2 text-sm">
        <div>Field</div>
        <div>Existing</div>
        <div>Incoming</div>
        <div>Decision</div>
      </div>
      {(row.field_diffs || []).map((diff) =>
        renderFieldDiffRow(
          row.row_id,
          diff.field,
          diff.existing_value,
          diff.incoming_value,
          decisions,
          updateDecision,
        ),
      )}
    </div>
  )
}

function ConflictCard({
  row,
  decisions,
  updateDecision,
  updateSelectedContact,
}: {
  row: DuplicateRow
  decisions: Record<number, DecisionState>
  updateDecision: (rowId: number, field: string, choice: "existing" | "incoming") => void
  updateSelectedContact: (rowId: number, contactId: string) => void
}) {
  const selectedId = decisions[row.row_id]?.existing_contact_id
  const selectedContact =
    row.candidates?.find((candidate) => candidate.id === selectedId) || row.candidates?.[0]

  return (
    <div
      className="border rounded-lg p-4 shadow-sm"
      data-testid={`conflict-card-${row.row_id}`}
    >
      <div className="flex flex-col gap-2 mb-3">
        <h3 className="text-lg font-semibold">Conflict Row #{row.row_id}</h3>
        <p className="text-sm text-muted-foreground">
          Multiple contacts matched. Choose which contact to update, then select field-by-field
          values.
        </p>
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedId}
          onChange={(event) => updateSelectedContact(row.row_id, event.target.value)}
        >
          {row.candidates?.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.first_name} {candidate.last_name} ({formatIdentifier(candidate.email, 'email')})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-2 text-sm">
        <div>Field</div>
        <div>Existing</div>
        <div>Incoming</div>
        <div>Decision</div>
      </div>
      {KEY_FIELDS.map((field) =>
        renderFieldDiffRow(
          row.row_id,
          field,
          selectedContact?.[field] ?? null,
          row.incoming_data?.[field] ?? null,
          decisions,
          updateDecision,
        ),
      )}
    </div>
  )
}

function renderFieldDiffRow(
  rowId: number,
  field: string,
  existingValue: any,
  incomingValue: any,
  decisions: Record<number, DecisionState>,
  updateDecision: (rowId: number, field: string, choice: "existing" | "incoming") => void,
) {
  const choice = decisions[rowId]?.field_overrides?.[field] || "existing"
  return (
    <div
      className="grid grid-cols-4 gap-4 py-2 border-t text-sm"
      data-testid={`duplicate-field-${rowId}-${field}`}
      key={`${rowId}-${field}`}
    >
      <div className="font-medium">{field.replace(/_/g, " ")}</div>
      <div className="text-muted-foreground">{String(existingValue ?? "—")}</div>
      <div className="text-muted-foreground">{String(incomingValue ?? "—")}</div>
      <div className="flex gap-2">
        <Button
          variant={choice === "existing" ? "default" : "outline"}
          size="sm"
          data-testid={`field-choice-${rowId}-${field}-existing`}
          onClick={() => updateDecision(rowId, field, "existing")}
        >
          Keep existing
        </Button>
        <Button
          variant={choice === "incoming" ? "default" : "outline"}
          size="sm"
          data-testid={`field-choice-${rowId}-${field}-incoming`}
          onClick={() => updateDecision(rowId, field, "incoming")}
        >
          Use incoming
        </Button>
      </div>
    </div>
  )
}
