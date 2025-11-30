import api from '@/lib/api'
import { Communication, InboxThread, Paginated } from '@/types'

export const communicationsApi = {
  getInbox: async (params?: {
    page?: number
    size?: number
    type?: string
    direction?: string
    status?: string
    search?: string
  }): Promise<Paginated<Communication>> => {
    const response = await api.get('/api/v1/communications/inbox', { params })
    return response.data
  },

  getCommunication: async (id: string): Promise<Communication> => {
    const response = await api.get(`/api/v1/communications/${id}`)
    return response.data
  },

  getContactHistory: async (contactId: string): Promise<Paginated<Communication>> => {
    const response = await api.get(`/api/v1/communications/contact/${contactId}`)
    return response.data
  },

  sendMessage: async (data: {
    contact_id: string
    body: string
    type?: string
    channel?: string
    subject?: string
    media_urls?: string[]
  }): Promise<Communication> => {
    const response = await api.post('/api/v1/communications/send', {
      ...data,
      type: data.type || 'web_chat', // Default to web_chat for real-time delivery
    })
    return response.data
  },

  uploadFiles: async (files: File[]): Promise<string[]> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post('/api/v1/communications/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.urls
  },

  getInboxThreads: async (params?: {
    page?: number
    size?: number
    sort_by?: string
    status?: string
  }): Promise<InboxThread[]> => {
    const response = await api.get('/api/v1/communications/inbox/threads', { params })
    return response.data
  },

  sendEmail: async (data: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body_html: string
    attachments?: File[]
  }): Promise<Communication> => {
    const formData = new FormData()

    // Add email fields as form data
    formData.append('to', data.to.join(','))
    if (data.cc && data.cc.length > 0) {
      formData.append('cc', data.cc.join(','))
    }
    if (data.bcc && data.bcc.length > 0) {
      formData.append('bcc', data.bcc.join(','))
    }
    formData.append('subject', data.subject)
    formData.append('body_html', data.body_html)

    // Add attachments if present
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file)
      })
    }

    const response = await api.post('/api/v1/inbox/send-email', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  markAsRead: async (communicationId: string): Promise<Communication> => {
    const response = await api.patch(`/api/v1/communications/${communicationId}/read`)
    return response.data
  },

  archive: async (communicationId: string): Promise<Communication> => {
    const response = await api.patch(`/api/v1/communications/${communicationId}/archive`)
    return response.data
  },

  unarchive: async (communicationId: string): Promise<Communication> => {
    const response = await api.patch(`/api/v1/communications/${communicationId}/unarchive`)
    return response.data
  },
}
