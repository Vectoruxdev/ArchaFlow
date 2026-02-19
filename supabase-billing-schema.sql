-- ArchaFlow Billing Schema Migration
-- Adds billing/subscription columns to businesses table and creates supporting tables

-- 1. Add billing columns to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  ADD COLUMN IF NOT EXISTS seat_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS included_seats INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_limit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 2. Subscription events audit log
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_business
  ON subscription_events(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created
  ON subscription_events(created_at DESC);

-- 3. AI credit usage tracking
CREATE TABLE IF NOT EXISTS ai_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  feature TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_usage_business
  ON ai_credit_usage(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_usage_created
  ON ai_credit_usage(created_at DESC);

-- 4. Helper function: count seats (user_roles) for a business
CREATE OR REPLACE FUNCTION count_business_seats(bid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM user_roles WHERE business_id = bid;
$$ LANGUAGE SQL STABLE;

-- 5. Helper function: get plan limits as JSONB
CREATE OR REPLACE FUNCTION get_plan_limits(tier TEXT)
RETURNS JSONB AS $$
  SELECT CASE tier
    WHEN 'free' THEN jsonb_build_object(
      'max_projects', 50,
      'max_seats', 1,
      'included_seats', 1,
      'storage_gb', 1,
      'ai_credits', 0,
      'has_ai', false,
      'has_sso', false,
      'has_api', false
    )
    WHEN 'pro' THEN jsonb_build_object(
      'max_projects', -1,
      'max_seats', -1,
      'included_seats', 3,
      'storage_gb', 100,
      'ai_credits', 500,
      'has_ai', true,
      'has_sso', false,
      'has_api', false
    )
    WHEN 'enterprise' THEN jsonb_build_object(
      'max_projects', -1,
      'max_seats', -1,
      'included_seats', 10,
      'storage_gb', -1,
      'ai_credits', 2000,
      'has_ai', true,
      'has_sso', true,
      'has_api', true
    )
    ELSE jsonb_build_object(
      'max_projects', 50,
      'max_seats', 1,
      'included_seats', 1,
      'storage_gb', 1,
      'ai_credits', 0,
      'has_ai', false,
      'has_sso', false,
      'has_api', false
    )
  END;
$$ LANGUAGE SQL IMMUTABLE;

-- 6. RLS policies for new tables
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_usage ENABLE ROW LEVEL SECURITY;

-- subscription_events: members can read their own workspace events
CREATE POLICY "Members can view subscription events"
  ON subscription_events FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- ai_credit_usage: members can read their own workspace usage
CREATE POLICY "Members can view AI credit usage"
  ON ai_credit_usage FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );
