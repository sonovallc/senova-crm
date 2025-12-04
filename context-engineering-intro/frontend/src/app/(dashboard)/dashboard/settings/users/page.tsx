"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, CheckCircle, XCircle, Shield, KeyRound, Trash2, ChevronDown, ChevronUp, Package, Unlink } from "lucide-react"
import { useRouter } from "next/navigation"
import { PasswordResetDialog } from "@/components/password-reset-dialog"
import { objectsApi, type UserObject } from "@/lib/api/objects"
import { useToast } from "@/hooks/use-toast"
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

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: "owner" | "admin" | "user"
  is_active: boolean
  is_approved: boolean
  created_at: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // State for expanded users and their objects
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [userObjects, setUserObjects] = useState<Record<string, UserObject[]>>({})
  const [loadingObjects, setLoadingObjects] = useState<Record<string, boolean>>({})

  // Check if user has permission (owner or admin only)
  useEffect(() => {
    if (user && user.role !== "owner" && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError("")

    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.items || [])
    } catch (err) {
      // Ignore abort errors (these are intentional cancellations)
      if (err instanceof Error && err.name === "AbortError") {
        return
      }
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/approve`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve user")
      }

      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve user")
    }
  }

  const deactivateUser = async (userId: string) => {
    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/deactivate`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to deactivate user")
      }

      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate user")
    }
  }

  const reactivateUser = async (userId: string) => {
    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/reactivate`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to reactivate user")
      }

      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate user")
    }
  }

  const changeRole = async (userId: string, newRole: "owner" | "admin" | "user") => {
    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/change-role`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, new_role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to change role")
      }

      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role")
    }
  }

  const openPasswordResetDialog = (targetUser: User) => {
    setSelectedUser(targetUser)
    setPasswordResetDialogOpen(true)
  }

  const openDeleteDialog = (targetUser: User) => {
    setUserToDelete(targetUser)
    setDeleteDialogOpen(true)
  }

  const deleteUser = async () => {
    if (!userToDelete) return

    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/delete`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userToDelete.id }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to delete user")
      }

      // Close dialog and refresh users list
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
      setDeleteDialogOpen(false)
    }
  }

  const toggleUserExpanded = async (userId: string) => {
    const newExpanded = new Set(expandedUsers)

    if (newExpanded.has(userId)) {
      // Collapse
      newExpanded.delete(userId)
      setExpandedUsers(newExpanded)
    } else {
      // Expand and fetch objects if not already loaded
      newExpanded.add(userId)
      setExpandedUsers(newExpanded)

      if (!userObjects[userId]) {
        await fetchUserObjects(userId)
      }
    }
  }

  const fetchUserObjects = async (userId: string) => {
    setLoadingObjects(prev => ({ ...prev, [userId]: true }))

    try {
      const objects = await objectsApi.getUserObjects(userId)
      setUserObjects(prev => ({ ...prev, [userId]: objects }))
    } catch (err) {
      console.error(`Failed to fetch objects for user ${userId}:`, err)
      setUserObjects(prev => ({ ...prev, [userId]: [] }))
    } finally {
      setLoadingObjects(prev => ({ ...prev, [userId]: false }))
    }
  }

  const unassignObject = async (objectId: string, userId: string, objectName: string, userEmail: string) => {
    try {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/objects/${objectId}/users/${userId}`,
        {
          method: "DELETE",
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || "Failed to unassign object"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      // Success - show toast and refresh
      toast({
        title: "Success",
        description: `${userEmail} has been unassigned from ${objectName}`,
      })

      // Refresh the user's objects
      await fetchUserObjects(userId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unassign object"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: "default",
      admin: "secondary",
      user: "outline",
    } as const

    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"}>
        {role.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        {/* Only owner can create new users */}
        {user?.role === "owner" && (
          <Button onClick={() => router.push("/dashboard/settings/users/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users.map((u) => (
          <Card key={u.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {u.first_name && u.last_name
                      ? `${u.first_name} ${u.last_name}`
                      : u.email}
                    {getRoleBadge(u.role)}
                    {!u.is_approved && (
                      <Badge variant="outline" className="text-orange-600">
                        PENDING
                      </Badge>
                    )}
                    {!u.is_active && (
                      <Badge variant="destructive">INACTIVE</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {u.email} • Created {new Date(u.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  {!u.is_approved && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => approveUser(u.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}

                  {u.id !== user?.id && (
                    u.is_active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateUser(u.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => reactivateUser(u.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Reactivate
                      </Button>
                    )
                  )}

                  {(user?.role === "owner" || user?.role === "admin") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPasswordResetDialog(u)}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                  )}

                  {/* View Objects button - Only for owner viewing other users */}
                  {user?.role === "owner" && u.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserExpanded(u.id)}
                    >
                      {expandedUsers.has(u.id) ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Hide Objects
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-2 h-4 w-4" />
                          View Objects
                        </>
                      )}
                    </Button>
                  )}

                  {/* Delete button - Only OWNER can delete users (admin can only deactivate/pause) */}
                  {user?.role === "owner" && u.id !== user?.id && u.role !== "owner" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(u)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}

                  {user?.role === "owner" && u.id !== user?.id && (
                    <div className="flex gap-1">
                      {u.role !== "owner" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => changeRole(u.id, "owner")}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      {u.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => changeRole(u.id, "admin")}
                        >
                          Admin
                        </Button>
                      )}
                      {u.role !== "user" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => changeRole(u.id, "user")}
                        >
                          User
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Expanded Objects Section */}
            {expandedUsers.has(u.id) && user?.role === "owner" && (
              <CardContent>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Assigned Objects</span>
                  </div>

                  {loadingObjects[u.id] ? (
                    <p className="text-sm text-muted-foreground">Loading objects...</p>
                  ) : userObjects[u.id] && userObjects[u.id].length > 0 ? (
                    <div className="space-y-2">
                      {userObjects[u.id].map(obj => (
                        <div
                          key={obj.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{obj.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {obj.type}
                              </Badge>
                              {obj.role_name && (
                                <Badge variant="secondary" className="text-xs">
                                  {obj.role_name}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Permissions: {Object.entries(obj.permissions)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key.replace('can_', '').replace(/_/g, ' '))
                                .join(', ') || 'View only'}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to unassign ${u.email} from ${obj.name}?`)) {
                                unassignObject(obj.id, u.id, obj.name, u.email)
                              }
                            }}
                          >
                            <Unlink className="h-4 w-4" />
                            <span className="ml-2">Unassign</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No objects assigned</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48">
            <p className="text-muted-foreground mb-4">No users found</p>
            {/* Only owner can create new users */}
            {user?.role === "owner" && (
              <Button onClick={() => router.push("/dashboard/settings/users/new")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create First User
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Password Reset Dialog */}
      {selectedUser && (
        <PasswordResetDialog
          open={passwordResetDialogOpen}
          onOpenChange={setPasswordResetDialogOpen}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          isSelf={selectedUser.id === user?.id}
          onSuccess={() => {
            // Optionally show a success message
            fetchUsers()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <strong>{userToDelete?.email}</strong>. This action cannot be undone.
              All data associated with this user will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
