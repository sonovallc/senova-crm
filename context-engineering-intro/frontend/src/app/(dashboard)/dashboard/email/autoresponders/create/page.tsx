'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from '@/components/inbox/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronUp, ChevronDown, Save, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  category: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface SequenceStep {
  sequence_order: number
  timing_mode: 'fixed_duration' | 'wait_for_trigger' | 'either_or' | 'both'
  delay_days: number
  delay_hours: number
  wait_trigger_type?: string
  wait_trigger_config?: Record<string, any>
  template_id?: string
  subject: string
  body_html: string
}

type TriggerType = 'new_contact' | 'tag_added' | 'date_based' | 'appointment_booked' | 'appointment_completed'
type ContentMode = 'template' | 'custom'

export default function CreateAutoresponderPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Basic info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Trigger configuration
  const [triggerType, setTriggerType] = useState<TriggerType>('new_contact')
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [dateField, setDateField] = useState('birthday')
  const [daysBefore, setDaysBefore] = useState(7)

  // Email content
  const [contentMode, setContentMode] = useState<ContentMode>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')

  // Sequence
  const [sequenceEnabled, setSequenceEnabled] = useState(false)
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([])

  // Status
  const [isActive, setIsActive] = useState(false)
  const [sendFromUser, setSendFromUser] = useState(true)

  // Fetch templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/v1/email-templates')
      // Backend returns EmailTemplateList with {items: [...], total, skip, limit}
      return response.data.items
    },
  })

  // Fetch tags
  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/v1/tags')
      // Backend returns direct array, not { tags: [...] }
      return response.data
    },
    // Fetch tags if main trigger is tag_added OR if any sequence step uses tag_added trigger
    enabled: triggerType === 'tag_added' || sequenceSteps.some(s => s.wait_trigger_type === 'tag_added'),
  })

  // Create autoresponder mutation
  const createAutoresponderMutation = useMutation({
    mutationFn: async (payload: { autoresponderData: any; sequenceSteps: SequenceStep[] }) => {
      // Step 1: Create the autoresponder (WITHOUT sequence_steps in payload)
      const response = await api.post('/v1/autoresponders', payload.autoresponderData)
      const autoresponder = response.data

      // Step 2: If sequence enabled, create each sequence step separately
      if (payload.sequenceSteps.length > 0) {
        for (const step of payload.sequenceSteps) {
          await api.post(`/api/v1/autoresponders/${autoresponder.id}/sequences`, step)
        }
      }

      return autoresponder
    },
    onSuccess: (data) => {
      toast({
        title: 'Autoresponder created',
        description: 'Your autoresponder has been created successfully',
      })
      router.push('/dashboard/email/autoresponders')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.message || 'Failed to create autoresponder',
        variant: 'destructive',
      })
    },
  })

  // BUG FIX #6: Fetch single template to get body_html (list endpoint doesn't include it)
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (templateId && templateId !== 'none') {
      try {
        // Fetch full template data including body_html
        const response = await api.get(`/api/v1/email-templates/${templateId}`)
        const fullTemplate = response.data
        setSubject(fullTemplate.subject || '')
        setBodyHtml(fullTemplate.body_html || '')
      } catch (error) {
        console.error('Failed to fetch template:', error)
        // Fallback to list data
        const templates = Array.isArray(templatesData) ? templatesData : []
        const template = templates.find((t: EmailTemplate) => t.id === templateId)
        if (template) {
          setSubject(template.subject || '')
          setBodyHtml(template.body_html || '')
        }
      }
    }
  }

  const handleAddSequenceStep = () => {
    const newStep: SequenceStep = {
      sequence_order: sequenceSteps.length + 1,
      timing_mode: 'fixed_duration',
      delay_days: 1,
      delay_hours: 0,
      wait_trigger_type: undefined,
      wait_trigger_config: {},
      subject: '',
      body_html: '',
    }
    setSequenceSteps([...sequenceSteps, newStep])
  }

  const handleRemoveSequenceStep = (index: number) => {
    const updatedSteps = sequenceSteps.filter((_, i) => i !== index)
    // Reorder remaining steps
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      sequence_order: i + 1,
    }))
    setSequenceSteps(reorderedSteps)
  }

  const handleMoveSequenceStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sequenceSteps.length - 1)
    ) {
      return
    }

    const newSteps = [...sequenceSteps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newSteps[index]
    newSteps[index] = newSteps[targetIndex]
    newSteps[targetIndex] = temp

    // Update sequence orders
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      sequence_order: i + 1,
    }))
    setSequenceSteps(reorderedSteps)
  }

  const handleUpdateSequenceStep = (index: number, field: keyof SequenceStep, value: any) => {
    const updatedSteps = [...sequenceSteps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSequenceSteps(updatedSteps)
  }

  // BUG FIX #7: Update template_id SYNCHRONOUSLY first, then fetch and update subject/body async
  // This ensures the dropdown reflects the selection immediately
  const handleSequenceStepTemplateChange = (index: number, templateId: string) => {
    console.log('[BUG7 DEBUG] handleSequenceStepTemplateChange called with:', { index, templateId })

    if (!templateId || templateId === 'none') {
      setSequenceSteps(prev => {
        const updatedSteps = [...prev]
        updatedSteps[index] = { ...updatedSteps[index], template_id: undefined }
        return updatedSteps
      })
      return
    }

    // CRITICAL: Update template_id SYNCHRONOUSLY so the dropdown shows the selection immediately
    setSequenceSteps(prev => {
      const updatedSteps = [...prev]
      updatedSteps[index] = { ...updatedSteps[index], template_id: templateId }
      console.log('[BUG7 DEBUG] Synchronous state update - template_id set to:', templateId)
      return updatedSteps
    })

    // Then fetch template data and update subject/body asynchronously
    api.get(`/api/v1/email-templates/${templateId}`)
      .then(response => {
        const fullTemplate = response.data
        console.log('[BUG7 DEBUG] Template fetched:', fullTemplate.name)
        setSequenceSteps(prev => {
          const updatedSteps = [...prev]
          // Preserve the template_id we already set, just add subject and body
          updatedSteps[index] = {
            ...updatedSteps[index],
            subject: fullTemplate.subject || '',
            body_html: fullTemplate.body_html || ''
          }
          return updatedSteps
        })
      })
      .catch(error => {
        console.error('[BUG7 DEBUG] Failed to fetch template:', error)
        // Fallback: use list data for subject if available
        const templates = Array.isArray(templatesData) ? templatesData : []
        const template = templates.find((t: EmailTemplate) => t.id === templateId)
        if (template) {
          setSequenceSteps(prev => {
            const updatedSteps = [...prev]
            updatedSteps[index] = {
              ...updatedSteps[index],
              subject: template.subject || '',
              body_html: template.body_html || ''
            }
            return updatedSteps
          })
        }
      })
  }

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Name is required'
    }

    if (triggerType === 'tag_added' && !selectedTagId) {
      return 'Please select a tag for the tag_added trigger'
    }

    if (triggerType === 'date_based' && !dateField) {
      return 'Please select a date field for the date_based trigger'
    }

    // Check main email content
    if (contentMode === 'template') {
      if (!selectedTemplateId || selectedTemplateId === 'none') {
        return 'Please select a template or switch to custom content'
      }
    } else {
      if (!subject.trim()) {
        return 'Subject is required when using custom content'
      }
      if (!bodyHtml.trim() || bodyHtml === '<p></p>') {
        return 'Email body is required when using custom content'
      }
    }

    // Validate sequence steps if enabled
    if (sequenceEnabled) {
      for (let i = 0; i < sequenceSteps.length; i++) {
        const step = sequenceSteps[i]
        if (!step.subject.trim()) {
          return `Sequence step ${i + 1}: Subject is required`
        }
        if (!step.body_html.trim() || step.body_html === '<p></p>') {
          return `Sequence step ${i + 1}: Email body is required`
        }
      }
    }

    return null
  }

  const handleSave = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    // Build trigger config
    let triggerConfig: any = {}
    if (triggerType === 'tag_added') {
      triggerConfig = { tag_id: selectedTagId }
    } else if (triggerType === 'date_based') {
      triggerConfig = { field: dateField, days_before: daysBefore }
    }

    const autoresponderData: any = {
      name,
      description: description || undefined,
      trigger_type: triggerType,
      trigger_config: Object.keys(triggerConfig).length > 0 ? triggerConfig : {},
      is_active: isActive,
      send_from_user: sendFromUser,
      sequence_enabled: sequenceEnabled,
    }

    // Add main email content
    if (contentMode === 'template' && selectedTemplateId && selectedTemplateId !== 'none') {
      autoresponderData.template_id = selectedTemplateId
    } else {
      autoresponderData.subject = subject
      autoresponderData.body_html = bodyHtml
    }

    // Prepare sequence steps (will be created separately after autoresponder creation)
    const sequenceStepsToCreate: SequenceStep[] = []
    if (sequenceEnabled && sequenceSteps.length > 0) {
      sequenceStepsToCreate.push(...sequenceSteps.map(step => ({
        sequence_order: step.sequence_order,
        timing_mode: step.timing_mode,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
        wait_trigger_type: step.wait_trigger_type || undefined,
        wait_trigger_config: step.wait_trigger_config || {},
        template_id: step.template_id || undefined,
        subject: step.subject,
        body_html: step.body_html,
      })))
    }

    // Pass both autoresponder data and sequence steps to mutation
    createAutoresponderMutation.mutate({
      autoresponderData,
      sequenceSteps: sequenceStepsToCreate
    })
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Autoresponder</h1>
        <p className="text-muted-foreground mt-2">
          Set up automated email responses based on triggers
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Give your autoresponder a name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                data-testid="autoresponder-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome New Contacts"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                data-testid="autoresponder-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="mt-1.5"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
            <CardDescription>When should this autoresponder be triggered?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trigger-type">Trigger Type *</Label>
              <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
                <SelectTrigger id="trigger-type" data-testid="autoresponder-trigger-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_contact">New Contact Created</SelectItem>
                  <SelectItem value="tag_added">Tag Added to Contact</SelectItem>
                  <SelectItem value="date_based">Date-Based (Birthday, Anniversary)</SelectItem>
                  <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
                  <SelectItem value="appointment_completed">Appointment Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional trigger config fields */}
            {triggerType === 'tag_added' && (
              <div>
                <Label htmlFor="tag-select">Select Tag *</Label>
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger id="tag-select" data-testid="autoresponder-tag-select" className="mt-1.5">
                    <SelectValue placeholder="Choose a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTags ? (
                      <SelectItem value="loading" disabled>Loading tags...</SelectItem>
                    ) : (Array.isArray(tagsData) ? tagsData : []).map((tag: Tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {triggerType === 'date_based' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date-field">Date Field *</Label>
                  <Select value={dateField} onValueChange={setDateField}>
                    <SelectTrigger id="date-field" data-testid="autoresponder-date-field-select" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="created_at">Account Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="days-before">Days Before *</Label>
                  <Input
                    id="days-before"
                    data-testid="autoresponder-days-before-input"
                    type="number"
                    min="0"
                    value={daysBefore}
                    onChange={(e) => setDaysBefore(parseInt(e.target.value) || 0)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send email this many days before the date
                  </p>
                </div>
              </div>
            )}

            {(triggerType === 'new_contact' || triggerType === 'appointment_booked' || triggerType === 'appointment_completed') && (
              <p className="text-sm text-muted-foreground">
                No additional configuration needed for this trigger type.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
            <CardDescription>Choose a template or create custom content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mode-template"
                  checked={contentMode === 'template'}
                  onCheckedChange={(checked) => {
                    if (checked) setContentMode('template')
                  }}
                />
                <Label htmlFor="mode-template" className="cursor-pointer">
                  Use Template
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mode-custom"
                  checked={contentMode === 'custom'}
                  onCheckedChange={(checked) => {
                    if (checked) setContentMode('custom')
                  }}
                />
                <Label htmlFor="mode-custom" className="cursor-pointer">
                  Custom Content
                </Label>
              </div>
            </div>

            {contentMode === 'template' ? (
              <div>
                <Label htmlFor="template-select">Select Template *</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger id="template-select" data-testid="autoresponder-template-select" className="mt-1.5">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Custom Content)</SelectItem>
                    {isLoadingTemplates ? (
                      <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                    ) : (Array.isArray(templatesData) ? templatesData : []).map((template: EmailTemplate) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateId && selectedTemplateId !== 'none' && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium">Preview:</p>
                    <p className="text-sm mt-1"><strong>Subject:</strong> {subject}</p>
                    <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    data-testid="autoresponder-subject-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use variables: {"{{contact_name}}"}, {"{{company}}"}, {"{{email}}"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="body-html">Email Body *</Label>
                  <div className="mt-1.5">
                    <RichTextEditor
                      value={bodyHtml}
                      onChange={setBodyHtml}
                      placeholder="Write your email content here..."
                      data-testid="autoresponder-body-editor"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can use the same variables in the body
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sequence Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Step Sequence (Optional)</CardTitle>
            <CardDescription>Send additional follow-up emails automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sequence-enabled"
                data-testid="autoresponder-sequence-toggle"
                checked={sequenceEnabled}
                onCheckedChange={(checked) => setSequenceEnabled(checked as boolean)}
              />
              <Label htmlFor="sequence-enabled" className="cursor-pointer">
                Enable multi-step sequence
              </Label>
            </div>

            {sequenceEnabled && (
              <div className="space-y-4">
                {sequenceSteps.map((step, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Step {index + 1}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveSequenceStep(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveSequenceStep(index, 'down')}
                            disabled={index === sequenceSteps.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveSequenceStep(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Timing Mode Selector */}
                      <div>
                        <Label htmlFor={`timing-mode-${index}`}>Timing Mode *</Label>
                        <Select
                          value={step.timing_mode || 'fixed_duration'}
                          onValueChange={(value) => handleUpdateSequenceStep(index, 'timing_mode', value)}
                        >
                          <SelectTrigger id={`timing-mode-${index}`} className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed_duration">Time Only - Wait for specific time</SelectItem>
                            <SelectItem value="wait_for_trigger">Trigger Only - Wait for action/event</SelectItem>
                            <SelectItem value="either_or">Either/Or - Whichever happens first</SelectItem>
                            <SelectItem value="both">Both - Time AND trigger must happen</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.timing_mode === 'fixed_duration' && 'Send after the specified time delay'}
                          {step.timing_mode === 'wait_for_trigger' && 'Send when the trigger event occurs'}
                          {step.timing_mode === 'either_or' && 'Send when time passes OR trigger occurs (whichever is first)'}
                          {step.timing_mode === 'both' && 'Send only when BOTH time has passed AND trigger has occurred'}
                        </p>
                      </div>

                      {/* Show delay inputs for FIXED_DURATION, EITHER_OR, and BOTH */}
                      {(step.timing_mode === 'fixed_duration' || step.timing_mode === 'either_or' || step.timing_mode === 'both') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`delay-days-${index}`}>Delay (Days)</Label>
                            <Input
                              id={`delay-days-${index}`}
                              type="number"
                              min="0"
                              value={step.delay_days}
                              onChange={(e) =>
                                handleUpdateSequenceStep(index, 'delay_days', parseInt(e.target.value) || 0)
                              }
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`delay-hours-${index}`}>Delay (Hours)</Label>
                            <Input
                              id={`delay-hours-${index}`}
                              type="number"
                              min="0"
                              max="23"
                              value={step.delay_hours}
                              onChange={(e) =>
                                handleUpdateSequenceStep(index, 'delay_hours', parseInt(e.target.value) || 0)
                              }
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      )}

                      {/* Show trigger inputs for WAIT_FOR_TRIGGER, EITHER_OR, and BOTH */}
                      {(step.timing_mode === 'wait_for_trigger' || step.timing_mode === 'either_or' || step.timing_mode === 'both') && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`wait-trigger-type-${index}`}>Wait For Trigger *</Label>
                            <Select
                              value={step.wait_trigger_type || 'none'}
                              onValueChange={(value) => {
                                handleUpdateSequenceStep(index, 'wait_trigger_type', value === 'none' ? undefined : value)
                                // Reset config when trigger type changes
                                handleUpdateSequenceStep(index, 'wait_trigger_config', {})
                              }}
                            >
                              <SelectTrigger id={`wait-trigger-type-${index}`} className="mt-1.5">
                                <SelectValue placeholder="Choose a trigger" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No trigger selected</SelectItem>
                                <SelectItem value="email_opened">Email Opened - Previous email was opened</SelectItem>
                                <SelectItem value="link_clicked">Link Clicked - Link in previous email was clicked</SelectItem>
                                <SelectItem value="email_replied">Email Replied - Contact replied to email</SelectItem>
                                <SelectItem value="tag_added">Tag Added - Specific tag was added to contact</SelectItem>
                                <SelectItem value="status_changed">Status Changed - Contact status changed</SelectItem>
                                <SelectItem value="appointment_booked">Appointment Booked - Contact booked appointment</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Step will wait for this event to occur before sending
                            </p>
                          </div>

                          {/* Conditional config based on trigger type */}
                          {step.wait_trigger_type === 'tag_added' && (
                            <div>
                              <Label htmlFor={`wait-tag-${index}`}>Wait for which tag?</Label>
                              <Select
                                value={step.wait_trigger_config?.tag_id || ''}
                                onValueChange={(value) =>
                                  handleUpdateSequenceStep(index, 'wait_trigger_config', { tag_id: value })
                                }
                              >
                                <SelectTrigger id={`wait-tag-${index}`} className="mt-1.5">
                                  <SelectValue placeholder="Choose a tag" />
                                </SelectTrigger>
                                <SelectContent>
                                  {isLoadingTags ? (
                                    <SelectItem value="loading" disabled>Loading tags...</SelectItem>
                                  ) : (Array.isArray(tagsData) ? tagsData : []).map((tag: Tag) => (
                                    <SelectItem key={tag.id} value={tag.id}>
                                      {tag.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {step.wait_trigger_type === 'status_changed' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`wait-from-status-${index}`}>From Status (Optional)</Label>
                                <Select
                                  value={step.wait_trigger_config?.from_status || 'any'}
                                  onValueChange={(value) =>
                                    handleUpdateSequenceStep(index, 'wait_trigger_config', {
                                      ...step.wait_trigger_config,
                                      from_status: value === 'any' ? undefined : value
                                    })
                                  }
                                >
                                  <SelectTrigger id={`wait-from-status-${index}`} className="mt-1.5">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="any">Any Status</SelectItem>
                                    <SelectItem value="LEAD">Lead</SelectItem>
                                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor={`wait-to-status-${index}`}>To Status</Label>
                                <Select
                                  value={step.wait_trigger_config?.to_status || 'CUSTOMER'}
                                  onValueChange={(value) =>
                                    handleUpdateSequenceStep(index, 'wait_trigger_config', {
                                      ...step.wait_trigger_config,
                                      to_status: value
                                    })
                                  }
                                >
                                  <SelectTrigger id={`wait-to-status-${index}`} className="mt-1.5">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="LEAD">Lead</SelectItem>
                                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {step.wait_trigger_type === 'appointment_booked' && (
                            <p className="text-sm text-muted-foreground">
                              This step will wait until an appointment is booked for the contact.
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <Label htmlFor={`step-template-${index}`}>Template (Optional)</Label>
                        <Select
                          value={step.template_id || 'none'}
                          onValueChange={(value) =>
                            handleSequenceStepTemplateChange(index, value === 'none' ? '' : value)
                          }
                        >
                          <SelectTrigger id={`step-template-${index}`} className="mt-1.5">
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Custom Content</SelectItem>
                            {isLoadingTemplates ? (
                              <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                            ) : (Array.isArray(templatesData) ? templatesData : []).map((template: EmailTemplate) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`step-subject-${index}`}>Subject *</Label>
                        <Input
                          id={`step-subject-${index}`}
                          value={step.subject}
                          onChange={(e) => handleUpdateSequenceStep(index, 'subject', e.target.value)}
                          placeholder="Email subject line"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`step-body-${index}`}>Email Body *</Label>
                        <div className="mt-1.5">
                          <RichTextEditor
                            value={step.body_html}
                            onChange={(html) => handleUpdateSequenceStep(index, 'body_html', html)}
                            placeholder="Write your email content here..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={handleAddSequenceStep} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sequence Step
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-active"
                data-testid="autoresponder-active-toggle"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="is-active" className="cursor-pointer">
                Activate immediately
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-from-user"
                data-testid="autoresponder-send-from-user-toggle"
                checked={sendFromUser}
                onCheckedChange={(checked) => setSendFromUser(checked as boolean)}
              />
              <Label htmlFor="send-from-user" className="cursor-pointer">
                Send from user's email
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                data-testid="autoresponder-save-button"
                onClick={handleSave}
                disabled={createAutoresponderMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {createAutoresponderMutation.isPending ? 'Saving...' : 'Save Autoresponder'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={createAutoresponderMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
