import api from '@/lib/api'
import { AIResponse, SentimentAnalysis } from '@/types'

export const aiApi = {
  generateResponse: async (data: {
    message: string
    contact_id?: string
    tone?: string
    max_length?: number
    include_conversation_history?: boolean
  }): Promise<AIResponse> => {
    const response = await api.post('/api/v1/ai/generate-response', data)
    return response.data
  },

  analyzeSentiment: async (message: string): Promise<SentimentAnalysis> => {
    const response = await api.post('/api/v1/ai/analyze-sentiment', { message })
    return response.data
  },

  classifyIntent: async (message: string): Promise<any> => {
    const response = await api.post('/api/v1/ai/classify-intent', { message })
    return response.data
  },

  enrichContact: async (contactId: string, forceRefresh = false): Promise<any> => {
    const response = await api.post('/api/v1/ai/enrich-contact', {
      contact_id: contactId,
      force_refresh: forceRefresh,
    })
    return response.data
  },

  getContactSegments: async (contactId: string): Promise<any> => {
    const response = await api.get(`/api/v1/ai/contact/${contactId}/segments`)
    return response.data
  },

  predictPurchaseIntent: async (contactId: string, productCategory?: string): Promise<any> => {
    const response = await api.get(`/api/v1/ai/contact/${contactId}/purchase-prediction`, {
      params: { product_category: productCategory },
    })
    return response.data
  },
}
