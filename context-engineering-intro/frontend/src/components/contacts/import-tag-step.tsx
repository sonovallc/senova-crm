"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { TagBadge } from "@/components/contacts/tag-badge"
import { TagSelector } from "@/components/contacts/tag-selector"
import { Button } from "@/components/ui/button"
import { useTags, tagsApi, TagCreate } from "@/lib/queries/tags"
import { TagModal } from "@/components/tags/tag-modal"
import { Tag } from "@/types"

interface ImportTagStepProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  onNext: () => void
  onBack: () => void
  canManageTags?: boolean
  roleLoading?: boolean
}

export function ImportTagStep({
  selectedTagIds,
  onChange,
  onNext,
  onBack,
  canManageTags = false,
  roleLoading = false,
}: ImportTagStepProps) {
  const { data: tags = [], isLoading: tagsLoading } = useTags()
  const queryClient = useQueryClient()
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const isTagSelectorLoading = tagsLoading || roleLoading

  const toggleTag = (tagId: string) => {
    onChange(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    )
  }

  const handleCreateTag = async (data: TagCreate) => {
    const newTag = await tagsApi.createTag(data)
    queryClient.setQueryData<Tag[] | undefined>(['tags'], (old) =>
      old ? [...old, newTag] : [newTag]
    )
    onChange(Array.from(new Set([...selectedTagIds, newTag.id])))
  }

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Step 3: Select Tags</h2>
        <p className="text-muted-foreground">
          Choose tags to apply to every contact in this import. You can skip this step if you
          want to tag contacts later.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Tags to Apply</h3>
            <p className="text-sm text-muted-foreground">
              Contacts will immediately inherit any tags you select here.
            </p>
          </div>
          {tagsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tags...
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4 min-h-[120px]">
          {selectedTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tags selected. Click &ldquo;Add Tag&rdquo; to choose existing tags.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  size="sm"
                  onRemove={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          )}

          {!isTagSelectorLoading && (
            <div className="mt-4">
              <TagSelector
                tags={tags}
                selectedTagIds={selectedTagIds}
                onSelectTag={toggleTag}
                loading={isTagSelectorLoading}
                canCreateTags={canManageTags}
                onCreateTag={canManageTags ? () => setIsTagModalOpen(true) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Pro tip: Tags make it easy to find and segment the contacts you just imported. Apply
          your &ldquo;CSV Import&rdquo; or campaign tags before previewing the import results.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            onChange([])
            onNext()
          }}
        >
          Skip Tagging
        </Button>
        <Button onClick={onNext}>
          Next: Review Duplicates
        </Button>
      </div>

      <TagModal
        open={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSave={async (payload) => {
          await handleCreateTag(payload as TagCreate)
        }}
        mode="create"
      />
    </div>
  )
}
