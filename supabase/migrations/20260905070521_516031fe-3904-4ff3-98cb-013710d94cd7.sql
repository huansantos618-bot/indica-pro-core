REVOKE EXECUTE ON FUNCTION public.audit_lead_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_company_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_campaign_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, text, uuid) FROM PUBLIC, anon, authenticated;