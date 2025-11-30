'use client'

import { useQuery } from '@tanstack/react-query'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { activitiesApi } from '@/lib/queries/activities'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/lib/api'

interface DashboardStats {
  total_contacts: number
  active_contacts: number
  leads: number
  prospects: number
  customers: number
  inactive_contacts: number
  total_communications: number
  recent_activity_count: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const canViewRecentActivity = user?.role === 'owner' || user?.role === 'admin'

  // Fetch real dashboard stats from API
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/v1/dashboard/stats')
      return response.data
    },
  })

  // Fetch recent activity
  const { data: activities } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => activitiesApi.listActivities({ page: 1, page_size: 10 }),
    enabled: canViewRecentActivity,
  })

  return (
    <div className="space-y-8 p-8 animate-fade-in-up">
      {/* Header */}
      <div className="stagger-children">
        <h1 className="text-3xl font-bold text-senova-gray-900 stagger-1">Dashboard</h1>
        <p className="mt-2 text-senova-gray-500 stagger-2">Welcome to Senova CRM, {user?.first_name || 'User'}!</p>
      </div>

      {/* Stats */}
      <div className="stagger-children">
        {stats && <StatsCards stats={stats} />}
      </div>

      {/* Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {canViewRecentActivity && activities ? (
          <RecentActivity activities={activities.items} viewAllHref="/dashboard/activity-log" />
        ) : (
          <Card className="border-senova-gray-300 hover:shadow-none">
            <CardContent className="py-10 text-sm text-senova-gray-500">
              Recent activity is visible to owners and admins.
            </CardContent>
          </Card>
        )}

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-senova-gray-300 bg-white p-8 text-center text-senova-gray-500 card-senova">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-senova-primary-light flex items-center justify-center">
                <svg className="h-8 w-8 text-senova-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-senova-gray-700">Analytics charts coming soon...</p>
                <p className="mt-2 text-sm">Revenue trends, message volume, and more</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
