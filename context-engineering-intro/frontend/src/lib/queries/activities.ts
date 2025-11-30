import api from '@/lib/api'

const MAX_PAGE_SIZE = 200
const clampPageSize = (value?: number) => {
  if (!value || Number.isNaN(value) || value <= 0) {
    return undefined
  }
  return Math.min(MAX_PAGE_SIZE, value)
}

export interface ActivityItem {
  id: string
  contact_id: string
  contact_name?: string | null
  contact_email?: string | null
  activity_type: string
  created_at: string
  user_id?: string | null
  user_name?: string | null
  details?: Record<string, any> | null
  is_deleted: boolean
}

export interface ActivityList {
  items: ActivityItem[]
  total: number
  page: number
  page_size: number
}

export interface ActivityQueryParams {
  page?: number
  page_size?: number
  types?: string[]
  user_id?: string
  contact_id?: string
  from?: string
  to?: string
  include_deleted?: boolean
}

function buildParams(params?: ActivityQueryParams) {
  if (!params) return undefined

  const payload: Record<string, any> = {
    page: params.page,
    page_size: clampPageSize(params.page_size),
    user_id: params.user_id,
    contact_id: params.contact_id,
    from: params.from,
    to: params.to,
    include_deleted: params.include_deleted,
  }

  // FastAPI expects comma-separated values for list params, not repeated params
  if (params.types && params.types.length > 0) {
    payload.type = params.types.join(',')
  }

  return payload
}

export const activitiesApi = {
  listContactActivities: async (contactId: string, params?: ActivityQueryParams): Promise<ActivityList> => {
    const response = await api.get(`/api/v1/contacts/${contactId}/activities`, {
      params: buildParams(params),
    })
    return response.data
  },

  listActivities: async (params?: ActivityQueryParams): Promise<ActivityList> => {
    const response = await api.get('/api/v1/activities', {
      params: buildParams({
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 50,
        types: params?.types,
        user_id: params?.user_id,
        contact_id: params?.contact_id,
        from: params?.from,
        to: params?.to,
        include_deleted: params?.include_deleted,
      }),
    })
    return response.data
  },

  exportActivitiesCsv: async (params?: ActivityQueryParams): Promise<Blob> => {
    const response = await api.get('/api/v1/activities/export', {
      params: buildParams(params),
      responseType: 'blob',
    })
    return response.data
  },
}

export const activityQueryKeys = {
  list: (params?: ActivityQueryParams) => [
    'activity-log',
    params?.page ?? 1,
    clampPageSize(params?.page_size) ?? undefined,
    (params?.types ?? []).join('|') || 'all',
    params?.user_id ?? null,
    params?.contact_id ?? null,
    params?.from ?? null,
    params?.to ?? null,
    params?.include_deleted ?? false,
  ],
  contact: (contactId: string, params?: ActivityQueryParams) => [
    'contact-activities',
    contactId,
    params?.page ?? 1,
    clampPageSize(params?.page_size) ?? undefined,
    (params?.types ?? []).join('|') || 'all',
    params?.from ?? null,
    params?.to ?? null,
    params?.include_deleted ?? false,
  ],
}
