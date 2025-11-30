'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/queries/payments'
import { Payment } from '@/types'
import { PaymentList } from '@/components/payments/payment-list'
import { PaymentStats } from '@/components/payments/payment-stats'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'

export default function PaymentsPage() {
  const [gatewayFilter, setGatewayFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', { gateway: gatewayFilter, status: statusFilter }],
    queryFn: () =>
      paymentsApi.getPayments({
        gateway: gatewayFilter !== 'all' ? gatewayFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: paymentsApi.getPaymentStats,
  })

  // Refund payment mutation
  const refundMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.refundPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      toast({
        title: 'Success',
        description: 'Payment refunded successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to refund payment',
        variant: 'destructive',
      })
    },
  })

  const payments = paymentsData?.items || []

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">Multi-gateway payment processing</p>
          </div>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="border-b p-6">
          <PaymentStats stats={stats} />
        </div>
      )}

      {/* Filters */}
      <div className="border-b p-6">
        <div className="flex gap-4">
          <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gateways</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="cashapp">Cash App</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payment List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        ) : (
          <PaymentList payments={payments} />
        )}
      </div>
    </div>
  )
}
