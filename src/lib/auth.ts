import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/database";

export type AccountType = "company" | "indicator";

export const ROLE_HOME: Record<AppRole, "/company/dashboard" | "/indicator/dashboard"> = {
  super_admin: "/company/dashboard",
  company_admin: "/company/dashboard",
  indicator: "/indicator/dashboard",
};

/** Lê o papel principal do usuário logado. */
export async function fetchPrimaryRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data?.length) return null;
  const roles = data.map((r) => r.role as AppRole);
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("company_admin")) return "company_admin";
  return roles[0] ?? null;
}

export async function resolveHomePath(userId: string) {
  const role = await fetchPrimaryRole(userId);
  return ROLE_HOME[role ?? "indicator"];
}

/** Sai da conta limpando o estado local. */
export async function signOut() {
  await supabase.auth.signOut();
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
