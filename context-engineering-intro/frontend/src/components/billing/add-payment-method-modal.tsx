'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { useCreateSetupIntent, useAddPaymentMethod } from '@/lib/queries/wallet'
import { useToast } from '@/hooks/use-toast'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface AddPaymentMethodModalProps {
  open: boolean
  onClose: () => void
  walletId: string
}

export function AddPaymentMethodModal({
  open,
  onClose,
  walletId,
}: AddPaymentMethodModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a credit or debit card to your wallet
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <AddPaymentMethodForm walletId={walletId} onSuccess={onClose} onCancel={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}

interface AddPaymentMethodFormProps {
  walletId: string
  onSuccess: () => void
  onCancel: () => void
}

function AddPaymentMethodForm({
  walletId,
  onSuccess,
  onCancel,
}: AddPaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const createSetupIntent = useCreateSetupIntent()
  const addPaymentMethod = useAddPaymentMethod()

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      // Step 1: Create SetupIntent on backend
      const { client_secret } = await createSetupIntent.mutateAsync(walletId)

      // Step 2: Get card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Step 3: Confirm SetupIntent with Stripe
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (!setupIntent?.payment_method) {
        throw new Error('Payment method not created')
      }

      // Step 4: Add payment method to wallet on backend
      await addPaymentMethod.mutateAsync({
        walletId,
        paymentMethodId: setupIntent.payment_method as string,
      })

      toast({
        title: 'Success',
        description: 'Payment method added successfully',
      })

      onSuccess()
    } catch (err: any) {
      console.error('Error adding payment method:', err)
      setError(err.message || 'Failed to add payment method')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      {/* Card Element */}
      <div className="space-y-2">
        <div className="rounded-lg border p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Your card information is securely processed by Stripe
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <div className="rounded-lg bg-muted p-3">
        <div className="flex items-start gap-2">
          <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Secure Payment</p>
            <p className="text-xs text-muted-foreground">
              We use Stripe for secure payment processing. Your card details are never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Add Card</>
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}