-- Stripe Connect: Add columns to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS online_payments_enabled BOOLEAN DEFAULT FALSE;

-- Stripe Connect: Add payment tracking columns to invoice_payments
ALTER TABLE invoice_payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;

-- Unique index to prevent duplicate payment records from webhook retries
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_payments_stripe_pi
  ON invoice_payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
