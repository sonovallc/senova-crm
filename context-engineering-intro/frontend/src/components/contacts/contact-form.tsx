'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Contact, Tag, ContactFieldDefinition, UserRef } from '@/types'
import { Plus, Trash2, ChevronDown, ChevronUp, Phone, DollarSign, Building2, MapPin, User, Search, Lock, Settings, Database, X } from 'lucide-react'
import { TagBadge } from '@/components/contacts/tag-badge'
import { TagSelector } from '@/components/contacts/tag-selector'
import { TagCreate, TagUpdate, tagsApi } from '@/lib/queries/tags'
import { useToast } from '@/hooks/use-toast'
import { getPrimaryEmail } from '@/lib/utils'
import { TagModal } from '@/components/tags/tag-modal'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/lib/auth'

const phoneSchema = z.object({
  type: z.string().min(1, 'Phone type is required'),
  number: z.string().min(1, 'Phone number is required'),
})

const addressSchema = z.object({
  type: z.string().min(1, 'Address type is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('USA'),
})

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['LEAD', 'PROSPECT', 'CUSTOMER', 'INACTIVE']),
  phones: z.array(phoneSchema).default([]),
  addresses: z.array(addressSchema).default([]),
  websites: z.array(z.string().url('Invalid URL')).default([]),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  contact?: Contact
  onSubmit: (data: ContactFormData, tagIds?: string[]) => void
  onCancel: () => void
  isLoading?: boolean
}

const PHONE_TYPES = ['Mobile', 'Home', 'Work', 'Other'] as const
const ADDRESS_TYPES = ['Home', 'Work', 'Other'] as const

// Define 9 field groups for organized display
const FIELD_GROUPS = [
  {
    id: 'contact',
    title: '📞 Contact Information',
    icon: Phone,
    defaultOpen: true,
    categories: ['contact', 'contact_information']
  },
  {
    id: 'financial',
    title: '💰 Financial Qualification',
    icon: DollarSign,
    defaultOpen: false,
    categories: ['financial']
  },
  {
    id: 'company',
    title: '🏢 Company & Employment',
    icon: Building2,
    defaultOpen: true,
    categories: ['company', 'professional']
  },
  {
    id: 'address',
    title: '📍 Personal Address',
    icon: MapPin,
    defaultOpen: false,
    categories: [] // Will handle via addresses array
  },
  {
    id: 'demographics',
    title: '👤 Demographics',
    icon: User,
    defaultOpen: false,
    categories: ['demographic']
  },
  {
    id: 'data_sources',
    title: '🔍 Data Sources & Verification',
    icon: Search,
    defaultOpen: false,
    categories: ['skiptrace']
  },
  {
    id: 'security',
    title: '🔐 Security/Hashing',
    icon: Lock,
    defaultOpen: false,
    categories: [] // Will filter SHA256 fields
  },
  {
    id: 'crm',
    title: '⚙️ CRM Management',
    icon: Settings,
    defaultOpen: false,
    categories: ['behavioral', 'social']
  },
  {
    id: 'system',
    title: '🗄️ System Fields',
    icon: Database,
    defaultOpen: false,
    categories: ['technical']
  }
]

export function ContactForm({ contact, onSubmit, onCancel, isLoading }: ContactFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [contactFields, setContactFields] = useState<ContactFieldDefinition[]>([])
  const [users, setUsers] = useState<UserRef[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | boolean | null>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    FIELD_GROUPS.reduce((acc, group) => ({ ...acc, [group.id]: group.defaultOpen }), {})
  )
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [contactTags, setContactTags] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const canManageTags = currentRole === 'owner' || currentRole === 'admin'

  useEffect(() => {
    let isMounted = true
    if (user) {
      setCurrentRole(user.role)
      return
    }

    const fetchRole = async () => {
      try {
        console.log('ContactForm fetching role via authService.getMe')
        const profile = await authService.getMe()
        if (isMounted) {
          setCurrentRole(profile.role)
          console.log('ContactForm resolved role:', profile.role)
        }
      } catch (error) {
        if (isMounted) {
          setCurrentRole(null)
          console.log('ContactForm failed to resolve role')
        }
      }
    }

    fetchRole()

    return () => {
      isMounted = false
    }
  }, [user])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: getPrimaryEmail(contact),
          phone: contact.phone ?? '',
          company: contact.company ?? '',
          status: contact.status,
          phones: contact.phones ?? [],
          addresses: contact.addresses ?? [],
          websites: contact.websites ?? [],
        }
      : {
          status: 'LEAD',
          phones: [],
          addresses: [],
          websites: [],
        },
  })

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray<ContactFormData, 'phones'>({
    control,
    name: 'phones',
  })

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray<ContactFormData, 'addresses'>({
    control,
    name: 'addresses',
  })

  const status = watch('status')
  const websites = watch('websites') || []
  const assignedToValue =
    (fieldValues['assigned_to_id'] as string | null | undefined) ??
    contact?.assigned_to_id ??
    null

  const appendWebsite = () => {
    setValue('websites', [...websites, ''])
  }

  const removeWebsite = (index: number) => {
    setValue('websites', websites.filter((_, i) => i !== index))
  }

  // Fetch dynamic contact fields, users, and tags
  useEffect(() => {
    fetchContactFields()
    fetchUsers()
    fetchAllTags()
  }, [])

  // Fetch contact tags when editing
  useEffect(() => {
    if (contact?.id) {
      fetchContactTags()
    }
  }, [contact?.id])

  // Reset form when contact changes (fixes bug where fields aren't populated when editing)
  useEffect(() => {
    if (contact) {
      reset({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: getPrimaryEmail(contact),
        phone: contact.phone ?? '',
        company: contact.company ?? '',
        status: contact.status,
        phones: contact.phones ?? [],
        addresses: contact.addresses ?? [],
        websites: contact.websites ?? [],
      })
    }
  }, [contact, reset])

  // Initialize field values from contact
  useEffect(() => {
    if (contact) {
      const values: Record<string, string | number | boolean | null> = {}
      const dynamicContact = contact as unknown as Record<string, unknown>
      contactFields.forEach(field => {
        const fieldValue = dynamicContact[field.field_name]
        if (typeof fieldValue === 'string' || typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
          values[field.field_name] = fieldValue
        } else if (fieldValue === null) {
          values[field.field_name] = null
        } else {
          values[field.field_name] = ''
        }
      })
      setFieldValues(values)
    }
  }, [contact, contactFields])

  const fetchContactFields = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/contacts/fields`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        }
      })
      const data = (await response.json()) as { fields?: ContactFieldDefinition[] }
      setContactFields(data.fields || [])
    } catch (error) {
      console.error('Failed to load contact fields:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        }
      })
      const data = (await response.json()) as { items?: UserRef[] }
      setUsers(data.items || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const fetchAllTags = async () => {
    try {
      const tags = await tagsApi.getTags()
      setAllTags(tags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const fetchContactTags = async () => {
    if (!contact?.id) return

    try {
      setTagsLoading(true)
      const tags = await tagsApi.getContactTags(contact.id)
      setContactTags(tags)
    } catch (error) {
      console.error('Failed to load contact tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  const handleAddTag = async (tagId: string) => {
    if (!contact?.id) {
      // For new contacts, just add to local state
      const tag = allTags.find(t => t.id === tagId)
      if (tag && !contactTags.find(t => t.id === tagId)) {
        setContactTags([...contactTags, tag])
      }
      return
    }

    try {
      await tagsApi.addTagToContact(contact.id, tagId)
      toast({
        title: 'Success',
        description: 'Tag added to contact',
      })
      fetchContactTags()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to add tag',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!contact?.id) {
      // For new contacts, just remove from local state
      setContactTags(contactTags.filter(t => t.id !== tagId))
      return
    }

    try {
      await tagsApi.removeTagFromContact(contact.id, tagId)
      toast({
        title: 'Success',
        description: 'Tag removed from contact',
      })
      fetchContactTags()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to remove tag',
        variant: 'destructive',
      })
    }
  }

  const handleCreateTagFromModal = async (data: TagCreate) => {
    try {
      const newTag = await tagsApi.createTag(data)
      setAllTags(prev => [...prev, newTag])
      await handleAddTag(newTag.id)
    } catch (error) {
      throw error
    }
  }

  const handleCreateTagModalSave = async (data: TagCreate | TagUpdate) => {
    await handleCreateTagFromModal(data as TagCreate)
  }

  const handleFieldChange = (fieldName: string, value: string | number | boolean | null) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }))
  }

  // Group fields by category
  const fieldsByCategory = contactFields.reduce((acc: Record<string, ContactFieldDefinition[]>, field) => {
    const category = field.field_category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(field)
    return acc
  }, {})

  const handleFormSubmit = (formData: ContactFormData) => {
    // Merge react-hook-form data with dynamic field values
    // IMPORTANT: formData should come LAST to preserve user's edits from React Hook Form
    // fieldValues contains original contact data including first_name, last_name, etc.
    // If fieldValues spreads last, it OVERWRITES the user's edits!
    const completeData = {
      ...fieldValues,     // Dynamic field values (original contact data)
      ...formData,        // React Hook Form values (user's edits) - TAKES PRECEDENCE
    } as ContactFormData
    // Pass tags IDs for new contacts (they'll be added after contact creation)
    const tagIds = contactTags.map(t => t.id)
    onSubmit(completeData, contact ? undefined : tagIds)
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input id="first_name" {...register('first_name')} disabled={isLoading} />
            {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input id="last_name" {...register('last_name')} disabled={isLoading} />
            {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} disabled={isLoading} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Legacy)</Label>
          <Input id="phone" type="tel" {...register('phone')} disabled={isLoading} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register('company')} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(value) => setValue('status', value as Contact['status'])} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LEAD">Lead</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Select
            value={assignedToValue ?? 'unassigned'}
            onValueChange={(value) => handleFieldChange('assigned_to_id', value === 'unassigned' ? null : value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tags</h3>
          <TagSelector
            tags={allTags}
            selectedTagIds={contactTags.map(t => t.id)}
            onSelectTag={handleAddTag}
            loading={tagsLoading}
            canCreateTags={canManageTags}
            onCreateTag={canManageTags ? () => setIsTagModalOpen(true) : undefined}
          />
        </div>

        {contactTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {contactTags.map((tag) => (
              <div key={tag.id} className="inline-flex items-center gap-1">
                <TagBadge name={tag.name} color={tag.color} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveTag(tag.id)}
                  disabled={isLoading || tagsLoading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags added yet</p>
        )}
      </div>

      {/* Phone Numbers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Phone Numbers</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendPhone({ type: 'Mobile', number: '' })}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Phone
          </Button>
        </div>

        {phoneFields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor={`phones.${index}.type`}>Type</Label>
                <Select
                  value={watch(`phones.${index}.type`)}
                  onValueChange={(value) => setValue(`phones.${index}.type`, value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_TYPES.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.phones?.[index]?.type && (
                  <p className="text-sm text-destructive">{errors.phones[index]?.type?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`phones.${index}.number`}>Number</Label>
                <Input
                  id={`phones.${index}.number`}
                  {...register(`phones.${index}.number`)}
                  placeholder="555-1234"
                  disabled={isLoading}
                />
                {errors.phones?.[index]?.number && (
                  <p className="text-sm text-destructive">{errors.phones[index]?.number?.message}</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePhone(index)}
              disabled={isLoading}
              className="mt-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Addresses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Addresses</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendAddress({ type: 'Home', street: '', city: '', state: '', zip: '', country: 'USA' })
            }
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Address
          </Button>
        </div>

        {addressFields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`addresses.${index}.type`}>Type</Label>
                <Select
                  value={watch(`addresses.${index}.type`)}
                  onValueChange={(value) => setValue(`addresses.${index}.type`, value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAddress(index)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`addresses.${index}.street`}>Street Address</Label>
              <Input
                id={`addresses.${index}.street`}
                {...register(`addresses.${index}.street`)}
                placeholder="123 Main St"
                disabled={isLoading}
              />
              {errors.addresses?.[index]?.street && (
                <p className="text-sm text-destructive">{errors.addresses[index]?.street?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor={`addresses.${index}.city`}>City</Label>
                <Input
                  id={`addresses.${index}.city`}
                  {...register(`addresses.${index}.city`)}
                  placeholder="Boston"
                  disabled={isLoading}
                />
                {errors.addresses?.[index]?.city && (
                  <p className="text-sm text-destructive">{errors.addresses[index]?.city?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`addresses.${index}.state`}>State</Label>
                <Input
                  id={`addresses.${index}.state`}
                  {...register(`addresses.${index}.state`)}
                  placeholder="MA"
                  disabled={isLoading}
                />
                {errors.addresses?.[index]?.state && (
                  <p className="text-sm text-destructive">{errors.addresses[index]?.state?.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor={`addresses.${index}.zip`}>ZIP Code</Label>
                <Input
                  id={`addresses.${index}.zip`}
                  {...register(`addresses.${index}.zip`)}
                  placeholder="02101"
                  disabled={isLoading}
                />
                {errors.addresses?.[index]?.zip && (
                  <p className="text-sm text-destructive">{errors.addresses[index]?.zip?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`addresses.${index}.country`}>Country</Label>
                <Input
                  id={`addresses.${index}.country`}
                  {...register(`addresses.${index}.country`)}
                  defaultValue="USA"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Websites */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Websites</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={appendWebsite}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Website
          </Button>
        </div>

        {websites.map((value: string, index: number) => (
          <div key={`website-${index}`} className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`websites.${index}`}>Website URL</Label>
              <Input
                id={`websites.${index}`}
                {...register(`websites.${index}` as const)}
                placeholder="https://example.com"
                type="url"
                disabled={isLoading}
              />
              {errors.websites?.[index] && (
                <p className="text-sm text-destructive">{errors.websites[index]?.message}</p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeWebsite(index)}
              disabled={isLoading}
              className="mt-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Dynamic Contact Fields - Organized into 9 Collapsible Groups */}
      {FIELD_GROUPS.map((fieldGroup) => {
        // Get all fields for this group's categories
        const groupFields = contactFields.filter(field => {
          // Special handling for Security/Hashing group - SHA256 fields
          if (fieldGroup.id === 'security') {
            return field.field_name.includes('sha256')
          }
          // All other groups use category matching
          return field.field_category ? fieldGroup.categories.includes(field.field_category) : false
        })

        // Skip address group (handled separately above)
        if (fieldGroup.id === 'address') return null

        // Skip empty groups
        if (groupFields.length === 0) return null

        // Helper function to check if a field is an overflow field (has _2, _3, ..., _30 suffix)
        const isOverflowField = (fieldName: string): boolean => {
          return /_([2-9]|[12][0-9]|30)$/.test(fieldName)
        }

        // Helper function to check if a field should be shown
        const shouldShowField = (field: any): boolean => {
          // Always show base fields (no _2, _3 suffix)
          if (!isOverflowField(field.field_name)) {
            return true
          }
          // For overflow fields, only show if they have a value
          const value = fieldValues[field.field_name]
          return value != null && value !== '' && value !== false
        }

        // Filter fields before processing
        const visibleFields = groupFields.filter(shouldShowField)

        // Group phone fields with their DNC counterparts
        const processedFields = new Set<string>()
        const fieldGroups: Array<{ fields: any[], isPhoneDncPair: boolean }> = []

        visibleFields.forEach((field) => {
          if (processedFields.has(field.field_name)) return

          // Check if this is a phone field with a DNC counterpart
          const dncFieldName = `${field.field_name}_dnc`
          const dncField = visibleFields.find(f => f.field_name === dncFieldName)

          if (dncField) {
            // This is a phone+DNC pair
            fieldGroups.push({
              fields: [field, dncField],
              isPhoneDncPair: true
            })
            processedFields.add(field.field_name)
            processedFields.add(dncFieldName)
          } else if (!field.field_name.endsWith('_dnc')) {
            // Regular field (not a DNC field)
            fieldGroups.push({
              fields: [field],
              isPhoneDncPair: false
            })
            processedFields.add(field.field_name)
          }
        })

        const GroupIcon = fieldGroup.icon

        return (
          <Collapsible
            key={fieldGroup.id}
            open={openGroups[fieldGroup.id]}
            onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, [fieldGroup.id]: open }))}
            className="space-y-4 border rounded-lg p-4"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors">
              <div className="flex items-center gap-2">
                <GroupIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{fieldGroup.title}</h3>
              </div>
              {openGroups[fieldGroup.id] ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
              {fieldGroups.map((group, groupIdx) => {
                if (group.isPhoneDncPair) {
                  const [phoneField, dncField] = group.fields
                  const phoneValue = fieldValues[phoneField.field_name]
                  const safePhoneValue = typeof phoneValue === 'string' ? phoneValue : ''
                  return (
                    <div key={phoneField.field_name} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {phoneField.field_label}
                        {phoneField.is_sensitive && (
                          <Badge variant="destructive" className="text-xs">Sensitive</Badge>
                        )}
                      </Label>
                      {/* Side-by-side phone and DNC */}
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Input
                            value={safePhoneValue}
                            onChange={(e) => handleFieldChange(phoneField.field_name, e.target.value)}
                            placeholder={`Enter ${phoneField.field_label.toLowerCase()}`}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Select
                            value={fieldValues[dncField.field_name]?.toString() || 'false'}
                            onValueChange={(value) => handleFieldChange(dncField.field_name, value === 'true')}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false">No DNC</SelectItem>
                              <SelectItem value="true">DNC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  const field = group.fields[0]
                  const fieldValue = fieldValues[field.field_name]
                  return (
                    <div key={field.field_name} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {field.field_label}
                        {field.is_sensitive && (
                          <Badge variant="destructive" className="text-xs">Sensitive</Badge>
                        )}
                      </Label>
                      {field.field_type === 'boolean' ? (
                        <Select
                          value={fieldValue !== undefined && fieldValue !== null ? fieldValue.toString() : undefined}
                          onValueChange={(value) => handleFieldChange(field.field_name, value === 'true')}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : field.field_type === 'integer' ? (
                        <Input
                          type="number"
                          value={
                            typeof fieldValue === 'number'
                              ? fieldValue
                              : typeof fieldValue === 'string'
                                ? fieldValue
                                : ''
                          }
                          onChange={(e) => handleFieldChange(field.field_name, e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          disabled={isLoading}
                        />
                      ) : (
                        <Input
                          value={typeof fieldValue === 'string' ? fieldValue : ''}
                          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  )
                }
              })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}

      {/* Additional Information from CSV Import (Overflow Data) */}
      {contact && contact.overflow_data && Object.keys(contact.overflow_data).length > 0 && (
        <div className="space-y-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Additional Information (From CSV Import)</h3>
            <p className="text-sm text-muted-foreground">
              These are additional values that were found in your CSV import for fields that had comma-delimited data.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(contact.overflow_data).map(([field, values]) => (
              <div key={field} className="space-y-2">
                <Label className="capitalize font-semibold">{field.replace(/_/g, ' ')} (Additional Values)</Label>
                <div className="grid gap-2">
                  {values.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded border">
                      <Badge variant="outline" className="text-xs">#{idx + 2}</Badge>
                      <span className="flex-1 font-mono text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Actions - Sticky at bottom */}
      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-2 border-t mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} data-testid="contact-form-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="contact-form-submit">
          {isLoading ? 'Saving...' : contact ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
    <TagModal
      open={isTagModalOpen}
      onClose={() => setIsTagModalOpen(false)}
      onSave={handleCreateTagModalSave}
      tag={null}
      mode="create"
    />
    </>
  )
}
