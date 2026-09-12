import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bell, ChevronDown, Copy, Link2, MapPin, Search, Store } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
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
const QUICK_CATEGORIES = ["Explorar", "Imóveis", "Veículos", "Indica Food", "Serviços"] as const;

function categoryMatches(item: CatalogItem, quickCategory: string) {
  if (quickCategory === "Explorar") return true;
  const source = `${item.title} ${item.description ?? ""} ${item.company?.category_business ?? ""}`
    .toLocaleLowerCase("pt-BR");
  const terms: Record<string, string[]> = {
    Imóveis: ["imóvel", "imoveis", "casa", "apartamento", "terreno", "imobili"],
    Veículos: ["veículo", "veiculo", "carro", "moto", "automot"],
    "Indica Food": ["food", "comida", "restaurante", "lanche", "prato", "aliment"],
    Serviços: ["serviço", "servico", "consultoria", "manutenção", "manutencao"],
  };
  return (terms[quickCategory] ?? []).some((term) => source.includes(term));
}

function Vitrine() {
  const [term, setTerm] = useState("");
  const [city, setCity] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [quickCategory, setQuickCategory] = useState<(typeof QUICK_CATEGORIES)[number]>("Explorar");
  const [locationOpen, setLocationOpen] = useState(false);
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
    if (!categoryMatches(item, quickCategory)) return false;
    return true;
  });

  const locationLabel = city === ALL ? "Todo o Brasil" : city;

  function referralLink(item: CatalogItem) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return `${origin}/p/${item.id}?ref=${indicator?.code ?? ""}`;
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
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <header className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <BrandLogo className="min-w-0 text-lg text-ink" name="Indica Pro" />
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Buscar produtos" onClick={() => document.getElementById("marketplace-search")?.focus()}>
              <Search className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => toast.info("Você não tem novas notificações.")}>
              <Bell className="size-5" />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          className="h-auto max-w-full justify-start gap-2 px-0 py-0 text-left hover:bg-transparent"
          onClick={() => setLocationOpen(true)}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <MapPin className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-normal text-muted-foreground">Sua localização</span>
            <span className="block truncate font-semibold text-foreground">
              {locationLabel}{city !== ALL ? ` · ${items.find((item) => item.company?.city === city)?.company?.state ?? ""}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-primary">Alterar</span>
          <ChevronDown className="size-3.5 shrink-0 text-primary" />
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="marketplace-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="O que você quer indicar?"
            className="h-11 rounded-lg border-border bg-card pl-10 shadow-sm"
          />
        </div>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        <nav className="flex w-max gap-2" aria-label="Categorias do Marketplace">
          {QUICK_CATEGORIES.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={quickCategory === item ? "default" : "outline"}
              className="rounded-full shadow-none"
              onClick={() => setQuickCategory(item)}
            >
              {item}
            </Button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-ink">Marketplace</h1>
          <p className="text-xs text-muted-foreground">Oportunidades para você indicar</p>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-28 shrink-0 rounded-full text-xs sm:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando vitrine…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <article key={item.id} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <button type="button" onClick={() => setSelected(item)} className="block w-full text-left">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
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
                  <Badge className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full border-0 bg-card/95 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm hover:bg-card/95">
                    {city !== ALL && item.company?.city === city ? "Perto de mim" : "Acabou de ser anunciado"}
                  </Badge>
                </div>
                <div className="space-y-1.5 p-2.5 sm:p-4">
                  <p className="truncate text-xs text-muted-foreground">{item.company?.name ?? "Loja"}</p>
                  <h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground">{item.title}</h2>
                  <p className="text-base font-bold text-ink sm:text-lg">{formatBRL(item.price)}</p>
                  <p className="flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />{item.company?.city ?? "Brasil"}
                  </p>
                </div>
                </button>
                <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4">
                  <Button className="h-auto min-h-11 w-full whitespace-normal px-2 py-2 text-[11px] leading-4 sm:text-xs" onClick={() => copyLink(item)}>
                    <Link2 className="size-3.5" />
                    <span>Gerar Link<span className="block font-normal opacity-90">Comissão: {formatBRL(item.commission_value)}</span></span>
                  </Button>
                </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
        <DialogContent className="max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Escolha sua localização</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Veja primeiro as oportunidades disponíveis na sua cidade.</p>
          <Select value={city} onValueChange={(value) => { setCity(value); setLocationOpen(false); }}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Cidade e estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todo o Brasil</SelectItem>
              {cities.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}{items.find((product) => product.company?.city === item)?.company?.state ? ` - ${items.find((product) => product.company?.city === item)?.company?.state}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-lg">
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
