/**
 * Telnyx React Query hooks
 *
 * Provides data fetching and mutation hooks for Telnyx SMS/MMS integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  telnyxSettingsApi,
  phoneNumbersApi,
  smsProfilesApi,
  tenDLCApi,
  type TelnyxSettings,
  type CreateTelnyxSettingsRequest,
  type UpdateTelnyxSettingsRequest,
  type VerifyCredentialsResponse,
  type AvailableNumber,
  type OwnedPhoneNumber,
  type SearchNumbersRequest,
  type PurchaseNumberRequest,
  type SMSProfile,
  type AssignedSMSProfile,
  type CreateSMSProfileRequest,
  type Brand,
  type CreateBrandRequest,
  type Campaign,
  type CreateCampaignRequest,
} from '@/lib/api/telnyx'

// Re-export types for convenience
export type {
  TelnyxSettings,
  CreateTelnyxSettingsRequest,
  UpdateTelnyxSettingsRequest,
  VerifyCredentialsResponse,
  AvailableNumber,
  OwnedPhoneNumber,
  SearchNumbersRequest,
  PurchaseNumberRequest,
  SMSProfile,
  AssignedSMSProfile,
  CreateSMSProfileRequest,
  Brand,
  CreateBrandRequest,
  Campaign,
  CreateCampaignRequest,
}

// =========================================================================
// TELNYX SETTINGS HOOKS
// =========================================================================

export function useTelnyxSettings(objectId?: string) {
  return useQuery({
    queryKey: ['telnyx', 'settings', objectId],
    queryFn: () => telnyxSettingsApi.list(objectId),
    retry: false,
  })
}

export function useTelnyxSettingsById(settingsId: string) {
  return useQuery({
    queryKey: ['telnyx', 'settings', 'detail', settingsId],
    queryFn: () => telnyxSettingsApi.get(settingsId),
    enabled: !!settingsId,
    retry: false,
  })
}

export function useCreateTelnyxSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTelnyxSettingsRequest) => telnyxSettingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'settings'] })
    },
  })
}

export function useUpdateTelnyxSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ settingsId, data }: { settingsId: string; data: UpdateTelnyxSettingsRequest }) =>
      telnyxSettingsApi.update(settingsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'settings'] })
    },
  })
}

export function useDeleteTelnyxSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settingsId: string) => telnyxSettingsApi.delete(settingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'settings'] })
    },
  })
}

export function useVerifyTelnyxCredentials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settingsId: string) => telnyxSettingsApi.verify(settingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'settings'] })
    },
  })
}

// =========================================================================
// PHONE NUMBER HOOKS
// =========================================================================

export function usePhoneNumbers(objectId?: string, status?: string) {
  return useQuery({
    queryKey: ['telnyx', 'phone-numbers', objectId, status],
    queryFn: () => phoneNumbersApi.list(objectId, status),
    retry: false,
  })
}

export function usePhoneNumber(numberId: string) {
  return useQuery({
    queryKey: ['telnyx', 'phone-numbers', 'detail', numberId],
    queryFn: () => phoneNumbersApi.get(numberId),
    enabled: !!numberId,
    retry: false,
  })
}

export function useSearchPhoneNumbers() {
  return useMutation({
    mutationFn: (data: SearchNumbersRequest) => phoneNumbersApi.search(data),
  })
}

export function usePurchasePhoneNumber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PurchaseNumberRequest) => phoneNumbersApi.purchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'phone-numbers'] })
    },
  })
}

export function useUpdatePhoneNumber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ numberId, data }: { numberId: string; data: { friendly_name?: string; campaign_id?: string } }) =>
      phoneNumbersApi.update(numberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'phone-numbers'] })
    },
  })
}

export function useReleasePhoneNumber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (numberId: string) => phoneNumbersApi.release(numberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'phone-numbers'] })
    },
  })
}

export function useSyncPhoneNumber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (numberId: string) => phoneNumbersApi.sync(numberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'phone-numbers'] })
    },
  })
}

// =========================================================================
// SMS PROFILE HOOKS
// =========================================================================

export function useMyProfiles() {
  return useQuery({
    queryKey: ['telnyx', 'sms-profiles', 'my'],
    queryFn: () => smsProfilesApi.getMyProfiles(),
    retry: false,
  })
}

export function useSMSProfiles(objectId?: string, isActive?: boolean) {
  return useQuery({
    queryKey: ['telnyx', 'sms-profiles', objectId, isActive],
    queryFn: () => smsProfilesApi.list(objectId, isActive),
    retry: false,
  })
}

export function useSMSProfile(profileId: string) {
  return useQuery({
    queryKey: ['telnyx', 'sms-profiles', 'detail', profileId],
    queryFn: () => smsProfilesApi.get(profileId),
    enabled: !!profileId,
    retry: false,
  })
}

export function useCreateSMSProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSMSProfileRequest) => smsProfilesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    },
  })
}

export function useUpdateSMSProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: Partial<CreateSMSProfileRequest> & { is_active?: boolean } }) =>
      smsProfilesApi.update(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    },
  })
}

export function useDeleteSMSProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => smsProfilesApi.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    },
  })
}

export function useAssignUsersToProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, assignments }: { profileId: string; assignments: { user_id: string; is_default?: boolean }[] }) =>
      smsProfilesApi.assignUsers(profileId, assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    },
  })
}

export function useRemoveProfileAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, userId }: { profileId: string; userId: string }) =>
      smsProfilesApi.removeAssignment(profileId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    },
  })
}

export function useSetDefaultProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, userId }: { profileId: string; userId: string }) =>
      smsProfilesApi.setDefault(profileId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'sms-profiles'] })
    },
  })
}

// =========================================================================
// 10DLC HOOKS
// =========================================================================

export function useBrands(objectId?: string) {
  return useQuery({
    queryKey: ['telnyx', '10dlc', 'brands', objectId],
    queryFn: () => tenDLCApi.listBrands(objectId),
    retry: false,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBrandRequest) => tenDLCApi.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', '10dlc', 'brands'] })
    },
  })
}

export function useSyncBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (brandId: string) => tenDLCApi.syncBrand(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', '10dlc', 'brands'] })
    },
  })
}

export function useCampaigns(brandId?: string) {
  return useQuery({
    queryKey: ['telnyx', '10dlc', 'campaigns', brandId],
    queryFn: () => tenDLCApi.listCampaigns(brandId),
    retry: false,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => tenDLCApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', '10dlc', 'campaigns'] })
    },
  })
}

export function useAssignNumberToCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ campaignId, phoneNumberId }: { campaignId: string; phoneNumberId: string }) =>
      tenDLCApi.assignNumber(campaignId, phoneNumberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', '10dlc', 'campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['telnyx', 'phone-numbers'] })
    },
  })
}

export function useSyncCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (campaignId: string) => tenDLCApi.syncCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx', '10dlc', 'campaigns'] })
    },
  })
}
