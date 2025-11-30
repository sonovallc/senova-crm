"use client"

import { useState, useEffect } from "react"
import { Check, Plus, Search } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { TagBadge } from "./tag-badge"
import { Tag } from "@/types"
import { cn } from "@/lib/utils"

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  onSelectTag: (tagId: string) => void
  onCreateTag?: () => void
  canCreateTags?: boolean
  loading?: boolean
}

export function TagSelector({
  tags,
  selectedTagIds,
  onSelectTag,
  onCreateTag,
  canCreateTags = false,
  loading = false,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Filter tags based on search
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              No tags found.
              {canCreateTags && onCreateTag && (
                <Button
                  variant="link"
                  className="mt-2 block w-full"
                  onClick={() => {
                    setOpen(false)
                    onCreateTag()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new tag
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id)
              return (
                <CommandItem
                  key={tag.id}
                  onSelect={() => {
                    onSelectTag(tag.id)
                    setOpen(false)
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
          {canCreateTags && onCreateTag && filteredTags.length > 0 && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => {
                  setOpen(false)
                  onCreateTag()
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new tag
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
