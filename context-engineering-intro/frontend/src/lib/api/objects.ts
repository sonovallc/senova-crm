import { api } from '@/lib/api'
import type { Paginated } from '@/types'
import type {
  CRMObject,
  ObjectContact,
  ObjectUser,
  ObjectWebsite,
  CreateObjectRequest,
  UpdateObjectRequest,
  AssignUserRequest,
  CreateWebsiteRequest,
  UpdateWebsiteRequest,
  BulkContactAssignmentFilters
} from '@/types/objects'

// Interface for user's object assignments
export interface UserObject {
  id: string
  name: string
  type: string
  company_info: Record<string, any>
  permissions: Record<string, boolean>
  role_name: string | null
  assigned_at: string
}

export const objectsApi = {
  // Objects CRUD
  list: (params?: { page?: number; page_size?: number; search?: string; type?: string }) => {
    const page = params?.page || 1;
    const page_size = params?.page_size || 20;

    // Convert frontend pagination params to backend format
    const backendParams = {
      skip: (page - 1) * page_size,
      limit: page_size,
      ...(params?.search && { search: params.search }),
      ...(params?.type && { type: params.type })
    };

    return api.get<any>('/v1/objects', { params: backendParams }).then(res => {
      const data = res.data;
      // Transform backend response to match Paginated<T> type
      // Backend returns: { objects: [...], total: 10, skip: 0, limit: 20 }
      // Frontend expects: { items: [...], total: 10, page: 1, page_size: 20, pages: 1 }
      const total = data.total || 0;

      return {
        items: data.objects || [],
        total: total,
        page: page,
        page_size: page_size,
        pages: Math.ceil(total / page_size)
      } as Paginated<CRMObject>;
    });
  },

  get: (id: string) =>
    api.get<CRMObject>(`/v1/objects/${id}`).then(res => res.data),

  create: (data: CreateObjectRequest) =>
    api.post<CRMObject>('/v1/objects', data).then(res => res.data),

  update: (id: string, data: UpdateObjectRequest) =>
    api.put<CRMObject>(`/v1/objects/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/v1/objects/${id}`).then(res => res.data),

  // Contacts management
  listContacts: (id: string, params?: { page?: number; page_size?: number; search?: string; role?: string; department?: string }) => {
    const page = params?.page || 1;
    const page_size = params?.page_size || 20;

    // Convert frontend pagination params to backend format
    const backendParams = {
      skip: (page - 1) * page_size,
      limit: page_size,
      ...(params?.search && { search: params.search }),
      ...(params?.role && { role: params.role }),
      ...(params?.department && { department: params.department })
    };

    return api.get<any>(`/v1/objects/${id}/contacts`, { params: backendParams }).then(res => {
      const data = res.data;
      // Backend now returns ObjectContactListResponse with items, total, page, page_size, pages
      return {
        items: data.items || [],
        total: data.total || 0,
        page: data.page || page,
        page_size: data.page_size || page_size,
        pages: data.pages || Math.ceil((data.total || 0) / page_size)
      } as Paginated<ObjectContact>;
    });
  },

  assignContacts: (id: string, contactIds: string[]) =>
    api.post(`/v1/objects/${id}/contacts`, { contact_ids: contactIds }).then(res => res.data),

  bulkAssignContacts: (id: string, filters: BulkContactAssignmentFilters) =>
    api.post(`/v1/objects/${id}/contacts/bulk`, { filters }).then(res => res.data),

  updateContactAssignment: (id: string, contactId: string, data: { role?: string; department?: string }) =>
    api.put(`/v1/objects/${id}/contacts/${contactId}`, data).then(res => res.data),

  removeContact: (id: string, contactId: string) =>
    api.delete(`/v1/objects/${id}/contacts/${contactId}`).then(res => res.data),

  // Users management
  listUsers: (id: string) =>
    api.get<ObjectUser[]>(`/v1/objects/${id}/users`).then(res => res.data),

  assignUser: (id: string, data: AssignUserRequest) =>
    api.post<ObjectUser>(`/v1/objects/${id}/users`, data).then(res => res.data),

  updateUserPermissions: (id: string, userId: string, permissions: Partial<ObjectUser['permissions']>) =>
    api.put<ObjectUser>(`/v1/objects/${id}/users/${userId}`, { permissions }).then(res => res.data),

  removeUser: (id: string, userId: string) =>
    api.delete(`/v1/objects/${id}/users/${userId}`).then(res => res.data),

  // Websites management
  listWebsites: (id: string) =>
    api.get<ObjectWebsite[]>(`/v1/objects/${id}/websites`).then(res => res.data),

  createWebsite: (id: string, data: CreateWebsiteRequest) =>
    api.post<ObjectWebsite>(`/v1/objects/${id}/websites`, data).then(res => res.data),

  updateWebsite: (id: string, websiteId: string, data: UpdateWebsiteRequest) =>
    api.put<ObjectWebsite>(`/v1/objects/${id}/websites/${websiteId}`, data).then(res => res.data),

  deleteWebsite: (id: string, websiteId: string) =>
    api.delete(`/v1/objects/${id}/websites/${websiteId}`).then(res => res.data),

  // User's objects management
  getUserObjects: (userId: string) =>
    api.get<UserObject[]>(`/v1/users/${userId}/objects`).then(res => res.data),
}