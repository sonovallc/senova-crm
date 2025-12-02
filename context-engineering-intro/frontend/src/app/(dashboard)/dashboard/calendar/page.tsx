'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
  Phone,
  User,
  Filter,
  Settings,
  Bell,
  CheckCircle2
} from 'lucide-react'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  // Get current month and year
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add padding for days before month starts
    const startPadding = firstDay.getDay()
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i)
    }

    return days
  }

  const calendarDays = getDaysInMonth(currentDate)

  // Mock events data
  const events = [
    { id: 1, title: 'Consultation - Client #1247', time: '9:00 AM', type: 'video', duration: '30 min', color: 'bg-senova-primary' },
    { id: 2, title: 'Treatment - Client #1246', time: '10:30 AM', type: 'in-person', duration: '1 hour', color: 'bg-senova-success' },
    { id: 3, title: 'Follow-up Call', time: '2:00 PM', type: 'phone', duration: '15 min', color: 'bg-senova-info' },
    { id: 4, title: 'Team Meeting', time: '4:00 PM', type: 'video', duration: '45 min', color: 'bg-senova-warning' }
  ]

  const upcomingAppointments = [
    { id: 1, name: 'Client #1247', service: 'Initial Consultation', date: 'Today', time: '9:00 AM', type: 'video' },
    { id: 2, name: 'Client #1246', service: 'Follow-up Treatment', date: 'Today', time: '10:30 AM', type: 'in-person' },
    { id: 3, name: 'Client #1245', service: 'Skin Analysis', date: 'Tomorrow', time: '11:00 AM', type: 'in-person' },
    { id: 4, name: 'Client #1244', service: 'Treatment Plan Review', date: 'Tomorrow', time: '2:30 PM', type: 'phone' }
  ]

  const stats = {
    todayAppointments: 8,
    weekAppointments: 42,
    pendingRequests: 5,
    cancelledToday: 1
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-3 w-3" />
      case 'phone': return <Phone className="h-3 w-3" />
      default: return <User className="h-3 w-3" />
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-senova-gray-50 via-white to-senova-primary-light/5">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-senova-primary to-senova-primary-dark flex items-center justify-center shadow-lg">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-senova-gray-900">Calendar</h1>
              <p className="text-sm text-senova-gray-500">
                Manage appointments and schedules
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-senova-primary text-senova-primary hover:bg-senova-primary/10">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-senova-primary hover:bg-senova-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Today\'s Appointments</CardDescription>
                <CardTitle className="text-2xl">{stats.todayAppointments}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">This Week</CardDescription>
                <CardTitle className="text-2xl">{stats.weekAppointments}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Pending Requests</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {stats.pendingRequests}
                  <Bell className="h-4 w-4 text-senova-warning" />
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Cancelled Today</CardDescription>
                <CardTitle className="text-2xl text-senova-error">{stats.cancelledToday}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{monthYear}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateMonth('prev')}
                        className="hover:bg-senova-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateMonth('next')}
                        className="hover:bg-senova-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-px bg-senova-gray-200 rounded-lg overflow-hidden">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="bg-senova-gray-50 p-2 text-center text-xs font-medium text-senova-gray-600">
                        {day}
                      </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                      const isToday = day === new Date().getDate() &&
                                     currentDate.getMonth() === new Date().getMonth() &&
                                     currentDate.getFullYear() === new Date().getFullYear()

                      return (
                        <div
                          key={index}
                          className={`
                            bg-white min-h-[80px] p-2 relative cursor-pointer
                            hover:bg-senova-gray-50 transition-colors
                            ${day === null ? 'bg-senova-gray-50/50' : ''}
                            ${isToday ? 'ring-2 ring-senova-primary ring-inset' : ''}
                          `}
                        >
                          {day && (
                            <>
                              <div className={`text-sm ${isToday ? 'font-bold text-senova-primary' : 'text-senova-gray-700'}`}>
                                {day}
                              </div>

                              {/* Sample events for some days */}
                              {day === 15 && (
                                <div className="mt-1 space-y-1">
                                  <div className="h-1 bg-senova-primary rounded-full" />
                                  <div className="h-1 bg-senova-success rounded-full" />
                                </div>
                              )}
                              {day === 20 && (
                                <div className="mt-1">
                                  <div className="h-1 bg-senova-info rounded-full" />
                                </div>
                              )}
                              {day === new Date().getDate() && (
                                <div className="mt-1 space-y-1">
                                  <div className="h-1 bg-senova-warning rounded-full" />
                                  <div className="h-1 bg-senova-primary rounded-full" />
                                  <div className="h-1 bg-senova-success rounded-full" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Today\'s Events */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-senova-gray-700 mb-3">Today\'s Schedule</h3>
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-senova-gray-50 hover:bg-senova-gray-100 transition-colors">
                          <div className={`h-2 w-2 rounded-full ${event.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{event.title}</span>
                                {getEventTypeIcon(event.type)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-senova-gray-500">
                                <Clock className="h-3 w-3" />
                                {event.time} ({event.duration})
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Appointments */}
            <div>
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                  <CardDescription>Next scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div key={apt.id} className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{apt.name}</h4>
                            <p className="text-xs text-senova-gray-500">{apt.service}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {apt.date}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-senova-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {apt.time}
                          </div>
                          <div className="flex items-center gap-1">
                            {apt.type === 'video' && <Video className="h-3 w-3" />}
                            {apt.type === 'phone' && <Phone className="h-3 w-3" />}
                            {apt.type === 'in-person' && <MapPin className="h-3 w-3" />}
                            {apt.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4 border-senova-primary text-senova-primary hover:bg-senova-primary/10"
                  >
                    View All Appointments
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Block Time
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Calendar Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}