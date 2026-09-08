import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RewardType = Database["public"]["Enums"]["reward_type"];

export const REWARD_LABELS: Record<string, string> = {
  cash: "Comissão em Pix",
  gift: "Brinde",
  store_discount: "Desconto na loja",
  product_discount: "Desconto no produto",
  discount: "Desconto acumulado",
  free_product: "Produto grátis",
};

export const REWARD_OPTIONS = [
  { value: "cash", label: "Comissão em Pix (dinheiro)" },
  { value: "gift", label: "Brinde para o indicador" },
  { value: "store_discount", label: "Desconto na loja" },
  { value: "product_discount", label: "Desconto no produto" },
] as const;

export const PRODUCT_CONDITIONS = ["Novo na caixa", "Seminovo", "Usado"] as const;

/** Limites por plano (indicadores e produtos ativos). */
export const PLAN_LIMITS = {
  free: { products: 1, indicators: 5 },
  starter: { products: 5, indicators: Infinity },
  pro: { products: Infinity, indicators: Infinity },
  enterprise: { products: Infinity, indicators: Infinity },
} as const;

export function planLimits(plan: string | null | undefined) {
  return PLAN_LIMITS[(plan ?? "free") as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
}

export function limitLabel(value: number) {
  return value === Infinity ? "ilimitado" : String(value);
}

export const catalogQueryKey = ["marketplace-products"] as const;

export type CatalogItem = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  reward_type: string;
  reward_description: string | null;
  product_condition: string;
  commission_value: number;
  company_id: string;
  company: { name: string; city: string | null; state: string | null; category_business: string | null; slug: string } | null;
};

/** Vitrine global: produtos ativos de todas as empresas. */
export async function fetchCatalog(): Promise<CatalogItem[]> {
  const { data } = await supabase
    .from("products_campaigns")
    .select(
      "id,title,description,price,image_url,stock_quantity,reward_type,reward_description,product_condition,commission_value,company_id,companies(name,city,state,category_business,slug)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const { companies, ...rest } = row as Record<string, unknown> & { companies: unknown };
    return { ...(rest as Omit<CatalogItem, "company">), company: (companies as CatalogItem["company"]) ?? null };
  });
}
