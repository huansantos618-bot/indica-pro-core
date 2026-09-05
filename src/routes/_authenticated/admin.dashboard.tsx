import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, Users, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/company";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Visão geral global — IndicaPro Admin" },
      {
        name: "description",
        content: "Indicadores globais da plataforma: empresas, indicadores, leads e vendas validadas.",
      },
      { property: "og:title", content: "Visão geral global — IndicaPro Admin" },
      {
        property: "og:description",
        content: "Indicadores globais da plataforma: empresas, indicadores, leads e vendas validadas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [companies, indicators, leads, won, commissions] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("indicators").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "won"),
        supabase.from("commissions").select("amount"),
      ]);

      const volume = (commissions.data ?? []).reduce(
        (total, c) => total + Number(c.amount ?? 0),
        0,
      );

      return {
        companies: companies.count ?? 0,
        indicators: indicators.count ?? 0,
        leads: leads.count ?? 0,
        won: won.count ?? 0,
        volume,
      };
    },
  });

  const cards = [
    { label: "Empresas cadastradas", value: data?.companies ?? 0, icon: Building2 },
    { label: "Indicadores", value: data?.indicators ?? 0, icon: UsersRound },
    { label: "Leads gerados", value: data?.leads ?? 0, icon: Users },
    { label: "Vendas validadas", value: data?.won ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Visão geral da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Números consolidados de todos os tenants do IndicaPro.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{isLoading ? "—" : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume de comissões movimentado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-primary">
            {isLoading ? "—" : formatBRL(data?.volume ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Soma de todas as comissões registradas na plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
