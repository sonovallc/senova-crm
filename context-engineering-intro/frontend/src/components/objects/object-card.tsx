import { CRMObject } from '@/types/objects'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Eye, Edit, Trash2, Building2, Users, Globe, Mail, Phone, MapPin, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { formatAddress } from '@/lib/utils/address'

interface ObjectCardProps {
  object: CRMObject
  onView: (object: CRMObject) => void
  onEdit: (object: CRMObject) => void
  onDelete: (id: string) => void
  onDuplicate?: (object: CRMObject) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function ObjectCard({
  object,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit = false,
  canDelete = false,
}: ObjectCardProps) {
  const typeColors = {
    company: 'bg-blue-100 text-blue-800',
    organization: 'bg-green-100 text-green-800',
    group: 'bg-amber-100 text-red-800'
  }

  const typeIcons = {
    company: Building2,
    organization: Users,
    group: Globe
  }

  const Icon = typeIcons[object.type] || Building2

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-senova-gray-200 hover:border-senova-primary"
      onClick={() => onView(object)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-senova-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-senova-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-senova-gray-900 truncate">
                {object.name}
              </h3>
              <Badge className={`${typeColors[object.type]} mt-1`}>
                {object.type.charAt(0).toUpperCase() + object.type.slice(1)}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onView(object)
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit(object)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canEdit && onDuplicate && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(object)
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(object.id)
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {object.company_info?.legal_name && (
          <p className="text-sm text-senova-gray-600 truncate">
            {object.company_info.legal_name}
          </p>
        )}

        <div className="space-y-2">
          {object.company_info?.email && (
            <div className="flex items-center gap-2 text-sm text-senova-gray-600">
              <Mail className="h-3 w-3" />
              <span className="truncate">{object.company_info.email}</span>
            </div>
          )}
          {object.company_info?.phone && (
            <div className="flex items-center gap-2 text-sm text-senova-gray-600">
              <Phone className="h-3 w-3" />
              <span className="truncate">{object.company_info.phone}</span>
            </div>
          )}
          {object.company_info?.address && (
            <div className="flex items-center gap-2 text-sm text-senova-gray-600">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{formatAddress(object.company_info.address)}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-senova-gray-100">
          <p className="text-xs text-senova-gray-500">
            Created {format(new Date(object.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}