'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import type { CRMObject } from '@/types/objects'
import { ObjectsTable } from '@/components/objects/objects-table'
import { ObjectCard } from '@/components/objects/object-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Grid3X3, List, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function ObjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user } = useAuth()

  // Fetch objects with pagination and filters
  const { data: objectsData, isLoading } = useQuery({
    queryKey: ['objects', currentPage, pageSize, searchQuery, typeFilter],
    queryFn: () => objectsApi.list({
      page: currentPage,
      page_size: pageSize,
      search: searchQuery || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: objectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] })
      toast({
        title: 'Success',
        description: 'Object deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete object',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this object? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (object: CRMObject) => {
    router.push(`/dashboard/objects/${object.id}/edit`)
  }

  const handleView = (object: CRMObject) => {
    router.push(`/dashboard/objects/${object.id}`)
  }

  const handleDuplicate = async (object: CRMObject) => {
    try {
      const duplicateData = {
        name: `${object.name} (Copy)`,
        type: object.type,
        company_info: { ...object.company_info }
      }
      await objectsApi.create(duplicateData)
      queryClient.invalidateQueries({ queryKey: ['objects'] })
      toast({
        title: 'Success',
        description: 'Object duplicated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to duplicate object',
        variant: 'destructive',
      })
    }
  }

  const canCreate = user?.role === 'owner'

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-senova-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-senova-primary" />
              Objects
            </h1>
            <p className="text-senova-gray-600 mt-1">
              Manage your company objects and organizational units
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => router.push('/dashboard/objects/create')}
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Object
            </Button>
          )}
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-senova-gray-400" />
              <Input
                placeholder="Search objects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'grid')}>
            <TabsList className="bg-senova-gray-100">
              <TabsTrigger value="table" className="data-[state=active]:bg-white">
                <List className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger value="grid" className="data-[state=active]:bg-white">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-senova-primary"></div>
        </div>
      ) : !objectsData?.items?.length ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-senova-gray-50 rounded-lg border-2 border-dashed border-senova-gray-300">
          <Building2 className="h-16 w-16 text-senova-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-senova-gray-900 mb-2">
            No objects found
          </h3>
          <p className="text-sm text-senova-gray-500 mb-6 text-center max-w-md">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Get started by creating your first object'}
          </p>
          {canCreate && !searchQuery && typeFilter === 'all' && (
            <Button
              onClick={() => router.push('/dashboard/objects/create')}
              className="bg-senova-primary hover:bg-senova-primary-dark text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Object
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <ObjectsTable
          objects={objectsData.items}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onDuplicate={handleDuplicate}
          canEdit={user?.role === 'owner' || user?.role === 'admin'}
          canDelete={user?.role === 'owner'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {objectsData.items.map((object) => (
            <ObjectCard
              key={object.id}
              object={object}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onDuplicate={handleDuplicate}
              canEdit={user?.role === 'owner' || user?.role === 'admin'}
              canDelete={user?.role === 'owner'}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {objectsData && objectsData.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-senova-gray-600">
            Page {currentPage} of {objectsData.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(objectsData.pages, p + 1))}
            disabled={currentPage === objectsData.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}