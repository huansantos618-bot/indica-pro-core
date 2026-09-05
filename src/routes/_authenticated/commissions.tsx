import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/commissions")({
  head: () => ({
    meta: [
      { title: "Comissões — IndicaPro" },
      { name: "description", content: "Controle os valores devidos e pagos aos indicadores." },
      { property: "og:title", content: "Comissões — IndicaPro" },
      {
        property: "og:description",
        content: "Controle os valores devidos e pagos aos indicadores.",
      },
    ],
  }),
  component: () => <main className="p-8">Comissões</main>,
});
