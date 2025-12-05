import api from '@/lib/api'
import { EmailTemplate, EmailTemplateCategory, Paginated } from '@/types'

export const emailTemplatesApi = {
  getTemplates: async (params?: {
    page?: number
    page_size?: number
    category?: EmailTemplateCategory
    is_system?: boolean
    search?: string
    created_by?: string
  }): Promise<Paginated<EmailTemplate>> => {
    const response = await api.get('/v1/email-templates', { params })
    return response.data
  },

  getTemplate: async (id: string): Promise<EmailTemplate> => {
    const response = await api.get(`/api/v1/email-templates/${id}`)
    return response.data
  },

  createTemplate: async (data: {
    name: string
    category: EmailTemplateCategory
    subject: string
    body_html: string
  }): Promise<EmailTemplate> => {
    const response = await api.post('/v1/email-templates', data)
    return response.data
  },

  updateTemplate: async (
    id: string,
    data: {
      name?: string
      category?: EmailTemplateCategory
      subject?: string
      body_html?: string
    }
  ): Promise<EmailTemplate> => {
    const response = await api.patch(`/api/v1/email-templates/${id}`, data)
    return response.data
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/email-templates/${id}`)
  },

  duplicateTemplate: async (id: string): Promise<EmailTemplate> => {
    const response = await api.post(`/api/v1/email-templates/${id}/duplicate`)
    return response.data
  },

  previewTemplate: async (
    id: string,
    variables: Record<string, string>
  ): Promise<{ subject: string; body_html: string }> => {
    const response = await api.post(`/api/v1/email-templates/${id}/preview`, {
      variables,
    })
    return response.data
  },

  seedStarterTemplates: async (): Promise<{
    message: string
    count: number
    templates: Array<{ id: string; name: string; category: string }>
  }> => {
    const response = await api.post('/v1/email-templates/seed-starter-templates')
    return response.data
  },
}
