"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Save, Shield, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { FieldModal } from "@/components/fields/field-modal"

interface Field {
  field_name: string
  field_label: string
  field_category: string
  visible_to_admin: boolean
  visible_to_user: boolean
  is_sensitive: boolean
}

interface FieldCreate {
  field_name: string
  field_label: string
  field_category: string
  field_type: string
  visible_to_admin: boolean
  visible_to_user: boolean
  is_sensitive: boolean
}

export default function FieldVisibilityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (user?.role !== 'owner' && user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchFields()
  }, [user, router])

  const fetchFields = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/field-visibility`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }
      })
      const data = await response.json()
      setFields(Array.isArray(data) ? data : data.items || [])
    } catch (error) {
      toast({ title: 'Failed to load fields', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (fieldName: string, role: 'admin' | 'user', value: boolean) => {
    setFields(fields.map(f =>
      f.field_name === fieldName
        ? { ...f, [role === 'admin' ? 'visible_to_admin' : 'visible_to_user']: value }
        : f
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/field-visibility/bulk-update`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields.map(f => ({
          field_name: f.field_name,
          visible_to_admin: f.visible_to_admin,
          visible_to_user: f.visible_to_user
        })))
      })
      if (!response.ok) throw new Error('Save failed')
      toast({ title: 'Field visibility saved successfully' })
      await fetchFields()
    } catch (error) {
      toast({ title: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateField = async (data: FieldCreate) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/field-visibility`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create field')
      }

      toast({ title: 'Custom field created successfully' })
      await fetchFields()
    } catch (error: any) {
      throw error // Let modal handle the error display
    }
  }

  const fieldsByCategory = fields.reduce((acc, field) => {
    const cat = field.field_category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(field)
    return acc
  }, {} as Record<string, Field[]>)

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Field Visibility Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure which contact fields are visible to admins and users
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Field
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize text-lg">{category} Fields ({categoryFields.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Field Name</th>
                      <th className="text-center p-3 font-semibold">Sensitive</th>
                      <th className="text-center p-3 font-semibold">Visible to Admins</th>
                      <th className="text-center p-3 font-semibold">Visible to Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryFields.map(field => (
                      <tr key={field.field_name} className="border-b hover:bg-gray-50">
                        <td className="p-3">{field.field_label}</td>
                        <td className="text-center p-3">
                          {field.is_sensitive && (
                            <Badge variant="destructive" className="text-xs">Yes</Badge>
                          )}
                        </td>
                        <td className="text-center p-3">
                          <Switch
                            checked={field.visible_to_admin}
                            onCheckedChange={(checked) => handleToggle(field.field_name, 'admin', checked)}
                          />
                        </td>
                        <td className="text-center p-3">
                          <Switch
                            checked={field.visible_to_user}
                            onCheckedChange={(checked) => handleToggle(field.field_name, 'user', checked)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Field Modal */}
      <FieldModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreateField}
        mode="create"
      />
    </div>
  )
}
