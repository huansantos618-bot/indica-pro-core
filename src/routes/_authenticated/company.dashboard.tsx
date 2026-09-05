import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/company/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel da empresa — IndicaPro" },
      {
        name: "description",
        content: "Acompanhe campanhas, indicações e comissões do seu programa de indicação.",
      },
      { property: "og:title", content: "Painel da empresa — IndicaPro" },
      {
        property: "og:description",
        content: "Acompanhe campanhas, indicações e comissões do seu programa de indicação.",
      },
    ],
  }),
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("companies").select("name").limit(1).maybeSingle();
      if (active) setCompanyName(data?.name ?? null);
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
            <Building2 className="size-5 text-primary" />
            {companyName ?? "Painel da empresa"}
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
        <h1 className="text-2xl font-semibold">Bem-vindo ao seu painel</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Aqui você vai gerenciar campanhas, indicadores, indicações e comissões da sua empresa.
        </p>
      </div>
    </main>
  );
}
