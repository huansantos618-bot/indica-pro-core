import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — IndicaPro" },
      { name: "description", content: "Visão geral das indicações, campanhas e comissões." },
      { property: "og:title", content: "Painel — IndicaPro" },
      {
        property: "og:description",
        content: "Visão geral das indicações, campanhas e comissões.",
      },
    ],
  }),
  component: () => <main className="p-8">Painel</main>,
});
