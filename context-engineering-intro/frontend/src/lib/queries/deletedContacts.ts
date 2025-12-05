import api from '@/lib/api'

const MAX_PAGE_SIZE = 200
const clampPageSize = (value?: number, fallback = 20) => {
  if (!value || Number.isNaN(value) || value <= 0) {
    return fallback
  }
  return Math.min(MAX_PAGE_SIZE, value)
}

export interface DeletedContactSummary {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  deleted_at: string
  deleted_by?: string | null
}

export interface DeletedContactsList {
  items: DeletedContactSummary[]
  total: number
  page: number
  page_size: number
}

export interface DeletedContactsQuery {
  page?: number
  page_size?: number
}

export const deletedContactsApi = {
  listDeletedContacts: async (params?: DeletedContactsQuery): Promise<DeletedContactsList> => {
    const response = await api.get('/v1/contacts/deleted', {
      params: {
        page: params?.page ?? 1,
        page_size: clampPageSize(params?.page_size),
      },
    })
    return response.data
  },

  restoreContact: async (contactId: string): Promise<void> => {
    await api.post(`/api/v1/contacts/${contactId}/restore`)
  },

  permanentDeleteContact: async (contactId: string): Promise<void> => {
    await api.delete(`/api/v1/contacts/${contactId}/permanent`)
  },
}

export const deletedContactsQueryKeys = {
  list: (params?: DeletedContactsQuery) => [
    'deleted-contacts',
    params?.page ?? 1,
    clampPageSize(params?.page_size),
  ],
}
