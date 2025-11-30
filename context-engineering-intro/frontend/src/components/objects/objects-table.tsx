import { CRMObject } from '@/types/objects'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Eye, Edit, Trash2, Building2, Users, Globe, Copy } from 'lucide-react'
import { format } from 'date-fns'

interface ObjectsTableProps {
  objects: CRMObject[]
  onView: (object: CRMObject) => void
  onEdit: (object: CRMObject) => void
  onDelete: (id: string) => void
  onDuplicate?: (object: CRMObject) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function ObjectsTable({
  objects,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit = false,
  canDelete = false,
}: ObjectsTableProps) {
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

  return (
    <div className="rounded-lg border border-senova-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-senova-gray-50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Industry</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objects.map((object) => {
            const Icon = typeIcons[object.type] || Building2
            return (
              <TableRow
                key={object.id}
                className="hover:bg-senova-gray-50 transition-colors cursor-pointer"
                onClick={() => onView(object)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-senova-primary/10 rounded-lg">
                      <Icon className="h-4 w-4 text-senova-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-senova-gray-900">{object.name}</p>
                      {object.company_info?.legal_name && (
                        <p className="text-sm text-senova-gray-500">
                          {object.company_info.legal_name}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={typeColors[object.type]}>
                    {object.type.charAt(0).toUpperCase() + object.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-senova-gray-700">
                    {object.company_info?.industry || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-senova-gray-700">
                    {object.company_info?.email || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-senova-gray-600">
                    {format(new Date(object.created_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}