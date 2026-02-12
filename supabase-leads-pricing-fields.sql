-- ========================================
-- ArchaFlow Leads: Add Pricing Fields
-- Square footage, cost per sq ft, discount
-- ========================================
-- Run this in Supabase SQL Editor.
-- ========================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS square_footage NUMERIC(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cost_per_sqft NUMERIC(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IS NULL OR discount_type IN ('percent', 'fixed'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2);
