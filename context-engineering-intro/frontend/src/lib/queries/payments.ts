import api from '@/lib/api'
import { Payment, Paginated, PaymentGateway } from '@/types'

export const paymentsApi = {
  getPayments: async (params?: {
    page?: number
    size?: number
    gateway?: string
    status?: string
    contact_id?: string
  }): Promise<Paginated<Payment>> => {
    const response = await api.get('/api/v1/payments', { params })
    return response.data
  },

  getPayment: async (id: string): Promise<Payment> => {
    const response = await api.get(`/api/v1/payments/${id}`)
    return response.data
  },

  processPayment: async (data: {
    contact_id: string
    amount_cents: number
    payment_method_token: string
    gateway?: PaymentGateway
    description?: string
  }): Promise<Payment> => {
    const response = await api.post('/api/v1/payments/process', data)
    return response.data
  },

  refundPayment: async (id: string, amount_cents?: number): Promise<Payment> => {
    const response = await api.post(`/api/v1/payments/${id}/refund`, { amount_cents })
    return response.data
  },

  getPaymentStats: async (): Promise<any> => {
    const response = await api.get('/api/v1/payments/stats/summary')
    return response.data
  },
}
