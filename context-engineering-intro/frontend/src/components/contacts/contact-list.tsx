'use client'

import { Contact, ContactFieldDefinition, Tag } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TagBadge } from '@/components/contacts/tag-badge'
import { getInitials, formatPhoneNumber, getPrimaryEmail } from '@/lib/utils'
import { Mail, Phone, Building, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/lib/queries/contacts'
import { tagsApi } from '@/lib/queries/tags'

interface ContactListProps {
  contacts: Contact[]
  selectedId?: string
  onSelect: (contact: Contact) => void
  selectedIds?: string[]
  onToggleSelect?: (contactId: string) => void
  onToggleSelectAll?: () => void
  totalCount?: number
  selectAllMode?: 'page' | 'all'
  onSelectAllMatching?: () => void
  isSelectingAll?: boolean
}

interface ContactWithImages extends Contact {
  recent_images?: string[]
}

function getStatusColor(status: Contact['status']) {
  switch (status) {
    case 'LEAD':
      return 'bg-blue-500'
    case 'PROSPECT':
      return 'bg-yellow-500'
    case 'CUSTOMER':
      return 'bg-green-500'
    case 'INACTIVE':
      return 'bg-gray-500'
    default:
      return 'bg-gray-400'
  }
}

export function ContactList({
  contacts,
  selectedId,
  onSelect,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  totalCount = 0,
  selectAllMode = 'page',
  onSelectAllMatching,
  isSelectingAll = false
}: ContactListProps) {
  const router = useRouter()
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Fetch all tags for color mapping
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: tagsApi.getTags,
    retry: false,
  })

  // Create tag lookup map: tagName -> tagObject
  const tagMap = new Map(allTags.map(tag => [tag.name, tag]))

  // Fetch contact fields for grouping (optional, gracefully handle failure)
  const { data: contactFieldsData } = useQuery<ContactFieldDefinition[]>({
    queryKey: ['contact-fields'],
    queryFn: () => contactsApi.getContactFields(),
    retry: false,
    // Don't throw errors if this fails
    throwOnError: false,
  })

  // Ensure contactFields is always an array
  const contactFields = contactFieldsData ?? []

  // Check if all contacts on current page are selected
  const allSelected = contacts.length > 0 && contacts.every(contact => selectedIds.includes(contact.id))
  const someSelected = contacts.some(contact => selectedIds.includes(contact.id)) && !allSelected

  // Toggle expanded state for a card
  const toggleExpanded = (contactId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  // Base fields always shown in collapsed view
  const baseFields = ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'tags', 'status', 'created_at', 'updated_at', 'is_active', 'assigned_to_id', 'source', 'recent_images']

  const hasContactValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  }

  // Count additional populated fields
  const getAdditionalFieldsCount = (contact: Contact): number => {
    return Object.keys(contact).filter((key) => {
      if (baseFields.includes(key)) return false
      return hasContactValue(contact[key as keyof Contact])
    }).length
  }

  // Group additional fields by category
  const groupFieldsByCategory = (contact: Contact): Record<string, Array<{key: string, label: string, value: any, category: string}>> => {
    const grouped: Record<string, any[]> = {}

    Object.entries(contact).forEach(([key, value]) => {
      // Skip base fields and empty values
      if (baseFields.includes(key)) return
      if (!hasContactValue(value)) return

      // Find field definition (with safety check)
      const field = Array.isArray(contactFields) ? contactFields.find((f: any) => f.field_name === key) : null
      if (!field) return

      const category = field.field_category || 'other'
      if (!grouped[category]) grouped[category] = []

      grouped[category].push({
        key,
        label: field.field_label || key,
        value,
        category
      })
    })

    return grouped
  }

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      {onToggleSelect && onToggleSelectAll && contacts.length > 0 && (
        <div className="flex items-center gap-3 pb-2 border-b">
          <Checkbox
            data-testid="contact-select-all-checkbox"
            checked={allSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label="Select all contacts on this page"
          />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm text-muted-foreground" data-testid="bulk-selected-count">
              {selectAllMode === 'all'
                ? `${selectedIds.length} contacts selected`
                : allSelected
                  ? 'Deselect All'
                  : someSelected
                    ? `${selectedIds.length} selected on this page`
                    : 'Select All'}
            </span>

            {onSelectAllMatching && selectedIds.length > 0 && selectAllMode === 'page' && totalCount > contacts.length && (
              <Button
                data-testid="select-all-matching-button"
                variant="link"
                size="sm"
                onClick={onSelectAllMatching}
                disabled={isSelectingAll}
                className="h-auto p-0 text-sm"
              >
                {isSelectingAll ? 'Selecting...' : `Select all ${totalCount} contacts`}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => {
          const isSelected = contact.id === selectedId
          const isChecked = selectedIds.includes(contact.id)
          const fullName = `${contact.first_name} ${contact.last_name}`
          const displayEmail = getPrimaryEmail(contact)

          return (
            <Card
              key={contact.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary',
                isChecked && 'ring-2 ring-blue-500'
              )}
              onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {onToggleSelect && (
                      <Checkbox
                        data-testid={`contact-row-checkbox-${contact.id}`}
                        checked={isChecked}
                        onCheckedChange={() => onToggleSelect(contact.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={getStatusColor(contact.status)}>
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="font-semibold truncate text-blue-600 hover:text-blue-800 hover:underline block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {fullName}
                      </Link>
                      {contact.company && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 min-w-0">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{contact.company}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge variant={contact.status === 'CUSTOMER' ? 'default' : 'secondary'}>
                    {contact.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-1">
                  {displayEmail && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{displayEmail}</span>
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{formatPhoneNumber(contact.phone)}</span>
                    </p>
                  )}
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map((tagName) => {
                      const tag = tagMap.get(tagName)
                      return tag ? (
                        <TagBadge
                          key={tagName}
                          name={tag.name}
                          color={tag.color}
                          size="sm"
                        />
                      ) : (
                        <Badge key={tagName} variant="outline" className="text-xs">
                          {tagName}
                        </Badge>
                      )
                    })}
                    {contact.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{contact.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {(contact as ContactWithImages).recent_images && (contact as ContactWithImages).recent_images!.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Recent Images</p>
                    <div className="flex gap-1">
                      {(contact as ContactWithImages).recent_images!.slice(0, 5).map((imageUrl, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded overflow-hidden border">
                          <img
                            src={imageUrl}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {(contact as ContactWithImages).recent_images!.length > 5 && (
                        <div className="flex items-center justify-center w-12 h-12 rounded border bg-slate-100 text-xs font-medium">
                          +{(contact as ContactWithImages).recent_images!.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expandable Additional Fields Section */}
                {(() => {
                  const additionalFieldsCount = getAdditionalFieldsCount(contact)
                  const isExpanded = expandedCards.has(contact.id)
                  const groupedFields = groupFieldsByCategory(contact)

                  if (additionalFieldsCount === 0) return null

                  return (
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(contact.id)}
                      className="mt-3"
                    >
                      <CollapsibleTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>
                          {isExpanded ? 'Show less' : `Show more (${additionalFieldsCount} field${additionalFieldsCount === 1 ? '' : 's'})`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-3 space-y-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                        {Object.entries(groupedFields).map(([category, fields]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                              {category}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {fields.map((field: any) => (
                                <div key={field.key} className="text-sm min-w-0">
                                  <div className="flex gap-1 min-w-0">
                                    <span className="font-medium text-foreground flex-shrink-0">{field.label}:</span>
                                    <span className="text-muted-foreground truncate">
                                      {typeof field.value === 'boolean'
                                        ? (field.value ? 'Yes' : 'No')
                                        : Array.isArray(field.value)
                                          ? field.value.join(', ')
                                          : String(field.value)
                                      }
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })()}

                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/inbox?contact=${contact.id}`)
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Messages
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}

        {contacts.length === 0 && (
          <div className="col-span-full flex h-64 items-center justify-center text-muted-foreground">
            <p>No contacts found</p>
          </div>
        )}
      </div>
    </div>
  )
}
