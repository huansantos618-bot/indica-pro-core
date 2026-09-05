import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { companyQueryKey, fetchMyCompany } from "@/lib/company";

export const Route = createFileRoute("/_authenticated/company/settings")({
  head: () => ({
    meta: [
      { title: "Configurações da empresa — IndicaPro" },
      { name: "description", content: "Atualize os dados cadastrais da sua empresa." },
      { property: "og:title", content: "Configurações da empresa — IndicaPro" },
      { property: "og:description", content: "Atualize os dados cadastrais da sua empresa." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });
  const [form, setForm] = useState({ name: "", legal_name: "", contact_email: "" });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        legal_name: company.legal_name ?? "",
        contact_email: company.contact_email ?? "",
      });
    }
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error("Empresa não encontrada.");
      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name.trim(),
          legal_name: form.legal_name.trim() || null,
          contact_email: form.contact_email.trim() || null,
        })
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados atualizados.");
      queryClient.invalidateQueries({ queryKey: companyQueryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dados cadastrais da sua empresa.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome fantasia</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_name">Razão social</Label>
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={company?.cnpj ?? ""} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">E-mail de contato</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
