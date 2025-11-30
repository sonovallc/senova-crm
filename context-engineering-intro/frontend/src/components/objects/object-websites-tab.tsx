'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { objectsApi } from '@/lib/api/objects'
import type { ObjectWebsite, CreateWebsiteRequest } from '@/types/objects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Globe, Edit, Trash2, ExternalLink, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ObjectWebsitesTabProps {
  objectId: string
  canManage?: boolean
}

export function ObjectWebsitesTab({ objectId, canManage = false }: ObjectWebsitesTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<ObjectWebsite | null>(null)
  const [formData, setFormData] = useState<CreateWebsiteRequest>({
    name: '',
    slug: '',
    custom_domain: '',
    published: false
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch websites
  const { data: websites, isLoading } = useQuery({
    queryKey: ['objects', objectId, 'websites'],
    queryFn: () => objectsApi.listWebsites(objectId),
  })

  // Create website mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateWebsiteRequest) => objectsApi.createWebsite(objectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'websites'] })
      toast({
        title: 'Success',
        description: 'Website created successfully',
      })
      setIsCreateModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to create website',
        variant: 'destructive',
      })
    },
  })

  // Update website mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWebsiteRequest> }) =>
      objectsApi.updateWebsite(objectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'websites'] })
      toast({
        title: 'Success',
        description: 'Website updated successfully',
      })
      setEditingWebsite(null)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to update website',
        variant: 'destructive',
      })
    },
  })

  // Delete website mutation
  const deleteMutation = useMutation({
    mutationFn: (websiteId: string) => objectsApi.deleteWebsite(objectId, websiteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId, 'websites'] })
      toast({
        title: 'Success',
        description: 'Website deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete website',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      custom_domain: '',
      published: false
    })
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (website: ObjectWebsite) => {
    setFormData({
      name: website.name,
      slug: website.slug,
      custom_domain: website.custom_domain || '',
      published: website.published
    })
    setEditingWebsite(website)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingWebsite) {
      updateMutation.mutate({ id: editingWebsite.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (websiteId: string) => {
    if (confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      deleteMutation.mutate(websiteId)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Websites</CardTitle>
              <CardDescription>
                Manage websites hosted for this object
              </CardDescription>
            </div>
            {canManage && (
              <Button
                className="bg-senova-primary hover:bg-senova-primary-dark text-white"
                onClick={handleOpenCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Website
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senova-primary"></div>
            </div>
          ) : !websites?.length ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-senova-gray-400 mx-auto mb-3" />
              <p className="text-senova-gray-600">No websites created</p>
              {canManage && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleOpenCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Website
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websites.map((website) => (
                <Card key={website.id} className="border-senova-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-senova-primary/10 rounded-lg">
                          <Globe className="h-5 w-5 text-senova-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-senova-gray-900">{website.name}</h4>
                          <p className="text-sm text-senova-gray-600">/{website.slug}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant={website.published ? 'default' : 'secondary'}>
                        {website.published ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                      {website.ssl_provisioned && (
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          SSL
                        </Badge>
                      )}
                    </div>

                    {/* Custom domain */}
                    {website.custom_domain && (
                      <div className="mb-3">
                        <p className="text-xs text-senova-gray-500 mb-1">Custom Domain</p>
                        <a
                          href={`https://${website.custom_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-senova-primary hover:underline"
                        >
                          {website.custom_domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    {canManage && (
                      <div className="flex gap-2 pt-3 border-t border-senova-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenEdit(website)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(website.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || !!editingWebsite}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false)
            setEditingWebsite(null)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWebsite ? 'Edit Website' : 'Create Website'}</DialogTitle>
            <DialogDescription>
              {editingWebsite
                ? 'Update the website configuration'
                : 'Set up a new website for this object'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Website Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Website"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                })}
                placeholder="my-website"
                required
              />
              <p className="text-xs text-senova-gray-500 mt-1">
                Letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <Label htmlFor="custom_domain">Custom Domain (Optional)</Label>
              <Input
                id="custom_domain"
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                placeholder="example.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="published" className="cursor-pointer">
                Publish website immediately
              </Label>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingWebsite(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-senova-primary hover:bg-senova-primary-dark text-white"
                disabled={isSubmitting || !formData.name || !formData.slug}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingWebsite ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{editingWebsite ? 'Update Website' : 'Create Website'}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}