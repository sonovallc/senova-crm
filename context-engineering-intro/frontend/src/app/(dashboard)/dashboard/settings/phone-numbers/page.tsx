'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  usePhoneNumbers,
  useSearchPhoneNumbers,
  usePurchasePhoneNumber,
  useReleasePhoneNumber,
  useSyncPhoneNumber,
  useTelnyxSettings,
  type OwnedPhoneNumber,
  type AvailableNumber,
} from '@/lib/queries/telnyx'
import { objectsApi } from '@/lib/api/objects'
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
  Phone,
  Loader2,
  Search,
  ShoppingCart,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react'

interface CRMObject {
  id: string
  name: string
  type: string
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
]

export default function PhoneNumbersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedObjectId, setSelectedObjectId] = useState<string>('')
  const [searchForm, setSearchForm] = useState({
    area_code: '',
    state: '',
    city: '',
    number_type: 'local' as 'local' | 'toll_free',
  })
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([])
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null)
  const [friendlyName, setFriendlyName] = useState('')
  const [showReleaseDialog, setShowReleaseDialog] = useState(false)
  const [numberToRelease, setNumberToRelease] = useState<OwnedPhoneNumber | null>(null)

  // Check permissions
  const isOwner = user?.role === 'owner'

  // Queries
  const { data: telnyxSettings = [], isLoading: settingsLoading } = useTelnyxSettings()
  const { data: phoneNumbers = [], isLoading: numbersLoading, refetch: refetchNumbers } = usePhoneNumbers(selectedObjectId || undefined)

  // Fetch objects with Telnyx configured
  const { data: objectsWithTelnyx = [], isLoading: objectsLoading } = useQuery({
    queryKey: ['objects-with-telnyx'],
    queryFn: async () => {
      const objects = await objectsApi.list({ page: 1, page_size: 100 })
      // Filter to only objects that have Telnyx settings
      const configuredObjectIds = telnyxSettings.map(s => s.object_id)
      return (objects.items || []).filter((obj: CRMObject) => configuredObjectIds.includes(obj.id))
    },
    enabled: telnyxSettings.length > 0,
  })

  // Mutations
  const searchNumbers = useSearchPhoneNumbers()
  const purchaseNumber = usePurchasePhoneNumber()
  const releaseNumber = useReleasePhoneNumber()
  const syncNumber = useSyncPhoneNumber()

  if (!isOwner) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">Phone Number Management</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You don't have permission to view this page</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSearch = async () => {
    if (!selectedObjectId) {
      toast({
        title: 'Error',
        description: 'Please select a business object first',
        variant: 'destructive',
      })
      return
    }

    try {
      const results = await searchNumbers.mutateAsync({
        object_id: selectedObjectId,
        area_code: searchForm.area_code || undefined,
        state: searchForm.state || undefined,
        city: searchForm.city || undefined,
        number_type: searchForm.number_type,
        limit: 20,
      })
      setSearchResults(results)
      if (results.length === 0) {
        toast({
          title: 'No Results',
          description: 'No phone numbers found matching your criteria',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Search Failed',
        description: err.response?.data?.detail || 'Failed to search phone numbers',
        variant: 'destructive',
      })
    }
  }

  const handlePurchaseClick = (number: AvailableNumber) => {
    setSelectedNumber(number)
    setFriendlyName('')
    setShowPurchaseDialog(true)
  }

  const handlePurchase = async () => {
    if (!selectedNumber || !selectedObjectId) return

    try {
      await purchaseNumber.mutateAsync({
        object_id: selectedObjectId,
        phone_number: selectedNumber.phone_number,
        friendly_name: friendlyName || undefined,
      })
      toast({
        title: 'Success',
        description: `Phone number ${selectedNumber.phone_number} purchased successfully`,
      })
      setShowPurchaseDialog(false)
      setSelectedNumber(null)
      setSearchResults([])
      refetchNumbers()
    } catch (err: any) {
      toast({
        title: 'Purchase Failed',
        description: err.response?.data?.detail || 'Failed to purchase phone number',
        variant: 'destructive',
      })
    }
  }

  const handleReleaseClick = (number: OwnedPhoneNumber) => {
    setNumberToRelease(number)
    setShowReleaseDialog(true)
  }

  const handleRelease = async () => {
    if (!numberToRelease) return

    try {
      await releaseNumber.mutateAsync(numberToRelease.id)
      toast({
        title: 'Success',
        description: `Phone number ${numberToRelease.phone_number} released successfully`,
      })
      setShowReleaseDialog(false)
      setNumberToRelease(null)
      refetchNumbers()
    } catch (err: any) {
      toast({
        title: 'Release Failed',
        description: err.response?.data?.detail || 'Failed to release phone number',
        variant: 'destructive',
      })
    }
  }

  const handleSync = async (numberId: string) => {
    try {
      const result = await syncNumber.mutateAsync(numberId)
      toast({
        title: 'Synced',
        description: `Status updated: ${result.telnyx_status || result.status}`,
      })
      refetchNumbers()
    } catch (err: any) {
      toast({
        title: 'Sync Failed',
        description: err.response?.data?.detail || 'Failed to sync phone number',
        variant: 'destructive',
      })
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Format as (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Active</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><AlertCircle className="mr-1 h-3 w-3" />Pending</Badge>
      case 'released':
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />Released</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (settingsLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">Phone Number Management</h1>
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
          <h1 className="text-2xl font-bold">Phone Number Management</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Telnyx Not Configured
              </CardTitle>
              <CardDescription>
                You need to configure Telnyx before you can manage phone numbers
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
            <h1 className="text-2xl font-bold">Phone Number Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search, purchase, and manage phone numbers for SMS/MMS
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
              <CardDescription>Choose which business to manage phone numbers for</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedObjectId} onValueChange={setSelectedObjectId}>
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

          {selectedObjectId && (
            <Tabs defaultValue="owned" className="space-y-4">
              <TabsList>
                <TabsTrigger value="owned">Owned Numbers</TabsTrigger>
                <TabsTrigger value="search">Search & Purchase</TabsTrigger>
              </TabsList>

              {/* Owned Numbers Tab */}
              <TabsContent value="owned">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Owned Phone Numbers</CardTitle>
                        <CardDescription>Phone numbers currently assigned to this business</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => refetchNumbers()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {numbersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : phoneNumbers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No phone numbers</h3>
                        <p className="text-muted-foreground">
                          Search and purchase a phone number to get started
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Friendly Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Purchased</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {phoneNumbers.map((number) => (
                            <TableRow key={number.id}>
                              <TableCell className="font-medium font-mono">
                                {formatPhoneNumber(number.phone_number)}
                              </TableCell>
                              <TableCell>{number.friendly_name || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {number.phone_number_type || 'local'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {number.campaign_name ? (
                                  <Badge variant="secondary">{number.campaign_name}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(number.status)}</TableCell>
                              <TableCell>
                                {number.purchased_at
                                  ? new Date(number.purchased_at).toLocaleDateString()
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSync(number.id)}
                                    disabled={syncNumber.isPending}
                                    title="Sync from Telnyx"
                                  >
                                    {syncNumber.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleReleaseClick(number)}
                                    title="Release number"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
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

              {/* Search Tab */}
              <TabsContent value="search">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Available Numbers</CardTitle>
                    <CardDescription>Find and purchase new phone numbers from Telnyx</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Search Form */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="number-type">Number Type</Label>
                        <Select
                          value={searchForm.number_type}
                          onValueChange={(value: 'local' | 'toll_free') =>
                            setSearchForm({ ...searchForm, number_type: value })
                          }
                        >
                          <SelectTrigger id="number-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="toll_free">Toll-Free</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="area-code">Area Code</Label>
                        <Input
                          id="area-code"
                          placeholder="e.g., 512"
                          maxLength={3}
                          value={searchForm.area_code}
                          onChange={(e) =>
                            setSearchForm({ ...searchForm, area_code: e.target.value.replace(/\D/g, '') })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select
                          value={searchForm.state}
                          onValueChange={(value) => setSearchForm({ ...searchForm, state: value })}
                        >
                          <SelectTrigger id="state">
                            <SelectValue placeholder="Any state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any state</SelectItem>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="e.g., Austin"
                          value={searchForm.city}
                          onChange={(e) => setSearchForm({ ...searchForm, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button onClick={handleSearch} disabled={searchNumbers.isPending}>
                      {searchNumbers.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search Numbers
                    </Button>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Phone Number</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Features</TableHead>
                              <TableHead>Cost</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((number) => (
                              <TableRow key={number.phone_number}>
                                <TableCell className="font-medium font-mono">
                                  {formatPhoneNumber(number.phone_number)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{number.type}</Badge>
                                </TableCell>
                                <TableCell>
                                  {[number.locality, number.region].filter(Boolean).join(', ') || '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {number.features?.slice(0, 3).map((feature) => (
                                      <Badge key={feature} variant="secondary" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {number.monthly_cost ? `$${number.monthly_cost}/mo` : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => handlePurchaseClick(number)}
                                  >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Purchase
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Phone Number</DialogTitle>
            <DialogDescription>
              You are about to purchase {selectedNumber?.phone_number && formatPhoneNumber(selectedNumber.phone_number)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="friendly-name">Friendly Name (optional)</Label>
              <Input
                id="friendly-name"
                placeholder="e.g., Main Office Line"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name to help identify this number
              </p>
            </div>
            {selectedNumber?.monthly_cost && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  Monthly cost: <span className="font-semibold">${selectedNumber.monthly_cost}</span>
                </p>
                {selectedNumber.upfront_cost && (
                  <p className="text-sm">
                    One-time cost: <span className="font-semibold">${selectedNumber.upfront_cost}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={purchaseNumber.isPending}>
              {purchaseNumber.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Confirmation Dialog */}
      <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Phone Number?</DialogTitle>
            <DialogDescription>
              Are you sure you want to release {numberToRelease?.phone_number && formatPhoneNumber(numberToRelease.phone_number)}?
              This action cannot be undone and you will lose this number.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReleaseDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRelease}
              disabled={releaseNumber.isPending}
            >
              {releaseNumber.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Release Number
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
