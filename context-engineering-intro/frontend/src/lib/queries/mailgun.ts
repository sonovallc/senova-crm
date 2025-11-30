import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface MailgunSettings {
  id: string
  user_id: string
  domain: string
  region: 'us' | 'eu'
  from_email: string
  from_name: string
  api_key_masked: string
  is_active: boolean
  verified_at: string | null
  rate_limit_per_hour: number
  created_at: string
  updated_at: string
  verified_addresses: VerifiedEmailAddress[]
}

export interface VerifiedEmailAddress {
  id: string
  mailgun_settings_id: string
  email_address: string
  display_name: string | null
  is_default: boolean
  verified_at: string
  created_at: string
}

export interface MailgunSettingsCreate {
  api_key: string
  domain: string
  region: 'us' | 'eu'
  from_email: string
  from_name: string
}

export interface MailgunSettingsUpdate {
  api_key?: string
  domain?: string
  region?: 'us' | 'eu'
  from_email?: string
  from_name?: string
  rate_limit_per_hour?: number
}

export interface VerifiedEmailCreate {
  email_address: string
  display_name?: string
  is_default?: boolean
}

export interface VerifiedEmailUpdate {
  display_name?: string
  is_default?: boolean
}

export interface MailgunTestResponse {
  success: boolean
  message: string
  verified_at?: string
  error_details?: string
}

// API functions
export const mailgunApi = {
  getSettings: async (): Promise<MailgunSettings> => {
    const response = await api.get('/api/v1/mailgun/settings')
    return response.data
  },

  createSettings: async (data: MailgunSettingsCreate): Promise<MailgunSettings> => {
    const response = await api.post('/api/v1/mailgun/settings', data)
    return response.data
  },

  updateSettings: async (data: MailgunSettingsUpdate): Promise<MailgunSettings> => {
    const response = await api.patch('/api/v1/mailgun/settings', data)
    return response.data
  },

  deleteSettings: async (): Promise<void> => {
    await api.delete('/api/v1/mailgun/settings')
  },

  testConnection: async (): Promise<MailgunTestResponse> => {
    const response = await api.post('/api/v1/mailgun/test-connection', {
      send_test_email: false,
    })
    return response.data
  },

  getVerifiedAddresses: async (): Promise<VerifiedEmailAddress[]> => {
    const response = await api.get('/api/v1/mailgun/verified-addresses')
    return response.data
  },

  addVerifiedAddress: async (data: VerifiedEmailCreate): Promise<VerifiedEmailAddress> => {
    const response = await api.post('/api/v1/mailgun/verified-addresses', data)
    return response.data
  },

  updateVerifiedAddress: async (
    addressId: string,
    data: VerifiedEmailUpdate
  ): Promise<VerifiedEmailAddress> => {
    const response = await api.patch(`/api/v1/mailgun/verified-addresses/${addressId}`, data)
    return response.data
  },

  deleteVerifiedAddress: async (addressId: string): Promise<void> => {
    await api.delete(`/api/v1/mailgun/verified-addresses/${addressId}`)
  },
}

// React Query Hooks
export function useMailgunSettings() {
  return useQuery({
    queryKey: ['mailgun', 'settings'],
    queryFn: mailgunApi.getSettings,
    retry: false, // Don't retry on 404 (not configured)
  })
}

export function useCreateMailgunSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mailgunApi.createSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}

export function useUpdateMailgunSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mailgunApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}

export function useDeleteMailgunSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mailgunApi.deleteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}

export function useTestMailgunConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mailgunApi.testConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}

export function useVerifiedAddresses() {
  return useQuery({
    queryKey: ['mailgun', 'verified-addresses'],
    queryFn: mailgunApi.getVerifiedAddresses,
    retry: false,
  })
}

export function useAddVerifiedAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mailgunApi.addVerifiedAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'verified-addresses'] })
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}

export function useUpdateVerifiedAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: VerifiedEmailUpdate }) =>
      mailgunApi.updateVerifiedAddress(addressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'verified-addresses'] })
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}

export function useDeleteVerifiedAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mailgunApi.deleteVerifiedAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'verified-addresses'] })
      queryClient.invalidateQueries({ queryKey: ['mailgun', 'settings'] })
    },
  })
}
