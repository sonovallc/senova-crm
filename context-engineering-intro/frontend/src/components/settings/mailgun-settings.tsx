'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import {
  useMailgunSettings,
  useCreateMailgunSettings,
  useUpdateMailgunSettings,
  useDeleteMailgunSettings,
  useTestMailgunConnection,
  useAddVerifiedAddress,
  useDeleteVerifiedAddress,
  useUpdateVerifiedAddress,
  type MailgunSettingsCreate,
  type VerifiedEmailCreate,
} from '@/lib/queries/mailgun'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Mail, Loader2, CheckCircle2, XCircle, Trash2, Plus, Star, Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function MailgunSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddEmailDialog, setShowAddEmailDialog] = useState(false)
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    api_key: '',
    domain: '',
    region: 'us' as 'us' | 'eu',
    from_email: '',
    from_name: '',
    rate_limit_per_hour: 100,
  })

  const [newEmailData, setNewEmailData] = useState({
    email_address: '',
    display_name: '',
    is_default: false,
  })

  // Queries
  const { data: settings, isLoading, error } = useMailgunSettings()
  const createSettings = useCreateMailgunSettings()
  const updateSettings = useUpdateMailgunSettings()
  const deleteSettings = useDeleteMailgunSettings()
  const testConnection = useTestMailgunConnection()
  const addVerifiedAddress = useAddVerifiedAddress()
  const deleteVerifiedAddress = useDeleteVerifiedAddress()
  const updateVerifiedAddress = useUpdateVerifiedAddress()

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner'
  const hasSettings = !!settings && !error

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        api_key: '',
        domain: settings.domain,
        region: settings.region,
        from_email: settings.from_email,
        from_name: settings.from_name,
        rate_limit_per_hour: settings.rate_limit_per_hour,
      })
    }
  }, [settings])

  const handleSaveSettings = async () => {
    try {
      if (hasSettings) {
        // Update existing settings
        const updatePayload: any = {}

        if (formData.api_key) updatePayload.api_key = formData.api_key
        if (formData.domain !== settings.domain) updatePayload.domain = formData.domain
        if (formData.region !== settings.region) updatePayload.region = formData.region
        if (formData.from_email !== settings.from_email) updatePayload.from_email = formData.from_email
        if (formData.from_name !== settings.from_name) updatePayload.from_name = formData.from_name
        if (isAdminOrOwner && formData.rate_limit_per_hour !== settings.rate_limit_per_hour) {
          updatePayload.rate_limit_per_hour = formData.rate_limit_per_hour
        }

        await updateSettings.mutateAsync(updatePayload)
        toast({
          title: 'Success',
          description: 'Mailgun settings updated successfully',
        })
        setIsEditing(false)
        setFormData({ ...formData, api_key: '' }) // Clear API key field after save
      } else {
        // Create new settings
        if (!formData.api_key || !formData.domain || !formData.from_email || !formData.from_name) {
          toast({
            title: 'Validation Error',
            description: 'Please fill in all required fields',
            variant: 'destructive',
          })
          return
        }

        const createPayload: MailgunSettingsCreate = {
          api_key: formData.api_key,
          domain: formData.domain,
          region: formData.region,
          from_email: formData.from_email,
          from_name: formData.from_name,
        }

        await createSettings.mutateAsync(createPayload)
        toast({
          title: 'Success',
          description: 'Mailgun settings created successfully. Please test the connection.',
        })
        setFormData({ ...formData, api_key: '' }) // Clear API key field after save
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to save settings',
        variant: 'destructive',
      })
    }
  }

  const handleTestConnection = async () => {
    try {
      const result = await testConnection.mutateAsync()
      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: result.message,
        })
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error_details || result.message,
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to test connection',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteSettings = async () => {
    try {
      await deleteSettings.mutateAsync()
      toast({
        title: 'Success',
        description: 'Mailgun settings deleted successfully',
      })
      setShowDeleteDialog(false)
      setFormData({
        api_key: '',
        domain: '',
        region: 'us',
        from_email: '',
        from_name: '',
        rate_limit_per_hour: 100,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to delete settings',
        variant: 'destructive',
      })
    }
  }

  const handleAddEmail = async () => {
    try {
      if (!newEmailData.email_address) {
        toast({
          title: 'Validation Error',
          description: 'Email address is required',
          variant: 'destructive',
        })
        return
      }

      const payload: VerifiedEmailCreate = {
        email_address: newEmailData.email_address,
        display_name: newEmailData.display_name || undefined,
        is_default: newEmailData.is_default,
      }

      await addVerifiedAddress.mutateAsync(payload)
      toast({
        title: 'Success',
        description: 'Email address added successfully',
      })
      setShowAddEmailDialog(false)
      setNewEmailData({ email_address: '', display_name: '', is_default: false })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to add email address',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteEmail = async (addressId: string) => {
    try {
      await deleteVerifiedAddress.mutateAsync(addressId)
      toast({
        title: 'Success',
        description: 'Email address deleted successfully',
      })
      setEmailToDelete(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to delete email address',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefaultEmail = async (addressId: string) => {
    try {
      await updateVerifiedAddress.mutateAsync({
        addressId,
        data: { is_default: true },
      })
      toast({
        title: 'Success',
        description: 'Default email address updated',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update email address',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Mailgun Email Configuration
          </CardTitle>
          <CardDescription>Configure your Mailgun email service</CardDescription>
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
                <Mail className="h-5 w-5" />
                Mailgun Email Configuration
              </CardTitle>
              <CardDescription>Configure your Mailgun email service</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasSettings && settings.is_active && settings.verified_at ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
          {hasSettings && settings.verified_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Last verified: {new Date(settings.verified_at).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">
                API Key {!hasSettings && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={hasSettings ? settings.api_key_masked : 'Enter Mailgun API key...'}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  disabled={!isEditing && hasSettings}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={!isEditing && hasSettings}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {hasSettings && !isEditing && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep current API key
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">
                  Domain {!hasSettings && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="domain"
                  placeholder="mg.example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  disabled={!isEditing && hasSettings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value: 'us' | 'eu') =>
                    setFormData({ ...formData, region: value })
                  }
                  disabled={!isEditing && hasSettings}
                >
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="eu">Europe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">
                  From Email {!hasSettings && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="noreply@example.com"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  disabled={!isEditing && hasSettings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-name">
                  From Name {!hasSettings && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="from-name"
                  placeholder="My Company"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  disabled={!isEditing && hasSettings}
                />
              </div>
            </div>

            {isAdminOrOwner && (
              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (per hour)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.rate_limit_per_hour}
                  onChange={(e) =>
                    setFormData({ ...formData, rate_limit_per_hour: parseInt(e.target.value) || 100 })
                  }
                  disabled={!isEditing && hasSettings}
                />
                <p className="text-xs text-muted-foreground">
                  Only admin and owner users can modify rate limits
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!hasSettings ? (
              <Button onClick={handleSaveSettings} disabled={createSettings.isPending}>
                {createSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            ) : (
              <>
                {!isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testConnection.isPending}
                    >
                      {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Test Connection
                    </Button>
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                      {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Verified Email Addresses */}
          {hasSettings && settings.verified_addresses && settings.verified_addresses.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Verified Email Addresses</h3>
                <Button size="sm" onClick={() => setShowAddEmailDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Email
                </Button>
              </div>
              <div className="space-y-2">
                {settings.verified_addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      {address.is_default && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      <div>
                        <p className="font-medium">{address.email_address}</p>
                        {address.display_name && (
                          <p className="text-sm text-muted-foreground">{address.display_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!address.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultEmail(address.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEmailToDelete(address.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasSettings && (!settings.verified_addresses || settings.verified_addresses.length === 0) && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Verified Email Addresses</h3>
                <Button size="sm" onClick={() => setShowAddEmailDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Email
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No verified email addresses yet. Add one to start sending emails.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Mailgun?</DialogTitle>
            <DialogDescription>
              This will delete your Mailgun configuration and all verified email addresses. This action
              cannot be undone.
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

      {/* Add Email Dialog */}
      <Dialog open={showAddEmailDialog} onOpenChange={setShowAddEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Verified Email Address</DialogTitle>
            <DialogDescription>
              Add a verified email address that can be used for sending emails.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Email Address *</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="sender@example.com"
                value={newEmailData.email_address}
                onChange={(e) =>
                  setNewEmailData({ ...newEmailData, email_address: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-display-name">Display Name</Label>
              <Input
                id="new-display-name"
                placeholder="Marketing Team"
                value={newEmailData.display_name}
                onChange={(e) =>
                  setNewEmailData({ ...newEmailData, display_name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-is-default"
                checked={newEmailData.is_default}
                onCheckedChange={(checked) =>
                  setNewEmailData({ ...newEmailData, is_default: checked as boolean })
                }
              />
              <Label htmlFor="new-is-default" className="cursor-pointer">
                Set as default email address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmail} disabled={addVerifiedAddress.isPending}>
              {addVerifiedAddress.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Email Confirmation Dialog */}
      <Dialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Address?</DialogTitle>
            <DialogDescription>
              This will remove this email address from your verified senders. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => emailToDelete && handleDeleteEmail(emailToDelete)}
              disabled={deleteVerifiedAddress.isPending}
            >
              {deleteVerifiedAddress.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
