import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus } from "@/types/database";

/** Fases que a empresa pode usar no funil de indicações. */
export const COMPANY_LEAD_PHASES = [
  "new",
  "contacted",
  "negotiation",
  "won",
  "lost",
] as const satisfies readonly LeadStatus[];

export type CompanyLeadPhase = (typeof COMPANY_LEAD_PHASES)[number];

export const LEAD_PHASE_LABELS: Record<LeadStatus, string> = {
  new: "Recebido",
  contacted: "Em Análise",
  qualified: "Em Análise",
  negotiation: "Processo Comercial",
  won: "Venda Validada",
  lost: "Não Convertido",
};

export const LEAD_PHASE_TONE: Record<CompanyLeadPhase, string> = {
  new: "bg-sky-100 text-sky-800 border-sky-200",
  contacted: "bg-amber-100 text-amber-800 border-amber-200",
  negotiation: "bg-violet-100 text-violet-800 border-violet-200",
  won: "bg-emerald-100 text-emerald-800 border-emerald-200",
  lost: "bg-rose-100 text-rose-800 border-rose-200",
};

export function toPhase(status: LeadStatus): CompanyLeadPhase {
  return status === "qualified" ? "contacted" : status;
}

export function formatBRL(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Empresa do usuário logado (via profiles.company_id). */
export async function fetchMyCompany() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.company_id) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .maybeSingle();

  return company ?? null;
}

export const companyQueryKey = ["my-company"] as const;
