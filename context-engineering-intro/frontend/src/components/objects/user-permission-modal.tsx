'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import { api } from '@/lib/api'
import type { ObjectUser, ObjectPermissions, AssignUserRequest } from '@/types/objects'
import type { User } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Shield, Loader2, Info } from 'lucide-react'

interface UserPermissionModalProps {
  objectId: string
  existingUser?: ObjectUser | null
  onClose: () => void
  onSuccess: () => void
}

export function UserPermissionModal({
  objectId,
  existingUser,
  onClose,
  onSuccess
}: UserPermissionModalProps) {
  const [selectedUserId, setSelectedUserId] = useState(existingUser?.user_id || '')
  const [permissions, setPermissions] = useState<ObjectPermissions>({
    can_view: true,
    can_manage_contacts: false,
    can_manage_company_info: false,
    can_manage_websites: false,
    can_assign_users: false,
    manageable_fields: []
  })

  const { toast } = useToast()

  // Initialize permissions from existing user
  useEffect(() => {
    if (existingUser) {
      setPermissions(existingUser.permissions)
    }
  }, [existingUser])

  // Fetch available users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/v1/users')
      // Backend returns { items: [...], total, page, page_size, pages }
      return res.data?.items || res.data || []
    },
    enabled: !existingUser,
  })

  // Assign user mutation
  const assignMutation = useMutation({
    mutationFn: (data: AssignUserRequest) => objectsApi.assignUser(objectId, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User assigned successfully',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to assign user',
        variant: 'destructive',
      })
    },
  })

  // Update permissions mutation
  const updateMutation = useMutation({
    mutationFn: (permissions: Partial<ObjectPermissions>) =>
      objectsApi.updateUserPermissions(objectId, existingUser!.user_id, permissions),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to update permissions',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (existingUser) {
      updateMutation.mutate(permissions)
    } else {
      if (!selectedUserId) {
        toast({
          title: 'No user selected',
          description: 'Please select a user to assign',
          variant: 'destructive',
        })
        return
      }
      assignMutation.mutate({
        user_id: selectedUserId,
        permissions
      })
    }
  }

  const isSubmitting = assignMutation.isPending || updateMutation.isPending

  // Preset permission templates
  const applyTemplate = (template: 'viewer' | 'editor' | 'manager') => {
    switch (template) {
      case 'viewer':
        setPermissions({
          can_view: true,
          can_manage_contacts: false,
          can_manage_company_info: false,
          can_manage_websites: false,
          can_assign_users: false,
          manageable_fields: []
        })
        break
      case 'editor':
        setPermissions({
          can_view: true,
          can_manage_contacts: true,
          can_manage_company_info: true,
          can_manage_websites: false,
          can_assign_users: false,
          manageable_fields: []
        })
        break
      case 'manager':
        setPermissions({
          can_view: true,
          can_manage_contacts: true,
          can_manage_company_info: true,
          can_manage_websites: true,
          can_assign_users: true,
          manageable_fields: []
        })
        break
    }
  }

  return (
    <Dialog open onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingUser ? 'Edit User Permissions' : 'Assign User'}
          </DialogTitle>
          <DialogDescription>
            {existingUser
              ? `Configure permissions for ${existingUser.user.first_name} ${existingUser.user.last_name}`
              : 'Select a user and configure their permissions for this object'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* User Selection (only for new assignment) */}
          {!existingUser && (
            <div>
              <Label htmlFor="user">Select User *</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    Array.isArray(users) && users.length > 0 ? (
                      users
                        .filter((user) => user?.id) // Ensure user has valid id
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No users available
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Permission Templates */}
          <div>
            <Label>Quick Templates</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('viewer')}
              >
                Viewer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('editor')}
              >
                Editor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('manager')}
              >
                Manager
              </Button>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions</Label>

            <div className="space-y-3 p-4 bg-senova-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-senova-gray-600" />
                  <Label htmlFor="can_view" className="cursor-pointer font-normal">
                    View Object
                  </Label>
                </div>
                <Switch
                  id="can_view"
                  checked={permissions.can_view}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_view: checked })
                  }
                  disabled // Always enabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-senova-gray-600" />
                  <Label htmlFor="can_manage_contacts" className="cursor-pointer font-normal">
                    Manage Contacts
                  </Label>
                </div>
                <Switch
                  id="can_manage_contacts"
                  checked={permissions.can_manage_contacts}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_manage_contacts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-senova-gray-600" />
                  <Label htmlFor="can_manage_company_info" className="cursor-pointer font-normal">
                    Manage Company Info
                  </Label>
                </div>
                <Switch
                  id="can_manage_company_info"
                  checked={permissions.can_manage_company_info}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_manage_company_info: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-senova-gray-600" />
                  <Label htmlFor="can_manage_websites" className="cursor-pointer font-normal">
                    Manage Websites
                  </Label>
                </div>
                <Switch
                  id="can_manage_websites"
                  checked={permissions.can_manage_websites}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_manage_websites: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-senova-gray-600" />
                  <Label htmlFor="can_assign_users" className="cursor-pointer font-normal">
                    Assign Users
                  </Label>
                </div>
                <Switch
                  id="can_assign_users"
                  checked={permissions.can_assign_users}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_assign_users: checked })
                  }
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Users with these permissions can access and modify the specified areas of this object.
                Object owners always have full permissions.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-senova-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
              disabled={isSubmitting || (!existingUser && !selectedUserId)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingUser ? 'Updating...' : 'Assigning...'}
                </>
              ) : (
                <>{existingUser ? 'Update Permissions' : 'Assign User'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}