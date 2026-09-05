import { supabase } from "@/integrations/supabase/client";

export const indicatorQueryKey = ["my-indicator"] as const;

/** Registro do indicador logado. */
export async function fetchMyIndicator() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from("indicators")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

/** Link de divulgação com o código exclusivo do indicador. */
export function buildReferralLink(code: string, campaignId?: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const params = new URLSearchParams({ ref: code });
  if (campaignId) params.set("camp", campaignId);
  return `${origin}/?${params.toString()}`;
}
