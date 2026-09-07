import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { flushPendingAvatar } from "@/lib/profile";

export const Route = createFileRoute("/pendente")({
  head: () => ({
    meta: [
      { title: "Cadastro em análise — IndicaPro" },
      {
        name: "description",
        content:
          "Seu cadastro de indicador foi recebido e está aguardando a análise da equipe IndicaPro.",
      },
      { property: "og:title", content: "Cadastro em análise — IndicaPro" },
      {
        property: "og:description",
        content: "Seu cadastro de indicador está aguardando a análise da equipe IndicaPro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  useEffect(() => {
    void flushPendingAvatar();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-16">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <BrandLogo className="justify-center" />
        <Clock3 className="mx-auto mt-6 size-10 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Cadastro realizado com sucesso!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sua conta está aguardando a análise da nossa equipe. Em breve você será liberado para
          começar a indicar.
        </p>
        <div className="mt-8 grid gap-3">
          <Button asChild variant="hero" size="lg">
            <Link to="/login">Já fui aprovado, entrar</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Voltar ao site</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
