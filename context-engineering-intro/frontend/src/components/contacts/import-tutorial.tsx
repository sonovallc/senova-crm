"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react"

interface ImportTutorialProps {
  onClose: () => void
}

export default function ImportTutorial({ onClose }: ImportTutorialProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts Tutorial</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preparing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preparing">Preparing Your File</TabsTrigger>
            <TabsTrigger value="requirements">Column Requirements</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          {/* Tab 1: Preparing Your File */}
          <TabsContent value="preparing" className="space-y-4 mt-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">CSV File Format</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Column headers must be in the first row</li>
                  <li>• Data should start from row 2</li>
                  <li>• Use comma (,) as the separator (default)</li>
                  <li>• Semicolon (;) and tab separators are also supported</li>
                  <li>• Save with UTF-8 encoding to preserve special characters</li>
                </ul>

                <div className="mt-4 p-3 bg-muted rounded font-mono text-xs overflow-x-auto">
                  <div className="text-green-600"># Example CSV file:</div>
                  <div>first_name,last_name,email,mobile_phone</div>
                  <div>John,Smith,john@example.com,555-123-4567</div>
                  <div>Jane,Doe,jane@example.com,555-234-5678</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t">
              <FileSpreadsheet className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Excel File Format (.xlsx, .xls)</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Column headers must be in the first row</li>
                  <li>• Data should start from row 2</li>
                  <li>• Remove any merged cells before uploading</li>
                  <li>• Remove formulas - convert to values only</li>
                  <li>• Use the first sheet (or specify sheet name)</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-orange-900">Common Mistakes to Avoid</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>❌ Don't include summary rows or totals</li>
                  <li>❌ Don't merge cells in your spreadsheet</li>
                  <li>❌ Don't include formulas (convert to values)</li>
                  <li>❌ Don't use multiple sheets (use first sheet only)</li>
                  <li>❌ Don't include blank rows between data</li>
                  <li>❌ Don't use special characters in column names</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Column Requirements */}
          <TabsContent value="requirements" className="space-y-4 mt-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-green-900">Required Fields</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Each contact must have <strong>at least one</strong> of the following:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="font-mono bg-muted px-2 py-1 rounded">email</span>
                    <span className="text-muted-foreground">OR</span>
                    <span className="font-mono bg-muted px-2 py-1 rounded">phone</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-semibold text-green-900 mb-1">Valid Examples:</p>
                  <ul className="space-y-1 text-green-700">
                    <li>✓ Contact with email only</li>
                    <li>✓ Contact with phone only</li>
                    <li>✓ Contact with both email and phone</li>
                  </ul>
                </div>

                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <p className="font-semibold text-red-900 mb-1">Invalid Example:</p>
                  <ul className="space-y-1 text-red-700">
                    <li>✗ Contact with neither email nor phone (will be rejected)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-blue-900">Optional Fields</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You can include any of these additional fields:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="font-mono bg-muted px-2 py-1 rounded">first_name</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded">last_name</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded">company_name</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded">job_title</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono bg-muted px-2 py-1 rounded">street_address</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded">city</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded">state</p>
                    <p className="font-mono bg-muted px-2 py-1 rounded">zip_code</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t">
              <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-orange-900">Field Format Examples</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">Email:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>✓ john.smith@example.com</p>
                      <p>✓ jane_doe@company.co.uk</p>
                      <p>✗ invalid-email (missing @ and domain)</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-1">Phone:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>✓ 555-123-4567</p>
                      <p>✓ (555) 123-4567</p>
                      <p>✓ +1-555-123-4567</p>
                      <p>✗ 123 (too short)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Troubleshooting */}
          <TabsContent value="troubleshooting" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4 py-2">
                <h4 className="font-semibold text-red-900 mb-1">
                  Error: "Row X missing email and phone"
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  This row doesn't have either an email address or phone number.
                </p>
                <p className="text-sm font-medium">Solution:</p>
                <p className="text-sm text-muted-foreground">
                  Add at least one contact method (email OR phone) to this row, or remove the row if the contact information is unavailable.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h4 className="font-semibold text-orange-900 mb-1">
                  Error: "Invalid email format"
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The email address is not properly formatted.
                </p>
                <p className="text-sm font-medium">Solution:</p>
                <p className="text-sm text-muted-foreground">
                  Check for typos, ensure the email has an @ symbol and a valid domain (e.g., user@domain.com).
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h4 className="font-semibold text-orange-900 mb-1">
                  Error: "Invalid phone format"
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The phone number is too short or incorrectly formatted.
                </p>
                <p className="text-sm font-medium">Solution:</p>
                <p className="text-sm text-muted-foreground">
                  Ensure the phone number has at least 10 digits. Use formats like: 555-123-4567, (555) 123-4567, or +1-555-123-4567.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Error: "Duplicate contact"
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  A contact with this email address already exists in the CRM.
                </p>
                <p className="text-sm font-medium">Solution:</p>
                <p className="text-sm text-muted-foreground">
                  This contact will be automatically skipped. You can choose to "Import Valid Rows Only" to skip duplicates and import the rest.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h4 className="font-semibold text-orange-900 mb-1">
                  Error: "File too large"
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your file exceeds the 10MB size limit.
                </p>
                <p className="text-sm font-medium">Solution:</p>
                <p className="text-sm text-muted-foreground">
                  Split your file into smaller chunks (e.g., 1000-2000 contacts per file) and import them separately.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-semibold text-green-900 mb-1">
                  Tip: Auto-Assignment
                </h4>
                <p className="text-sm text-muted-foreground">
                  All contacts imported through this tool will be automatically assigned to you (the uploader). You can reassign them later if needed.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
