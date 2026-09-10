-- Colunas públicas seguras das empresas
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (id, name, slug, city, state, category_business, logo_url, is_active, company_code) ON public.companies TO anon;

CREATE POLICY "empresas ativas publicas" ON public.companies
FOR SELECT TO anon USING (is_active);

-- Colunas públicas seguras dos indicadores (apenas para validar o código do link)
REVOKE SELECT ON public.indicators FROM anon;
GRANT SELECT (id, code, full_name, company_id, is_active) ON public.indicators TO anon;

CREATE POLICY "indicadores ativos publicos" ON public.indicators
FOR SELECT TO anon USING (is_active);

-- Captura pública de indicações
GRANT INSERT ON public.leads TO anon;
CREATE POLICY "captura publica de leads" ON public.leads
FOR INSERT TO anon WITH CHECK (status = 'new'::lead_status);

GRANT INSERT ON public.remarketing_leads TO anon;
CREATE POLICY "captura publica de remarketing" ON public.remarketing_leads
FOR INSERT TO anon WITH CHECK (true);