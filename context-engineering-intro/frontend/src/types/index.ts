export type Nullable<T> = T | null

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type PaginatedResponse<T> = Paginated<T>

export type UserRole = 'owner' | 'admin' | 'manager' | 'agent' | 'user'

export interface UserRef {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  role?: UserRole
  avatar_url?: string | null
}

export interface User extends UserRef {
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ContactStatus =
  | 'LEAD'
  | 'PROSPECT'
  | 'CUSTOMER'
  | 'INACTIVE'

export interface ContactPhone {
  type: string
  number: string
}

export interface ContactAddress {
  type: string
  street: string
  city: string
  state?: string
  zip?: string
  country?: string
}

export interface ContactFieldDefinition {
  field_name: string
  label: string
  field_type?: string
  category?: string
  field_label?: string
  field_category?: string
  is_required?: boolean
  options?: string[]
  is_sensitive?: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
  created_by: string
  created_at: string
  updated_at: string
  contact_count?: number
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  status: ContactStatus
  tags: string[]
  notes?: string | null
  owner?: Nullable<UserRef>
  owner_id?: string | null
  assigned_to?: Nullable<UserRef>
  assigned_to_id?: string | null
  addresses?: ContactAddress[]
  phones?: ContactPhone[]
  websites?: string[]
  custom_fields: Record<string, unknown>
  enrichment_data?: Record<string, unknown>
  last_enriched_at?: string
  overflow_data?: Record<string, string[]>
  created_at: string
  updated_at: string
}

export enum CommunicationType {
  SMS = 'SMS',
  MMS = 'MMS',
  EMAIL = 'EMAIL',
  WEB_CHAT = 'WEB_CHAT',
  PHONE = 'PHONE',
}

export enum CommunicationDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum CommunicationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export interface Communication {
  id: string
  contact_id: string
  contact_name?: string | null
  contact?: Contact
  type: CommunicationType
  direction: CommunicationDirection
  status: CommunicationStatus
  body: string
  subject?: string
  metadata?: Record<string, unknown>
  ai_confidence_score?: number
  closebot_processed?: boolean
  created_at: string
  updated_at?: string
  sent_at?: string | null
  media_urls?: string[]
  user?: UserRef | null  // Sender details for outbound messages
  error_message?: string | null  // For failed message details
}

export interface InboxThread {
  contact: Contact
  latest_message: Communication
  unread_count?: number
  last_activity_at?: string
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  SQUARE = 'square',
  PAYPAL = 'paypal',
  CASHAPP = 'cashapp',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface Payment {
  id: string
  contact_id: string
  gateway: PaymentGateway
  status: PaymentStatus
  amount_cents: number
  currency: string
  description?: string
  payment_method_last4?: string
  payment_method_brand?: string
  gateway_payment_id: string
  refund_amount_cents?: number
  created_at: string
  updated_at: string
}

export interface EnrichmentData {
  enriched_at: string
  confidence_score: number
  demographics: {
    age_range?: string
    gender?: string
    location?: {
      city?: string
      state?: string
      country?: string
      zip_code?: string
    }
    education?: string
    occupation?: string
    income_range?: string
  }
  behavioral: {
    interests?: string[]
    purchase_behavior?: Record<string, unknown>
    online_activity?: Record<string, unknown>
    social_media?: Record<string, unknown>
  }
  psychographic: {
    personality_traits?: string[]
    values?: string[]
    lifestyle?: string[]
  }
  professional: {
    job_title?: string
    company_size?: string
    industry?: string
    seniority_level?: string
  }
  predictions: {
    purchase_likelihood?: number
    lifetime_value_estimate?: number
    churn_risk?: number
  }
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string | null
  enabled: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface AIResponse {
  response_text: string
  confidence_score: number
  suggested_actions: string[]
  requires_human_review: boolean
  sentiment: string
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  confidence: number
  emotions: Record<string, number>
}

export type EmailTemplateCategory =
  | 'welcome'
  | 'appointment'
  | 'follow_up'
  | 'promotion'
  | 'newsletter'
  | 'general'

export interface EmailTemplate {
  id: string
  name: string
  category: EmailTemplateCategory
  subject: string
  body_html: string
  is_system: boolean
  usage_count: number
  thumbnail_url?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}
