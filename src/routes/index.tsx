import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IndicaPro — Programas de indicação para empresas" },
      {
        name: "description",
        content:
          "Plataforma para empresas criarem campanhas de indicação, acompanharem leads e pagarem comissões aos seus indicadores.",
      },
      { property: "og:title", content: "IndicaPro — Programas de indicação para empresas" },
      {
        property: "og:description",
        content:
          "Plataforma para empresas criarem campanhas de indicação, acompanharem leads e pagarem comissões aos seus indicadores.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">IndicaPro</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Base do projeto pronta: banco de dados, papéis de acesso e rotas configurados.
      </p>
      <Link
        to="/auth"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Entrar
      </Link>
    </main>
  );
}
