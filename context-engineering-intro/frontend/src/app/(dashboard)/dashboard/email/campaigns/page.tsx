'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Mail, Clock, CheckCircle2, Pause, XCircle, Play, Trash2, Copy, Edit, BarChart2, MoreHorizontal, Ban, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  recipient_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  delivery_rate: number | null
  open_rate: number | null
  click_rate: number | null
}

interface CampaignsResponse {
  campaigns: Campaign[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_ICONS = {
  draft: Mail,
  scheduled: Clock,
  sending: Mail,
  sent: CheckCircle2,
  paused: Pause,
  cancelled: XCircle,
}

export default function CampaignsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pause campaign mutation
  const pauseMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/pause`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({ title: 'Campaign paused', description: 'The campaign has been paused.' })
    },
    onError: () => {
      toast({ title: 'Failed to pause campaign', variant: 'destructive' })
    },
  })

  // Resume campaign mutation
  const resumeMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/resume`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({ title: 'Campaign resumed', description: 'The campaign has been resumed.' })
    },
    onError: () => {
      toast({ title: 'Failed to resume campaign', variant: 'destructive' })
    },
  })

  // Cancel campaign mutation
  const cancelMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/cancel`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({ title: 'Campaign cancelled', description: 'The campaign has been cancelled and can now be deleted.' })
    },
    onError: () => {
      toast({ title: 'Failed to cancel campaign', variant: 'destructive' })
    },
  })

  // Clear recipients mutation
  const clearRecipientsMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.delete(`/api/v1/campaigns/${campaignId}/recipients`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({ title: 'Recipients cleared', description: 'All recipients have been removed from this campaign.' })
    },
    onError: () => {
      toast({ title: 'Failed to clear recipients', variant: 'destructive' })
    },
  })

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.delete(`/api/v1/campaigns/${campaignId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({ title: 'Campaign deleted', description: 'The campaign has been deleted.' })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 'Failed to delete campaign'
      toast({
        title: 'Failed to delete campaign',
        description: errorMessage,
        variant: 'destructive'
      })
    },
  })

  // Duplicate campaign mutation
  const duplicateMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/duplicate`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({ title: 'Campaign duplicated', description: 'The campaign has been duplicated.' })
      router.push(`/dashboard/email/campaigns/${data.id}`)
    },
    onError: () => {
      toast({ title: 'Failed to duplicate campaign', variant: 'destructive' })
    },
  })

  // Handle action click without navigating to detail page
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  // Fetch campaigns
  const { data: campaignsData, isLoading, isError, error } = useQuery<CampaignsResponse>({
    queryKey: ['campaigns', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      console.log('Fetching campaigns...')
      const response = await api.get(`/api/v1/campaigns?${params.toString()}`)
      console.log('Campaigns response:', response)
      return response.data
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: typeof window !== 'undefined', // Only run on client side
  })

  const campaigns = campaignsData?.campaigns || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage mass email campaigns
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/email/campaigns/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading campaigns...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Failed to load campaigns</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading campaigns'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email campaign to start reaching your contacts
            </p>
            <Button onClick={() => router.push('/dashboard/email/campaigns/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const StatusIcon = STATUS_ICONS[campaign.status]
            return (
              <Card
                key={campaign.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/email/campaigns/${campaign.id}`)}
                data-testid={`campaign-card-${campaign.id}`}
                data-campaign-status={campaign.status}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <Badge className={STATUS_COLORS[campaign.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        {campaign.scheduled_at && campaign.status === 'scheduled' && (
                          <p>Scheduled for {new Date(campaign.scheduled_at).toLocaleString()}</p>
                        )}
                        {campaign.completed_at && (
                          <p>Completed {formatDistanceToNow(new Date(campaign.completed_at))} ago</p>
                        )}
                        {!campaign.scheduled_at && !campaign.completed_at && (
                          <p>Created {formatDistanceToNow(new Date(campaign.created_at))} ago</p>
                        )}
                      </div>
                      {/* Action Buttons */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`campaign-menu-button-${campaign.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => handleActionClick(e, () => router.push(`/dashboard/email/campaigns/${campaign.id}`))}>
                            <BarChart2 className="mr-2 h-4 w-4" />
                            View Stats
                          </DropdownMenuItem>
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => handleActionClick(e, () => router.push(`/dashboard/email/campaigns/${campaign.id}/edit`))}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
                            <DropdownMenuItem onClick={(e) => handleActionClick(e, () => pauseMutation.mutate(campaign.id))}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'paused' && (
                            <DropdownMenuItem onClick={(e) => handleActionClick(e, () => resumeMutation.mutate(campaign.id))}>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {campaign.status !== 'draft' && campaign.status !== 'cancelled' && (
                            <DropdownMenuItem
                              onClick={(e) => handleActionClick(e, () => {
                                if (confirm('Are you sure you want to cancel this campaign?')) {
                                  cancelMutation.mutate(campaign.id)
                                }
                              })}
                              data-testid={`campaign-cancel-option-${campaign.id}`}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel Campaign
                            </DropdownMenuItem>
                          )}
                          {campaign.recipient_count > 0 && (
                            <DropdownMenuItem onClick={(e) => handleActionClick(e, () => {
                              if (confirm('Are you sure you want to remove all recipients from this campaign?')) {
                                clearRecipientsMutation.mutate(campaign.id)
                              }
                            })}>
                              <Users className="mr-2 h-4 w-4" />
                              Clear Recipients
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => handleActionClick(e, () => duplicateMutation.mutate(campaign.id))}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {(campaign.status === 'draft' || campaign.status === 'cancelled') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => handleActionClick(e, () => {
                                  if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
                                    deleteMutation.mutate(campaign.id)
                                  }
                                })}
                                className="text-red-600"
                                data-testid={`campaign-delete-option-${campaign.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <p className="text-2xl font-bold">{campaign.recipient_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-2xl font-bold">{campaign.sent_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivered</p>
                      <p className="text-2xl font-bold">
                        {campaign.delivered_count}
                        {campaign.delivery_rate !== null && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({campaign.delivery_rate.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opened</p>
                      <p className="text-2xl font-bold">
                        {campaign.opened_count}
                        {campaign.open_rate !== null && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({campaign.open_rate.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clicked</p>
                      <p className="text-2xl font-bold">
                        {campaign.clicked_count}
                        {campaign.click_rate !== null && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({campaign.click_rate.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
