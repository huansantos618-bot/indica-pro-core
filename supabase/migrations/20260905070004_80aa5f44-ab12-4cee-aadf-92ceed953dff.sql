-- Vitrine: indicador vê campanhas ativas de qualquer empresa
CREATE POLICY "indicator reads active campaigns"
ON public.campaigns
FOR SELECT
TO authenticated
USING (status = 'active'::campaign_status AND public.has_role(auth.uid(), 'indicator'::app_role));

-- Indicador vê empresas ativas (nome/logo) para exibir na vitrine
CREATE POLICY "indicator reads active companies"
ON public.companies
FOR SELECT
TO authenticated
USING (is_active AND public.has_role(auth.uid(), 'indicator'::app_role));

-- Indicador edita os próprios leads enquanto ainda não foram trabalhados pela empresa
CREATE POLICY "indicator updates own new leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_my_indicator(indicator_id) AND status = 'new'::lead_status)
WITH CHECK (public.is_my_indicator(indicator_id) AND status = 'new'::lead_status);