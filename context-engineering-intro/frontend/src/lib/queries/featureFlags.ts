import api from '@/lib/api'
import { FeatureFlag } from '@/types'

type ListParams = {
  page?: number
  page_size?: number
}

export interface FeatureFlagListResponse {
  items: FeatureFlag[]
  total: number
  page: number
  page_size: number
}

export interface FeatureFlagCreateInput {
  key: string
  name: string
  description?: string
}

export interface FeatureFlagUpdateInput {
  name?: string
  description?: string
  enabled?: boolean
}

export const featureFlagsApi = {
  listFlags: async (params?: ListParams): Promise<FeatureFlagListResponse> => {
    const response = await api.get('/v1/feature-flags/', { params })
    return response.data
  },
  createFlag: async (data: FeatureFlagCreateInput): Promise<FeatureFlag> => {
    const response = await api.post('/v1/feature-flags/', data)
    return response.data
  },
  updateFlag: async (id: string, data: FeatureFlagUpdateInput): Promise<FeatureFlag> => {
    const response = await api.patch(`/api/v1/feature-flags/${id}`, data)
    return response.data
  },
  deleteFlag: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/feature-flags/${id}`)
  },
}
