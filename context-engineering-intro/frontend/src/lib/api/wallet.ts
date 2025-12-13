/**
 * Wallet and Payment Method API client
 *
 * Features:
 * - Wallet balance management
 * - Payment method CRUD operations
 * - Auto-recharge configuration
 * - Transaction history
 * - Stripe payment integration
 */

import { api } from '@/lib/api'

// =========================================================================
// TYPES
// =========================================================================

export interface Wallet {
  id: string
  owner_type: string
  owner_object_id: string | null
  owner_user_id: string | null
  balance: string
  currency: string
  auto_recharge_enabled: boolean
  auto_recharge_threshold: string
  auto_recharge_amount: string
  has_payment_method: boolean
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  transaction_type: string
  amount: string
  balance_after: string
  description: string
  reference_type: string | null
  reference_id: string | null
  created_at: string
}

export interface PaymentMethod {
  id: string
  card_brand: string
  card_last_four: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface FundWalletRequest {
  amount: number
  payment_method_id: string
}

export interface WalletSettingsUpdate {
  auto_recharge_enabled?: boolean
  auto_recharge_threshold?: number
  auto_recharge_amount?: number
}

export interface SetupIntentResponse {
  client_secret: string
}

// =========================================================================
// WALLET API
// =========================================================================

export const walletApi = {
  /**
   * Get wallet for an owner (object or user)
   */
  getWallet: async (ownerType: string, ownerId: string): Promise<Wallet> => {
    const response = await api.get(`/v1/wallets/${ownerType}/${ownerId}`)
    return response.data
  },

  /**
   * Fund wallet with payment
   */
  fundWallet: async (ownerType: string, ownerId: string, data: FundWalletRequest): Promise<WalletTransaction> => {
    const response = await api.post(`/v1/wallets/${ownerType}/${ownerId}/fund`, data)
    return response.data
  },

  /**
   * Get wallet transactions
   */
  getWalletTransactions: async (
    ownerType: string,
    ownerId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<WalletTransaction[]> => {
    const response = await api.get(`/v1/wallets/${ownerType}/${ownerId}/transactions`, { params })
    return response.data
  },

  /**
   * Update wallet auto-recharge settings
   */
  updateWalletSettings: async (
    ownerType: string,
    ownerId: string,
    data: WalletSettingsUpdate
  ): Promise<Wallet> => {
    const response = await api.put(`/v1/wallets/${ownerType}/${ownerId}/settings`, data)
    return response.data
  },

  /**
   * Get wallet balance only
   */
  getWalletBalance: async (ownerType: string, ownerId: string): Promise<{ balance: string; currency: string }> => {
    const response = await api.get(`/v1/wallets/${ownerType}/${ownerId}/balance`)
    return response.data
  },
}

// =========================================================================
// PAYMENT METHOD API
// =========================================================================

export const paymentMethodApi = {
  /**
   * Get all payment methods for a wallet
   */
  getPaymentMethods: async (walletId: string): Promise<PaymentMethod[]> => {
    const response = await api.get(`/v1/payment-methods/?wallet_id=${walletId}`)
    return response.data
  },

  /**
   * Create Stripe setup intent for adding new payment method
   */
  createSetupIntent: async (walletId: string): Promise<SetupIntentResponse> => {
    const response = await api.post(`/v1/payment-methods/setup-intent`, { wallet_id: walletId })
    return response.data
  },

  /**
   * Add payment method after successful Stripe setup
   */
  addPaymentMethod: async (walletId: string, paymentMethodId: string): Promise<PaymentMethod> => {
    const response = await api.post(`/v1/payment-methods/`, {
      wallet_id: walletId,
      stripe_payment_method_id: paymentMethodId,
    })
    return response.data
  },

  /**
   * Delete payment method
   */
  deletePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await api.delete(`/v1/payment-methods/${paymentMethodId}`)
  },

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<PaymentMethod> => {
    const response = await api.put(`/v1/payment-methods/${paymentMethodId}/set-default`)
    return response.data
  },
}