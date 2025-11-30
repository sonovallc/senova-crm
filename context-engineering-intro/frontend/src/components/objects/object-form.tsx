'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import type { CRMObject, CreateObjectRequest, UpdateObjectRequest } from '@/types/objects'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Building2, Plus, X, Loader2 } from 'lucide-react'
import { addressToString } from '@/lib/utils/address'

interface ObjectFormProps {
  object?: CRMObject
  onSuccess: (object: CRMObject) => void
  onCancel: () => void
}

export function ObjectForm({ object, onSuccess, onCancel }: ObjectFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    type: 'company' | 'organization' | 'group';
    company_info: Record<string, string>;
  }>({
    name: object?.name || '',
    type: object?.type || 'company',
    company_info: {
      legal_name: object?.company_info?.legal_name || '',
      industry: object?.company_info?.industry || '',
      email: object?.company_info?.email || '',
      phone: object?.company_info?.phone || '',
      website: object?.company_info?.website || '',
      address: addressToString(object?.company_info?.address) || '',
      ...Object.fromEntries(
        Object.entries(object?.company_info || {})
          .filter(([key]) => !['legal_name', 'industry', 'email', 'phone', 'website', 'address'].includes(key))
      )
    }
  })
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([])
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: CreateObjectRequest) => objectsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['objects'] })
      toast({
        title: 'Success',
        description: 'Object created successfully',
      })
      onSuccess(data)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to create object',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateObjectRequest) => objectsApi.update(object!.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['objects'] })
      queryClient.invalidateQueries({ queryKey: ['objects', object!.id] })
      toast({
        title: 'Success',
        description: 'Object updated successfully',
      })
      onSuccess(data)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to update object',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Add custom fields to company_info
    const companyInfo: Record<string, string> = { ...formData.company_info }
    customFields.forEach(field => {
      if (field.key && field.value) {
        companyInfo[field.key] = field.value
      }
    })

    const data = {
      name: formData.name,
      type: formData.type as 'company' | 'organization' | 'group',
      company_info: companyInfo
    }

    if (object) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const addCustomField = () => {
    if (newFieldKey && newFieldValue) {
      setCustomFields([...customFields, { key: newFieldKey, value: newFieldValue }])
      setNewFieldKey('')
      setNewFieldValue('')
    }
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-senova-primary" />
          {object ? 'Edit Object' : 'Create New Object'}
        </CardTitle>
        <CardDescription>
          {object
            ? 'Update the information for this object'
            : 'Fill in the details to create a new object'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-senova-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter object name"
                />
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'company' | 'organization' | 'group' })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-senova-gray-900">Company Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={formData.company_info.legal_name}
                  onChange={(e) => setFormData({
                    ...formData,
                    company_info: { ...formData.company_info, legal_name: e.target.value }
                  })}
                  placeholder="Enter legal name"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.company_info.industry}
                  onChange={(e) => setFormData({
                    ...formData,
                    company_info: { ...formData.company_info, industry: e.target.value }
                  })}
                  placeholder="Enter industry"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.company_info.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    company_info: { ...formData.company_info, email: e.target.value }
                  })}
                  placeholder="company@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.company_info.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    company_info: { ...formData.company_info, phone: e.target.value }
                  })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.company_info.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    company_info: { ...formData.company_info, website: e.target.value }
                  })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.company_info.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    company_info: { ...formData.company_info, address: e.target.value }
                  })}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-senova-gray-900">Custom Fields</h3>

            {/* Existing custom fields from the object */}
            {Object.entries(formData.company_info)
              .filter(([key]) => !['legal_name', 'industry', 'email', 'phone', 'website', 'address'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}</Label>
                    <Input
                      value={String(value)}
                      onChange={(e) => setFormData({
                        ...formData,
                        company_info: { ...formData.company_info, [key]: e.target.value }
                      })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const { [key]: _, ...rest } = formData.company_info
                      setFormData({ ...formData, company_info: rest })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

            {/* Newly added custom fields */}
            {customFields.map((field, index) => (
              <div key={`new-${index}`} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>{field.key}</Label>
                  <Input
                    value={field.value}
                    onChange={(e) => {
                      const updated = [...customFields]
                      updated[index].value = e.target.value
                      setCustomFields(updated)
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add new custom field */}
            <div className="flex gap-2 items-end p-4 bg-senova-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="new-field-key">Field Name</Label>
                <Input
                  id="new-field-key"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="e.g., Tax ID"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="new-field-value">Value</Label>
                <Input
                  id="new-field-value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="Enter value"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addCustomField}
                disabled={!newFieldKey || !newFieldValue}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-senova-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
              disabled={isLoading || !formData.name}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {object ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{object ? 'Update Object' : 'Create Object'}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}