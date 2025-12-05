'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import api from '@/lib/api'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  category: string
}

interface ContactPreview {
  id: string
  first_name: string
  last_name: string
  email: string
  company: string
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)

  // Form data
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tagsFilter, setTagsFilter] = useState<string[]>([])
  const [sendNow, setSendNow] = useState(true)
  const [scheduledAt, setScheduledAt] = useState('')

  // Fetch templates
  const { data: templatesData } = useQuery<{ items: EmailTemplate[]; total: number }>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/v1/email-templates')
      return response.data
    },
  })

  // Filter contacts preview
  // BUG #16 FIX: Always run query when on step 2 to show recipient count
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery<{ total_count: number; preview: ContactPreview[] }>({
    queryKey: ['filter-contacts', statusFilter, tagsFilter],
    queryFn: async () => {
      const response = await api.post('/v1/campaigns/filter-contacts', {
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        tags: tagsFilter.length > 0 ? tagsFilter : undefined,
        has_email: true,
        exclude_unsubscribed: true,
      })
      return response.data
    },
    enabled: step === 2,
  })

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await api.post('/v1/campaigns', campaignData)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: 'Campaign created',
        description: 'Your campaign has been created successfully',
      })
      router.push(`/dashboard/email/campaigns/${data.id}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      })
    },
  })

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, batchSize }: { campaignId: string; batchSize: number }) => {
      const response = await api.post(`/api/v1/campaigns/${campaignId}/send`, { batch_size: batchSize })
      return response.data
    },
  })

  // BUG FIX #6: Fetch single template to get body_html (list endpoint doesn't include it)
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)

    // Clear body if "no-template" selected
    if (templateId === 'no-template') {
      setSubject('')
      setBodyHtml('')
      return
    }

    try {
      // Fetch full template data including body_html
      const response = await api.get(`/api/v1/email-templates/${templateId}`)
      const fullTemplate = response.data

      setTimeout(() => {
        setSubject(fullTemplate.subject || '')
        setBodyHtml(fullTemplate.body_html || '')
      }, 0)
    } catch (error) {
      console.error('Failed to fetch template:', error)
      // Fallback to list data (body_html will be empty/undefined)
      const template = templatesData?.items?.find((t) => t.id === templateId)
      if (template) {
        setSubject(template.subject || '')
        setBodyHtml(template.body_html || '')
      }
    }
  }

  const handleCreateCampaign = async () => {
    const campaignData = {
      name: campaignName,
      subject,
      template_id: selectedTemplateId && selectedTemplateId !== 'no-template' ? selectedTemplateId : undefined,
      body_html: bodyHtml,
      recipient_filter: {
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        tags: tagsFilter.length > 0 ? tagsFilter : undefined,
        has_email: true,
        exclude_unsubscribed: true,
      },
      scheduled_at: sendNow ? undefined : scheduledAt || undefined,
    }

    const campaign = await createCampaignMutation.mutateAsync(campaignData)

    if (sendNow) {
      await sendCampaignMutation.mutateAsync({
        campaignId: campaign.id,
        batchSize: 50,
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-muted-foreground">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded ${s <= step ? 'bg-primary' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step 1: Campaign Details */}
      {step === 1 && (
        <Card data-testid="campaign-wizard-step-1">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                data-testid="campaign-name-input"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Monthly Newsletter - December 2024"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                data-testid="campaign-description-input"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="Internal notes about this campaign..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="template">Select Template (Optional)</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger data-testid="campaign-template-selector">
                  <SelectValue placeholder="Choose a template or write custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-template">Custom (No Template)</SelectItem>
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
                data-testid="campaign-subject-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Amazing December Deals Inside!"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variables like: {"{{"}contact_name{"}}"}, {"{{"}company{"}}"}, {"{{"}first_name{"}}"}
              </p>
            </div>

            <div>
              <Label>Email Content</Label>
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                data-testid="campaign-body-editor"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!campaignName || !subject || !bodyHtml}
              data-testid="campaign-next-button"
            >
              Next: Select Recipients
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Recipients */}
      {step === 2 && (
        <Card data-testid="campaign-wizard-step-2">
          <CardHeader>
            <CardTitle>Select Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Filter by Status (Optional)</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="campaign-status-filter">
                  <SelectValue placeholder="All contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="LEAD">Leads</SelectItem>
                  <SelectItem value="PROSPECT">Prospects</SelectItem>
                  <SelectItem value="CUSTOMER">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* BUG #16 FIX: Show loading state while fetching recipients */}
            {isLoadingContacts && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-testid="campaign-recipient-loading">
                <p className="text-sm text-muted-foreground">Loading recipients...</p>
              </div>
            )}

            {!isLoadingContacts && contactsData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="campaign-recipient-preview">
                <p className="font-semibold text-lg">
                  {contactsData.total_count} recipients will receive this campaign
                </p>
                {contactsData.preview.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <ul className="space-y-1 text-sm">
                      {contactsData.preview.slice(0, 5).map((contact) => (
                        <li key={contact.id}>
                          {contact.first_name} {contact.last_name} ({contact.email})
                        </li>
                      ))}
                      {contactsData.preview.length > 5 && (
                        <li className="text-muted-foreground">
                          + {contactsData.total_count - 5} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="campaign-prev-button">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={isLoadingContacts || !contactsData || contactsData.total_count === 0}
                data-testid="campaign-next-button-step2"
              >
                {isLoadingContacts ? 'Loading recipients...' : 'Next: Schedule & Send'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule & Send */}
      {step === 3 && (
        <Card data-testid="campaign-wizard-step-3">
          <CardHeader>
            <CardTitle>Schedule & Send</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>When to send?</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="send-now"
                    data-testid="campaign-send-now-radio"
                    checked={sendNow}
                    onChange={() => setSendNow(true)}
                  />
                  <Label htmlFor="send-now" className="font-normal cursor-pointer">
                    Send now
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="send-later"
                    data-testid="campaign-send-later-radio"
                    checked={!sendNow}
                    onChange={() => setSendNow(false)}
                  />
                  <Label htmlFor="send-later" className="font-normal cursor-pointer">
                    Schedule for later
                  </Label>
                </div>
                {!sendNow && (
                  <Input
                    type="datetime-local"
                    data-testid="campaign-schedule-datetime"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="ml-6"
                  />
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2" data-testid="campaign-review-summary">
              <p className="font-semibold">Review Summary:</p>
              <ul className="text-sm space-y-1">
                <li>Campaign: {campaignName}</li>
                <li>Subject: {subject}</li>
                <li>Recipients: {contactsData?.total_count || 0}</li>
                <li>
                  Schedule: {sendNow ? 'Send immediately' : `Send on ${scheduledAt}`}
                </li>
                <li>Batch size: 50 emails per batch</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} data-testid="campaign-prev-button-step3">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={createCampaignMutation.isPending || sendCampaignMutation.isPending}
                data-testid="campaign-submit-button"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendNow ? 'Create & Send Campaign' : 'Schedule Campaign'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
