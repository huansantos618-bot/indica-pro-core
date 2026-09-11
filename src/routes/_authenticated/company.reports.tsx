import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BarChart3, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  companyQueryKey,
  fetchMyCompany,
  formatBRL,
  LEAD_PHASE_LABELS,
} from "@/lib/company";
import type { LeadStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/company/reports")({
  head: () => ({
    meta: [
      { title: "Relatórios IndicaPro — desempenho das indicações" },
      {
        name: "description",
        content:
          "Acompanhe leads por fase, vendas validadas, comissões e o ranking dos seus melhores indicadores.",
      },
      { property: "og:title", content: "Relatórios IndicaPro — desempenho das indicações" },
      {
        property: "og:description",
        content:
          "Acompanhe leads por fase, vendas validadas, comissões e o ranking dos seus melhores indicadores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyReports,
});

type LeadRow = {
  id: string;
  status: LeadStatus;
  deal_value: number | null;
  commission_amount: number | null;
  indicator_id: string | null;
  product_id: string | null;
};

function CompanyReports() {
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

  const { data } = useQuery({
    queryKey: ["company-reports", company?.id],
    enabled: Boolean(company?.id),
    queryFn: async () => {
      const [leadsRes, indicatorsRes, productsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id,status,deal_value,commission_amount,indicator_id,product_id")
          .eq("company_id", company!.id),
        supabase.from("indicators").select("id,full_name,code").eq("company_id", company!.id),
        supabase.from("products_campaigns").select("id,title").eq("company_id", company!.id),
      ]);
      return {
        leads: (leadsRes.data ?? []) as LeadRow[],
        indicators: indicatorsRes.data ?? [],
        products: productsRes.data ?? [],
      };
    },
  });

  const leads = data?.leads ?? [];

  const byStatus = useMemo(() => {
    const map = new Map<LeadStatus, number>();
    leads.forEach((l) => map.set(l.status, (map.get(l.status) ?? 0) + 1));
    return map;
  }, [leads]);

  const won = leads.filter((l) => l.status === "won");
  const revenue = won.reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);
  const commissions = won.reduce((sum, l) => sum + Number(l.commission_amount ?? 0), 0);
  const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0;

  const ranking = useMemo(() => {
    const map = new Map<string, { total: number; wins: number; value: number }>();
    leads.forEach((l) => {
      if (!l.indicator_id) return;
      const current = map.get(l.indicator_id) ?? { total: 0, wins: 0, value: 0 };
      current.total += 1;
      if (l.status === "won") {
        current.wins += 1;
        current.value += Number(l.deal_value ?? 0);
      }
      map.set(l.indicator_id, current);
    });
    return [...map.entries()]
      .map(([id, stats]) => ({
        id,
        name: data?.indicators.find((i) => i.id === id)?.full_name ?? "Indicador",
        code: data?.indicators.find((i) => i.id === id)?.code ?? "—",
        ...stats,
      }))
      .sort((a, b) => b.wins - a.wins || b.total - a.total)
      .slice(0, 10);
  }, [leads, data?.indicators]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      if (!l.product_id) return;
      map.set(l.product_id, (map.get(l.product_id) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([id, count]) => ({
        id,
        title: data?.products.find((p) => p.id === id)?.title ?? "Produto",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [leads, data?.products]);

  const cards = [
    { label: "Indicações recebidas", value: String(leads.length) },
    { label: "Vendas validadas", value: String(won.length) },
    { label: "Taxa de conversão", value: `${conversion}%` },
    { label: "Faturamento indicado", value: formatBRL(revenue) },
    { label: "Recompensas geradas", value: formatBRL(commissions) },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios IndicaPro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja o desempenho das suas indicações e quem mais vende para você.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" /> Indicações por fase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...byStatus.entries()].length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há indicações registradas.</p>
            ) : (
              [...byStatus.entries()].map(([status, count]) => {
                const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{LEAD_PHASE_LABELS[status]}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" /> Ranking de indicadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum indicador com indicações ainda.</p>
            ) : (
              ranking.map((row, index) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {index + 1}. {row.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{row.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{row.wins} vendas</p>
                    <p className="text-xs text-muted-foreground">
                      {row.total} indicações · {formatBRL(row.value)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produtos mais indicados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto indicado até agora.</p>
          ) : (
            topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="truncate">{product.title}</span>
                <span className="font-semibold">{product.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
