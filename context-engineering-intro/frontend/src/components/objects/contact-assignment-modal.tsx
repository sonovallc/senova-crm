'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import { contactsApi } from '@/lib/queries/contacts'
import type { Contact } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Search, User, Mail, Phone, Loader2 } from 'lucide-react'

interface ContactAssignmentModalProps {
  objectId: string
  onClose: () => void
  onSuccess: () => void
}

export function ContactAssignmentModal({ objectId, onClose, onSuccess }: ContactAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const { toast } = useToast()

  // Fetch available contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', 'available', currentPage, searchQuery],
    queryFn: () => contactsApi.getContacts({
      page: currentPage,
      page_size: pageSize,
      search: searchQuery || undefined,
    }),
  })

  // Assign contacts mutation
  const assignMutation = useMutation({
    mutationFn: (contactIds: string[]) => objectsApi.assignContacts(objectId, contactIds),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${selectedContacts.length} contact(s) assigned successfully`,
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

  const handleAssign = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'No contacts selected',
        description: 'Please select at least one contact to assign',
        variant: 'destructive',
      })
      return
    }
    assignMutation.mutate(selectedContacts)
  }

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const isSubmitting = assignMutation.isPending

  return (
    <Dialog open onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Contacts</DialogTitle>
          <DialogDescription>
            Select contacts to assign to this object
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-senova-gray-400" />
              <Input
                placeholder="Search contacts by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto border border-senova-gray-200 rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senova-primary"></div>
              </div>
            ) : !contactsData?.items?.length ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-senova-gray-400 mx-auto mb-3" />
                <p className="text-senova-gray-600">No contacts found</p>
                {searchQuery && (
                  <p className="text-sm text-senova-gray-500 mt-1">
                    Try adjusting your search query
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-senova-gray-200">
                {contactsData.items.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-4 p-4 hover:bg-senova-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-senova-gray-900">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        {contact.email && (
                          <span className="flex items-center gap-1 text-sm text-senova-gray-600">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1 text-sm text-senova-gray-600">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.company && (
                          <span className="text-sm text-senova-gray-600">
                            {contact.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {contactsData && contactsData.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-senova-gray-200">
          <p className="text-sm text-senova-gray-600">
            {selectedContacts.length} contact(s) selected
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
              onClick={handleAssign}
              disabled={isSubmitting || selectedContacts.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>Assign {selectedContacts.length > 0 && `(${selectedContacts.length})`}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}