ALTER TABLE public.companies
  ADD COLUMN legal_name TEXT,
  ADD COLUMN cnpj TEXT UNIQUE;

ALTER TABLE public.indicators
  ADD COLUMN cpf TEXT,
  ALTER COLUMN company_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.unaccent_fallback(_value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(_value,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

CREATE OR REPLACE FUNCTION public.slugify(_value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent_fallback(_value)), '[^a-z0-9]+', '-', 'g'));
$$;

REVOKE EXECUTE ON FUNCTION public.slugify(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unaccent_fallback(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  account_type TEXT := COALESCE(meta ->> 'account_type', 'indicator');
  new_company_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email, meta ->> 'full_name', meta ->> 'phone')
  ON CONFLICT (id) DO NOTHING;

  IF account_type = 'company' THEN
    base_slug := NULLIF(public.slugify(COALESCE(meta ->> 'company_name', 'empresa')), '');
    base_slug := COALESCE(base_slug, 'empresa');
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix::text;
    END LOOP;

    INSERT INTO public.companies (name, legal_name, cnpj, slug, contact_email)
    VALUES (
      COALESCE(meta ->> 'company_name', 'Empresa'),
      meta ->> 'company_name',
      NULLIF(meta ->> 'cnpj', ''),
      final_slug,
      NEW.email
    )
    RETURNING id INTO new_company_id;

    UPDATE public.profiles SET company_id = new_company_id WHERE id = NEW.id;

    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (NEW.id, 'company_admin', new_company_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'indicator')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.indicators (user_id, full_name, email, phone, cpf)
    VALUES (
      NEW.id,
      COALESCE(meta ->> 'full_name', NEW.email),
      NEW.email,
      meta ->> 'phone',
      NULLIF(meta ->> 'cpf', '')
    );
  END IF;

  RETURN NEW;
END; $$;

CREATE POLICY "indicator updates own record" ON public.indicators FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());