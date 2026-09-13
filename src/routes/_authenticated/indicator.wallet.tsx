import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Clock, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateTime } from "@/lib/company";
import { fetchMyIndicator, indicatorQueryKey } from "@/lib/indicator";
import type { CommissionStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/indicator/wallet")({
  head: () => ({
    meta: [
      { title: "Minha carteira — IndicaPro" },
      {
        name: "description",
        content: "Veja saldo pendente, saldo disponível e o extrato completo das suas comissões.",
      },
      { property: "og:title", content: "Minha carteira — IndicaPro" },
      {
        property: "og:description",
        content: "Veja saldo pendente, saldo disponível e o extrato completo das suas comissões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletPage,
});

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: "Aguardando validação",
  approved: "Disponível",
  paid: "Pago",
  cancelled: "Cancelado",
};

const STATUS_TONE: Record<CommissionStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-sky-100 text-sky-800 border-sky-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

type CommissionRow = {
  id: string;
  amount: number;
  status: CommissionStatus;
  created_at: string;
  paid_at: string | null;
  leads: { name: string } | null;
  campaigns: { title: string } | null;
};

function WalletPage() {
  const { data: indicator } = useQuery({ queryKey: indicatorQueryKey, queryFn: fetchMyIndicator });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["indicator-commissions", indicator?.id],
    enabled: Boolean(indicator?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id, amount, status, created_at, paid_at, leads(name), campaigns(title)")
        .eq("indicator_id", indicator!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CommissionRow[];
    },
  });

  const sum = (status: CommissionStatus) =>
    commissions
      .filter((c) => c.status === status)
      .reduce((total, c) => total + Number(c.amount ?? 0), 0);

  const cards = [
    {
      label: "Saldo pendente",
      hint: "Vendas validadas ainda não liberadas",
      value: sum("pending"),
      icon: Clock,
    },
    {
      label: "Saldo disponível",
      hint: "Aprovado e aguardando pagamento",
      value: sum("approved"),
      icon: Wallet,
    },
    {
      label: "Total recebido",
      hint: "Comissões já pagas",
      value: sum("paid"),
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Minha carteira</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus ganhos com indicações.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, hint, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatBRL(value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extrato de ganhos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
          ) : commissions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Nenhuma comissão registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {commission.leads?.name ?? "—"}
                      </TableCell>
                      <TableCell>{commission.campaigns?.title ?? "Marketplace"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_TONE[commission.status]}>
                          {STATUS_LABEL[commission.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(commission.paid_at ?? commission.created_at)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(commission.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
