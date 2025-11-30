'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deletedContactsApi, DeletedContactSummary, DeletedContactsList } from '@/lib/queries/deletedContacts'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

export default function DeletedContactsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<DeletedContactSummary | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const role = user?.role
  const isOwner = role === 'owner'

  const { data, isLoading, refetch, isFetching } = useQuery<DeletedContactsList>({
    queryKey: ['deleted-contacts', page],
    queryFn: () => deletedContactsApi.listDeletedContacts({ page }),
    enabled: isOwner,
  })

  const handleRestore = async (contactId: string) => {
    try {
      setIsProcessing(true)
      await deletedContactsApi.restoreContact(contactId)
      toast({
        title: 'Contact restored',
        description: 'The contact has been restored successfully.',
      })
      await refetch()
    } catch (error) {
      toast({
        title: 'Restore failed',
        description: 'Unable to restore this contact. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (!pendingDelete) return
    try {
      setIsProcessing(true)
      await deletedContactsApi.permanentDeleteContact(pendingDelete.id)
      toast({
        title: 'Contact permanently deleted',
        description: `${pendingDelete.first_name || 'Contact'} has been removed.`,
      })
      setPendingDelete(null)
      await refetch()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Unable to permanently delete this contact.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Deleted Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only account owners can access the deleted contacts archive.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deleted Contacts</h1>
          <p className="text-sm text-muted-foreground">Restore or permanently remove archived contacts.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading deleted contacts...
            </div>
          ) : (
            <>
              <div className="rounded-md border" data-testid="deleted-contacts-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Deleted Date</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((contact) => {
                      const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed'
                      return (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{contact.email || '—'}</TableCell>
                          <TableCell>{formatDateTime(contact.deleted_at)}</TableCell>
                          <TableCell>{contact.deleted_by || '—'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestore(contact.id)}
                              disabled={isProcessing}
                              data-testid={`restore-btn-${contact.id}`}
                            >
                              Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setPendingDelete(contact)}
                              disabled={isProcessing}
                              data-testid={`delete-btn-${contact.id}`}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {data?.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No deleted contacts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={() => !isProcessing && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{pendingDelete?.first_name || 'this contact'}</strong> permanently. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => setPendingDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={isProcessing} onClick={handlePermanentDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
