import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, Save, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateTime } from "@/lib/company";
import { onlyDigits } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({
    meta: [
      { title: "Faturamento e planos — IndicaPro Admin" },
      {
        name: "description",
        content: "Aprove solicitações de plano, acompanhe receita recorrente e vencimentos das empresas.",
      },
      { property: "og:title", content: "Faturamento e planos — IndicaPro Admin" },
      {
        property: "og:description",
        content: "Aprove solicitações de plano, acompanhe receita recorrente e vencimentos das empresas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPlans,
});

const PLAN_LABELS: Record<string, string> = {
  free: "Grátis",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function AdminPlans() {
  const queryClient = useQueryClient();
  const [pix, setPix] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("system_settings").select("*").limit(1).maybeSingle();
      if (data && !settingsLoaded) {
        setPix(data.admin_pix_key ?? "");
        setWhatsapp(data.admin_whatsapp ?? "");
        setSettingsLoaded(true);
      }
      return data ?? null;
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["plan-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_plan_requests")
        .select("*, companies(name, contact_email, plan, subscription_expires_at)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id,name,plan,company_code,contact_email,subscription_expires_at,is_active")
        .order("name");
      return data ?? [];
    },
  });

  const pending = requests.filter((r) => r.status === "pending");

  const mrr = useMemo(
    () =>
      requests
        .filter((r) => r.status === "approved")
        .reduce((total, r) => total + Number(r.amount ?? 0), 0),
    [requests],
  );

  const expiring = useMemo(
    () =>
      companies
        .map((c) => ({ ...c, days: daysUntil(c.subscription_expires_at) }))
        .filter((c) => c.days !== null && c.days <= 15)
        .sort((a, b) => (a.days ?? 0) - (b.days ?? 0)),
    [companies],
  );

  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const request = requests.find((r) => r.id === id);
      if (!request) throw new Error("Solicitação não encontrada.");

      const { error } = await supabase
        .from("company_plan_requests")
        .update({
          status: approve ? "approved" : "rejected",
          approved_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;

      if (approve) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        const { error: companyError } = await supabase
          .from("companies")
          .update({
            plan: request.requested_plan,
            subscription_expires_at: expires.toISOString(),
          })
          .eq("id", request.company_id);
        if (companyError) throw companyError;
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.approve ? "Plano liberado por 30 dias." : "Solicitação recusada.");
      queryClient.invalidateQueries({ queryKey: ["plan-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (settings?.id) {
        const { error } = await supabase
          .from("system_settings")
          .update({ admin_pix_key: pix.trim() || null, admin_whatsapp: whatsapp.trim() || null })
          .eq("id", settings.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("system_settings")
        .insert({ admin_pix_key: pix.trim() || null, admin_whatsapp: whatsapp.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados de cobrança atualizados.");
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Faturamento e planos</h1>
        <p className="text-sm text-muted-foreground">
          Aprove upgrades, acompanhe a receita e avise empresas com assinatura perto do vencimento.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita aprovada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{formatBRL(mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitações pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencendo em até 15 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{expiring.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de cobrança</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="pix">Chave Pix da plataforma</Label>
            <Input id="pix" value={pix} onChange={(e) => setPix(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp de atendimento</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 90000-0000"
            />
          </div>
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
            <Save className="size-4" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitações de plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>
          ) : (
            requests.map((r) => {
              const company = (
                r as never as { companies?: { name?: string; contact_email?: string } }
              ).companies;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{company?.name ?? "Empresa"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.company_code ?? "—"} · {PLAN_LABELS[r.requested_plan] ?? r.requested_plan} ·{" "}
                      {formatBRL(Number(r.amount ?? 0))} · {formatDateTime(r.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={r.status === "pending" ? "secondary" : "outline"}
                      className="capitalize"
                    >
                      {r.status === "pending"
                        ? "Pendente"
                        : r.status === "approved"
                          ? "Aprovada"
                          : "Recusada"}
                    </Badge>
                    {r.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => decide.mutate({ id: r.id, approve: true })}
                          disabled={decide.isPending}
                        >
                          <CheckCircle2 className="size-4" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decide.mutate({ id: r.id, approve: false })}
                          disabled={decide.isPending}
                        >
                          <XCircle className="size-4" /> Recusar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assinaturas próximas do vencimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {expiring.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura vencendo em breve.</p>
          ) : (
            expiring.map((c) => {
              const message = encodeURIComponent(
                `Olá, ${c.name}! Sua assinatura ${PLAN_LABELS[c.plan] ?? c.plan} do IndicaPro vence em ${c.days} dia(s). Para renovar, use a chave Pix ${pix || "informada no painel"}.`,
              );
              const phone = onlyDigits(whatsapp);
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PLAN_LABELS[c.plan] ?? c.plan} · vence em {c.days} dia(s) ·{" "}
                      {formatDateTime(c.subscription_expires_at)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/${phone ? `55${phone}` : ""}?text=${message}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <MessageCircle className="size-4" /> Avisar
                    </a>
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
