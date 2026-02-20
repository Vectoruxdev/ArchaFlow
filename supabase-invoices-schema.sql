-- ============================================================
-- Invoicing System Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop old skeleton table if it exists
DROP TABLE IF EXISTS project_invoices CASCADE;

-- ============================================================
-- 1. invoice_settings (per business defaults)
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  default_payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  footer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- ============================================================
-- 2. invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','viewed','partially_paid','paid','overdue','void')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  issue_date DATE,
  due_date DATE,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  internal_notes TEXT,
  viewing_token UUID UNIQUE,
  token_expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, invoice_number)
);

-- ============================================================
-- 3. invoice_line_items
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. invoice_payments
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'other'
    CHECK (payment_method IN ('check','bank_transfer','credit_card','cash','other')),
  reference_number TEXT,
  notes TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. invoice_change_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  change_order_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_viewing_token ON invoices(viewing_token);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_change_orders_invoice_id ON invoice_change_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_settings_business_id ON invoice_settings(business_id);

-- ============================================================
-- RLS Policies (dev-friendly — same pattern as existing tables)
-- ============================================================
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_change_orders ENABLE ROW LEVEL SECURITY;

-- invoice_settings
CREATE POLICY "Allow all for authenticated users" ON invoice_settings
  FOR ALL USING (true) WITH CHECK (true);

-- invoices
CREATE POLICY "Allow all for authenticated users" ON invoices
  FOR ALL USING (true) WITH CHECK (true);

-- invoice_line_items
CREATE POLICY "Allow all for authenticated users" ON invoice_line_items
  FOR ALL USING (true) WITH CHECK (true);

-- invoice_payments
CREATE POLICY "Allow all for authenticated users" ON invoice_payments
  FOR ALL USING (true) WITH CHECK (true);

-- invoice_change_orders
CREATE POLICY "Allow all for authenticated users" ON invoice_change_orders
  FOR ALL USING (true) WITH CHECK (true);
