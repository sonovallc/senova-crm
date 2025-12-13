'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useSMSProfiles,
  useSMSProfile,
  useCreateSMSProfile,
  useUpdateSMSProfile,
  useDeleteSMSProfile,
  useAssignUsersToProfile,
  usePhoneNumbers,
  useTelnyxSettings,
  type SMSProfile,
  type CreateSMSProfileRequest,
} from '@/lib/queries/telnyx'
import { objectsApi } from '@/lib/api/objects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MessageSquare,
  Loader2,
  Plus,
  Edit,
  Users as UsersIcon,
  Trash2,
  Phone,
} from 'lucide-react'

interface CRMObject {
  id: string
  name: string
  type: string
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
}

interface AssignedUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  is_default: boolean
}

export default function SMSProfilesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<SMSProfile | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState<CreateSMSProfileRequest>({
    object_id: '',
    phone_number_id: '',
    display_name: '',
    signature: '',
    max_messages_per_day: '',
  })

  const [editForm, setEditForm] = useState({
    display_name: '',
    signature: '',
    max_messages_per_day: '',
    is_active: true,
  })

  const [selectedUsers, setSelectedUsers] = useState<Map<string, boolean>>(new Map())
  const [defaultUser, setDefaultUser] = useState<string>('')

  // Check permissions
  const isOwner = user?.role === 'owner'

  // Queries
  const { data: telnyxSettings = [], isLoading: settingsLoading } = useTelnyxSettings()
  const { data: profiles = [], isLoading: profilesLoading, refetch: refetchProfiles } = useSMSProfiles()

  // Fetch objects with Telnyx configured
  const { data: objectsWithTelnyx = [], isLoading: objectsLoading } = useQuery({
    queryKey: ['objects-with-telnyx-for-profiles'],
    queryFn: async () => {
      const objects = await objectsApi.list({ page: 1, page_size: 100 })
      const configuredObjectIds = telnyxSettings.map(s => s.object_id)
      return (objects.items || []).filter((obj: CRMObject) => configuredObjectIds.includes(obj.id))
    },
    enabled: telnyxSettings.length > 0 && createDialogOpen,
  })

  // Fetch phone numbers for selected object
  const { data: phoneNumbers = [], isLoading: phoneNumbersLoading } = usePhoneNumbers(
    createForm.object_id || undefined
  )

  // Fetch all users for assignment
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-for-sms-profiles'],
    queryFn: async () => {
      const token = sessionStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      return data.items || []
    },
    enabled: assignDialogOpen,
  })

  // Fetch profile with assignments
  const { data: profileWithAssignments } = useSMSProfile(selectedProfile?.id || '')

  // Mutations
  const createProfile = useCreateSMSProfile()
  const updateProfile = useUpdateSMSProfile()
  const deleteProfile = useDeleteSMSProfile()
  const assignUsers = useAssignUsersToProfile()

  // Initialize selected users when profile assignments load
  useEffect(() => {
    if (profileWithAssignments?.assigned_users) {
      const newSelection = new Map<string, boolean>()
      let defaultId = ''

      profileWithAssignments.assigned_users.forEach((u: AssignedUser) => {
        newSelection.set(u.id, true)
        if (u.is_default) {
          defaultId = u.id
        }
      })

      setSelectedUsers(newSelection)
      setDefaultUser(defaultId)
    }
  }, [profileWithAssignments])

  if (!isOwner) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">SMS Sending Profiles</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You don't have permission to view this page</p>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateProfile = async () => {
    if (!createForm.object_id || !createForm.phone_number_id || !createForm.display_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await createProfile.mutateAsync(createForm)
      toast({
        title: 'Success',
        description: 'SMS profile created successfully',
      })
      setCreateDialogOpen(false)
      setCreateForm({
        object_id: '',
        phone_number_id: '',
        display_name: '',
        signature: '',
        max_messages_per_day: '',
      })
      refetchProfiles()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to create SMS profile',
        variant: 'destructive',
      })
    }
  }

  const handleEditClick = (profile: SMSProfile) => {
    setSelectedProfile(profile)
    setEditForm({
      display_name: profile.display_name,
      signature: profile.signature || '',
      max_messages_per_day: profile.max_messages_per_day || '',
      is_active: profile.is_active,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return

    try {
      await updateProfile.mutateAsync({
        profileId: selectedProfile.id,
        data: editForm,
      })
      toast({
        title: 'Success',
        description: 'SMS profile updated successfully',
      })
      setEditDialogOpen(false)
      refetchProfiles()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update SMS profile',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this SMS profile?')) return

    try {
      await deleteProfile.mutateAsync(profileId)
      toast({
        title: 'Success',
        description: 'SMS profile deleted successfully',
      })
      refetchProfiles()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to delete SMS profile',
        variant: 'destructive',
      })
    }
  }

  const handleAssignClick = (profile: SMSProfile) => {
    setSelectedProfile(profile)
    setSelectedUsers(new Map())
    setDefaultUser('')
    setAssignDialogOpen(true)
  }

  const handleSaveAssignments = async () => {
    if (!selectedProfile) return

    try {
      const assignments = Array.from(selectedUsers.entries())
        .filter(([_, selected]) => selected)
        .map(([userId]) => ({
          user_id: userId,
          is_default: userId === defaultUser,
        }))

      await assignUsers.mutateAsync({
        profileId: selectedProfile.id,
        assignments,
      })
      toast({
        title: 'Success',
        description: 'User assignments updated successfully',
      })
      setAssignDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update user assignments',
        variant: 'destructive',
      })
    }
  }

  const toggleUserSelection = (userId: string, checked: boolean) => {
    const newSelection = new Map(selectedUsers)
    if (checked) {
      newSelection.set(userId, true)
      if (newSelection.size === 1) {
        setDefaultUser(userId)
      }
    } else {
      newSelection.delete(userId)
      if (defaultUser === userId) {
        setDefaultUser('')
      }
    }
    setSelectedUsers(newSelection)
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  if (settingsLoading || profilesLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">SMS Sending Profiles</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (telnyxSettings.length === 0) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">SMS Sending Profiles</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Telnyx Not Configured
              </CardTitle>
              <CardDescription>
                You need to configure Telnyx before creating SMS profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/settings/integrations/telnyx')}>
                Configure Telnyx
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SMS Sending Profiles</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage SMS identities and assign them to users
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Profile
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl space-y-6">
          {profiles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No SMS profiles created yet</p>
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
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Object</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Assigned Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium font-mono">
                        {formatPhoneNumber(profile.phone_number)}
                        {profile.phone_number_friendly_name && (
                          <span className="block text-xs text-muted-foreground">
                            {profile.phone_number_friendly_name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{profile.display_name}</TableCell>
                      <TableCell>{profile.object_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {profile.max_messages_per_day || 'Unlimited'}
                      </TableCell>
                      <TableCell>{profile.assigned_user_count || 0} users</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(profile)}
                            title="Edit profile"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignClick(profile)}
                            title="Assign users"
                          >
                            <UsersIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProfile(profile.id)}
                            title="Delete profile"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create Profile Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add SMS Profile</DialogTitle>
            <DialogDescription>
              Create an SMS sending identity that can be assigned to users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="object">
                Business Object <span className="text-red-500">*</span>
              </Label>
              <Select
                value={createForm.object_id}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, object_id: value, phone_number_id: '' })
                }
              >
                <SelectTrigger id="object">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {objectsLoading ? (
                    <SelectItem value="_loading" disabled>Loading...</SelectItem>
                  ) : objectsWithTelnyx.length === 0 ? (
                    <SelectItem value="_none" disabled>No businesses with Telnyx</SelectItem>
                  ) : (
                    objectsWithTelnyx.map((obj: CRMObject) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-number">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Select
                value={createForm.phone_number_id}
                onValueChange={(value) => setCreateForm({ ...createForm, phone_number_id: value })}
                disabled={!createForm.object_id}
              >
                <SelectTrigger id="phone-number">
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbersLoading ? (
                    <SelectItem value="_loading" disabled>Loading...</SelectItem>
                  ) : phoneNumbers.length === 0 ? (
                    <SelectItem value="_none" disabled>No phone numbers available</SelectItem>
                  ) : (
                    phoneNumbers
                      .filter((n) => n.status === 'active')
                      .map((number) => (
                        <SelectItem key={number.id} value={number.id}>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {formatPhoneNumber(number.phone_number)}
                            {number.friendly_name && ` - ${number.friendly_name}`}
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {createForm.object_id && phoneNumbers.length === 0 && !phoneNumbersLoading && (
                <p className="text-sm text-muted-foreground">
                  No phone numbers found. <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/dashboard/settings/phone-numbers')}>Purchase one first</Button>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="display-name"
                placeholder="e.g., Sales Team"
                value={createForm.display_name}
                onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Signature</Label>
              <Textarea
                id="signature"
                placeholder="Optional signature appended to messages"
                value={createForm.signature || ''}
                onChange={(e) => setCreateForm({ ...createForm, signature: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-messages">Max Messages Per Day</Label>
              <Input
                id="max-messages"
                type="number"
                placeholder="Leave empty for unlimited"
                value={createForm.max_messages_per_day || ''}
                onChange={(e) =>
                  setCreateForm({ ...createForm, max_messages_per_day: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={createProfile.isPending}>
              {createProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit SMS Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={selectedProfile?.phone_number ? formatPhoneNumber(selectedProfile.phone_number) : ''}
                disabled
              />
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
              <Label htmlFor="edit-signature">Signature</Label>
              <Textarea
                id="edit-signature"
                value={editForm.signature}
                onChange={(e) => setEditForm({ ...editForm, signature: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-max-messages">Max Messages Per Day</Label>
              <Input
                id="edit-max-messages"
                type="number"
                placeholder="Leave empty for unlimited"
                value={editForm.max_messages_per_day}
                onChange={(e) => setEditForm({ ...editForm, max_messages_per_day: e.target.value })}
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
            <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Assign Users to {selectedProfile?.display_name}
            </DialogTitle>
            <DialogDescription>
              Phone: {selectedProfile?.phone_number && formatPhoneNumber(selectedProfile.phone_number)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select users who can send SMS from this profile. Choose one as the default.
                </p>
                <div className="space-y-2 border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {users.map((u: User) => (
                    <div key={u.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`user-${u.id}`}
                          checked={selectedUsers.get(u.id) || false}
                          onCheckedChange={(checked) =>
                            toggleUserSelection(u.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`user-${u.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
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
            <Button onClick={handleSaveAssignments} disabled={assignUsers.isPending}>
              {assignUsers.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
