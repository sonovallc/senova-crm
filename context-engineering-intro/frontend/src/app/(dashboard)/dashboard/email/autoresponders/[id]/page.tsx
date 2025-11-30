'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Edit, Trash2, Send, CheckCircle2, XCircle, Clock, Mail, Users, AlertCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import Link from 'next/link'

interface AutoresponderDetails {
  id: string
  name: string
  description: string | null
  trigger_type: 'new_contact' | 'tag_added' | 'date_based' | 'appointment_booked' | 'appointment_completed'
  trigger_tag: string | null
  trigger_date_field: string | null
  trigger_days_offset: number | null
  is_active: boolean
  sequence_enabled: boolean
  template_id: string | null
  template_name: string | null
  total_executions: number
  total_sent: number
  total_pending: number
  total_failed: number
  created_at: string
  updated_at: string
}

interface ExecutionLog {
  id: string
  contact_id: string
  contact_name: string
  contact_email: string
  sequence_step: number
  status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  failed_at: string | null
  error_message: string | null
  created_at: string
}

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  new_contact: 'New Contact',
  tag_added: 'Tag Added',
  date_based: 'Date-Based',
  appointment_booked: 'Appointment Booked',
  appointment_completed: 'Appointment Completed',
}

const TRIGGER_TYPE_COLORS: Record<string, string> = {
  new_contact: 'bg-blue-100 text-blue-800',
  tag_added: 'bg-amber-100 text-red-800',
  date_based: 'bg-green-100 text-green-800',
  appointment_booked: 'bg-yellow-100 text-yellow-800',
  appointment_completed: 'bg-orange-100 text-orange-800',
}

export default function AutoresponderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const autoresponderId = params.id as string

  // Fetch autoresponder details
  const { data: autoresponder, isLoading, isError } = useQuery<AutoresponderDetails>({
    queryKey: ['autoresponder', autoresponderId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/autoresponders/${autoresponderId}`)
      return response.data
    },
    enabled: !!autoresponderId,
  })

  // Fetch execution logs
  const { data: executionLogs, isLoading: logsLoading } = useQuery<ExecutionLog[]>({
    queryKey: ['autoresponder-logs', autoresponderId],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/v1/autoresponders/${autoresponderId}/executions`)
        return response.data || []
      } catch {
        // Return empty array if endpoint doesn't exist yet
        return []
      }
    },
    enabled: !!autoresponderId,
  })

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/v1/autoresponders/${autoresponderId}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoresponder', autoresponderId] })
      toast({
        title: 'Status updated',
        description: autoresponder?.is_active ? 'Autoresponder deactivated' : 'Autoresponder activated',
      })
    },
    onError: () => {
      toast({
        title: 'Failed to update status',
        variant: 'destructive',
      })
    },
  })

  // Delete autoresponder
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/autoresponders/${autoresponderId}`)
    },
    onSuccess: () => {
      toast({
        title: 'Autoresponder deleted',
      })
      router.push('/dashboard/email/autoresponders')
    },
    onError: () => {
      toast({
        title: 'Failed to delete autoresponder',
        variant: 'destructive',
      })
    },
  })

  // Send test email
  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/v1/autoresponders/${autoresponderId}/test`)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Test email sent',
        description: 'Check your inbox for the test email.',
      })
    },
    onError: () => {
      toast({
        title: 'Failed to send test email',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !autoresponder) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Autoresponder not found</h3>
            <p className="text-muted-foreground mb-4">
              The autoresponder you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.push('/dashboard/email/autoresponders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Autoresponders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const successRate = autoresponder.total_sent > 0
    ? ((autoresponder.total_sent / (autoresponder.total_sent + autoresponder.total_failed)) * 100).toFixed(1)
    : '0'

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/email/autoresponders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{autoresponder.name}</h1>
              <Badge className={TRIGGER_TYPE_COLORS[autoresponder.trigger_type]}>
                {TRIGGER_TYPE_LABELS[autoresponder.trigger_type]}
              </Badge>
              {autoresponder.is_active ? (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            {autoresponder.description && (
              <p className="text-muted-foreground">{autoresponder.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">Active</span>
            <Switch
              checked={autoresponder.is_active}
              onCheckedChange={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {testMutation.isPending ? 'Sending...' : 'Send Test'}
          </Button>
          <Link href={`/dashboard/email/autoresponders/${autoresponderId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this autoresponder?')) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{autoresponder.total_executions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{autoresponder.total_sent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{autoresponder.total_pending.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{autoresponder.total_failed.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Autoresponder trigger and template settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Trigger Type</p>
              <p className="font-medium">{TRIGGER_TYPE_LABELS[autoresponder.trigger_type]}</p>
            </div>
            {autoresponder.trigger_tag && (
              <div>
                <p className="text-sm text-muted-foreground">Trigger Tag</p>
                <Badge variant="outline">{autoresponder.trigger_tag}</Badge>
              </div>
            )}
            {autoresponder.trigger_date_field && (
              <div>
                <p className="text-sm text-muted-foreground">Date Field</p>
                <p className="font-medium">{autoresponder.trigger_date_field}</p>
              </div>
            )}
            {autoresponder.trigger_days_offset !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Days Offset</p>
                <p className="font-medium">
                  {autoresponder.trigger_days_offset > 0 ? '+' : ''}{autoresponder.trigger_days_offset} days
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{autoresponder.template_name || 'No template'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{autoresponder.sequence_enabled ? 'Multi-Step Sequence' : 'Single Email'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(autoresponder.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDistanceToNow(new Date(autoresponder.updated_at), { addSuffix: true })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>History of emails sent by this autoresponder</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !executionLogs || executionLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No executions yet</p>
              <p className="text-sm">Emails will appear here when the autoresponder is triggered.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.contact_name}</div>
                        <div className="text-sm text-muted-foreground">{log.contact_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Step {log.sequence_step}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'sent' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Sent
                        </Badge>
                      )}
                      {log.status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {log.status === 'failed' && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.sent_at ? (
                        <span className="text-sm">{format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}</span>
                      ) : log.failed_at ? (
                        <span className="text-sm text-red-600">{format(new Date(log.failed_at), 'MMM d, yyyy h:mm a')}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <span className="text-sm text-red-600 truncate max-w-[200px] block">{log.error_message}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
