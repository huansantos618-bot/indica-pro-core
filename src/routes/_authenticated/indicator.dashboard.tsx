import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/indicator/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel do indicador — IndicaPro" },
      {
        name: "description",
        content: "Acompanhe as suas indicações, o seu código exclusivo e as comissões a receber.",
      },
      { property: "og:title", content: "Painel do indicador — IndicaPro" },
      {
        property: "og:description",
        content: "Acompanhe as suas indicações, o seu código exclusivo e as comissões a receber.",
      },
    ],
  }),
  component: IndicatorDashboard,
});

function IndicatorDashboard() {
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState<{ full_name: string; code: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("indicators")
        .select("full_name, code")
        .limit(1)
        .maybeSingle();
      if (active && data) setIndicator(data);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-card">
        <div className="section-shell flex h-16 items-center justify-between">
          <span className="flex items-center gap-2 font-semibold">
            <UserRound className="size-5 text-primary" />
            {indicator?.full_name ?? "Painel do indicador"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="section-shell py-12">
        <h1 className="text-2xl font-semibold">Seu espaço de indicações</h1>
        {indicator?.code ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm">
            Código exclusivo: <strong className="text-primary">{indicator.code}</strong>
          </p>
        ) : null}
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Em breve você verá aqui as suas indicações, o status de cada uma e as comissões a receber.
        </p>
      </div>
    </main>
  );
}
