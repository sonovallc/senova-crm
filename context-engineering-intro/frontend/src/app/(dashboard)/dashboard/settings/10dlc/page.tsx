'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useBrands,
  useCreateBrand,
  useSyncBrand,
  useCampaigns,
  useCreateCampaign,
  useSyncCampaign,
  useAssignNumberToCampaign,
  usePhoneNumbers,
  useTelnyxSettings,
  type Brand,
  type Campaign,
  type CreateBrandRequest,
  type CreateCampaignRequest,
} from '@/lib/queries/telnyx'
import { objectsApi } from '@/lib/api/objects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Shield,
  Loader2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Building2,
  Megaphone,
  Phone,
  Link as LinkIcon,
} from 'lucide-react'

interface CRMObject {
  id: string
  name: string
  type: string
}

const USE_CASES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'MIXED', label: 'Mixed / General' },
  { value: 'CUSTOMER_CARE', label: 'Customer Care' },
  { value: 'DELIVERY_NOTIFICATIONS', label: 'Delivery Notifications' },
  { value: 'ACCOUNT_NOTIFICATIONS', label: 'Account Notifications' },
  { value: 'SECURITY', label: 'Security Alerts' },
  { value: 'HIGHER_EDUCATION', label: 'Higher Education' },
  { value: 'LOW_VOLUME', label: 'Low Volume (Personal)' },
]

const VERTICALS = [
  { value: 'PROFESSIONAL', label: 'Professional Services' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'FINANCE', label: 'Financial Services' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'OTHER', label: 'Other' },
]

const ENTITY_TYPES = [
  { value: 'PRIVATE_PROFIT', label: 'Private Company (For Profit)' },
  { value: 'PUBLIC_PROFIT', label: 'Public Company (For Profit)' },
  { value: 'SOLE_PROPRIETOR', label: 'Sole Proprietor' },
  { value: 'NON_PROFIT', label: 'Non-Profit' },
  { value: 'GOVERNMENT', label: 'Government' },
]

export default function TenDLCPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedObjectId, setSelectedObjectId] = useState<string>('')
  const [showBrandDialog, setShowBrandDialog] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  // Brand form
  const [brandForm, setBrandForm] = useState<Partial<CreateBrandRequest>>({
    object_id: '',
    company_name: '',
    display_name: '',
    ein: '',
    website: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    vertical: '',
    entity_type: '',
  })

  // Campaign form
  const [campaignForm, setCampaignForm] = useState<Partial<CreateCampaignRequest>>({
    brand_id: '',
    name: '',
    description: '',
    use_case: '',
    sample_messages: ['', ''],
    opt_in_message: '',
    opt_out_message: 'Reply STOP to unsubscribe',
    help_message: 'Reply HELP for assistance',
    subscriber_optin: true,
    subscriber_optout: true,
    subscriber_help: true,
    number_pool: false,
    embedded_link: false,
    embedded_phone: false,
  })

  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('')

  // Check permissions
  const isOwner = user?.role === 'owner'

  // Queries
  const { data: telnyxSettings = [], isLoading: settingsLoading } = useTelnyxSettings()
  const { data: brands = [], isLoading: brandsLoading, refetch: refetchBrands } = useBrands(selectedObjectId || undefined)
  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns()
  const { data: phoneNumbers = [], isLoading: phoneNumbersLoading } = usePhoneNumbers(selectedObjectId || undefined)

  // Fetch objects with Telnyx configured
  const { data: objectsWithTelnyx = [], isLoading: objectsLoading } = useQuery({
    queryKey: ['objects-with-telnyx-10dlc'],
    queryFn: async () => {
      const objects = await objectsApi.list({ page: 1, page_size: 100 })
      const configuredObjectIds = telnyxSettings.map(s => s.object_id)
      return (objects.items || []).filter((obj: CRMObject) => configuredObjectIds.includes(obj.id))
    },
    enabled: telnyxSettings.length > 0,
  })

  // Mutations
  const createBrand = useCreateBrand()
  const syncBrand = useSyncBrand()
  const createCampaign = useCreateCampaign()
  const syncCampaign = useSyncCampaign()
  const assignNumber = useAssignNumberToCampaign()

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>
      case 'pending':
      case 'in_review':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case 'rejected':
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!isOwner) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">10DLC Registration</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You don't have permission to view this page</p>
          </div>
        </div>
      </div>
    )
  }

  if (settingsLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">10DLC Registration</h1>
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
          <h1 className="text-2xl font-bold">10DLC Registration</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Telnyx Not Configured
              </CardTitle>
              <CardDescription>
                You need to configure Telnyx before registering for 10DLC
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

  const handleCreateBrand = async () => {
    if (!brandForm.object_id || !brandForm.company_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await createBrand.mutateAsync(brandForm as CreateBrandRequest)
      toast({
        title: 'Success',
        description: 'Brand submitted for registration. It may take a few days for approval.',
      })
      setShowBrandDialog(false)
      setBrandForm({
        object_id: selectedObjectId,
        company_name: '',
        display_name: '',
        ein: '',
        website: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        vertical: '',
        entity_type: '',
      })
      refetchBrands()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to create brand',
        variant: 'destructive',
      })
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.brand_id || !campaignForm.name || !campaignForm.use_case) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      const filteredSamples = (campaignForm.sample_messages || []).filter(m => m.trim())
      if (filteredSamples.length < 2) {
        toast({
          title: 'Validation Error',
          description: 'Please provide at least 2 sample messages',
          variant: 'destructive',
        })
        return
      }

      await createCampaign.mutateAsync({
        ...campaignForm,
        sample_messages: filteredSamples,
      } as CreateCampaignRequest)
      toast({
        title: 'Success',
        description: 'Campaign submitted for registration.',
      })
      setShowCampaignDialog(false)
      setCampaignForm({
        brand_id: '',
        name: '',
        description: '',
        use_case: '',
        sample_messages: ['', ''],
        opt_in_message: '',
        opt_out_message: 'Reply STOP to unsubscribe',
        help_message: 'Reply HELP for assistance',
        subscriber_optin: true,
        subscriber_optout: true,
        subscriber_help: true,
        number_pool: false,
        embedded_link: false,
        embedded_phone: false,
      })
      refetchCampaigns()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to create campaign',
        variant: 'destructive',
      })
    }
  }

  const handleAssignNumber = async () => {
    if (!selectedCampaign || !selectedPhoneNumber) return

    try {
      await assignNumber.mutateAsync({
        campaignId: selectedCampaign.id,
        phoneNumberId: selectedPhoneNumber,
      })
      toast({
        title: 'Success',
        description: 'Phone number assigned to campaign',
      })
      setShowAssignDialog(false)
      setSelectedPhoneNumber('')
      refetchCampaigns()
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'phone-numbers'] })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to assign phone number',
        variant: 'destructive',
      })
    }
  }

  const handleSyncBrand = async (brandId: string) => {
    try {
      const result = await syncBrand.mutateAsync(brandId)
      toast({
        title: 'Synced',
        description: `Brand status: ${result.brand_status || result.status}`,
      })
      refetchBrands()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to sync brand',
        variant: 'destructive',
      })
    }
  }

  const handleSyncCampaign = async (campaignId: string) => {
    try {
      const result = await syncCampaign.mutateAsync(campaignId)
      toast({
        title: 'Synced',
        description: `Campaign status: ${result.campaign_status || result.status}`,
      })
      refetchCampaigns()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to sync campaign',
        variant: 'destructive',
      })
    }
  }

  const approvedBrands = brands.filter(b => b.status.toLowerCase() === 'approved' || b.status.toLowerCase() === 'active')
  const unassignedNumbers = phoneNumbers.filter(n => n.status === 'active' && !n.campaign_id)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">10DLC Registration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Register your business for A2P 10DLC messaging compliance
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl space-y-6">
          {/* Object Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Business</CardTitle>
              <CardDescription>Choose which business to manage 10DLC registration for</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedObjectId} onValueChange={(value) => {
                setSelectedObjectId(value)
                setBrandForm(prev => ({ ...prev, object_id: value }))
              }}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a business with Telnyx configured" />
                </SelectTrigger>
                <SelectContent>
                  {objectsWithTelnyx.map((obj: CRMObject) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-5 w-5" />
                What is 10DLC?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 text-sm space-y-2">
              <p>
                10DLC (10-Digit Long Code) is a system for registering standard phone numbers for Application-to-Person (A2P) messaging in the US.
              </p>
              <p>
                <strong>Registration is required</strong> for businesses sending SMS to US phone numbers. The process involves:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li><strong>Brand Registration</strong> - Register your business identity</li>
                <li><strong>Campaign Registration</strong> - Describe how you'll use SMS</li>
                <li><strong>Number Assignment</strong> - Link phone numbers to approved campaigns</li>
              </ol>
            </CardContent>
          </Card>

          {selectedObjectId && (
            <Tabs defaultValue="brands" className="space-y-4">
              <TabsList>
                <TabsTrigger value="brands">
                  <Building2 className="mr-2 h-4 w-4" />
                  Brands
                </TabsTrigger>
                <TabsTrigger value="campaigns">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Campaigns
                </TabsTrigger>
              </TabsList>

              {/* Brands Tab */}
              <TabsContent value="brands">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Brand Registrations</CardTitle>
                        <CardDescription>Your registered business identities</CardDescription>
                      </div>
                      <Button onClick={() => setShowBrandDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Register Brand
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {brandsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : brands.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No brands registered</h3>
                        <p className="text-muted-foreground mb-4">
                          Register your business to start sending compliant SMS
                        </p>
                        <Button onClick={() => setShowBrandDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Register First Brand
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Display Name</TableHead>
                            <TableHead>EIN</TableHead>
                            <TableHead>Vertical</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {brands.map((brand) => (
                            <TableRow key={brand.id}>
                              <TableCell className="font-medium">{brand.company_name}</TableCell>
                              <TableCell>{brand.display_name || '-'}</TableCell>
                              <TableCell>{brand.ein || '-'}</TableCell>
                              <TableCell>{brand.vertical || '-'}</TableCell>
                              <TableCell>{getStatusBadge(brand.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSyncBrand(brand.id)}
                                  disabled={syncBrand.isPending}
                                  title="Sync status"
                                >
                                  {syncBrand.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Campaign Registrations</CardTitle>
                        <CardDescription>Your registered messaging campaigns</CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowCampaignDialog(true)}
                        disabled={approvedBrands.length === 0}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Register Campaign
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {approvedBrands.length === 0 && (
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 mb-4">
                        <p className="text-sm text-yellow-700">
                          <AlertCircle className="inline mr-2 h-4 w-4" />
                          You need an approved brand before creating campaigns
                        </p>
                      </div>
                    )}
                    {campaignsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : campaigns.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No campaigns registered</h3>
                        <p className="text-muted-foreground">
                          Register a campaign to describe your messaging use case
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Use Case</TableHead>
                            <TableHead>Phone Numbers</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell>{campaign.brand_name || '-'}</TableCell>
                              <TableCell>{campaign.use_case}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {campaign.phone_number_count} assigned
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedCampaign(campaign)
                                      setShowAssignDialog(true)
                                    }}
                                    disabled={campaign.status.toLowerCase() !== 'approved' && campaign.status.toLowerCase() !== 'active'}
                                    title="Assign phone number"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSyncCampaign(campaign.id)}
                                    disabled={syncCampaign.isPending}
                                    title="Sync status"
                                  >
                                    {syncCampaign.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Brand Registration Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Brand</DialogTitle>
            <DialogDescription>
              Register your business for 10DLC messaging compliance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">
                  Legal Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company-name"
                  placeholder="Acme Corp, Inc."
                  value={brandForm.company_name}
                  onChange={(e) => setBrandForm({ ...brandForm, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Acme Corp"
                  value={brandForm.display_name || ''}
                  onChange={(e) => setBrandForm({ ...brandForm, display_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ein">EIN (Tax ID)</Label>
                <Input
                  id="ein"
                  placeholder="12-3456789"
                  value={brandForm.ein || ''}
                  onChange={(e) => setBrandForm({ ...brandForm, ein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select
                  value={brandForm.entity_type || ''}
                  onValueChange={(value) => setBrandForm({ ...brandForm, entity_type: value })}
                >
                  <SelectTrigger id="entity-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vertical">Industry Vertical</Label>
              <Select
                value={brandForm.vertical || ''}
                onValueChange={(value) => setBrandForm({ ...brandForm, vertical: value })}
              >
                <SelectTrigger id="vertical">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {VERTICALS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="contact">
                <AccordionTrigger>Contact Information</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+15551234567"
                        value={brandForm.phone || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@company.com"
                        value={brandForm.email || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://company.com"
                      value={brandForm.website || ''}
                      onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="address">
                <AccordionTrigger>Business Address</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="123 Main St"
                      value={brandForm.street || ''}
                      onChange={(e) => setBrandForm({ ...brandForm, street: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={brandForm.city || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="TX"
                        maxLength={2}
                        value={brandForm.state || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, state: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">ZIP Code</Label>
                      <Input
                        id="postal-code"
                        value={brandForm.postal_code || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrandDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBrand} disabled={createBrand.isPending}>
              {createBrand.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Registration Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Campaign</DialogTitle>
            <DialogDescription>
              Describe your SMS messaging use case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand">
                Brand <span className="text-red-500">*</span>
              </Label>
              <Select
                value={campaignForm.brand_id || ''}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, brand_id: value })}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Select an approved brand" />
                </SelectTrigger>
                <SelectContent>
                  {approvedBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-name">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Customer Notifications"
                value={campaignForm.name || ''}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="use-case">
                Use Case <span className="text-red-500">*</span>
              </Label>
              <Select
                value={campaignForm.use_case || ''}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, use_case: value })}
              >
                <SelectTrigger id="use-case">
                  <SelectValue placeholder="Select use case" />
                </SelectTrigger>
                <SelectContent>
                  {USE_CASES.map((uc) => (
                    <SelectItem key={uc.value} value={uc.value}>
                      {uc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Campaign Description</Label>
              <Textarea
                id="description"
                placeholder="Describe how you will use SMS messaging..."
                value={campaignForm.description || ''}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Sample Messages <span className="text-red-500">*</span>
                <span className="text-muted-foreground ml-2 text-xs">(at least 2 required)</span>
              </Label>
              {(campaignForm.sample_messages || []).map((msg, idx) => (
                <Input
                  key={idx}
                  placeholder={`Sample message ${idx + 1}`}
                  value={msg}
                  onChange={(e) => {
                    const updated = [...(campaignForm.sample_messages || [])]
                    updated[idx] = e.target.value
                    setCampaignForm({ ...campaignForm, sample_messages: updated })
                  }}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...(campaignForm.sample_messages || []), '']
                  setCampaignForm({ ...campaignForm, sample_messages: updated })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Sample
              </Button>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="compliance">
                <AccordionTrigger>Compliance Messages</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="opt-in">Opt-in Message</Label>
                    <Textarea
                      id="opt-in"
                      placeholder="Message sent when user opts in"
                      value={campaignForm.opt_in_message || ''}
                      onChange={(e) => setCampaignForm({ ...campaignForm, opt_in_message: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opt-out">Opt-out Message</Label>
                    <Input
                      id="opt-out"
                      value={campaignForm.opt_out_message || ''}
                      onChange={(e) => setCampaignForm({ ...campaignForm, opt_out_message: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="help">Help Message</Label>
                    <Input
                      id="help"
                      value={campaignForm.help_message || ''}
                      onChange={(e) => setCampaignForm({ ...campaignForm, help_message: e.target.value })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
              {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Phone Number Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Phone Number</DialogTitle>
            <DialogDescription>
              Assign a phone number to campaign: {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
                <SelectTrigger id="phone-number">
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedNumbers.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No unassigned phone numbers
                    </SelectItem>
                  ) : (
                    unassignedNumbers.map((number) => (
                      <SelectItem key={number.id} value={number.id}>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {number.phone_number}
                          {number.friendly_name && ` - ${number.friendly_name}`}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignNumber}
              disabled={assignNumber.isPending || !selectedPhoneNumber}
            >
              {assignNumber.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Number
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
