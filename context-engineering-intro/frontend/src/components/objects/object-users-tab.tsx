'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import type { ObjectUser } from '@/types/objects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPermissionModal } from '@/components/objects/user-permission-modal'
import { PermissionBadges } from '@/components/objects/permission-badges'
import { useToast } from '@/hooks/use-toast'
import { Plus, UserCheck, Trash2, Edit, Shield, User } from 'lucide-react'

interface ObjectUsersTabProps {
  objectId: string
  canManage?: boolean
}

export function ObjectUsersTab({ objectId, canManage = false }: ObjectUsersTabProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ObjectUser | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch object users
  const { data: users, isLoading } = useQuery({
    queryKey: ['objects', objectId, 'users'],
    queryFn: () => objectsApi.listUsers(objectId),
  })

  // Remove user mutation
  const removeMutation = useMutation({
    mutationFn: (userId: string) => objectsApi.removeUser(objectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'users'] })
      toast({
        title: 'Success',
        description: 'User removed from object',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to remove user',
        variant: 'destructive',
      })
    },
  })

  const handleRemoveUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this user from the object?')) {
      removeMutation.mutate(userId)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      owner: 'bg-red-100 text-red-800',
      admin: 'bg-orange-100 text-orange-800',
      manager: 'bg-blue-100 text-blue-800',
      agent: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
    }
    return colors[role as keyof typeof colors] || colors.user
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user access and permissions for this object
              </CardDescription>
            </div>
            {canManage && (
              <Button
                className="bg-senova-primary hover:bg-senova-primary-dark text-white"
                onClick={() => setIsAssignModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senova-primary"></div>
            </div>
          ) : !users?.length ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-senova-gray-400 mx-auto mb-3" />
              <p className="text-senova-gray-600">No users assigned</p>
              {canManage && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Assign First User
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((objectUser) => (
                <div
                  key={objectUser.id}
                  className="p-4 bg-senova-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white rounded-full">
                        <User className="h-5 w-5 text-senova-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-senova-gray-900">
                            {objectUser.user.first_name} {objectUser.user.last_name}
                          </p>
                          <Badge className={getRoleBadgeColor(objectUser.user.role)}>
                            {objectUser.user.role.charAt(0).toUpperCase() + objectUser.user.role.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-senova-gray-600 mb-3">
                          {objectUser.user.email}
                        </p>

                        {/* Permissions */}
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <Shield className="h-4 w-4 text-senova-gray-500" />
                            <span className="text-sm font-medium text-senova-gray-700">Permissions:</span>
                          </div>
                          <PermissionBadges permissions={objectUser.permissions} />
                        </div>

                        {/* Assigned date */}
                        <p className="text-xs text-senova-gray-500 mt-3">
                          Assigned on {new Date(objectUser.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(objectUser)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(objectUser.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {(isAssignModalOpen || editingUser) && (
        <UserPermissionModal
          objectId={objectId}
          existingUser={editingUser}
          onClose={() => {
            setIsAssignModalOpen(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setIsAssignModalOpen(false)
            setEditingUser(null)
            queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'users'] })
          }}
        />
      )}
    </>
  )
}