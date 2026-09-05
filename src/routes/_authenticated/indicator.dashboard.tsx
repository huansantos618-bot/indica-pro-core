import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Compass, Send, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_PHASE_LABELS, LEAD_PHASE_TONE, formatBRL, formatDateTime, toPhase } from "@/lib/company";
import { fetchMyIndicator, indicatorQueryKey } from "@/lib/indicator";
import type { LeadStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/indicator/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel do indicador — IndicaPro" },
      {
        name: "description",
        content: "Acompanhe as suas indicações, o seu código exclusivo e as comissões a receber.",
      },
      { property: "og:title", content: "Painel do indicador — IndicaPro" },
      {
        property: "og:description",
        content: "Acompanhe as suas indicações, o seu código exclusivo e as comissões a receber.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndicatorDashboard,
});

type RecentLead = {
  id: string;
  name: string;
  status: LeadStatus;
  created_at: string;
  companies: { name: string } | null;
};

function IndicatorDashboard() {
  const { data: indicator } = useQuery({ queryKey: indicatorQueryKey, queryFn: fetchMyIndicator });

  const { data: leads = [] } = useQuery({
    queryKey: ["indicator-leads", indicator?.id],
    enabled: Boolean(indicator?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, status, created_at, companies(name)")
        .eq("indicator_id", indicator!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RecentLead[];
    },
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ["indicator-commissions", indicator?.id],
    enabled: Boolean(indicator?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id, amount, status")
        .eq("indicator_id", indicator!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const won = leads.filter((l) => l.status === "won").length;
  const toReceive = commissions
    .filter((c) => c.status !== "paid" && c.status !== "cancelled")
    .reduce((total, c) => total + Number(c.amount ?? 0), 0);

  const stats = [
    { label: "Indicações enviadas", value: String(leads.length), icon: Send },
    { label: "Vendas validadas", value: String(won), icon: CheckCircle2 },
    { label: "A receber", value: formatBRL(toReceive), icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Olá, {indicator?.full_name?.split(" ")[0] ?? "indicador"}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Divulgue campanhas, envie indicações e acompanhe seus ganhos.
          </p>
        </div>
        <Button asChild>
          <Link to="/indicator/explore">
            <Compass className="size-4" /> Explorar campanhas
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
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
          <CardTitle className="text-base">Últimas indicações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Você ainda não enviou indicações.
            </p>
          ) : (
            leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.companies?.name ?? "—"} · {formatDateTime(lead.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className={LEAD_PHASE_TONE[toPhase(lead.status)]}>
                  {LEAD_PHASE_LABELS[lead.status]}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
