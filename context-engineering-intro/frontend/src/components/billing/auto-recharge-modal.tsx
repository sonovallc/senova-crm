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
import { Switch } from '@/components/ui/switch'
import { DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AutoRechargeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (settings: {
    auto_recharge_enabled: boolean
    auto_recharge_threshold?: number
    auto_recharge_amount?: number
  }) => Promise<void>
  currentSettings: {
    enabled: boolean
    threshold: number
    amount: number
  }
}

export function AutoRechargeModal({
  open,
  onClose,
  onSubmit,
  currentSettings,
}: AutoRechargeModalProps) {
  const [enabled, setEnabled] = useState(currentSettings.enabled)
  const [threshold, setThreshold] = useState(currentSettings.threshold.toString())
  const [amount, setAmount] = useState(currentSettings.amount.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        auto_recharge_enabled: enabled,
        auto_recharge_threshold: enabled ? parseFloat(threshold) : undefined,
        auto_recharge_amount: enabled ? parseFloat(amount) : undefined,
      })
      onClose()
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Auto-Recharge Settings</DialogTitle>
          <DialogDescription>
            Configure automatic wallet recharge when your balance runs low
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-recharge">Enable Auto-Recharge</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add funds when balance is low
              </p>
            </div>
            <Switch
              id="auto-recharge"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              {/* Threshold Amount */}
              <div className="space-y-2">
                <Label htmlFor="threshold">
                  Recharge when balance drops below
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="threshold"
                    type="number"
                    min="5"
                    max="100"
                    step="1"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="pl-9"
                    placeholder="10.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: $5.00 | Maximum: $100.00
                </p>
              </div>

              {/* Recharge Amount */}
              <div className="space-y-2">
                <Label htmlFor="recharge-amount">Amount to add</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="recharge-amount"
                    type="number"
                    min="10"
                    max="500"
                    step="5"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9"
                    placeholder="50.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: $10.00 | Maximum: $500.00
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm">
                  When your balance drops below{' '}
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(threshold) || 0)}
                  </span>
                  , we'll automatically add{' '}
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(amount) || 0)}
                  </span>{' '}
                  to your wallet using your default payment method.
                </p>
              </div>
            </>
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
              (enabled &&
                (!threshold ||
                  !amount ||
                  parseFloat(threshold) < 5 ||
                  parseFloat(threshold) > 100 ||
                  parseFloat(amount) < 10 ||
                  parseFloat(amount) > 500))
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Settings</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}