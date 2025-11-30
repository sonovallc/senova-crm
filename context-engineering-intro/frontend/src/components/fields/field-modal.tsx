"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Field {
  field_name: string
  field_label: string
  field_category: string
  field_type: string
  visible_to_admin: boolean
  visible_to_user: boolean
  is_sensitive: boolean
}

interface FieldCreate {
  field_name: string
  field_label: string
  field_category: string
  field_type: string
  visible_to_admin: boolean
  visible_to_user: boolean
  is_sensitive: boolean
}

interface FieldModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: FieldCreate) => Promise<void>
  mode: "create"
}

// Field type options
const FIELD_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
]

// Field category options
const FIELD_CATEGORIES = [
  { value: "behavioral", label: "Behavioral" },
  { value: "company", label: "Company" },
  { value: "personal", label: "Personal" },
  { value: "contact", label: "Contact" },
  { value: "custom", label: "Custom" },
]

export function FieldModal({ open, onClose, onSave, mode }: FieldModalProps) {
  const [fieldName, setFieldName] = useState("")
  const [fieldLabel, setFieldLabel] = useState("")
  const [fieldType, setFieldType] = useState("string")
  const [fieldCategory, setFieldCategory] = useState("custom")
  const [visibleToAdmin, setVisibleToAdmin] = useState(true)
  const [visibleToUser, setVisibleToUser] = useState(false)
  const [isSensitive, setIsSensitive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      setFieldName("")
      setFieldLabel("")
      setFieldType("string")
      setFieldCategory("custom")
      setVisibleToAdmin(true)
      setVisibleToUser(false)
      setIsSensitive(false)
      setError("")
    }
  }, [open])

  // Auto-generate field_name from field_label
  useEffect(() => {
    if (fieldLabel && !fieldName) {
      const generatedName = fieldLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      setFieldName(generatedName)
    }
  }, [fieldLabel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!fieldLabel.trim()) {
      setError("Field label is required")
      return
    }

    if (!fieldName.trim()) {
      setError("Field name is required")
      return
    }

    if (!/^[a-z0-9_]+$/.test(fieldName)) {
      setError("Field name must contain only lowercase letters, numbers, and underscores")
      return
    }

    if (fieldLabel.length > 255) {
      setError("Field label must be 255 characters or less")
      return
    }

    if (fieldName.length > 100) {
      setError("Field name must be 100 characters or less")
      return
    }

    setLoading(true)
    try {
      const data: FieldCreate = {
        field_name: fieldName.trim(),
        field_label: fieldLabel.trim(),
        field_category: fieldCategory,
        field_type: fieldType,
        visible_to_admin: visibleToAdmin,
        visible_to_user: visibleToUser,
        is_sensitive: isSensitive,
      }

      await onSave(data)
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create field")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFieldName("")
    setFieldLabel("")
    setFieldType("string")
    setFieldCategory("custom")
    setVisibleToAdmin(true)
    setVisibleToUser(false)
    setIsSensitive(false)
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Custom Field</DialogTitle>
          <DialogDescription>
            Add a new custom field to track additional contact information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Field Label */}
            <div className="space-y-2">
              <Label htmlFor="field-label">Field Label *</Label>
              <Input
                id="field-label"
                placeholder="e.g., LinkedIn Profile, Annual Revenue"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                maxLength={255}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The display name shown in the UI
              </p>
            </div>

            {/* Field Name (auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="field-name">Field Name *</Label>
              <Input
                id="field-name"
                placeholder="e.g., linkedin_profile, annual_revenue"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value.toLowerCase())}
                maxLength={100}
                disabled={loading}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Internal identifier (lowercase, numbers, underscores only)
              </p>
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type *</Label>
              <Select value={fieldType} onValueChange={setFieldType} disabled={loading}>
                <SelectTrigger id="field-type">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The data type for this field
              </p>
            </div>

            {/* Field Category */}
            <div className="space-y-2">
              <Label htmlFor="field-category">Category *</Label>
              <Select value={fieldCategory} onValueChange={setFieldCategory} disabled={loading}>
                <SelectTrigger id="field-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Group this field with similar fields
              </p>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <Label className="text-base font-semibold">Visibility Settings</Label>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="visible-admin" className="font-normal">Visible to Admins</Label>
                  <p className="text-xs text-muted-foreground">Admin users can view this field</p>
                </div>
                <Switch
                  id="visible-admin"
                  checked={visibleToAdmin}
                  onCheckedChange={setVisibleToAdmin}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="visible-user" className="font-normal">Visible to Users</Label>
                  <p className="text-xs text-muted-foreground">Regular users can view this field</p>
                </div>
                <Switch
                  id="visible-user"
                  checked={visibleToUser}
                  onCheckedChange={setVisibleToUser}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is-sensitive" className="font-normal">Mark as Sensitive</Label>
                  <p className="text-xs text-muted-foreground">Flag this field as containing sensitive data</p>
                </div>
                <Switch
                  id="is-sensitive"
                  checked={isSensitive}
                  onCheckedChange={setIsSensitive}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
