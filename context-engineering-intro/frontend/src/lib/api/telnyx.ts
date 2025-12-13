/**
 * Telnyx SMS/MMS API client
 *
 * Features:
 * - Telnyx settings management
 * - Phone number search and purchase
 * - SMS sending profiles
 * - 10DLC Brand and Campaign registration
 */

import { api } from '@/lib/api'

// =========================================================================
// TYPES
// =========================================================================

export interface TelnyxSettings {
  id: string
  object_id: string
  object_name?: string
  api_key_masked: string
  messaging_profile_id?: string
  webhook_secret_set: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateTelnyxSettingsRequest {
  object_id: string
  api_key: string
  messaging_profile_id?: string
  webhook_secret?: string
}

export interface UpdateTelnyxSettingsRequest {
  api_key?: string
  messaging_profile_id?: string
  webhook_secret?: string
  is_active?: boolean
}

export interface VerifyCredentialsResponse {
  valid: boolean
  balance?: string
  currency?: string
  error?: string
}

export interface AvailableNumber {
  phone_number: string
  type: string
  region?: string
  locality?: string
  features: string[]
  monthly_cost?: string
  upfront_cost?: string
}

export interface OwnedPhoneNumber {
  id: string
  phone_number: string
  friendly_name?: string
  external_id?: string
  messaging_profile_id?: string
  phone_number_type?: string
  capabilities: Record<string, any>
  campaign_id?: string
  campaign_name?: string
  status: string
  object_id: string
  object_name?: string
  purchased_at?: string
  created_at: string
}

export interface SearchNumbersRequest {
  object_id: string
  area_code?: string
  city?: string
  state?: string
  number_type?: 'local' | 'toll_free'
  features?: string[]
  limit?: number
}

export interface PurchaseNumberRequest {
  object_id: string
  phone_number: string
  friendly_name?: string
}

export interface SMSProfile {
  id: string
  object_id: string
  object_name?: string
  phone_number_id: string
  phone_number: string
  phone_number_friendly_name?: string
  display_name: string
  signature?: string
  max_messages_per_day?: string
  is_active: boolean
  created_at: string
  updated_at: string
  assigned_user_count: number
}

export interface AssignedSMSProfile {
  id: string
  phone_number: string
  display_name: string
  signature?: string
  is_default: boolean
}

export interface CreateSMSProfileRequest {
  object_id: string
  phone_number_id: string
  display_name: string
  signature?: string
  max_messages_per_day?: string
}

export interface Brand {
  id: string
  object_id: string
  object_name?: string
  external_brand_id?: string
  company_name: string
  display_name?: string
  ein?: string
  website?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country: string
  vertical?: string
  entity_type?: string
  status: string
  vetting_status?: string
  vetting_score?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface CreateBrandRequest {
  object_id: string
  company_name: string
  display_name?: string
  ein?: string
  website?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  vertical?: string
  entity_type?: string
}

export interface Campaign {
  id: string
  brand_id: string
  brand_name?: string
  external_campaign_id?: string
  name: string
  description?: string
  use_case: string
  sub_use_case?: string
  sample_messages: string[]
  opt_in_message?: string
  opt_out_message?: string
  help_message?: string
  subscriber_optin: boolean
  subscriber_optout: boolean
  subscriber_help: boolean
  number_pool: boolean
  embedded_link: boolean
  embedded_phone: boolean
  status: string
  rejection_reason?: string
  phone_number_count: number
  created_at: string
  updated_at: string
}

export interface CreateCampaignRequest {
  brand_id: string
  name: string
  description?: string
  use_case: string
  sub_use_case?: string
  sample_messages: string[]
  opt_in_message?: string
  opt_out_message?: string
  help_message?: string
  subscriber_optin?: boolean
  subscriber_optout?: boolean
  subscriber_help?: boolean
  number_pool?: boolean
  embedded_link?: boolean
  embedded_phone?: boolean
}

// =========================================================================
// TELNYX SETTINGS API
// =========================================================================

export const telnyxSettingsApi = {
  /**
   * List Telnyx settings (Owner/Admin only)
   */
  list: async (objectId?: string): Promise<TelnyxSettings[]> => {
    const params = objectId ? { object_id: objectId } : {}
    const response = await api.get('/telnyx-settings/', { params })
    return response.data
  },

  /**
   * Get specific Telnyx settings
   */
  get: async (settingsId: string): Promise<TelnyxSettings> => {
    const response = await api.get(`/telnyx-settings/${settingsId}`)
    return response.data
  },

  /**
   * Create Telnyx settings for an object
   */
  create: async (data: CreateTelnyxSettingsRequest): Promise<TelnyxSettings> => {
    const response = await api.post('/telnyx-settings/', data)
    return response.data
  },

  /**
   * Update Telnyx settings
   */
  update: async (settingsId: string, data: UpdateTelnyxSettingsRequest): Promise<TelnyxSettings> => {
    const response = await api.put(`/telnyx-settings/${settingsId}`, data)
    return response.data
  },

  /**
   * Delete Telnyx settings
   */
  delete: async (settingsId: string): Promise<void> => {
    await api.delete(`/telnyx-settings/${settingsId}`)
  },

  /**
   * Verify Telnyx credentials
   */
  verify: async (settingsId: string): Promise<VerifyCredentialsResponse> => {
    const response = await api.post(`/telnyx-settings/${settingsId}/verify`)
    return response.data
  },
}

// =========================================================================
// PHONE NUMBER API
// =========================================================================

export const phoneNumbersApi = {
  /**
   * Search available phone numbers
   */
  search: async (data: SearchNumbersRequest): Promise<AvailableNumber[]> => {
    const response = await api.post('/phone-numbers/search', data)
    return response.data
  },

  /**
   * Purchase a phone number
   */
  purchase: async (data: PurchaseNumberRequest): Promise<OwnedPhoneNumber> => {
    const response = await api.post('/phone-numbers/purchase', data)
    return response.data
  },

  /**
   * List owned phone numbers
   */
  list: async (objectId?: string, status?: string): Promise<OwnedPhoneNumber[]> => {
    const params: Record<string, string> = {}
    if (objectId) params.object_id = objectId
    if (status) params.status_filter = status
    const response = await api.get('/phone-numbers/', { params })
    return response.data
  },

  /**
   * Get specific phone number
   */
  get: async (numberId: string): Promise<OwnedPhoneNumber> => {
    const response = await api.get(`/phone-numbers/${numberId}`)
    return response.data
  },

  /**
   * Update phone number
   */
  update: async (numberId: string, data: { friendly_name?: string; campaign_id?: string }): Promise<OwnedPhoneNumber> => {
    const response = await api.put(`/phone-numbers/${numberId}`, data)
    return response.data
  },

  /**
   * Release (cancel) phone number
   */
  release: async (numberId: string): Promise<void> => {
    await api.delete(`/phone-numbers/${numberId}`)
  },

  /**
   * Sync phone number from Telnyx
   */
  sync: async (numberId: string): Promise<{ status: string; telnyx_status?: string }> => {
    const response = await api.post(`/phone-numbers/${numberId}/sync`)
    return response.data
  },
}

// =========================================================================
// SMS PROFILES API
// =========================================================================

export const smsProfilesApi = {
  /**
   * Get current user's assigned SMS profiles
   */
  getMyProfiles: async (): Promise<AssignedSMSProfile[]> => {
    const response = await api.get('/sms-profiles/my-profiles')
    return response.data
  },

  /**
   * List all SMS profiles (Owner/Admin)
   */
  list: async (objectId?: string, isActive?: boolean): Promise<SMSProfile[]> => {
    const params: Record<string, any> = {}
    if (objectId) params.object_id = objectId
    if (isActive !== undefined) params.is_active = isActive
    const response = await api.get('/sms-profiles/', { params })
    return response.data
  },

  /**
   * Get specific SMS profile with assigned users
   */
  get: async (profileId: string): Promise<{ profile: SMSProfile; assigned_users: any[] }> => {
    const response = await api.get(`/sms-profiles/${profileId}`)
    return response.data
  },

  /**
   * Create SMS profile
   */
  create: async (data: CreateSMSProfileRequest): Promise<SMSProfile> => {
    const response = await api.post('/sms-profiles/', data)
    return response.data
  },

  /**
   * Update SMS profile
   */
  update: async (profileId: string, data: Partial<CreateSMSProfileRequest> & { is_active?: boolean }): Promise<SMSProfile> => {
    const response = await api.put(`/sms-profiles/${profileId}`, data)
    return response.data
  },

  /**
   * Delete SMS profile
   */
  delete: async (profileId: string): Promise<void> => {
    await api.delete(`/sms-profiles/${profileId}`)
  },

  /**
   * Assign users to profile
   */
  assignUsers: async (profileId: string, assignments: { user_id: string; is_default?: boolean }[]): Promise<void> => {
    await api.post(`/sms-profiles/${profileId}/assignments`, assignments)
  },

  /**
   * Remove user assignment
   */
  removeAssignment: async (profileId: string, userId: string): Promise<void> => {
    await api.delete(`/sms-profiles/${profileId}/assignments/${userId}`)
  },

  /**
   * Set default profile for user
   */
  setDefault: async (profileId: string, userId: string): Promise<void> => {
    await api.put(`/sms-profiles/${profileId}/assignments/${userId}/default`)
  },
}

// =========================================================================
// 10DLC API
// =========================================================================

export const tenDLCApi = {
  /**
   * List 10DLC brands
   */
  listBrands: async (objectId?: string): Promise<Brand[]> => {
    const params = objectId ? { object_id: objectId } : {}
    const response = await api.get('/10dlc/brands', { params })
    return response.data
  },

  /**
   * Create 10DLC brand
   */
  createBrand: async (data: CreateBrandRequest): Promise<Brand> => {
    const response = await api.post('/10dlc/brands', data)
    return response.data
  },

  /**
   * Sync brand status from Telnyx
   */
  syncBrand: async (brandId: string): Promise<{ status: string; brand_status?: string }> => {
    const response = await api.post(`/10dlc/brands/${brandId}/sync`)
    return response.data
  },

  /**
   * List 10DLC campaigns
   */
  listCampaigns: async (brandId?: string): Promise<Campaign[]> => {
    const params = brandId ? { brand_id: brandId } : {}
    const response = await api.get('/10dlc/campaigns', { params })
    return response.data
  },

  /**
   * Create 10DLC campaign
   */
  createCampaign: async (data: CreateCampaignRequest): Promise<Campaign> => {
    const response = await api.post('/10dlc/campaigns', data)
    return response.data
  },

  /**
   * Assign phone number to campaign
   */
  assignNumber: async (campaignId: string, phoneNumberId: string): Promise<{ status: string }> => {
    const response = await api.post(`/10dlc/campaigns/${campaignId}/assign-number?phone_number_id=${phoneNumberId}`)
    return response.data
  },

  /**
   * Sync campaign status from Telnyx
   */
  syncCampaign: async (campaignId: string): Promise<{ status: string; campaign_status?: string }> => {
    const response = await api.post(`/10dlc/campaigns/${campaignId}/sync`)
    return response.data
  },
}
