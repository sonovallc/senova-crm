/**
 * Wallet and Payment Method React Query hooks
 *
 * Provides data fetching and mutation hooks for wallet and payment management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  walletApi,
  paymentMethodApi,
  type Wallet,
  type WalletTransaction,
  type PaymentMethod,
  type FundWalletRequest,
  type WalletSettingsUpdate,
  type SetupIntentResponse,
} from '@/lib/api/wallet'

// Re-export types for convenience
export type {
  Wallet,
  WalletTransaction,
  PaymentMethod,
  FundWalletRequest,
  WalletSettingsUpdate,
  SetupIntentResponse,
}

// =========================================================================
// WALLET HOOKS
// =========================================================================

export function useWallet(ownerType: string, ownerId: string) {
  return useQuery({
    queryKey: ['wallet', ownerType, ownerId],
    queryFn: () => walletApi.getWallet(ownerType, ownerId),
    enabled: !!ownerType && !!ownerId,
    retry: false,
  })
}

export function useFundWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      ownerType,
      ownerId,
      data,
    }: {
      ownerType: string
      ownerId: string
      data: FundWalletRequest
    }) => walletApi.fundWallet(ownerType, ownerId, data),
    onSuccess: (_, variables) => {
      // Invalidate wallet and transactions
      queryClient.invalidateQueries({ queryKey: ['wallet', variables.ownerType, variables.ownerId] })
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', variables.ownerType, variables.ownerId] })
    },
  })
}

export function useWalletTransactions(
  ownerType: string,
  ownerId: string,
  params?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: ['wallet-transactions', ownerType, ownerId, params],
    queryFn: () => walletApi.getWalletTransactions(ownerType, ownerId, params),
    enabled: !!ownerType && !!ownerId,
    retry: false,
  })
}

export function useUpdateWalletSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      ownerType,
      ownerId,
      data,
    }: {
      ownerType: string
      ownerId: string
      data: WalletSettingsUpdate
    }) => walletApi.updateWalletSettings(ownerType, ownerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', variables.ownerType, variables.ownerId] })
    },
  })
}

export function useWalletBalance(ownerType: string, ownerId: string) {
  return useQuery({
    queryKey: ['wallet-balance', ownerType, ownerId],
    queryFn: () => walletApi.getWalletBalance(ownerType, ownerId),
    enabled: !!ownerType && !!ownerId,
    retry: false,
    refetchInterval: 30000, // Refresh balance every 30 seconds
  })
}

// =========================================================================
// PAYMENT METHOD HOOKS
// =========================================================================

export function usePaymentMethods(walletId: string) {
  return useQuery({
    queryKey: ['payment-methods', walletId],
    queryFn: () => paymentMethodApi.getPaymentMethods(walletId),
    enabled: !!walletId,
    retry: false,
  })
}

export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: (walletId: string) => paymentMethodApi.createSetupIntent(walletId),
  })
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      walletId,
      paymentMethodId,
    }: {
      walletId: string
      paymentMethodId: string
    }) => paymentMethodApi.addPaymentMethod(walletId, paymentMethodId),
    onSuccess: (_, variables) => {
      // Invalidate payment methods and wallet (has_payment_method flag)
      queryClient.invalidateQueries({ queryKey: ['payment-methods', variables.walletId] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      paymentMethodId,
      walletId,
    }: {
      paymentMethodId: string
      walletId: string
    }) => paymentMethodApi.deletePaymentMethod(paymentMethodId),
    onSuccess: (_, variables) => {
      // Invalidate payment methods and wallet
      queryClient.invalidateQueries({ queryKey: ['payment-methods', variables.walletId] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      paymentMethodId,
      walletId,
    }: {
      paymentMethodId: string
      walletId: string
    }) => paymentMethodApi.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', variables.walletId] })
    },
  })
}