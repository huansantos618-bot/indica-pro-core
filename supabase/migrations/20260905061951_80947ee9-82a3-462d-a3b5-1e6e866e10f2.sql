-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'indicator');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiation', 'won', 'lost');
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.commission_type AS ENUM ('fixed', 'percentage');

-- UPDATED_AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- INDICATORS
CREATE OR REPLACE FUNCTION public.generate_indicator_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE new_code TEXT;
BEGIN
  LOOP
    new_code := 'IND-' || lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.indicators WHERE code = new_code);
  END LOOP;
  RETURN new_code;
END; $$;

CREATE TABLE public.indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.indicators ALTER COLUMN code SET DEFAULT public.generate_indicator_code();
CREATE INDEX idx_indicators_company ON public.indicators(company_id);
CREATE INDEX idx_indicators_user ON public.indicators(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicators TO authenticated;
GRANT ALL ON public.indicators TO service_role;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_my_indicator(_indicator_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.indicators WHERE id = _indicator_id AND user_id = auth.uid());
$$;

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  commission_type public.commission_type NOT NULL DEFAULT 'fixed',
  commission_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_company ON public.campaigns(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  indicator_id UUID REFERENCES public.indicators(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  deal_value NUMERIC(12,2),
  status public.lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_company ON public.leads(company_id);
CREATE INDEX idx_leads_indicator ON public.leads(indicator_id);
CREATE INDEX idx_leads_campaign ON public.leads(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- LEAD STATUS HISTORY
CREATE TABLE public.lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  from_status public.lead_status,
  to_status public.lead_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_history_lead ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_history_company ON public.lead_status_history(company_id);
GRANT SELECT, INSERT ON public.lead_status_history TO authenticated;
GRANT ALL ON public.lead_status_history TO service_role;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- COMMISSIONS
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.commission_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commissions_company ON public.commissions(company_id);
CREATE INDEX idx_commissions_indicator ON public.commissions(indicator_id);
CREATE INDEX idx_commissions_lead ON public.commissions(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- TRIGGERS updated_at
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_indicators_updated BEFORE UPDATE ON public.indicators FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_commissions_updated BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AUTO PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- LEAD STATUS TIMELINE TRIGGER
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_status_history (lead_id, company_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NEW.company_id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_status_history (lead_id, company_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NEW.company_id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_leads_status_history AFTER INSERT OR UPDATE OF status ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();

-- ============ RLS POLICIES ============

-- companies
CREATE POLICY "super admin manages companies" ON public.companies FOR ALL TO authenticated
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "members read own company" ON public.companies FOR SELECT TO authenticated
USING (id = public.current_company_id());
CREATE POLICY "company admin updates own company" ON public.companies FOR UPDATE TO authenticated
USING (id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin'))
WITH CHECK (id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin'));

-- profiles
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "company admin reads company profiles" ON public.profiles FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin'));
CREATE POLICY "super admin reads all profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.is_super_admin());

-- user_roles (read only from client; writes via service role)
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "company admin reads company roles" ON public.user_roles FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin'));
CREATE POLICY "super admin reads all roles" ON public.user_roles FOR SELECT TO authenticated
USING (public.is_super_admin());

-- indicators
CREATE POLICY "company scope indicators" ON public.indicators FOR ALL TO authenticated
USING (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')))
WITH CHECK (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')));
CREATE POLICY "indicator reads own record" ON public.indicators FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- campaigns
CREATE POLICY "company admin manages campaigns" ON public.campaigns FOR ALL TO authenticated
USING (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')))
WITH CHECK (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')));
CREATE POLICY "indicator reads company campaigns" ON public.campaigns FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.indicators i WHERE i.user_id = auth.uid() AND i.company_id = campaigns.company_id));

-- leads
CREATE POLICY "company scope leads" ON public.leads FOR ALL TO authenticated
USING (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')))
WITH CHECK (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')));
CREATE POLICY "indicator reads own leads" ON public.leads FOR SELECT TO authenticated
USING (public.is_my_indicator(indicator_id));
CREATE POLICY "indicator creates own leads" ON public.leads FOR INSERT TO authenticated
WITH CHECK (public.is_my_indicator(indicator_id));

-- lead_status_history
CREATE POLICY "company scope lead history" ON public.lead_status_history FOR SELECT TO authenticated
USING (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')));
CREATE POLICY "indicator reads own lead history" ON public.lead_status_history FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_status_history.lead_id AND public.is_my_indicator(l.indicator_id)));
CREATE POLICY "company admin inserts lead history" ON public.lead_status_history FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')));

-- commissions
CREATE POLICY "company scope commissions" ON public.commissions FOR ALL TO authenticated
USING (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')))
WITH CHECK (public.is_super_admin() OR (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'company_admin')));
CREATE POLICY "indicator reads own commissions" ON public.commissions FOR SELECT TO authenticated
USING (public.is_my_indicator(indicator_id));