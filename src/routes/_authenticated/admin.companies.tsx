import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/company";

export const Route = createFileRoute("/_authenticated/admin/companies")({
  head: () => ({
    meta: [
      { title: "Empresas e planos — IndicaPro Admin" },
      {
        name: "description",
        content: "Gestão de tenants: planos de assinatura, bloqueio e liberação de empresas.",
      },
      { property: "og:title", content: "Empresas e planos — IndicaPro Admin" },
      {
        property: "og:description",
        content: "Gestão de tenants: planos de assinatura, bloqueio e liberação de empresas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCompanies,
});

const PLAN_LABEL: Record<string, string> = {
  free: "Start (grátis)",
  pro: "Pro",
  enterprise: "Enterprise",
};

function AdminCompanies() {
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, legal_name, cnpj, plan, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: { plan?: "free" | "pro" | "enterprise"; is_active?: boolean };
    }) => {
      const { error } = await supabase.from("companies").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa atualizada.");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o plano de cada tenant e bloqueie contas inadimplentes ou suspeitas.
        </p>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Carregando…
                  </td>
                </tr>
              ) : (companies ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Nenhuma empresa cadastrada ainda.
                  </td>
                </tr>
              ) : (
                (companies ?? []).map((company) => (
                  <tr key={company.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{company.name}</p>
                      {company.legal_name ? (
                        <p className="text-xs text-muted-foreground">{company.legal_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{company.cnpj ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(company.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={company.plan}
                        onValueChange={(plan) =>
                          update.mutate({
                            id: company.id,
                            values: { plan: plan as "free" | "pro" | "enterprise" },
                          })
                        }
                      >
                        <SelectTrigger className="w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLAN_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={company.is_active ? "secondary" : "destructive"}>
                        {company.is_active ? "Ativa" : "Bloqueada"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={company.is_active ? "destructive" : "default"}
                        onClick={() =>
                          update.mutate({
                            id: company.id,
                            values: { is_active: !company.is_active },
                          })
                        }
                      >
                        {company.is_active ? "Bloquear" : "Desbloquear"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
