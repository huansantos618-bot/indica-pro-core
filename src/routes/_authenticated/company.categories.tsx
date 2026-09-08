import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { companyQueryKey, fetchMyCompany } from "@/lib/company";

export const Route = createFileRoute("/_authenticated/company/categories")({
  head: () => ({
    meta: [
      { title: "Minhas categorias — IndicaPro" },
      { name: "description", content: "Crie e organize as categorias do seu nicho de negócio." },
      { property: "og:title", content: "Minhas categorias — IndicaPro" },
      { property: "og:description", content: "Crie e organize as categorias do seu nicho de negócio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyCategories,
});

function CompanyCategories() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

  const { data: categories = [] } = useQuery({
    queryKey: ["company-categories", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_custom_categories")
        .select("*")
        .eq("company_id", company!.id)
        .order("category_name");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_custom_categories")
        .insert({ company_id: company!.id, category_name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      toast.success("Categoria criada.");
      queryClient.invalidateQueries({ queryKey: ["company-categories"] });
    },
    onError: () => toast.error("Não foi possível criar. Talvez ela já exista."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_custom_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida.");
      queryClient.invalidateQueries({ queryKey: ["company-categories"] });
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Minhas categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize seus produtos com as categorias do seu próprio nicho.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Lanches, Camisetas, Consultoria"
          />
          <Button
            disabled={!company?.id || name.trim().length < 2 || create.isPending}
            onClick={() => create.mutate()}
          >
            Adicionar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                <span>{c.category_name}</span>
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
