REVOKE EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_campaign_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_company_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_lead_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_lead_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;