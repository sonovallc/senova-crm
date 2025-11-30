'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Save, Users, Shield, Tag } from 'lucide-react'
import { MailgunSettings } from '@/components/settings/mailgun-settings'

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'Settings saved successfully',
    })
  }

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your CRM configuration and integrations</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* User Management Card - Owner/Admin Only */}
        {(user?.role === "owner" || user?.role === "admin") && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage users, roles, and permissions
                  </CardDescription>
                </div>
                <Button onClick={() => router.push('/dashboard/settings/users')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Field Visibility Card - Owner/Admin Only */}
        {(user?.role === "owner" || user?.role === "admin") && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Field Visibility
                  </CardTitle>
                  <CardDescription>
                    Configure which contact fields are visible to each role
                  </CardDescription>
                </div>
                <Button onClick={() => router.push('/dashboard/settings/fields')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Fields
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Tags Management Card - Owner/Admin Only */}
        {(user?.role === "owner" || user?.role === "admin") && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage tags for organizing contacts
                  </CardDescription>
                </div>
                <Button onClick={() => router.push('/dashboard/settings/tags')}>
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Tags
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="email-config">Email Configuration</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Communication Services</CardTitle>
                <CardDescription>Configure your messaging service API keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bandwidth-key">Bandwidth.com API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bandwidth-key"
                      type={showKeys['bandwidth'] ? 'text' : 'password'}
                      placeholder="Enter Bandwidth API key..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility('bandwidth')}
                    >
                      {showKeys['bandwidth'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mailgun-key">Mailgun API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mailgun-key"
                      type={showKeys['mailgun'] ? 'text' : 'password'}
                      placeholder="Enter Mailgun API key..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility('mailgun')}
                    >
                      {showKeys['mailgun'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Gateways</CardTitle>
                <CardDescription>Configure your payment processing credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-key">Stripe Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stripe-key"
                      type={showKeys['stripe'] ? 'text' : 'password'}
                      placeholder="sk_test_..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility('stripe')}
                    >
                      {showKeys['stripe'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="square-key">Square Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="square-key"
                      type={showKeys['square'] ? 'text' : 'password'}
                      placeholder="Enter Square access token..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility('square')}
                    >
                      {showKeys['square'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Services</CardTitle>
                <CardDescription>Configure AI and enrichment services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="closebot-key">Closebot API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="closebot-key"
                      type={showKeys['closebot'] ? 'text' : 'password'}
                      placeholder="Enter Closebot API key..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility('closebot')}
                    >
                      {showKeys['closebot'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audiencelab-key">Data Integration API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="audiencelab-key"
                      type={showKeys['audiencelab'] ? 'text' : 'password'}
                      placeholder="Enter enrichment service key..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility('audiencelab')}
                    >
                      {showKeys['audiencelab'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact enrichment and behavioral insights
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save API Keys
              </Button>
            </div>
          </TabsContent>

          {/* Email Configuration Tab */}
          <TabsContent value="email-config" className="space-y-4">
            <MailgunSettings />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Integrations</CardTitle>
                <CardDescription>Manage your connected services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Bandwidth.com', status: 'connected', description: 'SMS/MMS/Voice' },
                    { name: 'Mailgun', status: 'connected', description: 'Email service' },
                    { name: 'Stripe', status: 'connected', description: 'Payment processing' },
                    { name: 'Square', status: 'not configured', description: 'POS & Payments' },
                  ].map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                      <div className="text-sm">
                        {integration.status === 'connected' ? (
                          <span className="text-green-600">✓ Connected</span>
                        ) : (
                          <span className="text-muted-foreground">Not configured</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value="Admin" disabled />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
