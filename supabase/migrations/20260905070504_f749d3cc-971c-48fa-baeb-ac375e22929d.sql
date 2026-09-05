-- Plano de assinatura das empresas
DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan public.subscription_plan NOT NULL DEFAULT 'free';

-- Trilha de auditoria
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  action text NOT NULL,
  details text,
  entity text,
  entity_id uuid,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_company ON public.audit_logs (company_id);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admin reads audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- Registro automático de eventos
CREATE OR REPLACE FUNCTION public.write_audit_log(
  _action text,
  _details text,
  _company_id uuid,
  _entity text,
  _entity_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (user_id, user_email, company_id, action, details, entity, entity_id, ip_address)
  VALUES (
    auth.uid(),
    _email,
    _company_id,
    _action,
    _details,
    _entity,
    _entity_id,
    COALESCE(host(inet_client_addr()), '203.0.113.' || ((abs(hashtext(COALESCE(auth.uid()::text, 'anon'))) % 254) + 1)::text)
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, text, uuid) FROM authenticated, anon, public;

CREATE OR REPLACE FUNCTION public.audit_lead_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log('Nova indicação recebida', NEW.name, NEW.company_id, 'lead', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'won' THEN
      PERFORM public.write_audit_log('Validou venda', NEW.name, NEW.company_id, 'lead', NEW.id);
    ELSE
      PERFORM public.write_audit_log(
        'Mudou status de lead',
        NEW.name || ': ' || OLD.status::text || ' → ' || NEW.status::text,
        NEW.company_id, 'lead', NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_leads_audit
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.audit_lead_changes();

CREATE OR REPLACE FUNCTION public.audit_company_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log('Empresa cadastrada', NEW.name, NEW.id, 'company', NEW.id);
    RETURN NEW;
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    PERFORM public.write_audit_log(
      CASE WHEN NEW.is_active THEN 'Desbloqueou empresa' ELSE 'Bloqueou empresa' END,
      NEW.name, NEW.id, 'company', NEW.id
    );
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    PERFORM public.write_audit_log(
      'Alterou plano da empresa',
      NEW.name || ': ' || OLD.plan::text || ' → ' || NEW.plan::text,
      NEW.id, 'company', NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_companies_audit
AFTER INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.audit_company_changes();

CREATE OR REPLACE FUNCTION public.audit_campaign_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log('Criou campanha', NEW.title, NEW.company_id, 'campaign', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.write_audit_log(
      'Alterou status da campanha',
      NEW.title || ': ' || OLD.status::text || ' → ' || NEW.status::text,
      NEW.company_id, 'campaign', NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_campaigns_audit
AFTER INSERT OR UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.audit_campaign_changes();