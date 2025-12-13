import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import twilioApi, {
  TwilioSettings,
  TwilioSettingsCreate,
  TwilioConnectionTestResult,
} from '@/lib/api/twilio'

// React Query hooks for Twilio

// Hook to get Twilio settings
export function useTwilioSettings() {
  return useQuery({
    queryKey: ['twilio', 'settings'],
    queryFn: twilioApi.getTwilioSettings,
    retry: false, // Don't retry on 404 (not configured)
  })
}

// Hook to save/update Twilio settings
export function useSaveTwilioSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: twilioApi.saveTwilioSettings,
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(['twilio', 'settings'], data)
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['twilio', 'settings'] })
    },
  })
}

// Hook to test Twilio connection
export function useTestTwilioConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: twilioApi.testTwilioConnection,
    onSuccess: (result) => {
      if (result.success) {
        // If test is successful, refresh settings to get updated connection_verified_at
        queryClient.invalidateQueries({ queryKey: ['twilio', 'settings'] })
      }
    },
  })
}

// Hook to delete Twilio settings (disconnect)
export function useDeleteTwilioSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: twilioApi.deleteTwilioSettings,
    onSuccess: () => {
      // Clear the settings from cache
      queryClient.setQueryData(['twilio', 'settings'], null)
      // Invalidate to ensure fresh state
      queryClient.invalidateQueries({ queryKey: ['twilio', 'settings'] })
    },
  })
}

// Export types for use in components
export type {
  TwilioSettings,
  TwilioSettingsCreate,
  TwilioConnectionTestResult,
}