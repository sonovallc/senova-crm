'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PaymentMethod } from '@/lib/api/wallet'

interface AddFundsModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (amount: number, paymentMethodId: string) => Promise<void>
  paymentMethods: PaymentMethod[]
}

export function AddFundsModal({
  open,
  onClose,
  onSubmit,
  paymentMethods,
}: AddFundsModalProps) {
  const [amount, setAmount] = useState<string>('50')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quick amount buttons
  const quickAmounts = [25, 50, 100, 250, 500, 1000]

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount < 5 || numAmount > 1000) {
      return
    }

    if (!selectedPaymentMethod) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(numAmount, selectedPaymentMethod)
      // Reset form
      setAmount('50')
      setSelectedPaymentMethod('')
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set default payment method on open
  if (open && !selectedPaymentMethod && paymentMethods.length > 0) {
    const defaultMethod = paymentMethods.find((m) => m.is_default) || paymentMethods[0]
    setSelectedPaymentMethod(defaultMethod.id)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
          <DialogDescription>
            Choose an amount to add to your wallet balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="5"
                max="1000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: $5.00 | Maximum: $1,000.00
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant={amount === quickAmount.toString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
              >
                {formatCurrency(quickAmount)}
              </Button>
            ))}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            {paymentMethods.length > 0 ? (
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {method.card_brand} •••• {method.card_last_four}
                        </span>
                        {method.is_default && (
                          <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment methods available. Please add a card first.
              </p>
            )}
          </div>

          {/* Total Display */}
          {amount && parseFloat(amount) > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total to add:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !amount ||
              parseFloat(amount) < 5 ||
              parseFloat(amount) > 1000 ||
              !selectedPaymentMethod ||
              paymentMethods.length === 0
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Add Funds</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}