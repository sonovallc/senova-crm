'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import { contactsApi } from '@/lib/queries/contacts'
import type { ObjectContact } from '@/types/objects'
import type { Contact } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ContactAssignmentModal } from '@/components/objects/contact-assignment-modal'
import { BulkAssignmentModal } from '@/components/objects/bulk-assignment-modal'
import { useToast } from '@/hooks/use-toast'
import { formatErrorMessage } from '@/lib/error-handler'
import { Plus, Search, Users, Trash2, Filter, Mail, Phone, Building, User } from 'lucide-react'

interface ObjectContactsTabProps {
  objectId: string
  canManage?: boolean
}

export function ObjectContactsTab({ objectId, canManage = false }: ObjectContactsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ObjectContact | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch object contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['objects', objectId, 'contacts', currentPage, pageSize, searchQuery],
    queryFn: () => objectsApi.listContacts(objectId, {
      page: currentPage,
      page_size: pageSize,
      search: searchQuery || undefined,
    }),
  })

  // Remove contact mutation
  const removeMutation = useMutation({
    mutationFn: (contactId: string) => objectsApi.removeContact(objectId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'contacts'] })
      toast({
        title: 'Success',
        description: 'Contact removed from object',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  // Update contact assignment mutation
  const updateMutation = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: { role?: string; department?: string } }) =>
      objectsApi.updateContactAssignment(objectId, contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'contacts'] })
      toast({
        title: 'Success',
        description: 'Contact assignment updated',
      })
      setEditingContact(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  const handleRemoveContact = (contactId: string) => {
    if (confirm('Are you sure you want to remove this contact from the object?')) {
      removeMutation.mutate(contactId)
    }
  }

  const handleUpdateContact = (contactId: string, role: string, department: string) => {
    updateMutation.mutate({
      contactId,
      data: { role, department }
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                Manage contacts associated with this object
              </CardDescription>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Bulk Assign
                </Button>
                <Button
                  className="bg-senova-primary hover:bg-senova-primary-dark text-white"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Contact
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-senova-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Contacts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senova-primary"></div>
            </div>
          ) : !contactsData?.items?.length ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-senova-gray-400 mx-auto mb-3" />
              <p className="text-senova-gray-600">No contacts assigned</p>
              {canManage && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Assign First Contact
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Total count display */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total: {contactsData.total} contacts
                </span>
              </div>
              <div className="space-y-3">
              {contactsData.items.map((objectContact) => (
                <div
                  key={objectContact.id}
                  className="flex items-center justify-between p-4 bg-senova-gray-50 rounded-lg hover:bg-senova-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-full">
                      <User className="h-5 w-5 text-senova-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-senova-gray-900">
                        {objectContact.contact.first_name} {objectContact.contact.last_name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        {objectContact.contact.email && (
                          <span className="flex items-center gap-1 text-sm text-senova-gray-600">
                            <Mail className="h-3 w-3" />
                            {objectContact.contact.email}
                          </span>
                        )}
                        {objectContact.contact.phone && (
                          <span className="flex items-center gap-1 text-sm text-senova-gray-600">
                            <Phone className="h-3 w-3" />
                            {objectContact.contact.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {objectContact.role && (
                          <Badge variant="outline">{objectContact.role}</Badge>
                        )}
                        {objectContact.department && (
                          <Badge variant="outline">
                            <Building className="h-3 w-3 mr-1" />
                            {objectContact.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(objectContact.contact_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {contactsData && contactsData.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-senova-gray-600">
                Page {currentPage} of {contactsData.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(contactsData.pages, p + 1))}
                disabled={currentPage === contactsData.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {isAssignModalOpen && (
        <ContactAssignmentModal
          objectId={objectId}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            setIsAssignModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'contacts'] })
          }}
        />
      )}

      {isBulkModalOpen && (
        <BulkAssignmentModal
          objectId={objectId}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            setIsBulkModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'contacts'] })
          }}
        />
      )}
    </>
  )
}