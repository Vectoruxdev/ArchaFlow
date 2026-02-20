-- Billing overrides table for admin audit trail
CREATE TABLE IF NOT EXISTS billing_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'discount_applied', 'discount_removed',
    'comp_applied', 'comp_removed',
    'tier_changed'
  )),
  details JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  performed_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_overrides_business ON billing_overrides(business_id);
CREATE INDEX idx_billing_overrides_active ON billing_overrides(business_id, is_active);

-- Allow "comped" as a valid subscription_status
-- (No constraint change needed if subscription_status is a TEXT column without CHECK constraint)
-- If there IS a check constraint, uncomment and adapt:
-- ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_subscription_status_check;
-- ALTER TABLE businesses ADD CONSTRAINT businesses_subscription_status_check
--   CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'none', 'comped'));
