import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, MessageCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { companyQueryKey, fetchMyCompany, formatDateTime } from "@/lib/company";
import { onlyDigits } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/company/remarketing")({
  head: () => ({
    meta: [
      { title: "Base de remarketing — IndicaPro" },
      {
        name: "description",
        content: "Lista de clientes interessados capturados pelas indicações, prontos para reativação.",
      },
      { property: "og:title", content: "Base de remarketing — IndicaPro" },
      {
        property: "og:description",
        content: "Lista de clientes interessados capturados pelas indicações, prontos para reativação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyRemarketing,
});

function CompanyRemarketing() {
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["remarketing", company?.id],
    enabled: Boolean(company?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("remarketing_leads")
        .select("*, products_campaigns(title), indicators(full_name, code)")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.client_name, r.client_whatsapp].some((v) => (v ?? "").toLowerCase().includes(term)),
    );
  }, [rows, search]);

  function exportCsv() {
    const csv = [
      ["Cliente", "WhatsApp", "Produto", "Indicador", "Data"],
      ...filtered.map((r) => [
        r.client_name,
        r.client_whatsapp,
        (r as never as { products_campaigns?: { title?: string } }).products_campaigns?.title ?? "",
        (r as never as { indicators?: { full_name?: string } }).indicators?.full_name ?? "",
        formatDateTime(r.created_at),
      ]),
    ]
      .map((line) => line.map((cell) => String(cell).replace(/;/g, ",")).join(";"))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "remarketing.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Base de remarketing</h1>
          <p className="text-sm text-muted-foreground">
            Todo cliente interessado capturado pelas indicações fica salvo aqui para reativação.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="size-4" /> Exportar CSV
        </Button>
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou WhatsApp"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? "Carregando..." : `${filtered.length} contato(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contato capturado ainda. Eles aparecem conforme as indicações chegam.
            </p>
          ) : (
            filtered.map((r) => {
              const product = (r as never as { products_campaigns?: { title?: string } })
                .products_campaigns?.title;
              const indicator = (r as never as { indicators?: { full_name?: string; code?: string } })
                .indicators;
              const phone = onlyDigits(r.client_whatsapp ?? "");
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.client_whatsapp}
                      {product ? ` · ${product}` : ""}
                      {indicator?.full_name ? ` · via ${indicator.full_name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(r.created_at)}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://wa.me/55${phone}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <MessageCircle className="size-4" /> WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
