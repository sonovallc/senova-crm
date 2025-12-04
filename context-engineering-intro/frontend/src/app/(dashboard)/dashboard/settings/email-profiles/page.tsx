"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Plus, Edit, Users as UsersIcon, Trash2, Check, X } from "lucide-react"
import {
  emailProfilesApi,
  objectMailgunApi,
  type EmailProfile,
  type CreateProfileData,
  type UpdateProfileData,
  type UserAssignment,
  type AssignedUser,
  type ObjectForProfile,
  type ObjectMailgunSettings,
} from "@/lib/api/email-profiles"
import { objectsApi } from "@/lib/api/objects"

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
}

interface ObjectWithDomains {
  id: string
  name: string
  mailgun_domains: ObjectMailgunSettings[]
}

export default function EmailProfilesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<EmailProfile | null>(null)

  // Form state
  const [createForm, setCreateForm] = useState<CreateProfileData>({
    object_id: "",
    mailgun_settings_id: undefined,
    email_local_part: "",
    display_name: "",
    signature_html: "",
  })
  const [selectedObjectDomain, setSelectedObjectDomain] = useState<string>("")
  const [availableDomains, setAvailableDomains] = useState<ObjectMailgunSettings[]>([])

  const [editForm, setEditForm] = useState<UpdateProfileData>({
    display_name: "",
    signature_html: "",
    is_active: true,
  })

  const [selectedUsers, setSelectedUsers] = useState<Map<string, boolean>>(new Map())
  const [defaultUser, setDefaultUser] = useState<string>("")

  // Check permissions
  useEffect(() => {
    if (user && user.role !== "owner") {
      router.push("/dashboard/settings")
    }
  }, [user, router])

  // Fetch profiles
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['email-profiles'],
    queryFn: () => emailProfilesApi.list(),
    enabled: user?.role === 'owner',
  })
  // Defensive: ensure profiles is always an array
  const profiles = Array.isArray(profilesData) ? profilesData : []

  // Fetch objects with Mailgun configured (multi-domain support)
  const { data: objectsWithMailgun = [], isLoading: objectsLoading } = useQuery({
    queryKey: ['objects-with-mailgun'],
    queryFn: async () => {
      // Fetch all objects
      const objectsResponse = await objectsApi.list({ page: 1, page_size: 100 })
      const allObjects = objectsResponse.items || []

      // Check which ones have Mailgun configured
      const objectsWithSettings = await Promise.all(
        allObjects.map(async (obj) => {
          try {
            // Fetch all Mailgun domains for this object
            const domains = await objectMailgunApi.list(obj.id)
            // Filter to only verified/active domains
            const activeDomains = domains.filter(d => d.is_active && d.verified_at)
            if (activeDomains.length > 0) {
              return {
                id: obj.id,
                name: obj.name,
                mailgun_domains: activeDomains
              } as ObjectWithDomains
            }
          } catch (e) {
            // No settings for this object
          }
          return null
        })
      )

      return objectsWithSettings.filter((obj): obj is ObjectWithDomains => obj !== null)
    },
    enabled: createDialogOpen && user?.role === 'owner',
  })

  // Fetch all users for assignment
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = sessionStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      return data.items || []
    },
    enabled: assignDialogOpen,
  })

  // Fetch assignments for selected profile
  const { data: profileWithAssignments } = useQuery({
    queryKey: ['email-profile', selectedProfile?.id],
    queryFn: () => emailProfilesApi.get(selectedProfile!.id),
    enabled: !!selectedProfile && assignDialogOpen,
  })

  // Create profile mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProfileData) => emailProfilesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-profiles'] })
      setCreateDialogOpen(false)
      setCreateForm({ object_id: "", mailgun_settings_id: undefined, email_local_part: "", display_name: "", signature_html: "" })
      setSelectedObjectDomain("")
      setAvailableDomains([])
      toast({
        title: "Success",
        description: "Email profile created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email profile",
        variant: "destructive",
      })
    },
  })

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileData }) =>
      emailProfilesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-profiles'] })
      setEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Email profile updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email profile",
        variant: "destructive",
      })
    },
  })

  // Delete profile mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailProfilesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-profiles'] })
      toast({
        title: "Success",
        description: "Email profile deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email profile",
        variant: "destructive",
      })
    },
  })

  // Assign users mutation
  const assignMutation = useMutation({
    mutationFn: ({ profileId, assignments }: { profileId: string; assignments: UserAssignment[] }) =>
      emailProfilesApi.assignUsers(profileId, assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['email-profile', selectedProfile?.id] })
      setAssignDialogOpen(false)
      setSelectedUsers(new Map())
      setDefaultUser("")
      toast({
        title: "Success",
        description: "User assignments updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user assignments",
        variant: "destructive",
      })
    },
  })

  const handleCreateProfile = () => {
    if (!createForm.object_id || !createForm.email_local_part || !createForm.display_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    createMutation.mutate(createForm)
  }

  const handleEditProfile = (profile: EmailProfile) => {
    setSelectedProfile(profile)
    setEditForm({
      display_name: profile.display_name,
      signature_html: profile.signature_html || "",
      is_active: profile.is_active,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateProfile = () => {
    if (!selectedProfile) return
    updateMutation.mutate({ id: selectedProfile.id, data: editForm })
  }

  const handleAssignUsers = (profile: EmailProfile) => {
    setSelectedProfile(profile)
    setSelectedUsers(new Map())
    setDefaultUser("")
    setAssignDialogOpen(true)
  }

  const handleSaveAssignments = () => {
    if (!selectedProfile) return

    const assignments: UserAssignment[] = Array.from(selectedUsers.entries())
      .filter(([_, selected]) => selected)
      .map(([userId, _]) => ({
        user_id: userId,
        is_default: userId === defaultUser,
      }))

    assignMutation.mutate({ profileId: selectedProfile.id, assignments })
  }

  const toggleUserSelection = (userId: string, checked: boolean) => {
    const newSelection = new Map(selectedUsers)
    if (checked) {
      newSelection.set(userId, true)
      // Set as default if it's the first selection
      if (newSelection.size === 1) {
        setDefaultUser(userId)
      }
    } else {
      newSelection.delete(userId)
      // Clear default if this was the default user
      if (defaultUser === userId) {
        setDefaultUser("")
      }
    }
    setSelectedUsers(newSelection)
  }

  // Initialize selected users when profile assignments load
  useEffect(() => {
    if (profileWithAssignments?.assigned_users) {
      const newSelection = new Map<string, boolean>()
      let defaultId = ""

      profileWithAssignments.assigned_users.forEach((user: AssignedUser) => {
        newSelection.set(user.id, true)
        if (user.is_default) {
          defaultId = user.id
        }
      })

      setSelectedUsers(newSelection)
      setDefaultUser(defaultId)
    }
  }, [profileWithAssignments])

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading email profiles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Sending Profiles</h1>
          <p className="text-muted-foreground">
            Manage email identities and assign them to users
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No email profiles created yet</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email Address</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Object / Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.email_address}</TableCell>
                  <TableCell>{profile.display_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{profile.object_name || '-'}</span>
                      {profile.mailgun_domain_name && (
                        <span className="text-xs text-muted-foreground">
                          via {profile.mailgun_domain_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.is_active ? "default" : "secondary"}>
                      {profile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{profile.assigned_user_count || 0} users</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProfile(profile)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssignUsers(profile)}
                      >
                        <UsersIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete email profile ${profile.email_address}?`)) {
                            deleteMutation.mutate(profile.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Profile Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Email Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="object">Object <span className="text-red-500">*</span></Label>
              <Select
                value={createForm.object_id}
                onValueChange={(value) => {
                  const selectedObj = objectsWithMailgun.find(obj => obj.id === value)
                  const domains = selectedObj?.mailgun_domains || []
                  setAvailableDomains(domains)

                  // Auto-select the default domain
                  const defaultDomain = domains.find(d => d.is_default) || domains[0]
                  setCreateForm({
                    ...createForm,
                    object_id: value,
                    mailgun_settings_id: defaultDomain?.id
                  })
                  setSelectedObjectDomain(defaultDomain?.sending_domain || '')
                }}
              >
                <SelectTrigger id="object">
                  <SelectValue placeholder="Select an object with Mailgun configured" />
                </SelectTrigger>
                <SelectContent>
                  {objectsLoading ? (
                    <SelectItem value="_loading" disabled>Loading objects...</SelectItem>
                  ) : objectsWithMailgun.length === 0 ? (
                    <SelectItem value="_none" disabled>No objects with Mailgun configured</SelectItem>
                  ) : (
                    objectsWithMailgun.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.name} ({obj.mailgun_domains.length} domain{obj.mailgun_domains.length !== 1 ? 's' : ''})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {objectsWithMailgun.length === 0 && !objectsLoading && (
                <p className="text-sm text-muted-foreground">
                  Configure Mailgun for an object first in Objects → Email Settings
                </p>
              )}
            </div>

            {/* Domain selection - only show if object has multiple domains */}
            {availableDomains.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="domain">
                  Sending Domain <span className="text-red-500">*</span>
                  {availableDomains.length > 1 && (
                    <span className="text-muted-foreground ml-2">({availableDomains.length} available)</span>
                  )}
                </Label>
                <Select
                  value={createForm.mailgun_settings_id}
                  onValueChange={(value) => {
                    const domain = availableDomains.find(d => d.id === value)
                    setCreateForm({ ...createForm, mailgun_settings_id: value })
                    setSelectedObjectDomain(domain?.sending_domain || '')
                  }}
                >
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDomains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name} ({domain.sending_domain})
                        {domain.is_default && " - Default"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email-local">Email Local Part <span className="text-red-500">*</span></Label>
              <Input
                id="email-local"
                value={createForm.email_local_part}
                onChange={(e) => setCreateForm({ ...createForm, email_local_part: e.target.value })}
                placeholder="e.g., jeff"
                disabled={!createForm.object_id}
              />
              <p className="text-sm text-muted-foreground">
                Preview: {createForm.email_local_part || "email"}@{selectedObjectDomain || "[select object]"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name <span className="text-red-500">*</span></Label>
              <Input
                id="display-name"
                value={createForm.display_name}
                onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                placeholder="e.g., Jeff Wood"
                disabled={!createForm.object_id}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature">Email Signature (HTML)</Label>
              <Textarea
                id="signature"
                value={createForm.signature_html}
                onChange={(e) => setCreateForm({ ...createForm, signature_html: e.target.value })}
                placeholder="Optional HTML signature..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Email Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={selectedProfile?.email_address || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display-name">Display Name</Label>
              <Input
                id="edit-display-name"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-signature">Email Signature (HTML)</Label>
              <Textarea
                id="edit-signature"
                value={editForm.signature_html}
                onChange={(e) => setEditForm({ ...editForm, signature_html: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Users to {selectedProfile?.email_address}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {usersLoading ? (
              <p className="text-muted-foreground">Loading users...</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select users who can send emails from this profile. Choose one as the default.
                </p>
                <div className="space-y-2 border rounded-lg p-4">
                  {users.map((u: User) => (
                    <div key={u.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`user-${u.id}`}
                          checked={selectedUsers.get(u.id) || false}
                          onCheckedChange={(checked) => toggleUserSelection(u.id, checked as boolean)}
                        />
                        <label
                          htmlFor={`user-${u.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {u.first_name && u.last_name
                            ? `${u.first_name} ${u.last_name}`
                            : u.email}
                          <span className="text-muted-foreground ml-2">({u.email})</span>
                        </label>
                      </div>
                      {selectedUsers.get(u.id) && (
                        <RadioGroup value={defaultUser} onValueChange={setDefaultUser}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={u.id} id={`default-${u.id}`} />
                            <Label htmlFor={`default-${u.id}`} className="text-sm">
                              Default
                            </Label>
                          </div>
                        </RadioGroup>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}