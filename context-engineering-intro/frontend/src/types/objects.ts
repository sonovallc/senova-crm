import type { Contact, User } from './index'

export interface CompanyInfo {
  legal_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  [key: string]: any;
}

export interface CRMObject {
  id: string;
  name: string;
  type: 'company' | 'organization' | 'group';
  company_info: CompanyInfo;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface ObjectContact {
  id: string;
  object_id: string;
  contact_id: string;
  contact: Contact;
  role?: string;
  department?: string;
  assigned_at: string;
}

export interface ObjectUser {
  id: string;
  object_id: string;
  user_id: string;
  user: User;
  permissions: ObjectPermissions;
  assigned_at: string;
}

export interface ObjectPermissions {
  can_view: boolean;
  can_manage_contacts: boolean;
  can_manage_company_info: boolean;
  can_manage_websites: boolean;
  can_assign_users: boolean;
  manageable_fields?: string[];
}

export interface ObjectWebsite {
  id: string;
  object_id: string;
  name: string;
  slug: string;
  custom_domain?: string;
  content: any;
  published: boolean;
  ssl_provisioned: boolean;
}

export interface BulkContactAssignmentFilters {
  search?: string;
  status?: string[];
  tags?: string[];
  owner_ids?: string[];
  assigned_to_ids?: string[];
  has_email?: boolean;
  has_phone?: boolean;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
}

export interface CreateObjectRequest {
  name: string;
  type: 'company' | 'organization' | 'group';
  company_info?: CompanyInfo;
}

export interface UpdateObjectRequest {
  name?: string;
  type?: 'company' | 'organization' | 'group';
  company_info?: CompanyInfo;
}

export interface AssignUserRequest {
  user_id: string;
  permissions: ObjectPermissions;
}

export interface CreateWebsiteRequest {
  name: string;
  slug: string;
  custom_domain?: string;
  content?: any;
  published?: boolean;
}

export interface UpdateWebsiteRequest {
  name?: string;
  slug?: string;
  custom_domain?: string;
  content?: any;
  published?: boolean;
}