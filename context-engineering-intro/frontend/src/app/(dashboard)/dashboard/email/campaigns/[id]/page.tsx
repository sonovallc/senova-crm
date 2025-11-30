'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  Mail,
  CheckCircle2,
  Eye,
  MousePointer,
  AlertCircle,
  Pause,
  Play,
  Trash2,
} from 'lucide-react'
import api from '@/lib/api'

interface CampaignStats {
  campaign_id: string
  campaign_name: string
  status: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  failed_count: number
  unsubscribed_count: number
  pending_count: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  bounce_rate: number
  started_at: string | null
  completed_at: string | null
  estimated_completion: string | null
  progress_percentage: number
}

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  recipient_count: number
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const campaignId = params.id as string

  // Fetch campaign details
  const { data: campaign } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/campaigns/${campaignId}`)
      return response.data
    },
  })

  // Fetch campaign stats
  const { data: stats, isLoading } = useQuery<CampaignStats>({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/campaigns/${campaignId}/stats`)
      return response.data
    },
    refetchInterval: campaign?.status === 'sending' ? 5000 : false, // Refresh every 5s if sending
  })

  // Pause campaign mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/pause`)
      return response.data
    },
    onSuccess: () => {
      toast({ title: 'Campaign paused' })
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', campaignId] })
    },
  })

  // Resume campaign mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/resume`)
      return response.data
    },
    onSuccess: () => {
      toast({ title: 'Campaign resumed' })
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', campaignId] })
    },
  })

  if (isLoading || !stats || !campaign) {
    return (
      <div className="container mx-auto py-6">
        <p>Loading campaign details...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{stats.campaign_name}</h1>
              <Badge className={STATUS_COLORS[stats.status]}>
                {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{campaign.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {stats.status === 'sending' && (
            <Button
              variant="outline"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          {stats.status === 'paused' && (
            <Button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar (if sending) */}
      {stats.status === 'sending' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sending progress</span>
                <span>{stats.progress_percentage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.progress_percentage} />
              <p className="text-xs text-muted-foreground">
                {stats.sent_count + stats.failed_count} of {stats.total_recipients} processed
                {stats.estimated_completion && (
                  <span>
                    {' '}
                    · Estimated completion:{' '}
                    {new Date(stats.estimated_completion).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recipients
            </CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_recipients}</div>
            <p className="text-xs text-muted-foreground mt-1">Emails to send</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered_count}</div>
            <p className="text-xs text-green-600 mt-1">{stats.delivery_rate.toFixed(1)}% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opened</CardTitle>
            <Eye className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened_count}</div>
            <p className="text-xs text-blue-600 mt-1">{stats.open_rate.toFixed(1)}% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
            <MousePointer className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicked_count}</div>
            <p className="text-xs text-orange-600 mt-1">{stats.click_rate.toFixed(1)}% rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-xl font-bold">{stats.sent_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{stats.pending_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bounced</p>
              <p className="text-xl font-bold text-orange-600">
                {stats.bounced_count}
                <span className="text-sm text-muted-foreground ml-1">
                  ({stats.bounce_rate.toFixed(1)}%)
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-xl font-bold text-red-600">{stats.failed_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unsubscribed</p>
              <p className="text-xl font-bold">{stats.unsubscribed_count}</p>
            </div>
            {stats.started_at && (
              <div>
                <p className="text-sm text-muted-foreground">Started At</p>
                <p className="text-sm">{new Date(stats.started_at).toLocaleString()}</p>
              </div>
            )}
            {stats.completed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Completed At</p>
                <p className="text-sm">{new Date(stats.completed_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Delivery Rate</span>
                <span className="font-semibold">{stats.delivery_rate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.delivery_rate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Open Rate</span>
                <span className="font-semibold">{stats.open_rate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.open_rate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Click Rate</span>
                <span className="font-semibold">{stats.click_rate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.click_rate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
