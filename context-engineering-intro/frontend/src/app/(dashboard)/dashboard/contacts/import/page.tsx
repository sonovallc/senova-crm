"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, HelpCircle } from "lucide-react"
import BulkUpload from "@/components/contacts/bulk-upload"
import ColumnMapper from "@/components/contacts/column-mapper"
import ImportPreview from "@/components/contacts/import-preview"
import ImportTutorial from "@/components/contacts/import-tutorial"
import { ImportTagStep } from "@/components/contacts/import-tag-step"
import ImportDuplicatesStep from "@/components/contacts/import-duplicates-step"
import { authService } from "@/lib/auth"

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState(1) // 1-6: Upload, Map, Tags, Duplicates, Preview, Complete
  const [fileId, setFileId] = useState("")
  const [fileName, setFileName] = useState("")
  const [columns, setColumns] = useState<string[]>([])
  const [preview, setPreview] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [showTutorial, setShowTutorial] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [validationSummary, setValidationSummary] = useState<any | null>(null)
  const [mergeDecisions, setMergeDecisions] = useState<any[]>([])
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchRole = async () => {
      try {
        const profile = await authService.getMe()
        if (isMounted) {
          setCurrentRole(profile.role)
        }
      } catch (error) {
        if (isMounted) {
          setCurrentRole(null)
        }
      } finally {
        if (isMounted) {
          setIsRoleLoading(false)
        }
      }
    }
    fetchRole()
    return () => {
      isMounted = false
    }
  }, [])

  const handleDownloadSample = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')
      const response = await fetch(`${API_URL}/api/v1/contacts/import/sample`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sample-contacts.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading sample:', error)
    }
  }

  const handleUploadSuccess = (data: { file_id: string; filename: string; columns: string[]; preview: any[] }) => {
    setFileId(data.file_id)
    setFileName(data.filename)
    setColumns(data.columns)
    setPreview(data.preview)
    setValidationSummary(null)
    setMergeDecisions([])
    setCurrentStep(2)
  }

  const handleMappingComplete = (fieldMapping: Record<string, string>) => {
    setMapping(fieldMapping)
    setValidationSummary(null)
    setMergeDecisions([])
    setCurrentStep(3)
  }

  const handleImportComplete = (results: any) => {
    setImportResults(results)
    setCurrentStep(6)
  }

  const handleStartOver = () => {
    setCurrentStep(1)
    setFileId("")
    setFileName("")
    setColumns([])
    setPreview([])
    setMapping({})
    setSelectedTagIds([])
    setImportResults(null)
    setValidationSummary(null)
    setMergeDecisions([])
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Contacts</h1>
        <p className="text-muted-foreground">Upload a CSV or Excel file to bulk import contacts</p>
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-3 mb-8">
        <Button variant="outline" onClick={handleDownloadSample}>
          <Download className="w-4 h-4 mr-2" />
          Download Sample CSV
        </Button>
        <Button variant="outline" onClick={() => setShowTutorial(true)}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Need Help?
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: "Upload File" },
            { num: 2, label: "Map Columns" },
            { num: 3, label: "Select Tags" },
            { num: 4, label: "Resolve Duplicates" },
            { num: 5, label: "Preview & Import" },
            { num: 6, label: "Complete" }
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex flex-col items-center ${currentStep >= step.num ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 ${
                  currentStep >= step.num ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                }`}>
                  {step.num}
                </div>
                <p className="text-sm mt-2 font-medium">{step.label}</p>
              </div>
              {index < 5 && (
                <div className={`h-0.5 w-20 mx-2 ${currentStep > step.num ? 'bg-primary' : 'bg-muted-foreground'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center mt-4 text-sm text-muted-foreground">
          Step {currentStep} of 6
        </p>
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 1 && (
          <BulkUpload onUploadSuccess={handleUploadSuccess} />
        )}

        {currentStep === 2 && (
          <ColumnMapper
            columns={columns}
            preview={preview}
            onComplete={handleMappingComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <ImportTagStep
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
            canManageTags={currentRole === "owner" || currentRole === "admin"}
            roleLoading={isRoleLoading}
          />
        )}

        {currentStep === 4 && (
          <ImportDuplicatesStep
            fileId={fileId}
            mapping={mapping}
            onBack={() => setCurrentStep(3)}
            initialSummary={validationSummary}
            onSummaryUpdate={(summary) => setValidationSummary(summary)}
            onComplete={(summary, decisions) => {
              setValidationSummary(summary)
              setMergeDecisions(decisions)
              setCurrentStep(5)
            }}
          />
        )}

        {currentStep === 5 && (
          <ImportPreview
            fileId={fileId}
            mapping={mapping}
            selectedTagIds={selectedTagIds}
            validationData={validationSummary}
            mergeDecisions={mergeDecisions}
            onComplete={handleImportComplete}
            onBack={() => setCurrentStep(4)}
            onEditTags={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 6 && importResults && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-green-900 mb-2">Import Complete!</h2>
              <p className="text-green-700 mb-4">Your contacts have been successfully imported.</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{importResults.imported}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{importResults.updated || 0}</p>
                  <p className="text-sm text-muted-foreground">Updated</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{importResults.skipped || 0}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => window.location.href = '/dashboard/contacts'} className="flex-1">
                  View Imported Contacts
                </Button>
                <Button variant="outline" onClick={handleStartOver} className="flex-1">
                  Import More Contacts
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <ImportTutorial onClose={() => setShowTutorial(false)} />
      )}
    </div>
  )
}
