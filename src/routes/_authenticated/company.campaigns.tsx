import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companyQueryKey, fetchMyCompany, formatBRL, formatDateTime } from "@/lib/company";
import type { Campaign, CampaignStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/company/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas — IndicaPro" },
      { name: "description", content: "Crie e gerencie as campanhas de indicação da sua empresa." },
      { property: "og:title", content: "Campanhas — IndicaPro" },
      {
        property: "og:description",
        content: "Crie e gerencie as campanhas de indicação da sua empresa.",
      },
    ],
  }),
  component: CampaignsPage,
});

const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
];

const emptyForm = {
  title: "",
  product: "",
  commission_value: "",
  rules: "",
  status: "active" as CampaignStatus,
};

function CampaignsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error("Empresa não encontrada.");
      if (!form.title.trim()) throw new Error("Informe o título da campanha.");
      const { error } = await supabase.from("campaigns").insert({
        company_id: company.id,
        title: form.title.trim(),
        product: form.product.trim() || null,
        rules: form.rules.trim() || null,
        commission_type: "fixed",
        commission_value: Number(form.commission_value.replace(",", ".")) || 0,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha criada com sucesso.");
      setForm(emptyForm);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campanhas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina o que será indicado e quanto o indicador ganha por venda.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nova campanha
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando campanhas…</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Você ainda não tem campanhas. Crie a primeira para começar a receber indicações.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{campaign.title}</CardTitle>
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                    {campaign.status === "active" ? "Ativa" : "Pausada"}
                  </Badge>
                </div>
                {campaign.product ? (
                  <p className="text-sm text-muted-foreground">Produto: {campaign.product}</p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-semibold text-primary">
                  Comissão {formatBRL(Number(campaign.commission_value))}
                </p>
                {campaign.rules ? (
                  <p className="whitespace-pre-line text-muted-foreground">{campaign.rules}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Criada em {formatDateTime(campaign.created_at)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleStatus.mutate({
                      id: campaign.id,
                      status: campaign.status === "active" ? "paused" : "active",
                    })
                  }
                >
                  {campaign.status === "active" ? "Pausar" : "Ativar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova campanha</DialogTitle>
            <DialogDescription>
              Estas informações ficam visíveis para os seus indicadores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Indique e ganhe — Plano Premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Input
                id="product"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                placeholder="Plano Premium anual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Comissão (R$)</Label>
              <Input
                id="commission"
                inputMode="decimal"
                value={form.commission_value}
                onChange={(e) => setForm({ ...form, commission_value: e.target.value })}
                placeholder="150,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rules">Regras</Label>
              <Textarea
                id="rules"
                rows={4}
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                placeholder="A comissão é paga após a validação da venda e o pagamento da primeira mensalidade."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as CampaignStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createCampaign.mutate()} disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "Salvando…" : "Criar campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
