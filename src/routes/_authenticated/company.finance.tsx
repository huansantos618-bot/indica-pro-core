import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { formatBRL, formatDateTime } from "@/lib/company";
import { COMMISSION_STATUS_LABELS, type Commission } from "@/types/database";

export const Route = createFileRoute("/_authenticated/company/finance")({
  head: () => ({
    meta: [
      { title: "Financeiro — IndicaPro" },
      { name: "description", content: "Controle os valores devidos e pagos aos indicadores." },
      { property: "og:title", content: "Financeiro — IndicaPro" },
      {
        property: "og:description",
        content: "Controle os valores devidos e pagos aos indicadores.",
      },
    ],
  }),
  component: FinancePage,
});

type CommissionRow = Commission & {
  indicators: { full_name: string; code: string } | null;
  leads: { name: string } | null;
};

function FinancePage() {
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*, indicators(full_name, code), leads(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CommissionRow[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comissão marcada como paga.");
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["company-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = commissions
    .filter((c) => c.status !== "paid" && c.status !== "cancelled")
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
  const paid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comissões geradas pelas indicações da sua empresa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatBRL(pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Já pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatBRL(paid)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
          ) : commissions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhuma comissão registrada até o momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicador</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {commission.indicators
                        ? `${commission.indicators.full_name} (${commission.indicators.code})`
                        : "—"}
                    </TableCell>
                    <TableCell>{commission.leads?.name ?? "—"}</TableCell>
                    <TableCell>{formatBRL(Number(commission.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={commission.status === "paid" ? "default" : "secondary"}>
                        {COMMISSION_STATUS_LABELS[commission.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(commission.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {commission.status !== "paid" && commission.status !== "cancelled" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markPaid.mutate(commission.id)}
                        >
                          Marcar como paga
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
