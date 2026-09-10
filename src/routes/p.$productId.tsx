import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, MapPin, Store } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/company";
import { REWARD_LABELS } from "@/lib/catalog";

type Search = { ref?: string };

export const Route = createFileRoute("/p/$productId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Produto indicado — IndicaPro" },
      {
        name: "description",
        content:
          "Veja os detalhes do produto indicado e deixe seu contato para a loja falar com você pelo WhatsApp.",
      },
      { property: "og:title", content: "Produto indicado — IndicaPro" },
      {
        property: "og:description",
        content:
          "Veja os detalhes do produto indicado e deixe seu contato para a loja falar com você pelo WhatsApp.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProduct,
  errorComponent: () => (
    <p className="p-10 text-center text-sm text-muted-foreground">
      Não foi possível carregar este produto.
    </p>
  ),
  notFoundComponent: () => (
    <p className="p-10 text-center text-sm text-muted-foreground">Produto não encontrado.</p>
  ),
});

function PublicProduct() {
  const { productId } = Route.useParams();
  const { ref } = useSearch({ from: "/p/$productId" });

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [done, setDone] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["public-product", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products_campaigns")
        .select(
          "id,title,description,price,image_url,gallery_urls,product_condition,reward_type,reward_description,stock_quantity,company_id,companies(name,city,state,category_business,logo_url)",
        )
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();
      return data ?? null;
    },
  });

  const { data: indicator } = useQuery({
    queryKey: ["public-indicator", ref],
    enabled: Boolean(ref),
    queryFn: async () => {
      const { data } = await supabase
        .from("indicators")
        .select("id,full_name,code")
        .eq("code", ref!)
        .eq("is_active", true)
        .maybeSingle();
      return data ?? null;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Produto indisponível.");
      if (name.trim().length < 3) throw new Error("Digite seu nome completo.");
      if (whatsapp.replace(/\D/g, "").length < 10) throw new Error("Digite um WhatsApp válido.");

      const payload = {
        company_id: product.company_id,
        product_id: product.id,
        indicator_id: indicator?.id ?? null,
        name: name.trim(),
        client_whatsapp: whatsapp.trim(),
        phone: whatsapp.trim(),
        status: "new" as const,
      };

      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;

      await supabase.from("remarketing_leads").insert({
        company_id: product.company_id,
        product_id: product.id,
        indicator_id: indicator?.id ?? null,
        client_name: name.trim(),
        client_whatsapp: whatsapp.trim(),
      });
    },
    onSuccess: () => setDone(true),
    onError: (error: Error) => toast.error(error.message),
  });

  const company = (
    product as never as {
      companies?: {
        name?: string;
        city?: string | null;
        state?: string | null;
        category_business?: string | null;
      };
    }
  )?.companies;

  if (isLoading) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Carregando produto…</p>;
  }

  if (!product) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">
        Este produto não está mais disponível.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4">
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-muted-foreground">
                <Store className="size-10" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
              <p className="mt-1 text-3xl font-semibold text-primary">
                {formatBRL(Number(product.price ?? 0))}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full font-normal">
                {product.product_condition}
              </Badge>
              <Badge className="rounded-full bg-primary/10 font-normal text-primary hover:bg-primary/10">
                {REWARD_LABELS[product.reward_type] ?? "Recompensa"}
              </Badge>
            </div>

            {product.description ? (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            ) : null}

            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {company?.name ?? "Loja"}
              {company?.city ? ` · ${company.city}/${company.state ?? ""}` : ""}
            </p>

            {indicator?.full_name ? (
              <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                Indicado por <span className="font-medium text-foreground">{indicator.full_name}</span>
              </p>
            ) : null}
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            {done ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="size-10 text-primary" />
                <h2 className="text-lg font-semibold">Contato enviado!</h2>
                <p className="text-sm text-muted-foreground">
                  A loja vai falar com você pelo WhatsApp em breve.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Tenho interesse</h2>
                <p className="text-sm text-muted-foreground">
                  Deixe seu nome e WhatsApp que a loja entra em contato.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lead-name">Seu nome</Label>
                    <Input
                      id="lead-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-whats">Seu WhatsApp</Label>
                    <Input
                      id="lead-whats"
                      inputMode="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(11) 90000-0000"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => submit.mutate()}
                  disabled={submit.isPending}
                >
                  Quero falar com a loja
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
