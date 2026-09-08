import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Copy, MapPin, Search, Store } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { catalogQueryKey, fetchCatalog, REWARD_LABELS, type CatalogItem } from "@/lib/catalog";
import { formatBRL } from "@/lib/company";
import { fetchMyIndicator, indicatorQueryKey } from "@/lib/indicator";
import { whatsappLink } from "@/lib/locations";

export const Route = createFileRoute("/_authenticated/indicator/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine de produtos — IndicaPro" },
      {
        name: "description",
        content: "Busque produtos por cidade e categoria, veja a recompensa e gere seu link de indicação.",
      },
      { property: "og:title", content: "Vitrine de produtos — IndicaPro" },
      {
        property: "og:description",
        content: "Busque produtos por cidade e categoria, veja a recompensa e gere seu link de indicação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vitrine,
});

const ALL = "__all__";

function Vitrine() {
  const [term, setTerm] = useState("");
  const [city, setCity] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: catalogQueryKey, queryFn: fetchCatalog });
  const { data: indicator } = useQuery({ queryKey: indicatorQueryKey, queryFn: fetchMyIndicator });

  const cities = useMemo(
    () => [...new Set(items.map((i) => i.company?.city).filter(Boolean) as string[])].sort(),
    [items],
  );
  const categories = useMemo(
    () => [...new Set(items.map((i) => i.company?.category_business).filter(Boolean) as string[])].sort(),
    [items],
  );

  const filtered = items.filter((item) => {
    const haystack = `${item.title} ${item.description ?? ""} ${item.company?.name ?? ""}`.toLowerCase();
    if (term && !haystack.includes(term.toLowerCase())) return false;
    if (city !== ALL && item.company?.city !== city) return false;
    if (category !== ALL && item.company?.category_business !== category) return false;
    return true;
  });

  function referralLink(item: CatalogItem) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return `${origin}/?ref=${indicator?.code ?? ""}&prod=${item.id}`;
  }

  async function copyLink(item: CatalogItem) {
    if (!indicator?.code) {
      toast.error("Seu código de indicador ainda não está disponível.");
      return;
    }
    await navigator.clipboard.writeText(referralLink(item));
    toast.success("Link copiado! Agora é só enviar para o cliente.");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Vitrine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encontre produtos para indicar e gere seu link em um toque.
        </p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar produto, loja ou serviço"
            className="h-11 rounded-full pl-9"
          />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-11 rounded-full md:w-48">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as cidades</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 rounded-full md:w-56">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando vitrine…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className="text-left">
              <Card className="h-full overflow-hidden border-border/70 transition-shadow hover:shadow-md">
                <div className="aspect-square w-full overflow-hidden bg-secondary">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Store className="size-8" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <p className="text-base font-semibold">{formatBRL(item.price)}</p>
                  <p className="line-clamp-2 text-sm text-foreground">{item.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="rounded-full font-normal">
                      {item.product_condition}
                    </Badge>
                    <Badge className="rounded-full bg-primary/10 font-normal text-primary hover:bg-primary/10">
                      {REWARD_LABELS[item.reward_type] ?? "Recompensa"}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {item.company?.name ?? "Loja"}
                    {item.company?.city ? ` · ${item.company.city}` : ""}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt={selected.title}
                  className="max-h-64 w-full rounded-lg object-cover"
                />
              ) : null}
              <div className="space-y-3 text-sm">
                <p className="text-xl font-semibold">{formatBRL(selected.price)}</p>
                {selected.description ? (
                  <p className="text-muted-foreground">{selected.description}</p>
                ) : null}
                <p>
                  <span className="text-muted-foreground">Condição: </span>
                  {selected.product_condition}
                </p>
                <p>
                  <span className="text-muted-foreground">Recompensa: </span>
                  {REWARD_LABELS[selected.reward_type] ?? "—"}
                  {selected.reward_type === "cash" ? ` · ${formatBRL(selected.commission_value)}` : ""}
                  {selected.reward_description ? ` · ${selected.reward_description}` : ""}
                </p>
                <p>
                  <span className="text-muted-foreground">Loja: </span>
                  {selected.company?.name}
                  {selected.company?.city ? ` · ${selected.company.city}/${selected.company.state ?? ""}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => copyLink(selected)}>
                  <Copy className="size-4" /> Gerar link de indicação
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    window.open(
                      whatsappLink(
                        "",
                        `Olha esse produto: ${selected.title} — ${formatBRL(selected.price)}. ${referralLink(selected)}`,
                      ).replace("wa.me/55", "wa.me/"),
                      "_blank",
                      "noopener",
                    )
                  }
                >
                  Enviar no WhatsApp
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
