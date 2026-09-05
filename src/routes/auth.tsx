import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — IndicaPro" },
      {
        name: "description",
        content: "Acesse sua conta IndicaPro para gerenciar indicações, campanhas e comissões.",
      },
      { property: "og:title", content: "Entrar — IndicaPro" },
      {
        property: "og:description",
        content: "Acesse sua conta IndicaPro para gerenciar indicações, campanhas e comissões.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <h1 className="text-lg font-medium text-muted-foreground">Área de acesso do IndicaPro</h1>
    </main>
  );
}
