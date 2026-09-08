-- Enum: novas opções de recompensa (aditivo)
ALTER TYPE public.reward_type ADD VALUE IF NOT EXISTS 'gift';
ALTER TYPE public.reward_type ADD VALUE IF NOT EXISTS 'store_discount';
ALTER TYPE public.reward_type ADD VALUE IF NOT EXISTS 'product_discount';

-- Produtos: novos campos (aditivo)
ALTER TABLE public.products_campaigns
  ADD COLUMN IF NOT EXISTS reward_type public.reward_type NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS reward_description text,
  ADD COLUMN IF NOT EXISTS product_condition text NOT NULL DEFAULT 'Novo na caixa';

-- Categorias personalizadas por empresa
CREATE TABLE IF NOT EXISTS public.company_custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, category_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_custom_categories TO authenticated;
GRANT ALL ON public.company_custom_categories TO service_role;

ALTER TABLE public.company_custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa gerencia suas categorias"
ON public.company_custom_categories FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_super_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin());

CREATE POLICY "Indicadores veem categorias"
ON public.company_custom_categories FOR SELECT TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_custom_categories_company ON public.company_custom_categories(company_id);