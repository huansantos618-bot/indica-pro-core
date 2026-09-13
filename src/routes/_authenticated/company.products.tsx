import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { companyQueryKey, fetchMyCompany, formatBRL } from "@/lib/company";
import {
  limitLabel,
  planLimits,
  PRODUCT_CONDITIONS,
  REWARD_LABELS,
  REWARD_OPTIONS,
} from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/company/products")({
  head: () => ({
    meta: [
      { title: "Meu Marketplace — IndicaPro" },
      {
        name: "description",
        content: "Publique produtos no Marketplace para todos os indicadores do IndicaPro.",
      },
      { property: "og:title", content: "Meu Marketplace — IndicaPro" },
      {
        property: "og:description",
        content: "Publique produtos no Marketplace para todos os indicadores do IndicaPro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyProducts,
});

const EMPTY = {
  title: "",
  description: "",
  price: "",
  stock_quantity: "0",
  reward_type: "cash",
  reward_description: "",
  commission_value: "0",
  product_condition: "Novo na caixa",
  image_url: "",
};

function CompanyProducts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

  const { data: products = [] } = useQuery({
    queryKey: ["company-products", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products_campaigns")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const limits = planLimits(company?.plan);
  const activeCount = products.filter((p) => p.is_active).length;
  const reachedLimit = activeCount >= limits.products;
  const totalStockValue = products.reduce(
    (sum, p) => sum + Number(p.price ?? 0) * Number(p.stock_quantity ?? 0),
    0,
  );

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products_campaigns").insert({
        company_id: company!.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: Number(form.price || 0),
        stock_quantity: Number(form.stock_quantity || 0),
        reward_type: form.reward_type as never,
        reward_description: form.reward_description.trim() || null,
        commission_value: Number(form.commission_value || 0),
        commission_type: (form.reward_type === "cash" ? "cash" : "discount") as never,
        product_condition: form.product_condition,
        image_url: form.image_url.trim() || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ ...EMPTY });
      toast.success("Produto publicado no Marketplace para todos os indicadores.");
      queryClient.invalidateQueries({ queryKey: ["company-products"] });
    },
    onError: () => toast.error("Não foi possível salvar o produto."),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("products_campaigns")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-products"] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publique produtos para todos os indicadores encontrarem e compartilharem.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeCount} de {limitLabel(limits.products)} produtos ativos no seu plano.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Valor em estoque: <span className="font-medium text-foreground">{formatBRL(totalStockValue)}</span>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publicar no Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Preço (R$)</Label>
            <Input
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quantidade em estoque</Label>
            <Input
              inputMode="numeric"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Condição do item</Label>
            <Select
              value={form.product_condition}
              onValueChange={(v) => setForm({ ...form, product_condition: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Recompensa do indicador</Label>
            <Select value={form.reward_type} onValueChange={(v) => setForm({ ...form, reward_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REWARD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.reward_type === "cash" ? (
            <div className="space-y-1.5">
              <Label>Valor da comissão (R$)</Label>
              <Input
                inputMode="decimal"
                value={form.commission_value}
                onChange={(e) => setForm({ ...form, commission_value: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Descrição da recompensa</Label>
              <Input
                placeholder="Ex.: Ganhe um fone de ouvido"
                value={form.reward_description}
                onChange={(e) => setForm({ ...form, reward_description: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Link da foto do produto</Label>
            <Input
              placeholder="https://…"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            {reachedLimit ? (
              <p className="mb-2 text-sm text-muted-foreground">
                Seu plano permite {limitLabel(limits.products)} produtos ativos. Pause um produto ou
                solicite um plano maior nas Configurações.
              </p>
            ) : null}
            <Button
              disabled={!company?.id || reachedLimit || form.title.trim().length < 2 || create.isPending}
              onClick={() => create.mutate()}
            >
              Publicar no Marketplace
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{p.title}</p>
                <Package className="size-4 shrink-0 text-primary" />
              </div>
              <p className="text-lg font-semibold">{formatBRL(p.price)}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-full font-normal">
                  {(p as { product_condition?: string }).product_condition ?? "Novo na caixa"}
                </Badge>
                <Badge className="rounded-full bg-primary/10 font-normal text-primary hover:bg-primary/10">
                  {REWARD_LABELS[(p as { reward_type?: string }).reward_type ?? "cash"]}
                </Badge>
                <Badge variant="outline" className="rounded-full font-normal">
                  Estoque: {p.stock_quantity}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toggle.mutate({ id: p.id, active: !p.is_active })}
              >
                {p.is_active ? "Pausar" : "Ativar"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
