import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Trilha de auditoria — IndicaPro Admin" },
      {
        name: "description",
        content: "Registro de eventos da plataforma com data, usuário, ação e IP de origem.",
      },
      { property: "og:title", content: "Trilha de auditoria — IndicaPro Admin" },
      {
        property: "og:description",
        content: "Registro de eventos da plataforma com data, usuário, ação e IP de origem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAudit,
});

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function AdminAudit() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, user_email, action, details, entity, ip_address")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Trilha de auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Últimos 200 eventos registrados automaticamente pela plataforma.
        </p>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                    Carregando…
                  </td>
                </tr>
              ) : (logs ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                    Nenhum evento registrado ainda.
                  </td>
                </tr>
              ) : (
                (logs ?? []).map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3">{log.user_email ?? "sistema"}</td>
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.details ?? log.entity ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ip_address ?? "—"}</td>
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
