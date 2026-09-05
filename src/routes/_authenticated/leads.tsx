import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Indicações — IndicaPro" },
      { name: "description", content: "Acompanhe cada indicação e o seu status atual." },
      { property: "og:title", content: "Indicações — IndicaPro" },
      { property: "og:description", content: "Acompanhe cada indicação e o seu status atual." },
    ],
  }),
  component: () => <main className="p-8">Indicações</main>,
});
