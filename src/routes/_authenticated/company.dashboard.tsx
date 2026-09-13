import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, Users, Wallet, TrendingUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COMPANY_LEAD_PHASES,
  LEAD_PHASE_LABELS,
  formatBRL,
  toPhase,
} from "@/lib/company";
import type { LeadStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/company/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel da empresa — IndicaPro" },
      {
        name: "description",
        content: "Acompanhe produtos publicados, indicações e comissões do seu Marketplace.",
      },
      { property: "og:title", content: "Painel da empresa — IndicaPro" },
      {
        property: "og:description",
        content: "Acompanhe produtos publicados, indicações e comissões do seu Marketplace.",
      },
    ],
  }),
  component: CompanyDashboard,
});

async function fetchOverview() {
  const [products, leads, commissions] = await Promise.all([
    supabase.from("products_campaigns").select("id,is_active"),
    supabase.from("leads").select("id,status,deal_value"),
    supabase.from("commissions").select("amount,status"),
  ]);

  const leadRows = leads.data ?? [];
  const byPhase = COMPANY_LEAD_PHASES.map((phase) => ({
    phase,
    count: leadRows.filter((l) => toPhase(l.status as LeadStatus) === phase).length,
  }));

  return {
    activeProducts: (products.data ?? []).filter((product) => product.is_active).length,
    totalLeads: leadRows.length,
    wonValue: leadRows
      .filter((l) => l.status === "won")
      .reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0),
    pendingCommissions: (commissions.data ?? [])
      .filter((c) => c.status !== "paid" && c.status !== "cancelled")
      .reduce((sum, c) => sum + Number(c.amount ?? 0), 0),
    byPhase,
  };
}

function CompanyDashboard() {
  const { data } = useQuery({ queryKey: ["company-overview"], queryFn: fetchOverview });

  const cards = [
    { label: "Produtos publicados", value: String(data?.activeProducts ?? 0), icon: Store },
    { label: "Leads recebidos", value: String(data?.totalLeads ?? 0), icon: Users },
    { label: "Vendas validadas", value: formatBRL(data?.wonValue), icon: TrendingUp },
    { label: "Comissões a pagar", value: formatBRL(data?.pendingCommissions), icon: Wallet },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Início</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral dos seus produtos e indicações no Marketplace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil de indicações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(data?.byPhase ?? []).map(({ phase, count }) => (
            <div key={phase} className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {LEAD_PHASE_LABELS[phase]}
              </p>
              <p className="mt-1 text-xl font-semibold">{count}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
