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
-- Drop any existing check constraint on subscription_status and re-add with "comped" included
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE c.conrelid = 'businesses'::regclass
    AND c.contype = 'c'
    AND a.attname = 'subscription_status'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE businesses DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;
