'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailTemplatesApi } from '@/lib/queries/email-templates'
import { EmailTemplate, EmailTemplateCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RichTextEditor } from '@/components/inbox/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { formatErrorMessage } from '@/lib/error-handler'
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  Search,
  Mail,
  Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type SortOption = 'recent' | 'most_used' | 'name_asc' | 'name_desc'
type FilterTab = 'all' | 'my_templates' | 'system'

const CATEGORY_LABELS: Record<EmailTemplateCategory, string> = {
  welcome: 'Welcome',
  appointment: 'Appointment',
  follow_up: 'Follow-up',
  promotion: 'Promotion',
  newsletter: 'Newsletter',
  general: 'General',
}

const AVAILABLE_VARIABLES = [
  { key: '{{contact_name}}', description: 'Full contact name' },
  { key: '{{first_name}}', description: 'First name' },
  { key: '{{last_name}}', description: 'Last name' },
  { key: '{{email}}', description: 'Email address' },
  { key: '{{company}}', description: 'Company name' },
  { key: '{{phone}}', description: 'Phone number' },
]

export default function EmailTemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<EmailTemplateCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'general' as EmailTemplateCategory,
    subject: '',
    body_html: '',
  })

  // Preview state
  const [previewVariables, setPreviewVariables] = useState({
    contact_name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    company: 'Acme Corp',
    phone: '(555) 123-4567',
  })
  const [previewData, setPreviewData] = useState<{ subject: string; body_html: string } | null>(null)

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['email-templates', activeTab, categoryFilter, searchQuery],
    queryFn: () =>
      emailTemplatesApi.getTemplates({
        page: 1,
        page_size: 100,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        is_system: activeTab === 'system' ? true : activeTab === 'my_templates' ? false : undefined,
        search: searchQuery || undefined,
      }),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: emailTemplatesApi.createTemplate,
    onSuccess: () => {
      toast({
        title: 'Template created',
        description: 'Email template has been created successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      setIsCreateModalOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast({
        title: 'Failed to create template',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  // Update mutation
  // BUG FIX #12: Added error handling for invalidateQueries to prevent dual toasts
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      emailTemplatesApi.updateTemplate(id, data),
    onSuccess: async () => {
      toast({
        title: 'Template updated',
        description: 'Email template has been updated successfully.',
      })
      // Silently handle any query invalidation errors to prevent error toast after success
      try {
        await queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      } catch {
        // Ignore - the update was successful, just refresh failed
        console.warn('Failed to refresh templates list, but update was successful')
      }
      setIsEditModalOpen(false)
      setSelectedTemplate(null)
      resetForm()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update template',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: emailTemplatesApi.deleteTemplate,
    onSuccess: () => {
      toast({
        title: 'Template deleted',
        description: 'Email template has been deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      setIsDeleteDialogOpen(false)
      setSelectedTemplate(null)
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete template',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: emailTemplatesApi.duplicateTemplate,
    onSuccess: () => {
      toast({
        title: 'Template duplicated',
        description: 'Email template has been duplicated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
    onError: (error) => {
      toast({
        title: 'Failed to duplicate template',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: ({ id, variables }: { id: string; variables: Record<string, string> }) =>
      emailTemplatesApi.previewTemplate(id, variables),
    onSuccess: (data) => {
      setPreviewData(data)
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate preview',
        description: formatErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      subject: '',
      body_html: '',
    })
  }

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body_html.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdate = () => {
    if (!selectedTemplate) return
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body_html.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    updateMutation.mutate({ id: selectedTemplate.id, data: formData })
  }

  // BUG FIX #6: Fetch single template to get body_html (list endpoint doesn't include it)
  const handleEdit = async (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsEditModalOpen(true)

    // Fetch full template data including body_html
    try {
      const fullTemplate = await emailTemplatesApi.getTemplate(template.id)
      setFormData({
        name: fullTemplate.name,
        category: fullTemplate.category,
        subject: fullTemplate.subject,
        body_html: fullTemplate.body_html || '',
      })
    } catch (error) {
      console.error('Failed to fetch template:', error)
      // Fallback to what we have (body_html will be empty)
      setFormData({
        name: template.name,
        category: template.category,
        subject: template.subject,
        body_html: template.body_html || '',
      })
    }
  }

  const handleDelete = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  const handleDuplicate = (template: EmailTemplate) => {
    duplicateMutation.mutate(template.id)
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setPreviewData(null)
    setIsPreviewModalOpen(true)
    previewMutation.mutate({ id: template.id, variables: previewVariables })
  }

  const handleUseTemplate = () => {
    if (!selectedTemplate) return
    // Navigate to compose page with template ID as query parameter
    router.push(`/dashboard/email/compose?templateId=${selectedTemplate.id}`)
  }

  // Sort and filter templates
  const sortedTemplates = templatesData?.items.sort((a, b) => {
    switch (sortBy) {
      case 'most_used':
        return b.usage_count - a.usage_count
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  }) || []

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable email templates with variable support
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="my_templates">My Templates</TabsTrigger>
              <TabsTrigger value="system">System Templates</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as EmailTemplateCategory | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Created</SelectItem>
                <SelectItem value="most_used">Most Used</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to get started!
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
              {/* Template Card */}
              <div className="space-y-3">
                {/* Thumbnail */}
                <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md flex items-center justify-center">
                  <Mail className="h-12 w-12 text-slate-400" />
                </div>

                {/* Template Info */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{template.name}</h3>
                    {template.is_system && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        System
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {CATEGORY_LABELS[template.category]}
                  </Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {template.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Used {template.usage_count} times
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreview(template)}
                    className="flex-1"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                    disabled={template.is_system}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template)}
                    disabled={template.is_system}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template with variable support
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as EmailTemplateCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject (use variables like {{first_name}})"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: {AVAILABLE_VARIABLES.map((v) => v.key).join(', ')}
              </p>
            </div>
            <div>
              <Label>Body *</Label>
              <RichTextEditor
                value={formData.body_html}
                onChange={(html) => setFormData({ ...formData, body_html: html })}
                placeholder="Compose your email template..."
                className="min-h-[300px]"
              />
              <div className="mt-2 p-3 bg-slate-50 rounded-md">
                <p className="text-xs font-semibold mb-2">Available Variables:</p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <div key={variable.key} className="text-xs">
                      <code className="bg-slate-200 px-1 py-0.5 rounded">
                        {variable.key}
                      </code>
                      <span className="text-muted-foreground ml-1">
                        - {variable.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update your email template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as EmailTemplateCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject *</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject (use variables like {{first_name}})"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: {AVAILABLE_VARIABLES.map((v) => v.key).join(', ')}
              </p>
            </div>
            <div>
              <Label>Body *</Label>
              <RichTextEditor
                value={formData.body_html}
                onChange={(html) => setFormData({ ...formData, body_html: html })}
                placeholder="Compose your email template..."
                className="min-h-[300px]"
              />
              <div className="mt-2 p-3 bg-slate-50 rounded-md">
                <p className="text-xs font-semibold mb-2">Available Variables:</p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <div key={variable.key} className="text-xs">
                      <code className="bg-slate-200 px-1 py-0.5 rounded">
                        {variable.key}
                      </code>
                      <span className="text-muted-foreground ml-1">
                        - {variable.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false)
                setSelectedTemplate(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Template</DialogTitle>
            <DialogDescription>
              Preview how your template will look with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Sample Data Inputs */}
            <div className="p-4 bg-slate-50 rounded-md">
              <p className="text-sm font-semibold mb-3">Sample Data:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(previewVariables).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs">{key.replace(/_/g, ' ')}</Label>
                    <Input
                      value={value}
                      onChange={(e) =>
                        setPreviewVariables({ ...previewVariables, [key]: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  if (selectedTemplate) {
                    previewMutation.mutate({ id: selectedTemplate.id, variables: previewVariables })
                  }
                }}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Preview'
                )}
              </Button>
            </div>

            {/* Preview */}
            {previewData ? (
              <div className="border rounded-md p-4">
                <div className="mb-4">
                  <Label className="text-sm text-muted-foreground">Subject:</Label>
                  <p className="text-lg font-semibold">{previewData.subject}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Body:</Label>
                  <div
                    className="prose prose-sm max-w-none mt-2"
                    dangerouslySetInnerHTML={{ __html: previewData.body_html }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleUseTemplate}>Use This Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template &quot;{selectedTemplate?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTemplate) {
                  deleteMutation.mutate(selectedTemplate.id)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
