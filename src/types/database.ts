/**
 * IndicaPro — tipos de domínio derivados do schema do banco.
 * A fonte da verdade é src/integrations/supabase/types.ts (gerado automaticamente).
 */
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type AppRole = Enums["app_role"]; // 'super_admin' | 'company_admin' | 'indicator'
export type LeadStatus = Enums["lead_status"];
export type CommissionStatus = Enums["commission_status"];
export type CampaignStatus = Enums["campaign_status"];
export type CommissionType = Enums["commission_type"];

export type Company = Tables["companies"]["Row"];
export type CompanyInsert = Tables["companies"]["Insert"];
export type CompanyUpdate = Tables["companies"]["Update"];

export type Profile = Tables["profiles"]["Row"];
export type ProfileInsert = Tables["profiles"]["Insert"];
export type ProfileUpdate = Tables["profiles"]["Update"];

export type UserRole = Tables["user_roles"]["Row"];

export type Indicator = Tables["indicators"]["Row"];
export type IndicatorInsert = Tables["indicators"]["Insert"];
export type IndicatorUpdate = Tables["indicators"]["Update"];

export type Campaign = Tables["campaigns"]["Row"];
export type CampaignInsert = Tables["campaigns"]["Insert"];
export type CampaignUpdate = Tables["campaigns"]["Update"];

export type Lead = Tables["leads"]["Row"];
export type LeadInsert = Tables["leads"]["Insert"];
export type LeadUpdate = Tables["leads"]["Update"];

export type LeadStatusHistory = Tables["lead_status_history"]["Row"];

export type Commission = Tables["commissions"]["Row"];
export type CommissionInsert = Tables["commissions"]["Insert"];
export type CommissionUpdate = Tables["commissions"]["Update"];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  negotiation: "Em negociação",
  won: "Ganho",
  lost: "Perdido",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  paid: "Paga",
  cancelled: "Cancelada",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  archived: "Arquivada",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Administrador da plataforma",
  company_admin: "Administrador da empresa",
  indicator: "Indicador",
};
