'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import { contactsApi, ContactObjectInfo } from '@/lib/queries/contacts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, X, Loader2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ContactObjectsSectionProps {
  contactId: string
  canManage?: boolean
}

export function ContactObjectsSection({ contactId, canManage = false }: ContactObjectsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch objects for this contact directly (efficient single API call)
  const { data: contactObjectsData, isLoading: loadingContactObjects } = useQuery({
    queryKey: ['contact', contactId, 'objects'],
    queryFn: () => contactsApi.getContactObjects(contactId),
  })

  // Fetch all objects (for the add dialog)
  const { data: allObjectsData, isLoading: loadingAllObjects } = useQuery({
    queryKey: ['objects', 'all'],
    queryFn: () => objectsApi.list({ page: 1, page_size: 100 }),
    enabled: isDialogOpen, // Only fetch when dialog is open
  })

  // Mutation to assign contact to an object
  const assignMutation = useMutation({
    mutationFn: (objectId: string) => objectsApi.assignContacts(objectId, [contactId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'objects'] })
      queryClient.invalidateQueries({ queryKey: ['objects'] })
      toast({
        title: 'Success',
        description: 'Contact assigned to object',
      })
      setIsDialogOpen(false)
      setSearchQuery('')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to assign contact',
        variant: 'destructive',
      })
    },
  })

  // Mutation to remove contact from an object
  const removeMutation = useMutation({
    mutationFn: (objectId: string) => objectsApi.removeContact(objectId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'objects'] })
      queryClient.invalidateQueries({ queryKey: ['objects'] })
      toast({
        title: 'Success',
        description: 'Contact removed from object',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to remove contact',
        variant: 'destructive',
      })
    },
  })

  // Get list of objects this contact belongs to
  const contactObjects = contactObjectsData?.items || []

  // Filter objects for assignment dialog (exclude already assigned)
  const availableObjects = allObjectsData?.items?.filter(obj => {
    const isAssigned = contactObjects.some(co => co.id === obj.id)
    const matchesSearch = obj.name.toLowerCase().includes(searchQuery.toLowerCase())
    return !isAssigned && matchesSearch
  }) || []

  const isLoading = loadingContactObjects

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-senova-primary" />
              Objects
            </CardTitle>
            <CardDescription>
              Organizations and companies this contact belongs to
            </CardDescription>
          </div>
          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-senova-primary hover:bg-senova-primary-dark text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Object
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Contact to Object</DialogTitle>
                  <DialogDescription>
                    Select an object to assign this contact to
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-senova-gray-400" />
                    <Input
                      placeholder="Search objects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {loadingAllObjects ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-senova-primary" />
                      </div>
                    ) : availableObjects.length === 0 ? (
                      <p className="text-sm text-senova-gray-500 text-center py-4">
                        {searchQuery ? 'No matching objects found' : 'No available objects to assign'}
                      </p>
                    ) : (
                      availableObjects.map((obj) => (
                        <div
                          key={obj.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-senova-gray-50 cursor-pointer transition-colors"
                          onClick={() => !assignMutation.isPending && assignMutation.mutate(obj.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-senova-gray-400" />
                            <div>
                              <p className="font-medium text-sm">{obj.name}</p>
                              <p className="text-xs text-senova-gray-500">{obj.type}</p>
                            </div>
                          </div>
                          {assignMutation.isPending && assignMutation.variables === obj.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-senova-primary" />
          </div>
        ) : contactObjects.length === 0 ? (
          <div className="text-center py-6">
            <Building2 className="h-10 w-10 text-senova-gray-400 mx-auto mb-3" />
            <p className="text-sm text-senova-gray-500">
              This contact is not assigned to any objects yet.
            </p>
            {canManage && (
              <p className="text-xs text-senova-gray-400 mt-1">
                Use the "Add to Object" button to assign this contact to organizations.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contactObjects.map((obj) => (
              <div
                key={obj.id}
                className="flex items-center justify-between p-4 bg-senova-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full">
                    <Building2 className="h-5 w-5 text-senova-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-senova-gray-900">{obj.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {obj.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remove this contact from ${obj.name}?`)) {
                        removeMutation.mutate(obj.id)
                      }
                    }}
                    disabled={removeMutation.isPending && removeMutation.variables === obj.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removeMutation.isPending && removeMutation.variables === obj.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}