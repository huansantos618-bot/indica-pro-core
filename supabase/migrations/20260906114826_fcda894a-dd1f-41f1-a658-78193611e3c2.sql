-- ===== ENUMS (novos) =====
DO $$ BEGIN CREATE TYPE public.profile_status AS ENUM ('pending_approval','active','paused','banned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.document_type AS ENUM ('CPF','CNPJ'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.reward_type AS ENUM ('cash','discount','free_product'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('dinheiro','cartao_credito','cartao_debito','app_delivery_ifood','outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.plan_request_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'starter';

-- ===== ACRÉSCIMOS EM TABELAS BASE =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS role app_role,
  ADD COLUMN IF NOT EXISTS status public.profile_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_type public.document_type,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS category_business TEXT,
  ADD COLUMN IF NOT EXISTS company_code TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE new_code TEXT;
BEGIN
  LOOP
    new_code := 'EMP-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.companies WHERE company_code = new_code);
  END LOOP;
  RETURN new_code;
END; $$;

UPDATE public.companies SET company_code = public.generate_company_code() WHERE company_code IS NULL;
ALTER TABLE public.companies ALTER COLUMN company_code SET DEFAULT public.generate_company_code();
CREATE UNIQUE INDEX IF NOT EXISTS companies_company_code_key ON public.companies (company_code);

-- ===== PRODUTOS / CAMPANHAS =====
CREATE TABLE IF NOT EXISTS public.products_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  commission_value NUMERIC NOT NULL DEFAULT 0,
  commission_type public.reward_type NOT NULL DEFAULT 'cash',
  discount_percentage_per_sale NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  training_video_url TEXT,
  objections_text TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_campaigns TO authenticated;
GRANT SELECT ON public.products_campaigns TO anon;
GRANT ALL ON public.products_campaigns TO service_role;
ALTER TABLE public.products_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa gerencia seus produtos" ON public.products_campaigns FOR ALL TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')))
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE POLICY "produtos ativos publicos" ON public.products_campaigns FOR SELECT TO anon, authenticated USING (is_active);
CREATE TRIGGER trg_products_campaigns_updated BEFORE UPDATE ON public.products_campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS products_campaigns_company_idx ON public.products_campaigns (company_id);

-- ===== CURRÍCULO DA EMPRESA =====
CREATE TABLE IF NOT EXISTS public.company_curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  about_us_text TEXT,
  mission_vision_values TEXT,
  founded_year INTEGER,
  training_video_url TEXT,
  sales_script TEXT,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  support_material_links TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_curriculum TO authenticated;
GRANT SELECT ON public.company_curriculum TO anon;
GRANT ALL ON public.company_curriculum TO service_role;
ALTER TABLE public.company_curriculum ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa gerencia curriculo" ON public.company_curriculum FOR ALL TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')))
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE POLICY "curriculo publico" ON public.company_curriculum FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER trg_company_curriculum_updated BEFORE UPDATE ON public.company_curriculum FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== CAIXA DA LOJA =====
CREATE TABLE IF NOT EXISTS public.company_cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT current_date,
  payment_method public.payment_method NOT NULL DEFAULT 'dinheiro',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_cash_register TO authenticated;
GRANT ALL ON public.company_cash_register TO service_role;
ALTER TABLE public.company_cash_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa gerencia caixa" ON public.company_cash_register FOR ALL TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')))
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE TRIGGER trg_company_cash_register_updated BEFORE UPDATE ON public.company_cash_register FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS company_cash_register_company_date_idx ON public.company_cash_register (company_id, sale_date DESC);

-- ===== LEADS: ACRÉSCIMOS =====
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_given BOOLEAN NOT NULL DEFAULT false;

-- ===== CONFIGURAÇÕES DO SISTEMA =====
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_pix_key TEXT,
  admin_whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos leem configuracoes" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin gerencia configuracoes" ON public.system_settings FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE TRIGGER trg_system_settings_updated BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== PEDIDOS DE NOVA FOTO =====
CREATE TABLE IF NOT EXISTS public.indicator_photo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicator_photo_requests TO authenticated;
GRANT ALL ON public.indicator_photo_requests TO service_role;
ALTER TABLE public.indicator_photo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin gerencia pedidos de foto" ON public.indicator_photo_requests FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "indicador ve seus pedidos de foto" ON public.indicator_photo_requests FOR SELECT TO authenticated
  USING (is_my_indicator(indicator_id));

-- ===== PEDIDOS DE PLANO =====
CREATE TABLE IF NOT EXISTS public.company_plan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_code TEXT,
  requested_plan public.subscription_plan NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status public.plan_request_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_plan_requests TO authenticated;
GRANT ALL ON public.company_plan_requests TO service_role;
ALTER TABLE public.company_plan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa cria e ve seus pedidos" ON public.company_plan_requests FOR ALL TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')))
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE TRIGGER trg_company_plan_requests_updated BEFORE UPDATE ON public.company_plan_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== MOVIMENTAÇÃO DE ESTOQUE =====
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products_campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  quantity_delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa ve estoque" ON public.inventory_movements FOR SELECT TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE POLICY "empresa registra estoque" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));

-- ===== VENDAS DO CANAL INDICAPRO =====
CREATE TABLE IF NOT EXISTS public.indica_pro_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products_campaigns(id) ON DELETE SET NULL,
  indicator_id UUID REFERENCES public.indicators(id) ON DELETE SET NULL,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  reward_type public.reward_type NOT NULL DEFAULT 'cash',
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indica_pro_sales TO authenticated;
GRANT ALL ON public.indica_pro_sales TO service_role;
ALTER TABLE public.indica_pro_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa gerencia vendas indicapro" ON public.indica_pro_sales FOR ALL TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')))
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE POLICY "indicador ve suas vendas" ON public.indica_pro_sales FOR SELECT TO authenticated
  USING (is_my_indicator(indicator_id));
CREATE INDEX IF NOT EXISTS indica_pro_sales_company_idx ON public.indica_pro_sales (company_id, sold_at DESC);

-- ===== BASE DE REMARKETING =====
CREATE TABLE IF NOT EXISTS public.remarketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  indicator_id UUID REFERENCES public.indicators(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products_campaigns(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.remarketing_leads TO authenticated;
GRANT ALL ON public.remarketing_leads TO service_role;
ALTER TABLE public.remarketing_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa ve base de remarketing" ON public.remarketing_leads FOR ALL TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')))
  WITH CHECK (is_super_admin() OR (company_id = current_company_id() AND has_role(auth.uid(),'company_admin')));
CREATE POLICY "indicador ve seus clientes capturados" ON public.remarketing_leads FOR SELECT TO authenticated
  USING (is_my_indicator(indicator_id));
CREATE INDEX IF NOT EXISTS remarketing_leads_company_idx ON public.remarketing_leads (company_id, created_at DESC);