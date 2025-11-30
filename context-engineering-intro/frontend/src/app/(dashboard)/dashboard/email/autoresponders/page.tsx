'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Mail, Tag, Calendar, BarChart3, PlayCircle, PauseCircle, Edit, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

interface Autoresponder {
  id: string
  name: string
  description: string | null
  trigger_type: 'new_contact' | 'tag_added' | 'date_based' | 'appointment_booked' | 'appointment_completed'
  is_active: boolean
  sequence_enabled: boolean
  total_executions: number
  total_sent: number
  total_failed: number
  created_at: string
  updated_at: string
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

export default function AutorespondersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [triggerFilter, setTriggerFilter] = useState<string>('all')

  // Fetch autoresponders
  const { data: autoresponders, isLoading } = useQuery<Autoresponder[]>({
    queryKey: ['autoresponders', activeFilter, triggerFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeFilter === 'active') {
        params.append('is_active', 'true')
      } else if (activeFilter === 'inactive') {
        params.append('is_active', 'false')
      }
      if (triggerFilter && triggerFilter !== 'all') {
        params.append('trigger_type', triggerFilter)
      }

      const response = await api.get(`/api/v1/autoresponders?${params.toString()}`)
      return response.data
    },
  })

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async (autoresponderId: string) => {
      const response = await api.post(`/api/v1/autoresponders/${autoresponderId}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoresponders'] })
      toast({
        title: 'Success',
        description: 'Autoresponder status updated',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update autoresponder status',
        variant: 'destructive',
      })
    },
  })

  // Delete autoresponder
  const deleteMutation = useMutation({
    mutationFn: async (autoresponderId: string) => {
      await api.delete(`/api/v1/autoresponders/${autoresponderId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoresponders'] })
      toast({
        title: 'Success',
        description: 'Autoresponder deleted',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete autoresponder',
        variant: 'destructive',
      })
    },
  })

  const filteredAutoresponders = autoresponders?.filter((autoresponder) => {
    if (!searchQuery) return true
    return autoresponder.name.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Autoresponders</h1>
          <p className="text-muted-foreground">Automatically send emails based on triggers</p>
        </div>
        <Link href="/dashboard/email/autoresponders/create">
          <Button data-testid="autoresponder-create-button">
            <Plus className="mr-2 h-4 w-4" />
            Create Autoresponder
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search autoresponders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Trigger Filter */}
            <Select value={triggerFilter} onValueChange={setTriggerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Triggers</SelectItem>
                <SelectItem value="new_contact">New Contact</SelectItem>
                <SelectItem value="tag_added">Tag Added</SelectItem>
                <SelectItem value="date_based">Date-Based</SelectItem>
                <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
                <SelectItem value="appointment_completed">Appointment Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Autoresponders List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading autoresponders...</p>
          </CardContent>
        </Card>
      ) : filteredAutoresponders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No autoresponders yet</h3>
            <p className="text-muted-foreground mb-4">Create your first autoresponder to get started</p>
            <Link href="/dashboard/email/autoresponders/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Autoresponder
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Active</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Sequences</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutoresponders.map((autoresponder) => (
                <TableRow key={autoresponder.id}>
                  {/* Active Toggle */}
                  <TableCell>
                    <Switch
                      checked={autoresponder.is_active}
                      onCheckedChange={() => toggleMutation.mutate(autoresponder.id)}
                    />
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <div>
                      <div className="font-medium">{autoresponder.name}</div>
                      {autoresponder.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-md">
                          {autoresponder.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Trigger Type */}
                  <TableCell>
                    <Badge className={TRIGGER_TYPE_COLORS[autoresponder.trigger_type]}>
                      {TRIGGER_TYPE_LABELS[autoresponder.trigger_type]}
                    </Badge>
                  </TableCell>

                  {/* Sequences */}
                  <TableCell>
                    {autoresponder.sequence_enabled ? (
                      <Badge variant="outline">Multi-Step</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">
                        Single Email
                      </Badge>
                    )}
                  </TableCell>

                  {/* Sent Count */}
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{autoresponder.total_sent.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">
                        of {autoresponder.total_executions.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>

                  {/* Failed Count */}
                  <TableCell className="text-right">
                    {autoresponder.total_failed > 0 ? (
                      <span className="text-red-600 font-medium">{autoresponder.total_failed}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>

                  {/* Updated */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(autoresponder.updated_at), { addSuffix: true })}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/email/autoresponders/${autoresponder.id}`)}
                        data-testid={`autoresponder-stats-${autoresponder.id}`}
                        title="View Stats"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/email/autoresponders/${autoresponder.id}/edit`)}
                        data-testid={`autoresponder-edit-${autoresponder.id}`}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this autoresponder?')) {
                            deleteMutation.mutate(autoresponder.id)
                          }
                        }}
                        data-testid={`autoresponder-delete-${autoresponder.id}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Statistics Summary */}
      {filteredAutoresponders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Autoresponders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAutoresponders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredAutoresponders.filter((a) => a.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredAutoresponders.reduce((sum, a) => sum + a.total_sent, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredAutoresponders.reduce((sum, a) => sum + a.total_failed, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
