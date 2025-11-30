'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import type { BulkContactAssignmentFilters } from '@/types/objects'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Filter, Loader2, Users } from 'lucide-react'

interface BulkAssignmentModalProps {
  objectId: string
  onClose: () => void
  onSuccess: () => void
}

export function BulkAssignmentModal({ objectId, onClose, onSuccess }: BulkAssignmentModalProps) {
  const [filters, setFilters] = useState<BulkContactAssignmentFilters>({})
  const { toast } = useToast()

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (filters: BulkContactAssignmentFilters) =>
      objectsApi.bulkAssignContacts(objectId, filters),
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: `${data.assigned_count || 0} contacts assigned successfully`,
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to assign contacts',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Clean up empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
        acc[key as keyof BulkContactAssignmentFilters] = value
      }
      return acc
    }, {} as BulkContactAssignmentFilters)

    if (Object.keys(cleanFilters).length === 0) {
      toast({
        title: 'No filters selected',
        description: 'Please select at least one filter to bulk assign contacts',
        variant: 'destructive',
      })
      return
    }

    bulkAssignMutation.mutate(cleanFilters)
  }

  const isSubmitting = bulkAssignMutation.isPending

  return (
    <Dialog open onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Assign Contacts</DialogTitle>
          <DialogDescription>
            Set filters to assign multiple contacts at once to this object
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Search Filter */}
          <div>
            <Label htmlFor="search">Search Term</Label>
            <Input
              id="search"
              placeholder="Search by name, email, phone, or company"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status">Contact Status</Label>
            <Select
              value={filters.status?.[0] || ''}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value ? [value] : undefined })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Attributes */}
          <div className="space-y-3">
            <Label>Contact Attributes</Label>
            <div className="flex items-center justify-between p-3 bg-senova-gray-50 rounded-lg">
              <Label htmlFor="has_email" className="cursor-pointer font-normal">
                Has email address
              </Label>
              <Switch
                id="has_email"
                checked={filters.has_email || false}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, has_email: checked || undefined })
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-senova-gray-50 rounded-lg">
              <Label htmlFor="has_phone" className="cursor-pointer font-normal">
                Has phone number
              </Label>
              <Switch
                id="has_phone"
                checked={filters.has_phone || false}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, has_phone: checked || undefined })
                }
              />
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="created_after">Created After</Label>
              <Input
                id="created_after"
                type="date"
                value={filters.created_after || ''}
                onChange={(e) => setFilters({ ...filters, created_after: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="created_before">Created Before</Label>
              <Input
                id="created_before"
                type="date"
                value={filters.created_before || ''}
                onChange={(e) => setFilters({ ...filters, created_before: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="updated_after">Updated After</Label>
              <Input
                id="updated_after"
                type="date"
                value={filters.updated_after || ''}
                onChange={(e) => setFilters({ ...filters, updated_after: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="updated_before">Updated Before</Label>
              <Input
                id="updated_before"
                type="date"
                value={filters.updated_before || ''}
                onChange={(e) => setFilters({ ...filters, updated_before: e.target.value })}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-senova-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-senova-gray-600" />
              <span className="text-sm font-medium text-senova-gray-700">Filter Preview</span>
            </div>
            <p className="text-sm text-senova-gray-600">
              {Object.keys(filters).filter(key => filters[key as keyof BulkContactAssignmentFilters]).length === 0
                ? 'No filters selected - all contacts will be assigned'
                : `Contacts matching ${Object.keys(filters).filter(key => filters[key as keyof BulkContactAssignmentFilters]).length} filter(s) will be assigned`}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-senova-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Bulk Assign
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}