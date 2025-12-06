import { api } from '@/lib/api'

export interface ObjectMailgunSettings {
  id: string
  object_id: string
  name: string
  is_default: boolean
  sending_domain: string
  receiving_domain: string
  region: string
  is_active: boolean
  verified_at: string | null
  rate_limit_per_hour: number
  created_at: string
  updated_at: string
}

export interface ObjectForProfile {
  id: string
  name: string
  has_mailgun: boolean
  sending_domain?: string
  mailgun_domains?: ObjectMailgunSettings[]
}

export interface EmailProfile {
  id: string
  object_id?: string
  object_name?: string
  mailgun_settings_id?: string
  mailgun_domain_name?: string
  sending_domain?: string
  local_part?: string
  email_address: string
  display_name: string
  reply_to_address: string
  signature_html: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  assigned_user_count: number
}

export interface AssignedUser {
  id: string
  email: string
  full_name: string | null
  is_default: boolean
}

export interface ProfileWithAssignments {
  profile: EmailProfile
  assigned_users: AssignedUser[]
}

export interface AssignedProfile {
  id: string
  email_address: string
  display_name: string
  reply_to_address: string
  signature_html: string | null
  is_default: boolean
}

export interface CreateProfileData {
  object_id: string
  mailgun_settings_id?: string  // Optional - uses object default if not specified
  email_local_part: string
  display_name: string
  signature_html?: string
}

export interface UpdateProfileData {
  display_name?: string
  signature_html?: string
  is_active?: boolean
}

export interface UserAssignment {
  user_id: string
  is_default?: boolean
}

export interface CreateMailgunSettingsData {
  name: string
  api_key: string
  sending_domain: string
  receiving_domain: string
  region?: 'US' | 'EU'
  webhook_signing_key?: string
  rate_limit_per_hour?: number
  is_default?: boolean
}

export interface UpdateMailgunSettingsData {
  name?: string
  api_key?: string
  sending_domain?: string
  receiving_domain?: string
  region?: 'US' | 'EU'
  webhook_signing_key?: string
  rate_limit_per_hour?: number
}

export const objectMailgunApi = {
  // List all Mailgun configurations for an object (multi-domain support)
  list: async (objectId: string): Promise<ObjectMailgunSettings[]> => {
    const response = await api.get(`/v1/objects/${objectId}/mailgun`)
    return Array.isArray(response.data) ? response.data : []
  },

  // Get specific Mailgun settings
  get: async (objectId: string, settingsId: string): Promise<ObjectMailgunSettings | null> => {
    try {
      const response = await api.get(`/v1/objects/${objectId}/mailgun/${settingsId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // Get default Mailgun settings for backward compatibility
  getDefault: async (objectId: string): Promise<ObjectMailgunSettings | null> => {
    try {
      const response = await api.get(`/v1/objects/${objectId}/mailgun/default`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // Create new Mailgun configuration
  create: async (objectId: string, data: CreateMailgunSettingsData): Promise<ObjectMailgunSettings> => {
    const response = await api.post(`/v1/objects/${objectId}/mailgun`, data)
    return response.data
  },

  // Update specific Mailgun configuration
  update: async (objectId: string, settingsId: string, data: UpdateMailgunSettingsData): Promise<ObjectMailgunSettings> => {
    const response = await api.put(`/v1/objects/${objectId}/mailgun/${settingsId}`, data)
    return response.data
  },

  // Delete specific Mailgun configuration
  delete: async (objectId: string, settingsId: string): Promise<void> => {
    await api.delete(`/v1/objects/${objectId}/mailgun/${settingsId}`)
  },

  // Verify specific Mailgun configuration
  verify: async (objectId: string, settingsId: string): Promise<{ success: boolean; message: string; verified_at?: string }> => {
    const response = await api.post(`/v1/objects/${objectId}/mailgun/${settingsId}/verify`)
    return response.data
  },

  // Set specific Mailgun configuration as default
  setDefault: async (objectId: string, settingsId: string): Promise<ObjectMailgunSettings> => {
    const response = await api.put(`/v1/objects/${objectId}/mailgun/${settingsId}/set-default`)
    return response.data
  },
}

export const emailProfilesApi = {
  // Owner-only endpoints
  list: async (isActive?: boolean): Promise<EmailProfile[]> => {
    const params = isActive !== undefined ? `?is_active=${isActive}` : ''
    const response = await api.get(`/api/v1/email-profiles${params}`)
    // Defensive: ensure we always return an array
    return Array.isArray(response.data) ? response.data : []
  },

  create: async (data: CreateProfileData): Promise<EmailProfile> => {
    const response = await api.post('/v1/email-profiles', data)
    return response.data
  },

  get: async (profileId: string): Promise<ProfileWithAssignments> => {
    const response = await api.get(`/api/v1/email-profiles/${profileId}`)
    return response.data
  },

  update: async (profileId: string, data: UpdateProfileData): Promise<EmailProfile> => {
    const response = await api.put(`/api/v1/email-profiles/${profileId}`, data)
    return response.data
  },

  delete: async (profileId: string): Promise<void> => {
    await api.delete(`/api/v1/email-profiles/${profileId}`)
  },

  assignUsers: async (profileId: string, assignments: UserAssignment[]): Promise<void> => {
    await api.post(`/api/v1/email-profiles/${profileId}/assignments`, assignments)
  },

  removeAssignment: async (profileId: string, userId: string): Promise<void> => {
    await api.delete(`/api/v1/email-profiles/${profileId}/assignments/${userId}`)
  },

  setDefault: async (profileId: string, userId: string): Promise<void> => {
    await api.put(`/api/v1/email-profiles/${profileId}/assignments/${userId}/default`, {})
  },

  // User endpoint - get current user's assigned profiles
  getMyProfiles: async (): Promise<AssignedProfile[]> => {
    const response = await api.get('/v1/email-profiles/my-profiles')
    // Defensive: ensure we always return an array
    return Array.isArray(response.data) ? response.data : []
  },
}
