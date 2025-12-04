'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { objectMailgunApi, type CreateMailgunSettingsData, type UpdateMailgunSettingsData, type ObjectMailgunSettings } from '@/lib/api/email-profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Shield, CheckCircle2, XCircle, AlertCircle, Mail, Plus, Trash2, Star, Loader2, Edit2 } from 'lucide-react'
import { format } from 'date-fns'

interface ObjectMailgunTabProps {
  objectId: string
  objectName: string
  canManage: boolean
}

interface DomainFormData {
  name: string
  api_key: string
  sending_domain: string
  receiving_domain: string
  region: 'US' | 'EU'
  webhook_signing_key: string
  rate_limit_per_hour: number
  is_default: boolean
}

const defaultFormData: DomainFormData = {
  name: '',
  api_key: '',
  sending_domain: '',
  receiving_domain: '',
  region: 'US',
  webhook_signing_key: '',
  rate_limit_per_hour: 100,
  is_default: false
}

export function ObjectMailgunTab({ objectId, objectName, canManage }: ObjectMailgunTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<DomainFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Fetch all Mailgun settings for this object
  const { data: settingsList = [], isLoading, error } = useQuery({
    queryKey: ['object-mailgun-list', objectId],
    queryFn: () => objectMailgunApi.list(objectId),
    enabled: !!objectId
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMailgunSettingsData) => objectMailgunApi.create(objectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-mailgun-list', objectId] })
      resetForm()
      toast({ title: 'Success', description: 'Mailgun domain added successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to add Mailgun domain',
        variant: 'destructive'
      })
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ settingsId, data }: { settingsId: string; data: UpdateMailgunSettingsData }) =>
      objectMailgunApi.update(objectId, settingsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-mailgun-list', objectId] })
      resetForm()
      toast({ title: 'Success', description: 'Mailgun domain updated successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update Mailgun domain',
        variant: 'destructive'
      })
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (settingsId: string) => objectMailgunApi.delete(objectId, settingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-mailgun-list', objectId] })
      toast({ title: 'Success', description: 'Mailgun domain deleted' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete Mailgun domain',
        variant: 'destructive'
      })
    }
  })

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (settingsId: string) => objectMailgunApi.verify(objectId, settingsId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['object-mailgun-list', objectId] })
      toast({
        title: data.success ? 'Success' : 'Error',
        description: data.message,
        variant: data.success ? 'default' : 'destructive'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to verify Mailgun connection',
        variant: 'destructive'
      })
    }
  })

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (settingsId: string) => objectMailgunApi.setDefault(objectId, settingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-mailgun-list', objectId] })
      toast({ title: 'Success', description: 'Default domain updated' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to set default domain',
        variant: 'destructive'
      })
    }
  })

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingId(null)
    setShowForm(false)
  }

  const startEditing = (settings: ObjectMailgunSettings) => {
    setFormData({
      name: settings.name,
      api_key: '', // Don't show stored API key
      sending_domain: settings.sending_domain,
      receiving_domain: settings.receiving_domain,
      region: settings.region.toUpperCase() as 'US' | 'EU',
      webhook_signing_key: '', // Don't show webhook key
      rate_limit_per_hour: settings.rate_limit_per_hour,
      is_default: settings.is_default
    })
    setEditingId(settings.id)
    setShowForm(true)
  }

  const handleSave = () => {
    // Validate
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    if (!editingId && !formData.api_key) {
      toast({ title: 'Error', description: 'API Key is required', variant: 'destructive' })
      return
    }
    if (!formData.sending_domain || !formData.receiving_domain) {
      toast({ title: 'Error', description: 'Sending and receiving domains are required', variant: 'destructive' })
      return
    }

    if (editingId) {
      // Update existing
      const updateData: UpdateMailgunSettingsData = {
        name: formData.name,
        sending_domain: formData.sending_domain,
        receiving_domain: formData.receiving_domain,
        region: formData.region,
        rate_limit_per_hour: formData.rate_limit_per_hour,
      }
      if (formData.api_key) updateData.api_key = formData.api_key
      if (formData.webhook_signing_key) updateData.webhook_signing_key = formData.webhook_signing_key

      updateMutation.mutate({ settingsId: editingId, data: updateData })
    } else {
      // Create new
      const createData: CreateMailgunSettingsData = {
        name: formData.name,
        api_key: formData.api_key,
        sending_domain: formData.sending_domain,
        receiving_domain: formData.receiving_domain,
        region: formData.region,
        rate_limit_per_hour: formData.rate_limit_per_hour,
        is_default: formData.is_default || settingsList.length === 0, // First one is auto-default
      }
      if (formData.webhook_signing_key) createData.webhook_signing_key = formData.webhook_signing_key

      createMutation.mutate(createData)
    }
  }

  const handleDelete = (settings: ObjectMailgunSettings) => {
    if (confirm(`Are you sure you want to delete "${settings.name}"? This may affect email profiles using this domain.`)) {
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
          You need owner permissions to manage Mailgun settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Domains
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure multiple Mailgun domains for {objectName}. Each domain can be used for different email profiles.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        )}
      </div>

      {/* Domain List */}
      {settingsList.length > 0 ? (
        <div className="space-y-4">
          {settingsList.map((settings) => (
            <Card key={settings.id} className={settings.is_default ? 'border-senova-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{settings.name}</CardTitle>
                    {settings.is_default && (
                      <Badge variant="default" className="bg-senova-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    <Badge variant={settings.is_active && settings.verified_at ? 'default' : 'secondary'}>
                      {settings.is_active && settings.verified_at ? 'Active' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verifyMutation.mutate(settings.id)}
                      disabled={verifyMutation.isPending}
                    >
                      {verifyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </Button>
                    {!settings.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(settings.id)}
                        disabled={setDefaultMutation.isPending}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(settings)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(settings)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sending:</span>
                    <p className="font-medium">{settings.sending_domain}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Receiving:</span>
                    <p className="font-medium">{settings.receiving_domain}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Region:</span>
                    <p className="font-medium">{settings.region}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium flex items-center gap-1">
                      {settings.is_active && settings.verified_at ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Ready</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">Not Ready</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {settings.verified_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Verified: {format(new Date(settings.verified_at), 'PPP')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !showForm && (
        <Card>
          <CardContent className="py-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No Mailgun domains configured for this object
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Domain
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Domain' : 'Add New Domain'}</CardTitle>
            <CardDescription>
              {editingId
                ? 'Update the Mailgun configuration for this domain'
                : 'Add a new Mailgun domain configuration'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Domain Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Primary Domain or senovallc.com"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this domain configuration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">
                  API Key {!editingId && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder={editingId ? 'Leave blank to keep existing' : 'Enter Mailgun API key'}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sending_domain">
                    Sending Domain <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sending_domain"
                    placeholder="e.g., senovallc.com"
                    value={formData.sending_domain}
                    onChange={(e) => setFormData({ ...formData, sending_domain: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiving_domain">
                    Receiving Domain <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="receiving_domain"
                    placeholder="e.g., mg.senovallc.com"
                    value={formData.receiving_domain}
                    onChange={(e) => setFormData({ ...formData, receiving_domain: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value: 'US' | 'EU') => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="EU">European Union</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook_signing_key">Webhook Signing Key</Label>
                  <Input
                    id="webhook_signing_key"
                    type="password"
                    placeholder={editingId ? 'Leave blank to keep existing' : 'Optional'}
                    value={formData.webhook_signing_key}
                    onChange={(e) => setFormData({ ...formData, webhook_signing_key: e.target.value })}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Make sure your domain is verified in Mailgun and DNS records are properly configured.
                  After saving, click the verify button to test the connection.
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
                    editingId ? 'Update Domain' : 'Add Domain'
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
