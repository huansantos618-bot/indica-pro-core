CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  account_type TEXT := COALESCE(meta ->> 'account_type', 'indicator');
  new_company_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name, phone, avatar_url, role, status)
  VALUES (
    NEW.id, NEW.id, NEW.email, meta ->> 'full_name', meta ->> 'phone', NULLIF(meta ->> 'avatar_url',''),
    CASE WHEN account_type = 'company' THEN 'company_admin'::app_role ELSE 'indicator'::app_role END,
    CASE WHEN account_type = 'company' THEN 'active'::profile_status ELSE 'pending_approval'::profile_status END
  )
  ON CONFLICT (id) DO NOTHING;

  IF account_type = 'company' THEN
    base_slug := NULLIF(public.slugify(COALESCE(meta ->> 'company_name', 'empresa')), '');
    base_slug := COALESCE(base_slug, 'empresa');
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix::text;
    END LOOP;

    INSERT INTO public.companies (
      name, legal_name, cnpj, slug, contact_email, owner_id,
      document_type, document_number, category_business, country, state, city, plan
    )
    VALUES (
      COALESCE(meta ->> 'company_name', 'Empresa'),
      meta ->> 'company_name',
      NULLIF(meta ->> 'cnpj', ''),
      final_slug,
      NEW.email,
      NEW.id,
      NULLIF(meta ->> 'document_type','')::document_type,
      NULLIF(meta ->> 'document_number',''),
      NULLIF(meta ->> 'category_business',''),
      COALESCE(NULLIF(meta ->> 'country',''), 'Brasil'),
      NULLIF(meta ->> 'state',''),
      NULLIF(meta ->> 'city',''),
      'free'
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
END; $function$;