"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({
  amount,
  invoiceNumber,
  onSuccess,
  onError,
}: {
  amount: number
  invoiceNumber: string
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href + "?payment=success",
        },
        redirect: "if_required",
      })

      if (error) {
        onError(error.message || "Payment failed")
      } else {
        onSuccess()
      }
    } catch (err: any) {
      onError(err.message || "Payment failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : null}
        Pay ${amount.toFixed(2)}
      </Button>
    </form>
  )
}

export function StripePaymentForm({
  clientSecret,
  amount,
  invoiceNumber,
  onSuccess,
  onError,
}: {
  clientSecret: string
  amount: number
  invoiceNumber: string
  onSuccess: () => void
  onError: (message: string) => void
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#000000",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm
        amount={amount}
        invoiceNumber={invoiceNumber}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
