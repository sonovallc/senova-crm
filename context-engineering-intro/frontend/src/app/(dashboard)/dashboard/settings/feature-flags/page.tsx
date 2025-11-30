'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featureFlagsApi } from '@/lib/queries/featureFlags'
import { FeatureFlag } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'

const sanitizeTestId = (key: string) => key.replace(/[^a-z0-9-]/gi, '-').toLowerCase()

export default function FeatureFlagsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ key: '', name: '', description: '' })

  const canView = user?.role === 'owner' || user?.role === 'admin'
  const canManage = user?.role === 'owner'

  const { data, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => featureFlagsApi.listFlags({ page_size: 200 }),
    enabled: canView,
  })

  const createMutation = useMutation({
    mutationFn: featureFlagsApi.createFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
      setForm({ key: '', name: '', description: '' })
      toast({ title: 'Feature flag created' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create flag',
        description: error?.response?.data?.detail || 'Unable to create feature flag.',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      featureFlagsApi.updateFlag(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
      toast({ title: 'Feature flag updated' })
    },
    onError: () => {
      toast({
        title: 'Failed to update flag',
        description: 'Please try again.',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => featureFlagsApi.deleteFlag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
      toast({ title: 'Feature flag deleted' })
    },
    onError: () => {
      toast({
        title: 'Failed to delete flag',
        description: 'Please try again.',
        variant: 'destructive',
      })
    },
  })

  const flags = useMemo(() => data?.items ?? [], [data])

  if (!canView) {
    return (
      <div className="p-8" data-testid="feature-flags-denied">
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only owners and admins can view feature flags.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreate = () => {
    if (!form.key || !form.name) {
      toast({ title: 'Key and name are required', variant: 'destructive' })
      return
    }
    createMutation.mutate({ key: form.key, name: form.name, description: form.description })
  }

  return (
    <div className="p-8 space-y-6">
      {/* Documentation Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p className="mb-4">
            Feature flags allow you to enable or disable specific functionality in the CRM without deploying new code.
            This is useful for:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1 text-sm">
            <li><strong>Beta Testing:</strong> Roll out new features to a subset of users</li>
            <li><strong>Gradual Rollouts:</strong> Slowly enable features while monitoring for issues</li>
            <li><strong>Quick Rollback:</strong> Instantly disable problematic features</li>
            <li><strong>A/B Testing:</strong> Compare different implementations</li>
          </ul>
          <div className="text-sm">
            <strong>Who can manage flags:</strong>
            <ul className="list-disc list-inside mt-1">
              <li><strong>Owner:</strong> Can create, enable/disable, and delete feature flags</li>
              <li><strong>Admin:</strong> Can view feature flags (read-only)</li>
              <li><strong>Agent:</strong> Cannot access this page</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Feature Flag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage ? (
            <p className="text-sm text-muted-foreground">
              Only owners can create or edit feature flags.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Key *</label>
                  <Input
                    data-testid="flag-key-input"
                    placeholder="crm.new_feature.beta"
                    value={form.key}
                    onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (e.g., crm.feature.name). Use dots to group related flags.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    data-testid="flag-name-input"
                    placeholder="New Feature Beta"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Human-readable name displayed in the list.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    data-testid="flag-description-input"
                    placeholder="Controls visibility of the new dashboard layout"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Explain what this flag controls and when to enable it.
                  </p>
                </div>
              </div>
              <Button data-testid="add-flag-btn" onClick={handleCreate} disabled={createMutation.isPending}>
                Add Flag
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Flags</CardTitle>
        </CardHeader>
        <CardContent data-testid="feature-flags-table">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading flags...</p>
          ) : flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feature flags yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag: FeatureFlag) => {
                  const testId = sanitizeTestId(flag.key)
                  return (
                    <TableRow key={flag.id} data-testid={`flag-row-${testId}`}>
                      <TableCell>{flag.key}</TableCell>
                      <TableCell>{flag.name}</TableCell>
                      <TableCell className="max-w-xs truncate" title={flag.description || ''}>
                        {flag.description || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" data-testid={`flag-status-${testId}`}>
                          <span className="text-sm">{flag.enabled ? 'Enabled' : 'Disabled'}</span>
                          <Switch
                            data-testid={`toggle-${testId}`}
                            checked={flag.enabled}
                            disabled={!canManage || updateMutation.isPending}
                            onCheckedChange={(checked) => updateMutation.mutate({ id: flag.id, enabled: checked })}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`delete-${testId}`}
                            disabled={!canManage || deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(flag.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
