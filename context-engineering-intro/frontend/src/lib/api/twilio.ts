import api from '@/lib/api'

// Types for Twilio Settings
export interface TwilioSettings {
  id: string
  account_sid: string
  is_active: boolean
  connection_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface TwilioSettingsCreate {
  account_sid: string
  auth_token: string
  webhook_signing_secret?: string
}

export interface TwilioConnectionTestResult {
  success: boolean
  account_name?: string
  error?: string
}

// API functions for Twilio endpoints
export const twilioApi = {
  // Get current Twilio settings
  getTwilioSettings: async (): Promise<TwilioSettings | null> => {
    try {
      const response = await api.get('/v1/twilio/settings')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null // No settings configured yet
      }
      throw error
    }
  },

  // Save or update Twilio settings
  saveTwilioSettings: async (data: TwilioSettingsCreate): Promise<TwilioSettings> => {
    const response = await api.post('/v1/twilio/settings', data)
    return response.data
  },

  // Test Twilio connection
  testTwilioConnection: async (): Promise<TwilioConnectionTestResult> => {
    const response = await api.post('/v1/twilio/test')
    return response.data
  },

  // Delete Twilio settings (disconnect)
  deleteTwilioSettings: async (): Promise<void> => {
    await api.delete('/v1/twilio/settings')
  },
}

export default twilioApi