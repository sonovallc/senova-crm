'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import { ObjectForm } from '@/components/objects/object-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function EditObjectPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const { data: object, isLoading, error } = useQuery({
    queryKey: ['objects', id],
    queryFn: () => objectsApi.get(id as string),
    enabled: !!id,
  })

  // Check permissions
  const canEdit = user?.role === 'owner' || user?.role === 'admin'

  if (!canEdit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-16 w-16 text-senova-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-senova-gray-900 mb-2">
            Permission Denied
          </h3>
          <p className="text-sm text-senova-gray-500 mb-6">
            You don't have permission to edit objects.
          </p>
          <Button onClick={() => router.push('/dashboard/objects')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Objects
          </Button>
        </div>
      </div>
    )
  }

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
            The object you're trying to edit doesn't exist.
          </p>
          <Button onClick={() => router.push('/dashboard/objects')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Objects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button
        onClick={() => router.push(`/dashboard/objects/${id}`)}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Object Details
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-senova-gray-900">Edit Object</h1>
        <p className="text-senova-gray-600 mt-2">
          Update the information for {object.name}
        </p>
      </div>

      <ObjectForm
        object={object}
        onSuccess={() => {
          router.push(`/dashboard/objects/${id}`)
        }}
        onCancel={() => {
          router.push(`/dashboard/objects/${id}`)
        }}
      />
    </div>
  )
}