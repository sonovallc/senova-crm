import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Tag } from '@/types'

export interface TagCreate {
  name: string
  color: string
}

export interface TagUpdate {
  name?: string
  color?: string
}

export const tagsApi = {
  // Get all tags
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get('/api/v1/tags/')
    return response.data
  },

  // Create a new tag (admin/owner only)
  createTag: async (data: TagCreate): Promise<Tag> => {
    const response = await api.post('/api/v1/tags/', data)
    return response.data
  },

  // Update a tag (admin/owner only)
  updateTag: async (tagId: string, data: TagUpdate): Promise<Tag> => {
    const response = await api.put(`/api/v1/tags/${tagId}`, data)
    return response.data
  },

  // Delete a tag (owner only)
  deleteTag: async (tagId: string): Promise<void> => {
    await api.delete(`/api/v1/tags/${tagId}`)
  },

  // Get all tags for a specific contact
  getContactTags: async (contactId: string): Promise<Tag[]> => {
    const response = await api.get(`/api/v1/tags/contacts/${contactId}/tags`)
    return response.data
  },

  // Add a tag to a contact
  addTagToContact: async (contactId: string, tagId: string): Promise<void> => {
    await api.post(`/api/v1/tags/contacts/${contactId}/tags`, {
      tag_id: tagId
    })
  },

  // Remove a tag from a contact
  removeTagFromContact: async (contactId: string, tagId: string): Promise<void> => {
    await api.delete(`/api/v1/tags/contacts/${contactId}/tags/${tagId}`)
  },
}

// React Query Hooks
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getTags,
  })
}
