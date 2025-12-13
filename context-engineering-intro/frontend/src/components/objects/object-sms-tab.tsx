'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { telnyxSettingsApi, type TelnyxSettings, type CreateTelnyxSettingsRequest, type UpdateTelnyxSettingsRequest } from '@/lib/api/telnyx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Shield, CheckCircle2, XCircle, AlertCircle, Phone, Plus, Trash2, Loader2, Edit2 } from 'lucide-react'

interface ObjectSMSTabProps {
  objectId: string
  objectName: string
  canManage: boolean
}

interface FormData {
  api_key: string
  messaging_profile_id: string
  webhook_secret: string
}

const defaultFormData: FormData = {
  api_key: '',
  messaging_profile_id: '',
  webhook_secret: ''
}

export function ObjectSMSTab({ objectId, objectName, canManage }: ObjectSMSTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Fetch Telnyx settings for this object
  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['object-telnyx-settings', objectId],
    queryFn: () => telnyxSettingsApi.list(objectId),
    enabled: !!objectId
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTelnyxSettingsRequest) => telnyxSettingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-telnyx-settings', objectId] })
      resetForm()
      toast({ title: 'Success', description: 'SMS settings added successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to add SMS settings',
        variant: 'destructive'
      })
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ settingsId, data }: { settingsId: string; data: UpdateTelnyxSettingsRequest }) =>
      telnyxSettingsApi.update(settingsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-telnyx-settings', objectId] })
      resetForm()
      toast({ title: 'Success', description: 'SMS settings updated successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update SMS settings',
        variant: 'destructive'
      })
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (settingsId: string) => telnyxSettingsApi.delete(settingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-telnyx-settings', objectId] })
      toast({ title: 'Success', description: 'SMS settings deleted' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete SMS settings',
        variant: 'destructive'
      })
    }
  })

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (settingsId: string) => telnyxSettingsApi.verify(settingsId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['object-telnyx-settings', objectId] })
      toast({
        title: data.valid ? 'Success' : 'Error',
        description: data.valid
          ? `Connection verified. Balance: ${data.balance} ${data.currency}`
          : data.error || 'Verification failed',
        variant: data.valid ? 'default' : 'destructive'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to verify SMS connection',
        variant: 'destructive'
      })
    }
  })

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingId(null)
    setShowForm(false)
  }

  const startEditing = (settings: TelnyxSettings) => {
    setFormData({
      api_key: '', // Don't show stored API key
      messaging_profile_id: settings.messaging_profile_id || '',
      webhook_secret: '' // Don't show webhook secret
    })
    setEditingId(settings.id)
    setShowForm(true)
  }

  const handleSave = () => {
    // Validate
    if (!editingId && !formData.api_key) {
      toast({ title: 'Error', description: 'API Key is required', variant: 'destructive' })
      return
    }

    if (editingId) {
      // Update existing
      const updateData: UpdateTelnyxSettingsRequest = {}
      if (formData.api_key) updateData.api_key = formData.api_key
      if (formData.messaging_profile_id) updateData.messaging_profile_id = formData.messaging_profile_id
      if (formData.webhook_secret) updateData.webhook_secret = formData.webhook_secret

      updateMutation.mutate({ settingsId: editingId, data: updateData })
    } else {
      // Create new
      const createData: CreateTelnyxSettingsRequest = {
        object_id: objectId,
        api_key: formData.api_key,
      }
      if (formData.messaging_profile_id) createData.messaging_profile_id = formData.messaging_profile_id
      if (formData.webhook_secret) createData.webhook_secret = formData.webhook_secret

      createMutation.mutate(createData)
    }
  }

  const handleDelete = (settings: TelnyxSettings) => {
    if (confirm('Are you sure you want to delete these SMS settings? This may affect SMS profiles using this configuration.')) {
      deleteMutation.mutate(settings.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-senova-primary" />
      </div>
    )
  }

  if (!canManage) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Permission Required</AlertTitle>
        <AlertDescription>
          You need owner permissions to manage SMS settings.
        </AlertDescription>
      </Alert>
    )
  }

  // Only show one settings per object (unlike Mailgun which can have multiple domains)
  const existingSettings = settingsList.length > 0 ? settingsList[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Phone className="h-5 w-5" />
            SMS Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure SMS/MMS messaging for {objectName}. This enables phone number management and text messaging.
          </p>
        </div>
        {!showForm && !existingSettings && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Configure SMS
          </Button>
        )}
      </div>

      {/* Existing Settings Display */}
      {existingSettings && !showForm ? (
        <Card className="border-senova-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">SMS Settings</CardTitle>
                <Badge variant={existingSettings.is_active ? 'default' : 'secondary'}>
                  {existingSettings.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => verifyMutation.mutate(existingSettings.id)}
                  disabled={verifyMutation.isPending}
                  title="Verify connection"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(existingSettings)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(existingSettings)}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">API Key:</span>
                <p className="font-medium font-mono">{existingSettings.api_key_masked}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Messaging Profile:</span>
                <p className="font-medium">
                  {existingSettings.messaging_profile_id || 'Not configured'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Webhook Secret:</span>
                <p className="font-medium flex items-center gap-1">
                  {existingSettings.webhook_secret_set ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-600">Not set</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !showForm && (
        <Card>
          <CardContent className="py-8 text-center">
            <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No SMS settings configured for this object
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Configure SMS
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit SMS Settings' : 'Configure SMS'}</CardTitle>
            <CardDescription>
              {editingId
                ? 'Update the SMS configuration for this object'
                : 'Enter your Telnyx API credentials to enable SMS/MMS messaging'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">
                  API Key {!editingId && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder={editingId ? 'Leave blank to keep existing' : 'Enter your API key'}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key from the Telnyx portal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messaging_profile_id">Messaging Profile ID</Label>
                <Input
                  id="messaging_profile_id"
                  placeholder="Optional - for advanced routing"
                  value={formData.messaging_profile_id}
                  onChange={(e) => setFormData({ ...formData, messaging_profile_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. The messaging profile ID for advanced message routing.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_secret">Webhook Secret</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  placeholder={editingId ? 'Leave blank to keep existing' : 'Optional - for webhook verification'}
                  value={formData.webhook_secret}
                  onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Used to verify incoming webhook requests from Telnyx.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Webhook URL</AlertTitle>
                <AlertDescription>
                  Configure this URL in your Telnyx portal for receiving messages:
                  <code className="block mt-1 text-xs bg-muted p-2 rounded">
                    https://crm.senovallc.com/api/webhooks/telnyx
                  </code>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? 'Update Settings' : 'Save Settings'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
