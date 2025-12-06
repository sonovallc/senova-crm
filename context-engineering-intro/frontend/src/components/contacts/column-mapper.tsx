"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Wand2, CheckCircle2, Circle, XCircle, ChevronsUpDown, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColumnMapperProps {
  columns: string[]
  preview: any[]
  onComplete: (mapping: Record<string, string>) => void
  onBack: () => void
}

interface ContactField {
  field_name: string
  field_label: string
  required: boolean
  field_type: string
}

export default function ColumnMapper({
  columns,
  preview,
  onComplete,
  onBack,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [availableFields, setAvailableFields] = useState<ContactField[]>([])
  const [isLoadingFields, setIsLoadingFields] = useState(true)
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Fetch available contact fields
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const token = sessionStorage.getItem('access_token')
        const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')
        const response = await fetch(`${API_URL}/v1/contacts/import/fields`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to fetch fields')

        const data = await response.json()
        setAvailableFields(data.fields || [])
      } catch (error) {
        console.error('Error fetching fields:', error)
        toast({
          title: 'Error',
          description: 'Failed to load contact fields',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingFields(false)
      }
    }

    fetchFields()
  }, [])

  // Auto-map columns based on name similarity
  const handleAutoMap = () => {
    console.log('[AUTO-MAP] Starting auto-mapping...')
    console.log('[AUTO-MAP] Available fields count:', availableFields.length)
    console.log('[AUTO-MAP] CSV columns:', columns)

    const newMapping: Record<string, string> = {}

    columns.forEach(column => {
      const columnLower = column.toLowerCase().replace(/[_\s]/g, '')
      console.log(`[AUTO-MAP] Processing column "${column}" -> normalized: "${columnLower}"`)

      // Special case mappings for common variations
      const specialMappings: Record<string, string> = {
        'uuid': 'provider_uuid',  // Map CSV "UUID" to CRM "provider_uuid"
        'id': 'provider_uuid',     // Map CSV "ID" to CRM "provider_uuid" (not Contact.id)
      }

      // Check for special case first
      if (specialMappings[columnLower]) {
        const specialField = availableFields.find(f => f.field_name === specialMappings[columnLower])
        if (specialField) {
          console.log(`[AUTO-MAP] ✓ Special mapping: "${column}" -> "${specialField.field_name}"`)
          newMapping[column] = specialField.field_name
          return
        }
      }

      // Try exact match first (most accurate)
      let matchedField = availableFields.find(field => {
        const fieldLower = field.field_name.toLowerCase().replace(/[_\s]/g, '')
        return columnLower === fieldLower
      })

      if (matchedField) {
        console.log(`[AUTO-MAP] ✓ Exact match: "${column}" -> "${matchedField.field_name}"`)
      }

      // If no exact match, try fuzzy matching
      if (!matchedField) {
        matchedField = availableFields.find(field => {
          const fieldLower = field.field_name.toLowerCase().replace(/[_\s]/g, '')
          // Only match if column name contains field name or vice versa
          // But ensure minimum length to avoid false positives (e.g., "id" matching everything)
          if (fieldLower.length >= 4 || columnLower.length >= 4) {
            return columnLower.includes(fieldLower) || fieldLower.includes(columnLower)
          }
          return false
        })

        if (matchedField) {
          console.log(`[AUTO-MAP] ✓ Fuzzy match: "${column}" -> "${matchedField.field_name}"`)
        }
      }

      if (matchedField) {
        newMapping[column] = matchedField.field_name
      } else {
        console.log(`[AUTO-MAP] ✗ No match found for: "${column}"`)
      }
    })

    console.log('[AUTO-MAP] Final mapping:', newMapping)
    console.log('[AUTO-MAP] Mapped', Object.keys(newMapping).length, 'of', columns.length, 'columns')

    setMapping(newMapping)

    toast({
      title: 'Auto-mapped',
      description: `Automatically mapped ${Object.keys(newMapping).length} of ${columns.length} columns`,
    })
  }

  const handleMappingChange = (csvColumn: string, crmField: string) => {
    if (crmField === 'skip') {
      const newMapping = { ...mapping }
      delete newMapping[csvColumn]
      setMapping(newMapping)
    } else {
      setMapping({ ...mapping, [csvColumn]: crmField })
    }
  }

  const getColumnStatus = (column: string): 'mapped' | 'unmapped' | 'skipped' => {
    if (mapping[column]) return 'mapped'
    return 'unmapped'
  }

  const isValid = (): boolean => {
    // Check if at least email OR phone is mapped
    const mappedFields = Object.values(mapping)
    const hasEmail = mappedFields.includes('email') || mappedFields.includes('business_email')
    const hasPhone = mappedFields.includes('phone') || mappedFields.includes('mobile_phone') || mappedFields.includes('personal_phone')

    return hasEmail || hasPhone
  }

  const handleNext = () => {
    if (!isValid()) {
      toast({
        title: 'Validation Error',
        description: 'You must map at least Email OR Phone column',
        variant: 'destructive',
      })
      return
    }

    onComplete(mapping)
  }

  // Get preview values for a column
  const getPreviewValues = (column: string): string[] => {
    return preview.slice(0, 3).map(row => row[column] || '').filter(val => val)
  }

  if (isLoadingFields) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading contact fields...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Map Your Columns</h2>
        <p className="text-muted-foreground">
          Match your CSV columns to CRM contact fields. At least Email OR Phone is required.
        </p>
      </div>

      {/* Auto-map Button */}
      <div className="mb-6">
        <Button onClick={handleAutoMap} variant="outline">
          <Wand2 className="w-4 h-4 mr-2" />
          Auto-Map Columns
        </Button>
      </div>

      {/* Column Mapping Table */}
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-muted px-4 py-3 grid grid-cols-12 gap-4 font-semibold text-sm">
          <div className="col-span-1">Status</div>
          <div className="col-span-4">Your Column</div>
          <div className="col-span-2">Preview Data</div>
          <div className="col-span-1">→</div>
          <div className="col-span-4">CRM Field</div>
        </div>

        <div className="divide-y">
          {columns.map((column, index) => {
            const status = getColumnStatus(column)
            const previewValues = getPreviewValues(column)

            return (
              <div
                key={index}
                className="px-4 py-4 grid grid-cols-12 gap-4 items-center hover:bg-accent/50 transition-colors"
              >
                {/* Status Icon */}
                <div className="col-span-1">
                  {status === 'mapped' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {status === 'unmapped' && <Circle className="w-5 h-5 text-muted-foreground" />}
                  {status === 'skipped' && <XCircle className="w-5 h-5 text-orange-600" />}
                </div>

                {/* CSV Column Name */}
                <div className="col-span-4">
                  <p className="font-medium">{column}</p>
                </div>

                {/* Preview Data */}
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {previewValues.length > 0 ? (
                      previewValues.map((val, idx) => (
                        <div key={idx} className="truncate">{val}</div>
                      ))
                    ) : (
                      <div className="text-muted-foreground/50">No data</div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex justify-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* CRM Field Selector - Searchable */}
                <div className="col-span-4">
                  <Popover
                    open={openPopovers[column] || false}
                    onOpenChange={(open) =>
                      setOpenPopovers({ ...openPopovers, [column]: open })
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopovers[column] || false}
                        className="w-full justify-between"
                      >
                        {mapping[column]
                          ? availableFields.find(f => f.field_name === mapping[column])?.field_label || mapping[column]
                          : "Select field..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search fields..." />
                        <CommandList>
                          <CommandEmpty>No field found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="unmapped"
                              onSelect={() => {
                                handleMappingChange(column, 'skip')
                                setOpenPopovers({ ...openPopovers, [column]: false })
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !mapping[column] ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="text-muted-foreground">-- Not mapped --</span>
                            </CommandItem>
                            <CommandItem
                              value="skip"
                              onSelect={() => {
                                handleMappingChange(column, 'skip')
                                setOpenPopovers({ ...openPopovers, [column]: false })
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 opacity-0"
                                )}
                              />
                              <span className="text-orange-600">Skip this column</span>
                            </CommandItem>
                            {availableFields.map((field) => (
                              <CommandItem
                                key={field.field_name}
                                value={field.field_label}
                                onSelect={() => {
                                  handleMappingChange(column, field.field_name)
                                  setOpenPopovers({ ...openPopovers, [column]: false })
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    mapping[column] === field.field_name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {field.field_label}
                                {field.required && <span className="text-red-600 ml-1">*</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation Message */}
      <div className="mb-6">
        {isValid() ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Mapping is valid! You can proceed to preview.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <Circle className="w-4 h-4" />
            <span>Please map at least Email OR Phone to continue</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {Object.keys(mapping).length}
            </p>
            <p className="text-sm text-muted-foreground">Mapped</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">
              {columns.length - Object.keys(mapping).length}
            </p>
            <p className="text-sm text-muted-foreground">Unmapped</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{columns.length}</p>
            <p className="text-sm text-muted-foreground">Total Columns</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!isValid()} className="flex-1">
          Next: Select Tags
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
