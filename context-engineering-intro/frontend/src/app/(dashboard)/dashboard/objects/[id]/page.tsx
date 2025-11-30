'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ObjectContactsTab } from '@/components/objects/object-contacts-tab'
import { ObjectUsersTab } from '@/components/objects/object-users-tab'
import { ObjectWebsitesTab } from '@/components/objects/object-websites-tab'
import { ArrowLeft, Building2, Edit, Settings, Globe, Users, UserCheck, Calendar, User } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { formatAddress } from '@/lib/utils/address'

export default function ObjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('info')

  const { data: object, isLoading, error } = useQuery({
    queryKey: ['objects', id],
    queryFn: () => objectsApi.get(id as string),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-senova-primary"></div>
      </div>
    )
  }

  if (error || !object) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-16 w-16 text-senova-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-senova-gray-900 mb-2">
            Object not found
          </h3>
          <p className="text-sm text-senova-gray-500 mb-6">
            The object you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/dashboard/objects')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Objects
          </Button>
        </div>
      </div>
    )
  }

  const canEdit = user?.role === 'owner' || user?.role === 'admin'
  const canManageUsers = user?.role === 'owner'
  const canManageWebsites = user?.role === 'owner' || user?.role === 'admin'

  const typeColors = {
    company: 'bg-blue-100 text-blue-800',
    organization: 'bg-green-100 text-green-800',
    group: 'bg-amber-100 text-red-800'
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => router.push('/dashboard/objects')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Objects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-senova-primary/10 rounded-lg">
              <Building2 className="h-8 w-8 text-senova-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-senova-gray-900">{object.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={typeColors[object.type]}>
                  {object.type.charAt(0).toUpperCase() + object.type.slice(1)}
                </Badge>
                <span className="text-sm text-senova-gray-500">
                  Created {format(new Date(object.created_at), 'PPP')}
                </span>
              </div>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={() => router.push(`/dashboard/objects/${id}/edit`)}
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Object
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-senova-gray-100">
          <TabsTrigger value="info" className="data-[state=active]:bg-white">
            <Settings className="mr-2 h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-white">
            <Users className="mr-2 h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white">
            <UserCheck className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="websites" className="data-[state=active]:bg-white">
            <Globe className="mr-2 h-4 w-4" />
            Websites
          </TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic details and information about this object
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-senova-gray-700">Name</label>
                  <p className="mt-1 text-senova-gray-900">{object.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-senova-gray-700">Type</label>
                  <p className="mt-1">
                    <Badge className={typeColors[object.type]}>
                      {object.type.charAt(0).toUpperCase() + object.type.slice(1)}
                    </Badge>
                  </p>
                </div>
                {object.company_info?.legal_name && (
                  <div>
                    <label className="text-sm font-medium text-senova-gray-700">Legal Name</label>
                    <p className="mt-1 text-senova-gray-900">{object.company_info.legal_name}</p>
                  </div>
                )}
                {object.company_info?.industry && (
                  <div>
                    <label className="text-sm font-medium text-senova-gray-700">Industry</label>
                    <p className="mt-1 text-senova-gray-900">{object.company_info.industry}</p>
                  </div>
                )}
                {object.company_info?.email && (
                  <div>
                    <label className="text-sm font-medium text-senova-gray-700">Email</label>
                    <p className="mt-1 text-senova-gray-900">{object.company_info.email}</p>
                  </div>
                )}
                {object.company_info?.phone && (
                  <div>
                    <label className="text-sm font-medium text-senova-gray-700">Phone</label>
                    <p className="mt-1 text-senova-gray-900">{object.company_info.phone}</p>
                  </div>
                )}
                {object.company_info?.website && (
                  <div>
                    <label className="text-sm font-medium text-senova-gray-700">Website</label>
                    <a
                      href={object.company_info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-senova-primary hover:underline"
                    >
                      {object.company_info.website}
                    </a>
                  </div>
                )}
                {object.company_info?.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-senova-gray-700">Address</label>
                    <p className="mt-1 text-senova-gray-900">{formatAddress(object.company_info.address)}</p>
                  </div>
                )}
              </div>

              {/* Custom Fields */}
              {Object.entries(object.company_info || {})
                .filter(([key]) => !['legal_name', 'industry', 'email', 'phone', 'website', 'address'].includes(key))
                .length > 0 && (
                <div className="mt-6 pt-6 border-t border-senova-gray-200">
                  <h4 className="text-sm font-medium text-senova-gray-700 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(object.company_info || {})
                      .filter(([key]) => !['legal_name', 'industry', 'email', 'phone', 'website', 'address'].includes(key))
                      .map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-senova-gray-700">
                            {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                          </label>
                          <p className="mt-1 text-senova-gray-900">{String(value)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-senova-gray-200">
                <h4 className="text-sm font-medium text-senova-gray-700 mb-4">Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-senova-gray-400" />
                    <span className="text-senova-gray-600">Created:</span>
                    <span className="text-senova-gray-900">
                      {format(new Date(object.created_at), 'PPP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-senova-gray-400" />
                    <span className="text-senova-gray-600">Created by:</span>
                    <span className="text-senova-gray-900">{object.created_by}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-senova-gray-400" />
                    <span className="text-senova-gray-600">Last updated:</span>
                    <span className="text-senova-gray-900">
                      {format(new Date(object.updated_at), 'PPP')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <ObjectContactsTab
            objectId={object.id}
            canManage={canEdit}
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <ObjectUsersTab
            objectId={object.id}
            canManage={canManageUsers}
          />
        </TabsContent>

        {/* Websites Tab */}
        <TabsContent value="websites">
          <ObjectWebsitesTab
            objectId={object.id}
            canManage={canManageWebsites}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}