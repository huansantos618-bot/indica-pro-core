import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas — IndicaPro" },
      { name: "description", content: "Gerencie as campanhas de indicação da sua empresa." },
      { property: "og:title", content: "Campanhas — IndicaPro" },
      {
        property: "og:description",
        content: "Gerencie as campanhas de indicação da sua empresa.",
      },
    ],
  }),
  component: () => <main className="p-8">Campanhas</main>,
});
