import { ObjectPermissions } from '@/types/objects'
import { Badge } from '@/components/ui/badge'
import { Eye, Users, Building, Globe, UserPlus, Shield } from 'lucide-react'

interface PermissionBadgesProps {
  permissions: ObjectPermissions
}

export function PermissionBadges({ permissions }: PermissionBadgesProps) {
  const permissionItems = [
    {
      key: 'can_view',
      label: 'View',
      icon: Eye,
      color: 'bg-gray-100 text-gray-800',
      enabled: permissions.can_view
    },
    {
      key: 'can_manage_contacts',
      label: 'Manage Contacts',
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      enabled: permissions.can_manage_contacts
    },
    {
      key: 'can_manage_company_info',
      label: 'Manage Info',
      icon: Building,
      color: 'bg-green-100 text-green-800',
      enabled: permissions.can_manage_company_info
    },
    {
      key: 'can_manage_websites',
      label: 'Manage Websites',
      icon: Globe,
      color: 'bg-amber-100 text-red-800',
      enabled: permissions.can_manage_websites
    },
    {
      key: 'can_assign_users',
      label: 'Assign Users',
      icon: UserPlus,
      color: 'bg-orange-100 text-orange-800',
      enabled: permissions.can_assign_users
    }
  ]

  const enabledPermissions = permissionItems.filter(item => item.enabled)

  if (enabledPermissions.length === permissionItems.length) {
    return (
      <Badge className="bg-red-100 text-red-800">
        <Shield className="h-3 w-3 mr-1" />
        Full Access
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {enabledPermissions.map((item) => {
        const Icon = item.icon
        return (
          <Badge key={item.key} className={item.color}>
            <Icon className="h-3 w-3 mr-1" />
            {item.label}
          </Badge>
        )
      })}
      {enabledPermissions.length === 0 && (
        <Badge className="bg-gray-100 text-gray-500">
          <Eye className="h-3 w-3 mr-1" />
          View Only
        </Badge>
      )}
    </div>
  )
}