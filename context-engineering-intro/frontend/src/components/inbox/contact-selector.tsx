'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/lib/queries/contacts'
import { Contact } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, ChevronDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactSelectorProps {
  selectedContacts: string[] // Array of email addresses
  onContactsChange: (contacts: string[]) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

// Email validation regex (basic)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactSelector({
  selectedContacts,
  onContactsChange,
  disabled,
  placeholder = "Add recipients...",
  label = "To:"
}: ContactSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')

  // Fetch contacts based on search query
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts-search', searchQuery],
    queryFn: () => contactsApi.getContacts({
      search: searchQuery || undefined,
      page_size: 50,
    }),
    enabled: searchQuery.length > 0,
  })

  const contacts = contactsData?.items || []

  // Handle selecting a contact
  const handleSelectContact = (contact: Contact) => {
    const email = contact.email
    if (!email) return

    if (selectedContacts.includes(email)) {
      // Already selected, remove it
      onContactsChange(selectedContacts.filter(e => e !== email))
    } else {
      // Add to selected
      onContactsChange([...selectedContacts, email])
    }

    // Clear search and close popover after short delay
    setTimeout(() => {
      setSearchQuery('')
      setOpen(false)
    }, 100)
  }

  // Handle removing a contact
  const handleRemoveContact = (email: string) => {
    onContactsChange(selectedContacts.filter(e => e !== email))
  }

  // Handle manual email input (typing directly)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const email = inputValue.trim()

      if (email && EMAIL_REGEX.test(email)) {
        if (!selectedContacts.includes(email)) {
          onContactsChange([...selectedContacts, email])
        }
        setInputValue('')
        setSearchQuery('')
        setOpen(false)
      } else if (email) {
        alert(`Invalid email address: ${email}`)
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedContacts.length > 0) {
      // Remove last contact if backspace on empty input
      onContactsChange(selectedContacts.slice(0, -1))
    }
  }

  // Handle input blur (add email if valid)
  const handleInputBlur = () => {
    const email = inputValue.trim()
    if (email && EMAIL_REGEX.test(email)) {
      if (!selectedContacts.includes(email)) {
        onContactsChange([...selectedContacts, email])
      }
      setInputValue('')
      setSearchQuery('')
    }
  }

  // Update search query when input changes
  const handleInputChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    if (value.length > 0) {
      setOpen(true)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-2">
      <label className="text-sm font-medium text-muted-foreground w-12">{label}</label>

      <div className="flex-1 flex flex-wrap gap-2 items-center">
        {/* Selected contacts as badges */}
        {selectedContacts.map((email) => (
          <Badge key={email} variant="secondary" className="pl-2 pr-1">
            {email}
            <button
              type="button"
              onClick={() => handleRemoveContact(email)}
              className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Contact selector with autocomplete */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onFocus={() => {
                  if (inputValue.length > 0) {
                    setOpen(true)
                  }
                }}
                placeholder={selectedContacts.length === 0 ? placeholder : ""}
                disabled={disabled}
                className="w-full outline-none text-sm bg-transparent"
                data-testid="contact-selector-input"
              />
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-[400px] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false}>
              <CommandList>
                {isLoading && (
                  <CommandEmpty>Loading contacts...</CommandEmpty>
                )}
                {!isLoading && contacts.length === 0 && searchQuery.length > 0 && (
                  <CommandEmpty>
                    No contacts found. Press Enter to add "{searchQuery}" as email.
                  </CommandEmpty>
                )}
                {!isLoading && contacts.length > 0 && (
                  <CommandGroup heading="Contacts">
                    {contacts.map((contact) => {
                      if (!contact.email) return null

                      const isSelected = selectedContacts.includes(contact.email)
                      const displayName = `${contact.first_name} ${contact.last_name}`.trim()

                      return (
                        <CommandItem
                          key={contact.id}
                          value={contact.email}
                          onSelect={() => handleSelectContact(contact)}
                          className={cn(
                            "cursor-pointer",
                            isSelected && "bg-accent"
                          )}
                          data-testid={`contact-option-${contact.id}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col flex-1">
                              <div className="font-medium">{displayName}</div>
                              <div className="text-xs text-muted-foreground">{contact.email}</div>
                              {contact.company && (
                                <div className="text-xs text-muted-foreground">{contact.company}</div>
                              )}
                            </div>
                            {isSelected && (
                              <Badge variant="secondary" className="text-xs">Selected</Badge>
                            )}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
