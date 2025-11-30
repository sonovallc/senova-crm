'use client'

import { useRouter } from 'next/navigation'
import { ObjectForm } from '@/components/objects/object-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function CreateObjectPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Check permissions - only owners and admins can create objects
  const canCreate = user?.role === 'owner' || user?.role === 'admin'

  if (!canCreate) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-16 w-16 text-senova-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-senova-gray-900 mb-2">
            Permission Denied
          </h3>
          <p className="text-sm text-senova-gray-500 mb-6">
            Only owners and admins can create new objects.
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
        onClick={() => router.push('/dashboard/objects')}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Objects
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-senova-gray-900">Create Object</h1>
        <p className="text-senova-gray-600 mt-2">
          Add a new company, organization, or group to your CRM
        </p>
      </div>

      <ObjectForm
        onSuccess={(newObject) => {
          router.push(`/dashboard/objects/${newObject.id}`)
        }}
        onCancel={() => {
          router.push('/dashboard/objects')
        }}
      />
    </div>
  )
}