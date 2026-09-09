import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { companyQueryKey, fetchMyCompany, formatBRL } from "@/lib/company";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "app_delivery_ifood", label: "App de delivery (iFood)" },
  { value: "outro", label: "Outro" },
];

const PAYMENT_LABELS = Object.fromEntries(
  PAYMENT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<PaymentMethod, string>;

export const Route = createFileRoute("/_authenticated/company/cash")({
  head: () => ({
    meta: [
      { title: "Caixa da loja — IndicaPro" },
      {
        name: "description",
        content: "Registre as vendas do dia por forma de pagamento e acompanhe o total do caixa.",
      },
      { property: "og:title", content: "Caixa da loja — IndicaPro" },
      {
        property: "og:description",
        content: "Registre as vendas do dia por forma de pagamento e acompanhe o total do caixa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyCash,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function CompanyCash() {
  const queryClient = useQueryClient();
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

  const [saleDate, setSaleDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [filterDate, setFilterDate] = useState(todayISO());

  const { data: entries = [] } = useQuery({
    queryKey: ["cash-register", company?.id, filterDate],
    enabled: Boolean(company?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("company_cash_register")
        .select("*")
        .eq("company_id", company!.id)
        .eq("sale_date", filterDate)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const byMethod = new Map<PaymentMethod, number>();
    let total = 0;
    for (const e of entries) {
      const value = Number(e.total_amount ?? 0);
      total += value;
      byMethod.set(e.payment_method, (byMethod.get(e.payment_method) ?? 0) + value);
    }
    return { total, byMethod };
  }, [entries]);

  const createEntry = useMutation({
    mutationFn: async () => {
      const value = Number(amount.replace(",", "."));
      if (!company?.id) throw new Error("Empresa não encontrada.");
      if (!Number.isFinite(value) || value <= 0) throw new Error("Informe um valor válido.");

      const { error } = await supabase.from("company_cash_register").insert({
        company_id: company.id,
        sale_date: saleDate,
        payment_method: method,
        total_amount: value,
        description: description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda registrada no caixa!");
      setAmount("");
      setDescription("");
      setFilterDate(saleDate);
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function exportCsv() {
    const rows = [
      ["Data", "Forma de pagamento", "Valor", "Descrição"],
      ...entries.map((e) => [
        e.sale_date,
        PAYMENT_LABELS[e.payment_method],
        String(Number(e.total_amount ?? 0).toFixed(2)),
        (e.description ?? "").replace(/;/g, ","),
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `caixa-${filterDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Caixa da loja</h1>
          <p className="text-sm text-muted-foreground">
            Lance as vendas do dia e acompanhe o total por forma de pagamento.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!entries.length}>
          <Download className="size-4" /> Exportar CSV
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sale-date">Data da venda</Label>
              <Input
                id="sale-date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor total (R$)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {method === "app_delivery_ifood" ? (
              <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                Lembre-se de lançar o valor líquido recebido do aplicativo, já descontadas as taxas.
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="cash-description">Descrição (opcional)</Label>
              <Textarea
                id="cash-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: venda balcão, pedido 154..."
              />
            </div>

            <Button
              className="w-full"
              onClick={() => createEntry.mutate()}
              disabled={createEntry.isPending}
            >
              <Plus className="size-4" /> Registrar venda
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Resumo do dia</CardTitle>
              <Input
                type="date"
                className="w-auto"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold text-primary">{formatBRL(totals.total)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_OPTIONS.map((o) => (
                  <div
                    key={o.value}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{o.label}</span>
                    <span className="font-medium">
                      {formatBRL(totals.byMethod.get(o.value) ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lançamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada nesta data.</p>
              ) : (
                entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{PAYMENT_LABELS[e.payment_method]}</p>
                      <p className="text-xs text-muted-foreground">{e.description ?? "—"}</p>
                    </div>
                    <span className="font-semibold">{formatBRL(Number(e.total_amount ?? 0))}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
