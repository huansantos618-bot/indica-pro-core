import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/indicators")({
  head: () => ({
    meta: [
      { title: "Indicadores — IndicaPro" },
      { name: "description", content: "Cadastre e acompanhe os indicadores da sua empresa." },
      { property: "og:title", content: "Indicadores — IndicaPro" },
      {
        property: "og:description",
        content: "Cadastre e acompanhe os indicadores da sua empresa.",
      },
    ],
  }),
  component: () => <main className="p-8">Indicadores</main>,
});
