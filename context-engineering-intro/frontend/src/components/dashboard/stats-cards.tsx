'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, UserCheck, Activity, UserX, UserPlus } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    total_contacts: number
    active_contacts: number
    leads: number
    prospects: number
    customers: number
    inactive_contacts: number
    total_communications: number
    recent_activity_count: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-senova-sky-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          <Users className="h-4 w-4 text-senova-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_contacts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active_contacts.toLocaleString()} active
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-senova-sky-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contact Pipeline</CardTitle>
          <UserPlus className="h-4 w-4 text-senova-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.leads.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Leads | {stats.prospects.toLocaleString()} Prospects | {stats.customers.toLocaleString()} Customers
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-senova-sky-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-senova-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_communications.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            All channels
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-senova-sky-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-senova-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recent_activity_count.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
