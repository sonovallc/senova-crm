"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TagBadge } from "@/components/contacts/tag-badge"
import { Tag } from "@/types"
import { TagCreate, TagUpdate } from "@/lib/queries/tags"

interface TagModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: TagCreate | TagUpdate) => Promise<void>
  tag?: Tag | null
  mode: "create" | "edit"
}

// Predefined color presets
const COLOR_PRESETS = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Gray", value: "#6B7280" },
]

export function TagModal({ open, onClose, onSave, tag, mode }: TagModalProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLOR_PRESETS[0].value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Initialize form data when tag changes or modal opens
  useEffect(() => {
    if (tag && mode === "edit") {
      setName(tag.name)
      setColor(tag.color)
    } else {
      setName("")
      setColor(COLOR_PRESETS[0].value)
    }
    setError("")
  }, [tag, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!name.trim()) {
      setError("Tag name is required")
      return
    }

    if (name.length > 50) {
      setError("Tag name must be 50 characters or less")
      return
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setError("Invalid color format. Use hex format like #FF5733")
      return
    }

    setLoading(true)
    try {
      const data = mode === "edit" && tag
        ? { name: name.trim(), color }
        : { name: name.trim(), color }

      await onSave(data)
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save tag")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName("")
    setColor(COLOR_PRESETS[0].value)
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Tag" : "Edit Tag"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new tag to categorize contacts."
              : "Update the tag name or color."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Tag Name */}
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                placeholder="e.g., VIP, Hot Lead"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters
              </p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    className={`h-10 rounded-md border-2 transition-all ${
                      color === preset.value
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    disabled={loading}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="#FF5733"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="font-mono"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
                <TagBadge name={name || "Tag Name"} color={color} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create Tag" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
