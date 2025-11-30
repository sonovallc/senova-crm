'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/lib/queries/contacts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, Building, Calendar, MapPin, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPhoneNumber, getPrimaryEmail } from '@/lib/utils'
import { ActivityTimeline } from '@/components/contacts/activity-timeline'
import { ContactObjectsSection } from '@/components/contacts/contact-objects-section'
import { useAuth } from '@/contexts/auth-context'

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { user } = useAuth()

  // Check if user can manage objects
  const canManageObjects = user?.role === 'owner' || user?.role === 'admin'

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', resolvedParams.id],
    queryFn: () => contactsApi.getContact(resolvedParams.id),
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading contact...</p>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Contact not found</p>
        <Button onClick={() => router.push('/dashboard/contacts')}>
          Back to Contacts
        </Button>
      </div>
    )
  }

  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'

  // Helper to render field - ALWAYS shows field even if empty
  const renderField = (label: string, value: any, icon?: React.ReactNode) => {
    const displayValue = value !== null && value !== undefined && value !== '' ? value : '(not set)'
    return (
      <div className="flex items-start gap-2 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{displayValue}</p>
        </div>
      </div>
    )
  }

  // Helper to generate overflow phone fields (2-30)
  const generatePhoneFields = (baseField: string, label: string, maxCount: number = 30) => {
    const fields = []

    // Add base field - ALWAYS show base fields (even if empty)
    const baseValue = (contact as any)[baseField]
    if (baseField === 'mobile_phone' || baseField === 'personal_phone' || baseField === 'direct_number') {
      fields.push({
        label: label,
        value: baseValue,
        dnc: (contact as any)[`${baseField}_dnc`],
        isBase: true,
      })
    }

    // Add overflow fields (_2 through _30) - ONLY show if populated
    for (let i = 2; i <= maxCount; i++) {
      const fieldName = `${baseField}_${i}`
      const dncFieldName = `${fieldName}_dnc`
      const value = (contact as any)[fieldName]

      if (value) {  // Only include if populated
        fields.push({
          label: `${label} ${i}`,
          value: value,
          dnc: (contact as any)[dncFieldName],
          isBase: false,
        })
      }
    }

    return fields
  }

  // Collect all phone numbers with DNC indicators
  const phoneNumbers = [
    { label: 'Phone', value: contact.phone, dnc: null, isBase: true },
    ...generatePhoneFields('mobile_phone', 'Mobile Phone', 30),
    ...generatePhoneFields('direct_number', 'Direct Number', 30),
    ...generatePhoneFields('personal_phone', 'Personal Phone', 30),
    { label: 'Company Phone', value: (contact as any).company_phone, dnc: null, isBase: false },
    ...generatePhoneFields('company_phone', 'Company Phone', 30),
  ]

  // Helper to generate overflow email fields (2-30)
  const generateEmailFields = (baseField: string, label: string, maxCount: number = 30, includeBase: boolean = true) => {
    const fields = []

    // Add base field - ALWAYS show if includeBase is true (even if empty)
    if (includeBase) {
      const baseValue = (contact as any)[baseField]
      fields.push({
        label: label,
        value: baseValue,
        isBase: true,
      })
    }

    // Add overflow fields (_2 through _30) - ONLY show if populated
    for (let i = 2; i <= maxCount; i++) {
      const fieldName = `${baseField}_${i}`
      const value = (contact as any)[fieldName]

      if (value) {  // Only include if populated
        fields.push({
          label: `${label} ${i}`,
          value: value,
          isBase: false,
        })
      }
    }

    return fields
  }

  const primaryEmail = getPrimaryEmail(contact)

  // Collect all emails - base fields always shown, overflow only if populated
  const emails = [
    { label: 'Email', value: primaryEmail, isBase: true },
    ...generateEmailFields('personal_email', 'Personal Email', 30, true),
    ...generateEmailFields('business_email', 'Business Email', 30, true),
    ...generateEmailFields('personal_verified_email', 'Personal Verified Email', 30, true),
    ...generateEmailFields('business_verified_email', 'Business Verified Email', 30, true),
  ]

  // Integer fields to highlight - ALWAYS show all fields even if null
  const integerFields = [
    { label: 'Company Employee Count', value: (contact as any).company_employee_count },
    { label: 'Company Revenue', value: (contact as any).company_revenue },
    { label: 'Social Connections', value: (contact as any).social_connections },
    { label: 'Years of Experience', value: (contact as any).inferred_years_experience },
    { label: 'Lead Score', value: (contact as any).lead_score },
    { label: 'Skiptrace Match Score', value: (contact as any).skiptrace_match_score },
    { label: 'Skiptrace Exact Age', value: (contact as any).skiptrace_exact_age },
  ]

  // Overflow data
  const overflowData = (contact as any).overflow_data

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/contacts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={contact.status === 'CUSTOMER' ? 'default' : 'secondary'}>
                {contact.status}
              </Badge>
              {contact.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {contact.company}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/contacts?edit=${resolvedParams.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderField('First Name', contact.first_name)}
              {renderField('Last Name', contact.last_name)}
              {renderField('Company', contact.company)}
              {renderField('Job Title', (contact as any).job_title)}
              {renderField('Status', contact.status)}
              {renderField('Created', new Date(contact.created_at).toLocaleDateString())}
            </CardContent>
          </Card>

          {/* Contact Information - ALWAYS SHOWS PRIMARY FIELDS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Emails</p>
                {/* Show all email fields - only if populated */}
                {emails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{email.label}</p>
                      <p className="text-sm">{email.value}</p>
                    </div>
                  </div>
                ))}
                {emails.length === 0 && (
                  <p className="text-sm text-muted-foreground">(no email addresses)</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Phone Numbers</p>
                <div className="max-h-64 overflow-y-auto">
                  {/* Show phone fields only if populated */}
                  {phoneNumbers.filter(p => p.value).map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{phone.label}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{formatPhoneNumber(phone.value)}</p>
                          {phone.dnc !== null && phone.dnc !== undefined && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              DNC: {typeof phone.dnc === 'boolean' ? (phone.dnc ? 'Y' : 'N') : String(phone.dnc).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {phoneNumbers.filter(p => p.value).length === 0 && (
                    <p className="text-sm text-muted-foreground">(no phone numbers)</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integer Fields (CSV Import Test) - ALWAYS VISIBLE */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Integer Fields
                <Badge variant="outline" className="text-xs">CSV Import Test</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {integerFields.map((field, idx) => {
                const displayValue = field.value !== null && field.value !== undefined ? field.value : '(not set)'
                const valueClass = field.value !== null && field.value !== undefined
                  ? "text-lg font-semibold text-blue-600"
                  : "text-lg font-semibold text-muted-foreground"
                return (
                  <div key={idx} className="py-2 border-b last:border-0">
                    <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                    <p className={valueClass}>{displayValue}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Address Information - ALWAYS VISIBLE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Business Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                  <div className="text-sm">
                    {(contact as any).street_address ? (
                      <>
                        <p>{(contact as any).street_address}</p>
                        {((contact as any).city || (contact as any).state || (contact as any).zip_code) && (
                          <p>
                            {(contact as any).city || ''}{(contact as any).city && (contact as any).state ? ', ' : ''}{(contact as any).state || ''} {(contact as any).zip_code || ''}
                          </p>
                        )}
                        {(contact as any).country && (
                          <p className="text-xs text-muted-foreground mt-1">{(contact as any).country}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">(not set)</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Personal Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                  <div className="text-sm">
                    {(contact as any).personal_address ? (
                      <>
                        <p>{(contact as any).personal_address}</p>
                        {((contact as any).personal_city || (contact as any).personal_state || (contact as any).personal_zip) && (
                          <p>
                            {(contact as any).personal_city || ''}{(contact as any).personal_city && (contact as any).personal_state ? ', ' : ''}{(contact as any).personal_state || ''} {(contact as any).personal_zip || ''}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">(not set)</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information - ALWAYS VISIBLE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderField('Company Name', (contact as any).company_name)}
              {renderField('Company Domain', (contact as any).company_domain)}
              {renderField('Company Industry', (contact as any).company_industry)}
              {renderField('Company Description', (contact as any).company_description)}
              {renderField('LinkedIn URL', (contact as any).company_linkedin_url)}
            </CardContent>
          </Card>

          {/* Contact Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderField('Source', (contact as any).source)}
              {renderField('Assigned To', (contact as any).assigned_to_id ? `User ${(contact as any).assigned_to_id}` : '(not assigned)')}
              {renderField('Pipeline', (contact as any).pipeline_id ? `Pipeline ${(contact as any).pipeline_id}` : '(no pipeline)')}
              {renderField('Pipeline Stage', (contact as any).pipeline_stage)}
            </CardContent>
          </Card>

          {/* Objects Assignment */}
          <ContactObjectsSection
            contactId={resolvedParams.id}
            canManage={canManageObjects}
          />

          {/* Websites & Social Links */}
          {((contact as any).websites && (contact as any).websites.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Websites & Social Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(contact as any).websites.map((url: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderField('Active', (contact as any).is_active !== undefined ? ((contact as any).is_active ? 'Yes' : 'No') : 'Yes')}
              {renderField('Last Updated', new Date(contact.updated_at).toLocaleString())}
              {(contact as any).last_enriched_at && renderField('Last Enriched', new Date((contact as any).last_enriched_at).toLocaleString())}
            </CardContent>
          </Card>

          {/* Notes */}
          {(contact as any).notes && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{(contact as any).notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Overflow Data */}
          {overflowData && Object.keys(overflowData).length > 0 && (
            <Card className="border-green-200 bg-green-50/50 md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Overflow Data (Comma-Delimited Values)
                  <Badge variant="outline" className="text-xs">Additional Fields</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-white p-4 border">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(overflowData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Fields */}
          {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-slate-50 p-4 border">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(contact.custom_fields, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Activity</h2>
          <ActivityTimeline contactId={resolvedParams.id} />
        </div>
      </div>
    </div>
  )
}
