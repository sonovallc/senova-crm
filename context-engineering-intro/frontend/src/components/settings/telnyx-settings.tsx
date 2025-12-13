'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useTelnyxSettings,
  useCreateTelnyxSettings,
  useUpdateTelnyxSettings,
  useDeleteTelnyxSettings,
  useVerifyTelnyxCredentials,
  type TelnyxSettings as TelnyxSettingsType,
  type CreateTelnyxSettingsRequest,
  type UpdateTelnyxSettingsRequest,
} from '@/lib/queries/telnyx'
import { objectsApi } from '@/lib/api/objects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { MessageSquare, Loader2, CheckCircle2, XCircle, Trash2, Plus, Edit, Eye, EyeOff, RefreshCw } from 'lucide-react'

interface CRMObject {
  id: string
  name: string
  type: string
}

export function TelnyxSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showApiKey, setShowApiKey] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSettings, setSelectedSettings] = useState<TelnyxSettingsType | null>(null)

  // Form state for creating new settings
  const [createForm, setCreateForm] = useState<CreateTelnyxSettingsRequest>({
    object_id: '',
    api_key: '',
    messaging_profile_id: '',
    webhook_secret: '',
  })

  // Form state for editing settings
  const [editForm, setEditForm] = useState<UpdateTelnyxSettingsRequest>({
    api_key: '',
    messaging_profile_id: '',
    webhook_secret: '',
    is_active: true,
  })

  // Queries
  const { data: settingsList = [], isLoading, error } = useTelnyxSettings()
  const createSettings = useCreateTelnyxSettings()
  const updateSettings = useUpdateTelnyxSettings()
  const deleteSettings = useDeleteTelnyxSettings()
  const verifyCredentials = useVerifyTelnyxCredentials()

  // Fetch all objects for the dropdown
  const { data: objectsData, isLoading: objectsLoading } = useQuery({
    queryKey: ['objects-list'],
    queryFn: async () => {
      const response = await objectsApi.list({ page: 1, page_size: 100 })
      return response.items || []
    },
    enabled: showCreateDialog,
  })

  const isOwner = user?.role === 'owner'
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner'

  // Filter objects that don't already have Telnyx settings
  const availableObjects = (objectsData || []).filter(
    (obj: CRMObject) => !settingsList.some((s) => s.object_id === obj.id)
  )

  const handleCreateSettings = async () => {
    try {
      if (!createForm.object_id || !createForm.api_key) {
        toast({
          title: 'Validation Error',
          description: 'Please select an object and enter your API key',
          variant: 'destructive',
        })
        return
      }

      await createSettings.mutateAsync(createForm)
      toast({
        title: 'Success',
        description: 'Telnyx settings created successfully. Please verify the connection.',
      })
      setShowCreateDialog(false)
      setCreateForm({
        object_id: '',
        api_key: '',
        messaging_profile_id: '',
        webhook_secret: '',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to create settings',
        variant: 'destructive',
      })
    }
  }

  const handleEditClick = (settings: TelnyxSettingsType) => {
    setSelectedSettings(settings)
    setEditForm({
      api_key: '',
      messaging_profile_id: settings.messaging_profile_id || '',
      webhook_secret: '',
      is_active: settings.is_active,
    })
    setShowEditDialog(true)
  }

  const handleUpdateSettings = async () => {
    if (!selectedSettings) return

    try {
      const updatePayload: UpdateTelnyxSettingsRequest = {}

      if (editForm.api_key) updatePayload.api_key = editForm.api_key
      if (editForm.messaging_profile_id !== selectedSettings.messaging_profile_id) {
        updatePayload.messaging_profile_id = editForm.messaging_profile_id
      }
      if (editForm.webhook_secret) updatePayload.webhook_secret = editForm.webhook_secret
      if (editForm.is_active !== selectedSettings.is_active) {
        updatePayload.is_active = editForm.is_active
      }

      await updateSettings.mutateAsync({
        settingsId: selectedSettings.id,
        data: updatePayload,
      })
      toast({
        title: 'Success',
        description: 'Telnyx settings updated successfully',
      })
      setShowEditDialog(false)
      setSelectedSettings(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update settings',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteClick = (settings: TelnyxSettingsType) => {
    setSelectedSettings(settings)
    setShowDeleteDialog(true)
  }

  const handleDeleteSettings = async () => {
    if (!selectedSettings) return

    try {
      await deleteSettings.mutateAsync(selectedSettings.id)
      toast({
        title: 'Success',
        description: 'Telnyx settings deleted successfully',
      })
      setShowDeleteDialog(false)
      setSelectedSettings(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to delete settings',
        variant: 'destructive',
      })
    }
  }

  const handleVerifyCredentials = async (settingsId: string) => {
    try {
      const result = await verifyCredentials.mutateAsync(settingsId)
      if (result.valid) {
        toast({
          title: 'Connection Verified',
          description: `Account balance: ${result.balance} ${result.currency}`,
        })
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to verify credentials',
        variant: 'destructive',
      })
    }
  }

  if (!isAdminOrOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telnyx SMS Configuration
          </CardTitle>
          <CardDescription>You don't have permission to view this page</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telnyx SMS Configuration
          </CardTitle>
          <CardDescription>Configure your Telnyx SMS/MMS integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Telnyx SMS Configuration
              </CardTitle>
              <CardDescription>Configure your Telnyx SMS/MMS integration for each business</CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Configuration
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {settingsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Telnyx configurations</h3>
              <p className="text-muted-foreground mb-4">
                Configure Telnyx to start sending SMS/MMS messages
              </p>
              {isOwner && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Configuration
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Object</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Messaging Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Webhook Secret</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settingsList.map((settings) => (
                  <TableRow key={settings.id}>
                    <TableCell className="font-medium">
                      {settings.object_name || settings.object_id}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {settings.api_key_masked}
                      </code>
                    </TableCell>
                    <TableCell>
                      {settings.messaging_profile_id ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {settings.messaging_profile_id.substring(0, 16)}...
                        </code>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {settings.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {settings.webhook_secret_set ? (
                        <Badge variant="outline">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Set
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not set
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVerifyCredentials(settings.id)}
                          disabled={verifyCredentials.isPending}
                          title="Verify credentials"
                        >
                          {verifyCredentials.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        {isOwner && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(settings)}
                              title="Edit settings"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(settings)}
                              title="Delete settings"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Webhook URL Info */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-2">Webhook Configuration</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Configure your Telnyx webhook to receive SMS/MMS messages:
            </p>
            <code className="block text-xs bg-background p-2 rounded border">
              {typeof window !== 'undefined' && window.location.origin
                ? `${window.location.origin.replace('localhost:3004', 'crm.senovallc.com')}/api/v1/webhooks/telnyx/messaging`
                : 'https://crm.senovallc.com/api/v1/webhooks/telnyx/messaging'}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Telnyx Configuration</DialogTitle>
            <DialogDescription>
              Configure Telnyx SMS/MMS for a business object
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="object">
                Business Object <span className="text-red-500">*</span>
              </Label>
              <Select
                value={createForm.object_id}
                onValueChange={(value) => setCreateForm({ ...createForm, object_id: value })}
              >
                <SelectTrigger id="object">
                  <SelectValue placeholder="Select a business object" />
                </SelectTrigger>
                <SelectContent>
                  {objectsLoading ? (
                    <SelectItem value="_loading" disabled>Loading objects...</SelectItem>
                  ) : availableObjects.length === 0 ? (
                    <SelectItem value="_none" disabled>All objects already configured</SelectItem>
                  ) : (
                    availableObjects.map((obj: CRMObject) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">
                Telnyx API Key <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="KEY..."
                  value={createForm.api_key}
                  onChange={(e) => setCreateForm({ ...createForm, api_key: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  type="button"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find your API key in the Telnyx Mission Control Portal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messaging-profile">Messaging Profile ID</Label>
              <Input
                id="messaging-profile"
                placeholder="Optional - for advanced routing"
                value={createForm.messaging_profile_id || ''}
                onChange={(e) => setCreateForm({ ...createForm, messaging_profile_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="Optional - for webhook verification"
                value={createForm.webhook_secret || ''}
                onChange={(e) => setCreateForm({ ...createForm, webhook_secret: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSettings} disabled={createSettings.isPending}>
              {createSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Telnyx Configuration</DialogTitle>
            <DialogDescription>
              Update Telnyx settings for {selectedSettings?.object_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={selectedSettings?.api_key_masked || 'Leave blank to keep current'}
                  value={editForm.api_key || ''}
                  onChange={(e) => setEditForm({ ...editForm, api_key: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  type="button"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank to keep the current API key
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-messaging-profile">Messaging Profile ID</Label>
              <Input
                id="edit-messaging-profile"
                placeholder="Optional - for advanced routing"
                value={editForm.messaging_profile_id || ''}
                onChange={(e) => setEditForm({ ...editForm, messaging_profile_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-webhook-secret">Webhook Secret</Label>
              <Input
                id="edit-webhook-secret"
                type="password"
                placeholder="Leave blank to keep current"
                value={editForm.webhook_secret || ''}
                onChange={(e) => setEditForm({ ...editForm, webhook_secret: e.target.value })}
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
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings} disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Telnyx Configuration?</DialogTitle>
            <DialogDescription>
              This will delete the Telnyx configuration for {selectedSettings?.object_name}.
              All associated phone numbers and SMS profiles will be disconnected.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSettings}
              disabled={deleteSettings.isPending}
            >
              {deleteSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
