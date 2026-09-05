ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS product text,
  ADD COLUMN IF NOT EXISTS rules text;