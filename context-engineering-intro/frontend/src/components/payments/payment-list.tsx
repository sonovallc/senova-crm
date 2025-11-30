'use client'

import { Payment, PaymentGateway, PaymentStatus } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CreditCard, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentListProps {
  payments: Payment[]
  onSelect?: (payment: Payment) => void
}

function getStatusColor(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.SUCCEEDED:
      return 'bg-green-500'
    case PaymentStatus.PENDING:
    case PaymentStatus.PROCESSING:
      return 'bg-yellow-500'
    case PaymentStatus.FAILED:
      return 'bg-red-500'
    case PaymentStatus.REFUNDED:
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'bg-gray-500'
  }
}

function getGatewayIcon(gateway: PaymentGateway) {
  return <CreditCard className="h-4 w-4" />
}

export function PaymentList({ payments, onSelect }: PaymentListProps) {
  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <Card
          key={payment.id}
          className={cn(
            'p-4 transition-all',
            onSelect && 'cursor-pointer hover:shadow-md'
          )}
          onClick={() => onSelect?.(payment)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', getStatusColor(payment.status))}>
                <DollarSign className="h-6 w-6 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{formatCurrency(payment.amount_cents)}</h3>
                  <Badge variant="outline" className="gap-1">
                    {getGatewayIcon(payment.gateway)}
                    {payment.gateway.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{payment.description || 'No description'}</p>

                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDateTime(payment.created_at)}</span>
                  {payment.payment_method_last4 && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {payment.payment_method_brand} •••• {payment.payment_method_last4}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <Badge
                variant={payment.status === PaymentStatus.SUCCEEDED ? 'default' : 'secondary'}
              >
                {payment.status}
              </Badge>

              {payment.refund_amount_cents && payment.refund_amount_cents > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Refunded: {formatCurrency(payment.refund_amount_cents)}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}

      {payments.length === 0 && (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <p>No payments found</p>
        </div>
      )}
    </div>
  )
}
