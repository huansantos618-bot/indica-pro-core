export const COUNTRIES = ["Brasil", "Portugal", "Estados Unidos", "Outro"] as const;

export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const BUSINESS_CATEGORIES = [
  "Alimentação / Restaurante",
  "Supermercado",
  "Vestuário",
  "Beleza e Estética",
  "Saúde",
  "Educação",
  "Serviços",
  "Tecnologia",
  "Imobiliário",
  "Outros",
] as const;

/** Categorias que vendem por aplicativo de delivery. */
export const DELIVERY_CATEGORIES = ["Alimentação / Restaurante", "Supermercado"];

export const PLANS = {
  free: { label: "Plano Gratuito", price: 0, products: 1, indicators: 5 },
  starter: { label: "Plano Starter", price: 59.9, products: 5, indicators: 20 },
  pro: { label: "Plano Pro", price: 299.9, products: Infinity, indicators: Infinity },
} as const;

export type PlanKey = keyof typeof PLANS;

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}
