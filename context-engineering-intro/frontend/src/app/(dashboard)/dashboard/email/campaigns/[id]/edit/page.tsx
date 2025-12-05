'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/inbox/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Save } from 'lucide-react'
import api from '@/lib/api'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  category: string
}

interface Campaign {
  id: string
  name: string
  subject: string
  template_id: string | null
  body_html: string
  body_text: string | null
  recipient_filter: any
  status: string
}

export default function EditCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string
  const { toast } = useToast()

  // Form data
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [bodyHtml, setBodyHtml] = useState('')

  // Fetch campaign data
  const { data: campaignData, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/campaigns/${campaignId}`)
      return response.data
    },
    enabled: !!campaignId,
  })

  // Populate form when campaign data loads
  useEffect(() => {
    if (campaignData) {
      setCampaignName(campaignData.name || '')
      setSubject(campaignData.subject || '')
      setSelectedTemplateId(campaignData.template_id || 'no-template')
      setBodyHtml(campaignData.body_html || '')
    }
  }, [campaignData])

  // Fetch templates
  const { data: templatesData } = useQuery<{ items: EmailTemplate[]; total: number }>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/v1/email-templates')
      return response.data
    },
  })

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await api.put(`/api/v1/campaigns/${campaignId}`, campaignData)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Campaign updated',
        description: 'Your campaign has been updated successfully',
      })
      router.push(`/dashboard/email/campaigns/${campaignId}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update campaign',
        variant: 'destructive',
      })
    },
  })

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)

    if (templateId === 'no-template') {
      return
    }

    try {
      const response = await api.get(`/api/v1/email-templates/${templateId}`)
      const fullTemplate = response.data
      setSubject(fullTemplate.subject || '')
      setBodyHtml(fullTemplate.body_html || '')
    } catch (error) {
      console.error('Failed to fetch template:', error)
    }
  }

  const handleSave = async () => {
    if (!campaignName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Campaign name is required',
        variant: 'destructive',
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Subject is required',
        variant: 'destructive',
      })
      return
    }

    if (!bodyHtml.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email content is required',
        variant: 'destructive',
      })
      return
    }

    const updateData = {
      name: campaignName,
      subject,
      template_id: selectedTemplateId && selectedTemplateId !== 'no-template' ? selectedTemplateId : undefined,
      body_html: bodyHtml,
    }

    await updateCampaignMutation.mutateAsync(updateData)
  }

  if (isLoadingCampaign) {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-4xl">
        <div className="text-center">Loading campaign...</div>
      </div>
    )
  }

  if (!campaignData) {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-4xl">
        <div className="text-center text-red-600">Campaign not found</div>
      </div>
    )
  }

  if (campaignData.status !== 'draft') {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-4xl">
        <div className="text-center text-yellow-600">
          Only draft campaigns can be edited
        </div>
        <Button onClick={() => router.push('/dashboard/email/campaigns')}>
          Back to Campaigns
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground">{campaignData.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name"
            />
          </div>

          <div>
            <Label htmlFor="template">Email Template (Optional)</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template or create from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-template">No Template (Create from scratch)</SelectItem>
                {templatesData?.items?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <Label htmlFor="body">Email Content</Label>
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Compose your email..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateCampaignMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateCampaignMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
