import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Link2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/company";
import { buildReferralLink, fetchMyIndicator, indicatorQueryKey } from "@/lib/indicator";

export const Route = createFileRoute("/_authenticated/indicator/explore")({
  head: () => ({
    meta: [
      { title: "Explorar campanhas — IndicaPro" },
      {
        name: "description",
        content: "Veja as campanhas ativas das empresas, gere links de divulgação e indique clientes.",
      },
      { property: "og:title", content: "Explorar campanhas — IndicaPro" },
      {
        property: "og:description",
        content: "Veja as campanhas ativas das empresas, gere links de divulgação e indique clientes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

type Campaign = {
  id: string;
  company_id: string;
  title: string;
  product: string | null;
  description: string | null;
  rules: string | null;
  commission_type: "fixed" | "percentage";
  commission_value: number;
  companies: { name: string } | null;
};

function ExplorePage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const { data: indicator } = useQuery({ queryKey: indicatorQueryKey, queryFn: fetchMyIndicator });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["explore-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, company_id, title, product, description, rules, commission_type, commission_value, companies(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Campaign[];
    },
  });

  const createLead = useMutation({
    mutationFn: async () => {
      if (!selected || !indicator) throw new Error("Indicador não encontrado.");
      if (form.name.trim().length < 2) throw new Error("Informe o nome do cliente.");
      if (!form.phone.trim() && !form.email.trim())
        throw new Error("Informe ao menos telefone ou e-mail.");

      const { error } = await supabase.from("leads").insert({
        company_id: selected.company_id,
        campaign_id: selected.id,
        indicator_id: indicator.id,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Indicação enviada para a empresa!");
      setForm({ name: "", phone: "", email: "", notes: "" });
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["indicator-leads"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function copyLink(campaign: Campaign) {
    if (!indicator?.code) return;
    await navigator.clipboard.writeText(buildReferralLink(indicator.code, campaign.id));
    toast.success("Link de divulgação copiado!");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Explorar campanhas</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma campanha ativa, divulgue com o seu link ou indique um cliente manualmente.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando campanhas…</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma campanha ativa disponível no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  {campaign.companies?.name ?? "Empresa"}
                </Badge>
                <CardTitle className="text-lg">{campaign.title}</CardTitle>
                {campaign.product ? (
                  <p className="text-sm text-muted-foreground">{campaign.product}</p>
                ) : null}
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Megaphone className="size-4" />
                  {campaign.commission_type === "fixed"
                    ? `${formatBRL(campaign.commission_value)} por venda`
                    : `${campaign.commission_value}% por venda`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(campaign)}>
                    <Link2 className="size-4" /> Gerar link
                  </Button>
                  <Button size="sm" onClick={() => setSelected(campaign)}>
                    <Send className="size-4" /> Indicar cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => (open ? null : setSelected(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Indicar cliente</DialogTitle>
            <DialogDescription>
              {selected?.title}
              {selected?.companies?.name ? ` · ${selected.companies.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          {selected?.rules ? (
            <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Regras: </strong>
              {selected.rules}
            </p>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Nome do cliente</Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">Telefone</Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">E-mail</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-notes">Observações (opcional)</Label>
              <Textarea
                id="lead-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selected && copyLink(selected)}
              className="sm:mr-auto"
            >
              <Copy className="size-4" /> Copiar link
            </Button>
            <Button onClick={() => createLead.mutate()} disabled={createLead.isPending}>
              {createLead.isPending ? "Enviando…" : "Enviar indicação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
