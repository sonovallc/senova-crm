'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import {
  useTwilioSettings,
  useSaveTwilioSettings,
  useTestTwilioConnection,
  useDeleteTwilioSettings,
} from '@/lib/queries/twilio'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Phone, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

export function TwilioSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showAuthToken, setShowAuthToken] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    account_sid: '',
    auth_token: '',
    webhook_signing_secret: '',
  })

  // Queries
  const { data: settings, isLoading } = useTwilioSettings()
  const saveSettings = useSaveTwilioSettings()
  const testConnection = useTestTwilioConnection()
  const deleteSettings = useDeleteTwilioSettings()

  const hasSettings = !!settings

  const handleSaveSettings = async () => {
    try {
      // Validate required fields
      if (!formData.account_sid || !formData.auth_token) {
        toast({
          title: 'Validation Error',
          description: 'Account SID and Auth Token are required',
          variant: 'destructive',
        })
        return
      }

      await saveSettings.mutateAsync({
        account_sid: formData.account_sid,
        auth_token: formData.auth_token,
        webhook_signing_secret: formData.webhook_signing_secret || undefined,
      })

      toast({
        title: 'Success',
        description: 'Twilio settings saved successfully. Please test the connection.',
      })

      // Clear sensitive data from form after save
      setFormData({
        ...formData,
        auth_token: '',
        webhook_signing_secret: '',
      })
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
          description: `Connected to Twilio account: ${result.account_name}`,
        })
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Unable to connect to Twilio',
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
        description: 'Twilio settings deleted successfully',
      })
      setShowDeleteDialog(false)
      setFormData({
        account_sid: '',
        auth_token: '',
        webhook_signing_secret: '',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to delete settings',
        variant: 'destructive',
      })
    }
  }

  // Update form when settings change
  const handleAccountSidChange = (value: string) => {
    if (hasSettings && value !== settings.account_sid) {
      // If changing existing Account SID, require new auth token
      setFormData({ ...formData, account_sid: value })
    } else {
      setFormData({ ...formData, account_sid: value })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Twilio Integration
          </CardTitle>
          <CardDescription>
            Connect your Twilio account to enable SMS, MMS, and voice calling capabilities
          </CardDescription>
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
                <Phone className="h-5 w-5" />
                Twilio Integration
              </CardTitle>
              <CardDescription>
                Connect your Twilio account to enable SMS, MMS, and voice calling capabilities
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasSettings && settings.connection_verified_at ? (
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
          {hasSettings && settings.connection_verified_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Last verified: {new Date(settings.connection_verified_at).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Getting Started Section */}
          {!hasSettings && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-medium mb-2">Getting Started</h3>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Create a Twilio account at <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">twilio.com/try-twilio</a></li>
                <li>2. From your Twilio Console, copy your Account SID and Auth Token</li>
                <li>3. Paste them below and click "Test Connection"</li>
                <li>4. Once connected, you can purchase phone numbers and start messaging</li>
              </ol>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-sid">
                Account SID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account-sid"
                placeholder="AC..."
                value={hasSettings ? settings.account_sid : formData.account_sid}
                onChange={(e) => handleAccountSidChange(e.target.value)}
                disabled={hasSettings}
              />
              {hasSettings && (
                <p className="text-xs text-muted-foreground">
                  Account SID cannot be changed once connected
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-token">
                Auth Token <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="auth-token"
                  type={showAuthToken ? 'text' : 'password'}
                  placeholder={hasSettings ? '••••••••••••••••' : 'Enter your Auth Token'}
                  value={formData.auth_token}
                  onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAuthToken(!showAuthToken)}
                >
                  {showAuthToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {hasSettings && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep current Auth Token
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">
                Webhook Signing Secret (Optional)
              </Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="For webhook signature verification"
                value={formData.webhook_signing_secret}
                onChange={(e) => setFormData({ ...formData, webhook_signing_secret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Used to verify incoming webhook requests from Twilio
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSaveSettings}
              disabled={saveSettings.isPending || (!formData.account_sid && !hasSettings) || !formData.auth_token}
            >
              {saveSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasSettings ? 'Update Settings' : 'Save Settings'}
            </Button>

            {hasSettings && (
              <>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Once Connected Section */}
          {hasSettings && settings.connection_verified_at && (
            <div className="rounded-lg border p-4 bg-muted/50 mt-6">
              <h3 className="font-medium mb-2">Once Connected:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Purchase phone numbers directly in Senova</li>
                <li>• Send and receive SMS/MMS messages</li>
                <li>• Make click-to-call voice calls</li>
                <li>• Track all communications in your unified inbox</li>
                <li>• Set up auto-responders and messaging campaigns</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Twilio?</DialogTitle>
            <DialogDescription>
              This will delete your Twilio configuration and stop all SMS/voice services.
              You will need to reconfigure Twilio to use these features again.
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
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}