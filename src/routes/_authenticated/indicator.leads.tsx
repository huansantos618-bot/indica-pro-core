import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_PHASE_LABELS, LEAD_PHASE_TONE, formatDateTime, toPhase } from "@/lib/company";
import { fetchMyIndicator, indicatorQueryKey } from "@/lib/indicator";
import type { LeadStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/indicator/leads")({
  head: () => ({
    meta: [
      { title: "Meus leads — IndicaPro" },
      {
        name: "description",
        content: "Acompanhe o status de cada cliente que você indicou às empresas parceiras.",
      },
      { property: "og:title", content: "Meus leads — IndicaPro" },
      {
        property: "og:description",
        content: "Acompanhe o status de cada cliente que você indicou às empresas parceiras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndicatorLeadsPage,
});

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  created_at: string;
  campaigns: { title: string } | null;
  companies: { name: string } | null;
};

function IndicatorLeadsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<LeadRow | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const { data: indicator } = useQuery({ queryKey: indicatorQueryKey, queryFn: fetchMyIndicator });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["indicator-leads", indicator?.id],
    enabled: Boolean(indicator?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, phone, status, created_at, campaigns(title), companies(name)")
        .eq("indicator_id", indicator!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeadRow[];
    },
  });

  const updateLead = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      if (form.name.trim().length < 2) throw new Error("Informe o nome do cliente.");
      const { error } = await supabase
        .from("leads")
        .update({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados do lead atualizados.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["indicator-leads"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openEdit(lead: LeadRow) {
    setEditing(lead);
    setForm({ name: lead.name, phone: lead.phone ?? "", email: lead.email ?? "" });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Meus leads</h1>
        <p className="text-sm text-muted-foreground">
          Você pode editar os dados enquanto a indicação ainda estiver como “Recebido”.
        </p>
      </header>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
          ) : leads.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Você ainda não enviou indicações.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <span className="font-medium">{lead.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {lead.phone ?? lead.email ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>{lead.companies?.name ?? "—"}</TableCell>
                      <TableCell>{lead.campaigns?.title ?? "Marketplace"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={LEAD_PHASE_TONE[toPhase(lead.status)]}>
                          {LEAD_PHASE_LABELS[lead.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(lead.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {lead.status === "new" ? (
                          <Button size="sm" variant="ghost" onClick={() => openEdit(lead)}>
                            <Pencil className="size-4" /> Editar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Em andamento</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar indicação</DialogTitle>
            <DialogDescription>
              Só é possível editar antes de a empresa iniciar o atendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => updateLead.mutate()} disabled={updateLead.isPending}>
              {updateLead.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
