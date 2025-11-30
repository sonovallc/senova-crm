import api from '@/lib/api'
import { Contact, ContactFieldDefinition, Paginated } from '@/types'

export interface BulkDeleteContactsResponse {
  deleted: number
  failed: number
  errors?: Array<{ contact_id: string; reason: string }>
}

export const contactsApi = {
  getContacts: async (params?: {
    page?: number
    page_size?: number
    status?: string
    search?: string
    tags?: string[]
  }): Promise<Paginated<Contact>> => {
    // Convert tags array to comma-separated string for the API
    const apiParams = {
      ...params,
      tags: params?.tags && params.tags.length > 0 ? params.tags.join(',') : undefined
    }
    const response = await api.get('/api/v1/contacts/', { params: apiParams })
    return response.data
  },

  getContact: async (id: string): Promise<Contact> => {
    const response = await api.get(`/api/v1/contacts/${id}`)
    return response.data
  },

  searchContacts: async (filterRequest: {
    filters: Array<{
      field: string
      operator: string
      value?: string
    }>
    logic: 'and' | 'or'
    page: number
    page_size: number
  }): Promise<Paginated<Contact>> => {
    const response = await api.post('/api/v1/contacts/search', filterRequest)
    return response.data
  },

  createContact: async (data: Partial<Contact>): Promise<Contact> => {
    const response = await api.post('/api/v1/contacts/', data)
    return response.data
  },

  updateContact: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const response = await api.put(`/api/v1/contacts/${id}`, data)
    return response.data
  },

  deleteContact: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/contacts/${id}`)
  },

  bulkDeleteContacts: async (contactIds: string[]): Promise<BulkDeleteContactsResponse> => {
    const response = await api.post('/api/v1/contacts/bulk-delete', {
      contact_ids: contactIds
    })
    return response.data
  },

  enrichContact: async (id: string): Promise<Contact> => {
    const response = await api.post(`/api/v1/ai/enrich-contact`, {
      contact_id: id,
      force_refresh: true,
    })
    return response.data
  },

  getContactFields: async (): Promise<ContactFieldDefinition[]> => {
    const response = await api.get('/api/v1/contacts/fields')
    // Backend returns {fields: [...]} not [...] directly
    return response.data.fields || []
  },
}
