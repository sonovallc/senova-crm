"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

interface DuplicateBulkActionsProps {
  duplicateCount: number
  onBulkAction: (action: "skip_all" | "update_all" | "keep_first") => Promise<void>
  isLoading?: boolean
}

export default function DuplicateBulkActions({
  duplicateCount,
  onBulkAction,
  isLoading = false,
}: DuplicateBulkActionsProps) {
  if (duplicateCount === 0) {
    return null
  }

  return (
    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Bulk Actions Available
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            You have {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} to resolve.
            Use these quick actions to resolve all at once:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                onBulkAction("skip_all")
              }}
              disabled={isLoading}
              className="border-red-300 bg-white hover:bg-red-50 text-red-700"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Skip All Duplicates
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                onBulkAction("update_all")
              }}
              disabled={isLoading}
              className="border-blue-300 bg-white hover:bg-blue-50 text-blue-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Update All (Use New Data)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                onBulkAction("keep_first")
              }}
              disabled={isLoading}
              className="border-green-300 bg-white hover:bg-green-50 text-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Keep First (Preserve Existing)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
