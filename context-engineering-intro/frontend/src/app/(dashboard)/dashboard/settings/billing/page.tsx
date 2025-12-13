'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import {
  useWallet,
  useWalletTransactions,
  usePaymentMethods,
  useFundWallet,
  useUpdateWalletSettings,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
} from '@/lib/queries/wallet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CreditCard, Plus, DollarSign, TrendingUp, Settings, Trash2, Star } from 'lucide-react'
import { AddFundsModal } from '@/components/billing/add-funds-modal'
import { AutoRechargeModal } from '@/components/billing/auto-recharge-modal'
import { AddPaymentMethodModal } from '@/components/billing/add-payment-method-modal'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function BillingPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showAutoRecharge, setShowAutoRecharge] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

  // For now, use user-based wallet. Later can add object-based billing
  const ownerType = 'user'
  const ownerId = user?.id || ''

  // Queries
  const { data: wallet, isLoading: walletLoading } = useWallet(ownerType, ownerId)
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions(
    ownerType,
    ownerId,
    { limit: 10 }
  )
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods(wallet?.id || '')

  // Mutations
  const fundWallet = useFundWallet()
  const updateWalletSettings = useUpdateWalletSettings()
  const deletePaymentMethod = useDeletePaymentMethod()
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod()

  const handleAddFunds = async (amount: number, paymentMethodId: string) => {
    try {
      await fundWallet.mutateAsync({
        ownerType,
        ownerId,
        data: { amount, payment_method_id: paymentMethodId },
      })
      toast({
        title: 'Success',
        description: `Added ${formatCurrency(amount)} to your wallet`,
      })
      setShowAddFunds(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to add funds',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateAutoRecharge = async (settings: {
    auto_recharge_enabled: boolean
    auto_recharge_threshold?: number
    auto_recharge_amount?: number
  }) => {
    try {
      await updateWalletSettings.mutateAsync({
        ownerType,
        ownerId,
        data: settings,
      })
      toast({
        title: 'Success',
        description: 'Auto-recharge settings updated',
      })
      setShowAutoRecharge(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update settings',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      await deletePaymentMethod.mutateAsync({
        paymentMethodId,
        walletId: wallet?.id || '',
      })
      toast({
        title: 'Success',
        description: 'Payment method removed',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to remove payment method',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethod.mutateAsync({
        paymentMethodId,
        walletId: wallet?.id || '',
      })
      toast({
        title: 'Success',
        description: 'Default payment method updated',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to set default',
        variant: 'destructive',
      })
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your wallet, payment methods, and usage
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl space-y-6">
          {/* Wallet Balance Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-senova-purple-600" />
                  <CardTitle>Wallet Balance</CardTitle>
                </div>
                <Button onClick={() => setShowAddFunds(true)} disabled={!wallet}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Funds
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {walletLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : wallet ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {formatCurrency(parseFloat(wallet.balance))}
                    </span>
                    <span className="text-lg text-muted-foreground">{wallet.currency}</span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-Recharge</span>
                      <div className="flex items-center gap-2">
                        {wallet.auto_recharge_enabled ? (
                          <Badge variant="success">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAutoRecharge(true)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {wallet.auto_recharge_enabled && (
                      <p className="text-sm text-muted-foreground">
                        When balance drops below {formatCurrency(parseFloat(wallet.auto_recharge_threshold))},
                        add {formatCurrency(parseFloat(wallet.auto_recharge_amount))}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No wallet found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-senova-purple-600" />
                  <CardTitle>Payment Methods</CardTitle>
                </div>
                <Button onClick={() => setShowAddPayment(true)} disabled={!wallet}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Card
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : paymentMethods && paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {method.card_brand} •••• {method.card_last_four}
                            </span>
                            {method.is_default && (
                              <Badge variant="default" className="text-xs">
                                <Star className="mr-1 h-3 w-3" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Expires {method.card_exp_month}/{method.card_exp_year}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payment methods added</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddPayment(true)}
                    disabled={!wallet}
                  >
                    Add Your First Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Pricing Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-senova-purple-600" />
                <CardTitle>Usage Pricing</CardTitle>
              </div>
              <CardDescription>Current rates for SMS and phone services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">SMS Messages</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outbound SMS</span>
                    <span>$0.0079 per segment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inbound SMS</span>
                    <span>$0.0075 per segment</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">MMS Messages</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outbound MMS</span>
                    <span>$0.02 per message</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inbound MMS</span>
                    <span>$0.01 per message</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Phone Numbers</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Local Number</span>
                    <span>$1.15 per month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toll-Free</span>
                    <span>$2.00 per month</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  ℹ️ Prices include all carrier fees and surcharges
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="link" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            transaction.transaction_type === 'credit'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.transaction_type === 'credit' ? '+' : '-'}
                          {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(parseFloat(transaction.balance_after))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {wallet && (
        <>
          <AddFundsModal
            open={showAddFunds}
            onClose={() => setShowAddFunds(false)}
            onSubmit={handleAddFunds}
            paymentMethods={paymentMethods || []}
          />
          <AutoRechargeModal
            open={showAutoRecharge}
            onClose={() => setShowAutoRecharge(false)}
            onSubmit={handleUpdateAutoRecharge}
            currentSettings={{
              enabled: wallet.auto_recharge_enabled,
              threshold: parseFloat(wallet.auto_recharge_threshold),
              amount: parseFloat(wallet.auto_recharge_amount),
            }}
          />
          <AddPaymentMethodModal
            open={showAddPayment}
            onClose={() => setShowAddPayment(false)}
            walletId={wallet.id}
          />
        </>
      )}
    </div>
  )
}