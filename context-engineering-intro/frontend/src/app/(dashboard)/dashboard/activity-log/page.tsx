'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activitiesApi, ActivityItem, ActivityList } from '@/lib/queries/activities'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { Download, Loader2 } from 'lucide-react'

const clampPageSize = (value?: number, fallback = 50) => {
  if (!value || Number.isNaN(value) || value <= 0) {
    return fallback
  }
  return Math.min(200, value)
}

const activityTypeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Contact Created', value: 'Contact Created' },
  { label: 'Contact Updated', value: 'Contact Updated' },
  { label: 'Contact Deleted', value: 'Contact Deleted' },
  { label: 'Tag Added', value: 'Tag Added' },
  { label: 'Tag Removed', value: 'Tag Removed' },
  { label: 'Status Changed', value: 'Status Changed' },
  { label: 'Assignment Changed', value: 'Assignment Changed' },
]

function formatDetails(activity: ActivityItem): string {
  const details = activity.details || {}

  if (details.changes) {
    const fields = Object.keys(details.changes as Record<string, any>)
    if (fields.length > 0) {
      return `Updated fields: ${fields.join(', ')}`
    }
  }

  if (details.tag_name) {
    return `Tag: ${details.tag_name}`
  }

  if (details.old_status || details.new_status) {
    return `${details.old_status || 'unknown'} → ${details.new_status || 'unknown'}`
  }

  if (details.old_assignment || details.new_assignment) {
    return `Assignment: ${(details.old_assignment?.name || details.old_assignment?.id || 'Unassigned')} → ${
      details.new_assignment?.name || details.new_assignment?.id || 'Unassigned'
    }`
  }

  if (typeof details.soft === 'boolean') {
    return details.soft ? 'Soft delete' : 'Permanent action'
  }

  if (Object.keys(details).length > 0) {
    return JSON.stringify(details)
  }

  return '—'
}

export default function ActivityLogPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const role = user?.role
  const canViewLog = role === 'owner' || role === 'admin'

  const initialPage = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const initialType = searchParams.get('type') ?? 'all'
  const initialUser = searchParams.get('user') ?? ''
  const initialFrom = searchParams.get('from') ?? ''
  const initialTo = searchParams.get('to') ?? ''
  const initialSearch = searchParams.get('search') ?? ''
  const initialPageSize = clampPageSize(Number(searchParams.get('page_size')), 50)

  const [page, setPage] = useState(initialPage)
  const [activityType, setActivityType] = useState(initialType)
  const [userFilter, setUserFilter] = useState(initialUser)
  const [fromDate, setFromDate] = useState(initialFrom)
  const [toDate, setToDate] = useState(initialTo)
  const [searchText, setSearchText] = useState(initialSearch)
  const [pageSize] = useState(initialPageSize)

  const { data, isLoading, isFetching } = useQuery<ActivityList>({
    queryKey: ['activity-log', page, pageSize, activityType, userFilter, fromDate, toDate],
    queryFn: () =>
      activitiesApi.listActivities({
        page,
        page_size: pageSize,
        types: activityType === 'all' ? undefined : [activityType],
        user_id: userFilter || undefined,
        from: fromDate ? new Date(`${fromDate}T00:00:00Z`).toISOString() : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59Z`).toISOString() : undefined,
      }),
    enabled: canViewLog,
  })

  const filteredItems = useMemo<ActivityItem[]>(() => {
    if (!data?.items) return []
    if (!searchText) return data.items

    const term = searchText.toLowerCase()
    return data.items.filter((item) => {
      const haystack = [
        item.activity_type,
        item.contact_name,
        item.user_name,
        formatDetails(item),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [data, searchText])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  useEffect(() => {
    if (!canViewLog) {
      return
    }
    const params = new URLSearchParams()
    if (activityType !== 'all') params.set('type', activityType)
    if (userFilter) params.set('user', userFilter)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    if (searchText) params.set('search', searchText)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 50) params.set('page_size', String(pageSize))

    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [activityType, userFilter, fromDate, toDate, searchText, page, pageSize, router, pathname, canViewLog])

  const handleExport = async () => {
    if (isLoading || isFetching || filteredItems.length === 0) {
      return
    }
    try {
      const blob = await activitiesApi.exportActivitiesCsv({
        page,
        page_size: pageSize,
        types: activityType === 'all' ? undefined : [activityType],
        user_id: userFilter || undefined,
        from: fromDate ? new Date(`${fromDate}T00:00:00Z`).toISOString() : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59Z`).toISOString() : undefined,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contact-activities-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast({
        title: 'Export complete',
        description: 'Activity CSV downloaded successfully.',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export activity log. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!canViewLog) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only owners and admins can view the activity log.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm text-muted-foreground">Audit trail of contact changes.</p>
        </div>
        <Button
          data-testid="activity-log-export"
          onClick={handleExport}
          disabled={isLoading || isFetching || filteredItems.length === 0}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select value={activityType} onValueChange={(value) => { setPage(1); setActivityType(value) }}>
              <SelectTrigger data-testid="activity-log-filter-type">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="User ID"
              value={userFilter}
              onChange={(event) => {
                setPage(1)
                setUserFilter(event.target.value)
              }}
              data-testid="activity-log-filter-user"
            />

            <Input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setPage(1)
                setFromDate(event.target.value)
              }}
              data-testid="activity-log-filter-from"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(event) => {
                setPage(1)
                setToDate(event.target.value)
              }}
              data-testid="activity-log-filter-to"
            />
          </div>

          <Input
            placeholder="Search details..."
            value={searchText}
            onChange={(event) => {
              setPage(1)
              setSearchText(event.target.value)
            }}
            data-testid="activity-log-filter-search"
          />

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity...
            </div>
          ) : (
            <>
              <div className="rounded-md border" data-testid="activity-log-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Activity Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDateTime(item.created_at)}</TableCell>
                        <TableCell className="font-medium">
                          {item.activity_type === 'Contact Deleted' ? (
                            <span className="text-muted-foreground">
                              {item.contact_name || item.contact_email || item.contact_id}
                              <span className="text-xs ml-1 text-red-500">(deleted)</span>
                            </span>
                          ) : (
                            <Link
                              href={`/dashboard/contacts/${item.contact_id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {item.contact_name || item.contact_email || item.contact_id}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>{item.activity_type}</TableCell>
                        <TableCell>{item.user_name || 'System'}</TableCell>
                        <TableCell className="max-w-sm truncate text-muted-foreground">
                          {formatDetails(item)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No activity found for the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
