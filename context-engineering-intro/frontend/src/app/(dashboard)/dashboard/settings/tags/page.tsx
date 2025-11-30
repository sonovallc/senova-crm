"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TagBadge } from "@/components/contacts/tag-badge"
import { TagModal } from "@/components/tags/tag-modal"
import { Tag } from "@/types"
import { tagsApi, TagCreate, TagUpdate } from "@/lib/queries/tags"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function TagsManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)

  const isOwner = user?.role === "owner"
  const isAdmin = user?.role === "admin" || isOwner
  const canCreateTags = isAdmin
  const canDeleteTags = isOwner

  // Load tags
  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await tagsApi.getTags()
      setTags(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load tags",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (data: TagCreate) => {
    try {
      await tagsApi.createTag(data)
      toast({
        title: "Success",
        description: "Tag created successfully",
      })
      loadTags()
    } catch (error: any) {
      throw error // Let modal handle the error display
    }
  }

  const handleUpdateTag = async (data: TagUpdate) => {
    if (!selectedTag) return

    try {
      await tagsApi.updateTag(selectedTag.id, data)
      toast({
        title: "Success",
        description: "Tag updated successfully",
      })
      loadTags()
    } catch (error: any) {
      throw error // Let modal handle the error display
    }
  }

  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    try {
      await tagsApi.deleteTag(tagToDelete.id)
      toast({
        title: "Success",
        description: `Tag "${tagToDelete.name}" deleted successfully`,
      })
      setDeleteDialogOpen(false)
      setTagToDelete(null)
      loadTags()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete tag",
        variant: "destructive",
      })
    }
  }

  const openCreateModal = () => {
    setSelectedTag(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag)
    setModalMode("edit")
    setModalOpen(true)
  }

  const openDeleteDialog = (tag: Tag) => {
    setTagToDelete(tag)
    setDeleteDialogOpen(true)
  }

  const handleSaveTag = async (data: TagCreate | TagUpdate) => {
    if (modalMode === "edit") {
      await handleUpdateTag(data as TagUpdate)
    } else {
      await handleCreateTag(data as TagCreate)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-muted-foreground mt-1">
            Organize and categorize your contacts with tags
          </p>
        </div>
      {canCreateTags && (
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground mb-4">No tags created yet</p>
          {canCreateTags && (
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Tag
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag Name</TableHead>
                <TableHead>Contact Count</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <TagBadge name={tag.name} color={tag.color} />
                  </TableCell>
                  <TableCell>{tag.contact_count || 0} contacts</TableCell>
                  <TableCell>
                    {new Date(tag.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canCreateTags && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteTags && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(tag)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tag Create/Edit Modal */}
      <TagModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTag}
        tag={selectedTag}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Delete tag &quot;{tagToDelete?.name}&quot;? This will remove it from{" "}
              {tagToDelete?.contact_count || 0} contacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
