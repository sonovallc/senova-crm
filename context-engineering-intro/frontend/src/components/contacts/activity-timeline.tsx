import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activitiesApi, ActivityItem } from '@/lib/queries/activities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, getDateKey, getRelativeDayLabel } from '@/lib/utils'
import { Loader2, RefreshCcw, UserCircle2, Tag, Trash2, History, ListChecks } from 'lucide-react'

const FILTER_OPTIONS = [
  { label: 'All Activity', value: 'all' },
  { label: 'Contact Updated', value: 'Contact Updated' },
  { label: 'Tag Added', value: 'Tag Added' },
  { label: 'Tag Removed', value: 'Tag Removed' },
  { label: 'Contact Deleted', value: 'Contact Deleted' },
  { label: 'Status Changed', value: 'Status Changed' },
  { label: 'Assignment Changed', value: 'Assignment Changed' },
]

interface ActivityTimelineProps {
  contactId: string
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'Tag Added':
    case 'Tag Removed':
      return <Tag className="h-4 w-4" />
    case 'Status Changed':
      return <History className="h-4 w-4" />
    case 'Assignment Changed':
      return <UserCircle2 className="h-4 w-4" />
    case 'Contact Deleted':
      return <Trash2 className="h-4 w-4" />
    default:
      return <ListChecks className="h-4 w-4" />
  }
}

function renderDetails(activity: ActivityItem) {
  const details = activity.details || {}

  if (details.changes) {
    const entries = Object.entries(details.changes as Record<string, { old: any; new: any }>)
    if (entries.length > 0) {
      return (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {entries.slice(0, 3).map(([field, change]) => (
            <div key={field} className="flex flex-wrap gap-1">
              <span className="font-medium">{field}</span>
              <span>→</span>
              <span className="truncate max-w-[12rem]" title={String(change.new)}>
                {change.new === null || change.new === undefined || change.new === ''
                  ? '(cleared)'
                  : String(change.new)}
              </span>
            </div>
          ))}
          {entries.length > 3 && <p>+{entries.length - 3} more changes</p>}
        </div>
      )
    }
  }

  if (details.tag_name) {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        Tag: <span className="font-medium">{details.tag_name}</span>
      </div>
    )
  }

  if (details.old_status || details.new_status) {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        {details.old_status || 'Unknown'} → <span className="font-medium">{details.new_status || 'Unknown'}</span>
      </div>
    )
  }

  if (details.old_assignment || details.new_assignment) {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        {details.old_assignment?.name || details.old_assignment?.id || 'Unassigned'}
        <span> → </span>
        <span className="font-medium">
          {details.new_assignment?.name || details.new_assignment?.id || 'Unassigned'}
        </span>
      </div>
    )
  }

  if (typeof details.soft === 'boolean') {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        Soft Delete: <span className="font-medium">{details.soft ? 'Yes' : 'No'}</span>
      </div>
    )
  }

  return null
}

export function ActivityTimeline({ contactId }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<string>('all')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: () => activitiesApi.listContactActivities(contactId, { page_size: 100 }),
    enabled: !!contactId,
    staleTime: 30_000,
  })

  const filteredItems = useMemo(() => {
    if (!data?.items) {
      return []
    }

    if (filter === 'all') {
      return data.items
    }

    return data.items.filter((item) => item.activity_type === filter)
  }, [data, filter])

  const groupedItems = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string
        items: ActivityItem[]
      }
    >()

    filteredItems.forEach((item) => {
      const key = getDateKey(item.created_at)
      if (!groups.has(key)) {
        groups.set(key, {
          label: getRelativeDayLabel(item.created_at),
          items: [],
        })
      }
      groups.get(key)!.items.push(item)
    })

    return Array.from(groups.entries())
      .sort((a, b) => (a[0] > b[0] ? -1 : 1))
      .map(([key, value]) => ({ key, ...value }))
  }, [filteredItems])

  let itemIndex = 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48" data-testid="activity-filter">
              <SelectValue placeholder="Filter activity" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity...
          </div>
        ) : isError ? (
          <div className="space-y-2 text-sm text-red-600">
            <p>Unable to load activity timeline.</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => (
              <div key={group.key} className="space-y-4" data-testid={`activity-group-${group.key}`}>
                <Badge variant="secondary">{group.label}</Badge>
                <div className="space-y-4">
                  {group.items.map((item) => {
                    const currentIndex = itemIndex++
                    return (
                      <div
                        key={`${item.id}-${currentIndex}`}
                        className="rounded-lg border p-4"
                        data-testid={`activity-item-${currentIndex}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-muted p-2 text-muted-foreground">
                            {getActivityIcon(item.activity_type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">{item.activity_type}</p>
                                {item.user_name && (
                                  <p className="text-xs text-muted-foreground">
                                    Performed by {item.user_name}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                            </div>
                            {renderDetails(item)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
