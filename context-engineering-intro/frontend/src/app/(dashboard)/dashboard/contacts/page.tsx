'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi, type BulkDeleteContactsResponse } from '@/lib/queries/contacts'
import { tagsApi } from '@/lib/queries/tags'
import { Contact, Paginated, Tag } from '@/types'
import { ContactList } from '@/components/contacts/contact-list'
import { ContactForm } from '@/components/contacts/contact-form'
import { ContactFilterBuilder, ContactFilterRequest } from '@/components/contacts/contact-filter-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TagBadge } from '@/components/contacts/tag-badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Brain, Upload, Trash2, Filter, Tag as TagIcon, Check, Download } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type ApiError = {
  response?: {
    data?: {
      detail?: string | Array<{ type: string; loc: string[]; msg: string; input?: any; ctx?: any }>
    }
  }
}

const formatApiError = (error: unknown, fallback: string): string => {
  const apiError = error as ApiError
  const detail = apiError?.response?.data?.detail

  // Handle FastAPI Pydantic validation errors (array of error objects)
  if (Array.isArray(detail)) {
    // Extract and format error messages from Pydantic validation errors
    const messages = detail.map((err: any) => {
      // Format: "field_name: error message"
      const field = err.loc && err.loc.length > 0 ? err.loc.join('.') : 'field'
      return `${field}: ${err.msg}`
    })
    return messages.join(', ')
  }

  // Handle simple string errors
  if (typeof detail === 'string') {
    return detail
  }

  // Fallback
  return fallback
}

const getApiErrorMessage = (error: unknown, fallback: string) =>
  formatApiError(error, fallback)

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagFilterOpen, setTagFilterOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAllMode, setSelectAllMode] = useState<'page' | 'all'>('page')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeFilterRequest, setActiveFilterRequest] = useState<ContactFilterRequest | null>(null)
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false)
  const [bulkTagAction, setBulkTagAction] = useState<'add' | 'remove'>('add')
  const [bulkTagInProgress, setBulkTagInProgress] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch all tags
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: tagsApi.getTags,
  })

  // Handle ?edit={id} URL parameter to auto-open edit modal
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setEditingContactId(editId)
      setIsFormOpen(true)
      // Remove the edit parameter from URL after opening modal
      router.replace('/dashboard/contacts', { scroll: false })
    }
  }, [searchParams, router])

  // Fetch contacts with pagination (use advanced search if filter is active)
  const { data: contactsData, isLoading } = useQuery<Paginated<Contact>>({
    queryKey: ['contacts', { search: searchQuery, status: statusFilter, tags: selectedTagIds, page: currentPage, pageSize, filters: activeFilterRequest }],
    queryFn: () => {
      // Use advanced search endpoint if filters are active
      if (activeFilterRequest) {
        return contactsApi.searchContacts({
          ...activeFilterRequest,
          page: currentPage,
          page_size: pageSize,
        })
      }

      // Otherwise use simple getContacts
      return contactsApi.getContacts({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })
    },
  })

  // Fetch full contact details when editing
  const { data: fullContactData } = useQuery<Contact>({
    queryKey: ['contact', editingContactId],
    queryFn: () => {
      if (!editingContactId) {
        throw new Error('Contact ID is required')
      }
      return contactsApi.getContact(editingContactId)
    },
    enabled: !!editingContactId,
  })

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: contactsApi.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setIsFormOpen(false)
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to create contact'),
        variant: 'destructive',
      })
    },
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: contactsApi.bulkDeleteContacts,
    onSuccess: (data: BulkDeleteContactsResponse) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setSelectedIds([])
      setIsDeleteDialogOpen(false)
      toast({
        title: 'Success',
        description: `Deleted ${data.deleted} contact(s)${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to delete contacts'),
        variant: 'destructive',
      })
    },
  })

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      contactsApi.updateContact(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the contacts list cache
      queryClient.invalidateQueries({ queryKey: ['contacts'] })

      // CRITICAL: Also invalidate the individual contact cache to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] })

      setIsFormOpen(false)
      setEditingContactId(null)
      setEditingContact(null)
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to update contact'),
        variant: 'destructive',
      })
    },
  })

  // Enrich contact mutation
  const enrichMutation = useMutation({
    mutationFn: contactsApi.enrichContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast({
        title: 'Success',
        description: 'Contact enriched successfully',
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to enrich contact'),
        variant: 'destructive',
      })
    },
  })

  const handleCreateContact = async (data: Partial<Contact>, tagIds?: string[]) => {
    try {
      const newContact = await contactsApi.createContact(data)

      // If tags were selected, add them to the newly created contact
      if (tagIds && tagIds.length > 0 && newContact.id) {
        await Promise.all(
          tagIds.map(tagId => tagsApi.addTagToContact(newContact.id, tagId))
        )
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setIsFormOpen(false)
      toast({
        title: 'Success',
        description: `Contact created successfully${tagIds && tagIds.length > 0 ? ` with ${tagIds.length} tag(s)` : ''}`,
      })
    } catch (error) {
      const description = getApiErrorMessage(error, 'Failed to create contact')
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateContact = (data: Partial<Contact>) => {
    if (editingContactId) {
      updateMutation.mutate({ id: editingContactId, data })
    }
  }

  const handleEnrichContact = (contact: Contact) => {
    enrichMutation.mutate(contact.id)
  }

  const contacts = contactsData?.items || []

  const handleToggleSelectAll = (checked?: boolean | 'indeterminate') => {
    const contactIds = contacts.map(c => c.id)

    // Determine if we should select or deselect
    // If checked param is provided, use it; otherwise, toggle based on current state
    let shouldSelect: boolean
    if (typeof checked === 'boolean') {
      shouldSelect = checked
    } else {
      const allSelected = contactIds.every(id => selectedIds.includes(id))
      shouldSelect = !allSelected
    }

    if (shouldSelect) {
      // Select all contacts on current page
      setSelectedIds(prev => {
        const newIds = contactIds.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
      // Don't change selectAllMode to 'all' - keep it as 'page'
    } else {
      // Deselect all contacts on current page
      setSelectedIds(prev => prev.filter(id => !contactIds.includes(id)))
      setSelectAllMode('page')
    }
  }

  const handleSelectAllMatching = async () => {
    if (selectAllMode === 'all') {
      // Deselect all
      setSelectedIds([])
      setSelectAllMode('page')
      return
    }

    // Select ALL matching contacts across all pages using pagination
    setIsSelectingAll(true)

    // CRITICAL: Declare allIds outside try block so it's accessible in catch
    let allIds: string[] = []

    try {
      let currentPageNum = 1
      let hasMore = true
      const batchSize = 1000 // Realistic page size that backend can handle (max 2000)

      while (hasMore) {
        // CRITICAL FIX: Use the same query logic as main contacts query
        // to respect advanced filters and tag filters
        const response = activeFilterRequest
          ? await contactsApi.searchContacts({
              ...activeFilterRequest,
              page: currentPageNum,
              page_size: batchSize,
            })
          : await contactsApi.getContacts({
              page: currentPageNum,
              page_size: batchSize,
              search: searchQuery || undefined,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            })

        // Add IDs from this batch
        allIds = [...allIds, ...response.items.map(c => c.id)]

        // Check if there are more pages
        hasMore = response.items.length === batchSize && currentPageNum < response.pages
        currentPageNum++

        // Safety: stop after 100 pages (100k contacts max)
        if (currentPageNum > 100) break
      }

      // Success! Update state and show success message
      setSelectedIds(allIds)
      setSelectAllMode('all')

      toast({
        title: 'Success',
        description: `Successfully selected ${allIds.length} contact(s) across all pages`,
      })
    } catch (error) {
      console.error('Select all matching contacts error:', error)

      // Check if we got partial results
      if (allIds.length > 0) {
        // Partial success - we got some contacts before error
        setSelectedIds(allIds)
        toast({
          title: 'Partial Success',
          description: `Selected ${allIds.length} contact(s), but encountered an error. Some contacts may not be included.`,
          variant: 'default',
        })
      } else {
        // Complete failure - show error
        toast({
          title: 'Error',
          description: getApiErrorMessage(
            error,
            'Failed to select contacts across all pages. Try selecting contacts on this page instead.'
          ),
          variant: 'destructive',
        })
      }
    } finally {
      setIsSelectingAll(false)
    }
  }

  const handleBulkDelete = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} contact${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`
    )

    if (!confirmed) return

    bulkDeleteMutation.mutate(selectedIds)
  }

  const handleAdvancedSearch = (filterRequest: ContactFilterRequest) => {
    setActiveFilterRequest(filterRequest)
    setCurrentPage(1) // Reset to first page when applying filters
  }

  const handleClearAdvancedFilters = () => {
    setActiveFilterRequest(null)
    setCurrentPage(1)
  }

  const handleBulkAddTags = (tagId: string) => {
    setBulkTagAction('add')
    handleBulkTagOperation(tagId)
  }

  const handleBulkRemoveTags = (tagId: string) => {
    setBulkTagAction('remove')
    handleBulkTagOperation(tagId)
  }

  const handleBulkTagOperation = async (tagId: string) => {
    if (selectedIds.length === 0) return

    setBulkTagInProgress(true)
    const action = bulkTagAction
    let successCount = 0
    let failCount = 0

    try {
      // Process tags in parallel
      await Promise.allSettled(
        selectedIds.map(async (contactId) => {
          try {
            if (action === 'add') {
              await tagsApi.addTagToContact(contactId, tagId)
            } else {
              await tagsApi.removeTagFromContact(contactId, tagId)
            }
            successCount++
          } catch (error) {
            failCount++
          }
        })
      )

      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setBulkTagModalOpen(false)

      // Show appropriate toast based on results
      if (failCount === 0) {
        toast({
          title: 'Success',
          description: `${action === 'add' ? 'Added' : 'Removed'} tag ${action === 'add' ? 'to' : 'from'} ${successCount} contact(s).`,
        })
      } else if (successCount > 0) {
        // Partial success
        toast({
          title: 'Partially complete',
          description: `${action === 'add' ? 'Added' : 'Removed'} tag ${action === 'add' ? 'to' : 'from'} ${successCount} contact(s). ${failCount} failed.`,
        })
      } else {
        // All failed
        toast({
          title: 'Failed',
          description: `Failed to ${action} tag. Please try again.`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, `Failed to ${action} tags`),
        variant: 'destructive',
      })
    } finally {
      setBulkTagInProgress(false)
    }
  }

  const handleExportCSV = async (selectedOnly: boolean = false) => {
    try {
      // Determine which contacts to export
      let contactsToExport: Contact[] = []

      if (selectedOnly && selectedIds.length > 0) {
        // Export only selected contacts
        // For selected contacts, we need to fetch full data for each ID
        // If we have a small number, fetch individually
        // If we have many selected (from "Select All Matching"), fetch in batches
        if (selectedIds.length <= 100) {
          // Small selection - use contacts already in memory that are selected
          contactsToExport = contacts.filter(c => selectedIds.includes(c.id))

          // If some selected IDs are not in current page, we'd need to fetch them
          // For now, just export what we have in memory that's selected
          if (contactsToExport.length < selectedIds.length) {
            toast({
              title: 'Partial Export',
              description: `Exporting ${contactsToExport.length} of ${selectedIds.length} selected contacts (only those on current page).`,
            })
          }
        } else {
          // Large selection - fetch all matching contacts in batches
          toast({
            title: 'Preparing export...',
            description: `Fetching ${selectedIds.length} selected contacts...`,
          })

          // Fetch in batches using pagination
          let currentPageNum = 1
          let hasMore = true
          const batchSize = 1000

          while (hasMore && contactsToExport.length < selectedIds.length) {
            const response = activeFilterRequest
              ? await contactsApi.searchContacts({
                  ...activeFilterRequest,
                  page: currentPageNum,
                  page_size: batchSize,
                })
              : await contactsApi.getContacts({
                  page: currentPageNum,
                  page_size: batchSize,
                  search: searchQuery || undefined,
                  status: statusFilter !== 'all' ? statusFilter : undefined,
                  tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
                })

            // Add contacts that are in selectedIds
            const batchContacts = response.items.filter(c => selectedIds.includes(c.id))
            contactsToExport = [...contactsToExport, ...batchContacts]

            hasMore = response.items.length === batchSize && currentPageNum < response.pages
            currentPageNum++

            // Safety: stop after 100 pages
            if (currentPageNum > 100) break
          }
        }
      } else {
        // Export ALL contacts (not just current page!)
        toast({
          title: 'Preparing export...',
          description: 'Fetching all contacts...',
        })

        // Fetch ALL contacts across all pages using pagination
        let currentPageNum = 1
        let hasMore = true
        const batchSize = 1000 // Fetch in large batches for efficiency

        while (hasMore) {
          // Use the same query logic as main contacts query to respect filters
          const response = activeFilterRequest
            ? await contactsApi.searchContacts({
                ...activeFilterRequest,
                page: currentPageNum,
                page_size: batchSize,
              })
            : await contactsApi.getContacts({
                page: currentPageNum,
                page_size: batchSize,
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
              })

          // Add all contacts from this batch
          contactsToExport = [...contactsToExport, ...response.items]

          // Check if there are more pages
          hasMore = response.items.length === batchSize && currentPageNum < response.pages
          currentPageNum++

          // Safety: stop after 100 pages (100k contacts max)
          if (currentPageNum > 100) break
        }
      }

      if (contactsToExport.length === 0) {
        toast({
          title: 'No contacts to export',
          description: 'Please select contacts or ensure there are contacts to export.',
          variant: 'destructive',
        })
        return
      }

      // Define CSV columns
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Company',
        'Status',
        'Tags',
        'Created At',
        'Updated At'
      ]

      // Convert contacts to CSV rows
      const csvRows = contactsToExport.map(contact => {
        // Format tags as comma-separated names (tags are already strings)
        const tagNames = contact.tags?.join('; ') || ''

        // Format dates
        const formatDate = (dateString?: string) => {
          if (!dateString) return ''
          try {
            return new Date(dateString).toISOString().split('T')[0]
          } catch {
            return dateString
          }
        }

        return [
          contact.first_name || '',
          contact.last_name || '',
          contact.email || '',
          contact.phone || '',
          contact.company || '',
          contact.status || '',
          tagNames,
          formatDate(contact.created_at),
          formatDate(contact.updated_at)
        ].map(field => {
          // Escape quotes and wrap in quotes if field contains comma, quote, or newline
          const stringField = String(field)
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`
          }
          return stringField
        })
      })

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('data-testid', 'export-csv-download')
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = selectedOnly
        ? `contacts-export-selected-${timestamp}.csv`
        : `contacts-export-all-${timestamp}.csv`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Complete',
        description: `Exported ${contactsToExport.length} contact(s) to ${filename}`,
      })
    } catch (error) {
      console.error('CSV export error:', error)
      toast({
        title: 'Export Failed',
        description: getApiErrorMessage(error, 'Failed to export contacts to CSV'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-sm text-muted-foreground">Manage your customer database</p>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <div data-testid="bulk-action-bar" className="flex gap-2">
                <Button
                  data-testid="bulk-add-tags-button"
                  variant="outline"
                  onClick={() => {
                    setBulkTagAction('add')
                    setBulkTagModalOpen(true)
                  }}
                >
                  <TagIcon className="mr-2 h-4 w-4" />
                  Add Tags ({selectedIds.length})
                </Button>
                <Button
                  data-testid="bulk-remove-tags-button"
                  variant="outline"
                  onClick={() => {
                    setBulkTagAction('remove')
                    setBulkTagModalOpen(true)
                  }}
                >
                  <TagIcon className="mr-2 h-4 w-4" />
                  Remove Tags ({selectedIds.length})
                </Button>
                <Button
                  data-testid="bulk-export-button"
                  variant="outline"
                  onClick={() => handleExportCSV(true)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export ({selectedIds.length})
                </Button>
                <Button
                  data-testid="bulk-delete-button"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              </div>
            )}
            <Button
              data-testid="export-all-button"
              variant="outline"
              onClick={() => handleExportCSV(false)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/contacts/import')}>
              <Upload className="mr-2 h-4 w-4" />
              Import Contacts
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="LEAD">Lead</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag Filter */}
          <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48 justify-start">
                <TagIcon className="mr-2 h-4 w-4" />
                {selectedTagIds.length > 0 ? `${selectedTagIds.length} tag(s)` : 'Filter by tags'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {allTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => {
                          setSelectedTagIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== tag.id)
                              : [...prev, tag.id]
                          )
                          setCurrentPage(1)
                        }}
                        className="cursor-pointer"
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className={cn("h-4 w-4")} />
                        </div>
                        <TagBadge name={tag.name} color={tag.color} size="sm" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {selectedTagIds.length > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-sm"
                      onClick={() => {
                        setSelectedTagIds([])
                        setCurrentPage(1)
                        setTagFilterOpen(false)
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showAdvancedFilters ? "Hide" : "Advanced"} Filters
            {activeFilterRequest && (
              <span className="ml-2 rounded-full bg-primary-foreground px-2 py-0.5 text-xs text-primary">
                {activeFilterRequest.filters.length}
              </span>
            )}
          </Button>
        </div>

        {/* Active Tag Filters Display */}
        {selectedTagIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filtering by:</span>
            {selectedTagIds.map(tagId => {
              const tag = allTags.find(t => t.id === tagId)
              return tag ? (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  size="sm"
                  onRemove={() => {
                    setSelectedTagIds(prev => prev.filter(id => id !== tagId))
                    setCurrentPage(1)
                  }}
                />
              ) : null
            })}
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4">
            <ContactFilterBuilder
              onSearch={handleAdvancedSearch}
              onClear={handleClearAdvancedFilters}
            />
          </div>
        )}
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        ) : (
          <>
            <ContactList
              contacts={contacts}
              selectedId={selectedContact?.id}
              onSelect={(contact) => {
                setSelectedContact(contact)
                setEditingContactId(contact.id)
                setIsFormOpen(true)
              }}
              selectedIds={selectedIds}
              onToggleSelect={(contactId) => {
                setSelectedIds(prev =>
                  prev.includes(contactId)
                    ? prev.filter(id => id !== contactId)
                    : [...prev, contactId]
                )
              }}
              onToggleSelectAll={handleToggleSelectAll}
              totalCount={contactsData?.total || 0}
              selectAllMode={selectAllMode}
              onSelectAllMatching={handleSelectAllMatching}
              isSelectingAll={isSelectingAll}
            />

            {/* Pagination Controls */}
            {contactsData && contactsData.total > 0 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, contactsData.total)} of {contactsData.total} contacts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {contactsData.pages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= contactsData.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContactId ? 'Edit Contact' : 'Create Contact'}</DialogTitle>
            <DialogDescription>
              {editingContactId
                ? 'Update contact information below'
                : 'Add a new contact to your database'}
            </DialogDescription>
          </DialogHeader>
          <ContactForm
            contact={fullContactData || undefined}
            onSubmit={editingContactId ? handleUpdateContact : handleCreateContact}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingContactId(null)
              setEditingContact(null)
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contacts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} contact(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagModalOpen} onOpenChange={setBulkTagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{bulkTagAction === 'add' ? 'Add' : 'Remove'} Tags</DialogTitle>
            <DialogDescription>
              Select a tag to {bulkTagAction} {bulkTagAction === 'add' ? 'to' : 'from'} {selectedIds.length} contact(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allTags.map(tag => (
              <Button
                key={tag.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleBulkTagOperation(tag.id)}
                disabled={bulkTagInProgress}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
