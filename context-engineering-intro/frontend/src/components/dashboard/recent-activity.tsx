'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { ActivityItem } from '@/lib/queries/activities'
import { ListChecks, Tag, Trash2, User2 } from 'lucide-react'

interface RecentActivityProps {
  activities: ActivityItem[]
  viewAllHref?: string
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'Tag Added':
    case 'Tag Removed':
      return <Tag className="h-4 w-4" />
    case 'Contact Deleted':
      return <Trash2 className="h-4 w-4" />
    case 'Assignment Changed':
      return <User2 className="h-4 w-4" />
    default:
      return <ListChecks className="h-4 w-4" />
  }
}

function formatDetails(activity: ActivityItem): string {
  const details = activity.details || {}
  if (details.changes) {
    const fields = Object.keys(details.changes as Record<string, any>)
    if (fields.length > 0) {
      return `Updated ${fields.slice(0, 2).join(', ')}${fields.length > 2 ? '...' : ''}`
    }
  }
  if (details.tag_name) {
    return `${activity.activity_type}: ${details.tag_name}`
  }
  if (details.old_status || details.new_status) {
    return `${details.old_status || 'old'} → ${details.new_status || 'new'}`
  }
  return activity.activity_type
}

export function RecentActivity({ activities, viewAllHref }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest contact events</CardDescription>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4" data-testid="recent-activity-row">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{getActivityIcon(activity.activity_type)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.contact_name || activity.contact_email || 'Contact'}</p>
                  <Badge variant="outline" className="text-xs">
                    {activity.activity_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatDetails(activity)}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</p>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
