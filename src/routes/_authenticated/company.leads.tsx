import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  COMPANY_LEAD_PHASES,
  LEAD_PHASE_LABELS,
  LEAD_PHASE_TONE,
  formatBRL,
  formatDateTime,
  toPhase,
  type CompanyLeadPhase,
} from "@/lib/company";
import type { Lead, LeadStatus } from "@/types/database";

export const Route = createFileRoute("/_authenticated/company/leads")({
  head: () => ({
    meta: [
      { title: "Central de leads — IndicaPro" },
      { name: "description", content: "Acompanhe cada indicação recebida e o seu status atual." },
      { property: "og:title", content: "Central de leads — IndicaPro" },
      {
        property: "og:description",
        content: "Acompanhe cada indicação recebida e o seu status atual.",
      },
    ],
  }),
  component: LeadsPage,
});

type LeadRow = Lead & {
  indicators: { full_name: string; code: string } | null;
  campaigns: { title: string } | null;
};

function LeadsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, indicators(full_name, code), campaigns(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LeadRow[];
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyLeadPhase }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Lead movido para “${LEAD_PHASE_LABELS[variables.status]}”.`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-history"] });
      queryClient.invalidateQueries({ queryKey: ["company-overview"] });
      setSelected((current) =>
        current && current.id === variables.id ? { ...current, status: variables.status } : current,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Central de leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste um cartão entre as colunas para atualizar a fase. Cada mudança fica registrada na
          linha do tempo do lead.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando leads…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {COMPANY_LEAD_PHASES.map((phase) => {
            const columnLeads = leads.filter((lead) => toPhase(lead.status as LeadStatus) === phase);
            return (
              <div
                key={phase}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging) changeStatus.mutate({ id: dragging, status: phase });
                  setDragging(null);
                }}
                className="flex min-h-40 flex-col gap-3 rounded-xl border border-border bg-card/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      LEAD_PHASE_TONE[phase],
                    )}
                  >
                    {LEAD_PHASE_LABELS[phase]}
                  </span>
                  <span className="text-xs text-muted-foreground">{columnLeads.length}</span>
                </div>

                {columnLeads.map((lead) => (
                  <button
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setSelected(lead)}
                    className="rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40"
                  >
                    <p className="text-sm font-medium">{lead.name}</p>
                    {lead.campaigns?.title ? (
                      <p className="mt-1 text-xs text-muted-foreground">{lead.campaigns.title}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {lead.indicators
                        ? `${lead.indicators.full_name} · ${lead.indicators.code}`
                        : "Sem indicador"}
                    </p>
                    {lead.deal_value ? (
                      <p className="mt-1 text-xs font-semibold text-primary">
                        {formatBRL(Number(lead.deal_value))}
                      </p>
                    ) : null}
                  </button>
                ))}

                {columnLeads.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum lead nesta fase.</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {leads.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Ainda não há indicações recebidas.
          </CardContent>
        </Card>
      ) : null}

      <LeadDetail
        lead={selected}
        onClose={() => setSelected(null)}
        onChangeStatus={(status) =>
          selected ? changeStatus.mutate({ id: selected.id, status }) : undefined
        }
      />
    </div>
  );
}

function LeadDetail({
  lead,
  onClose,
  onChangeStatus,
}: {
  lead: LeadRow | null;
  onClose: () => void;
  onChangeStatus: (status: CompanyLeadPhase) => void;
}) {
  const { data: history = [] } = useQuery({
    queryKey: ["lead-history", lead?.id],
    enabled: Boolean(lead?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_status_history")
        .select("*")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead?.name}</DialogTitle>
          <DialogDescription>
            {lead?.campaigns?.title ?? "Sem campanha vinculada"} ·{" "}
            {lead?.indicators ? `Indicado por ${lead.indicators.full_name}` : "Sem indicador"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="space-y-1 text-muted-foreground">
            {lead?.email ? (
              <p className="flex items-center gap-2">
                <Mail className="size-4" /> {lead.email}
              </p>
            ) : null}
            {lead?.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4" /> {lead.phone}
              </p>
            ) : null}
            {lead?.deal_value ? (
              <p className="font-semibold text-primary">
                Valor do negócio: {formatBRL(Number(lead.deal_value))}
              </p>
            ) : null}
            {lead?.notes ? <p className="whitespace-pre-line">{lead.notes}</p> : null}
          </div>

          <div className="space-y-2">
            <p className="font-medium">Fase atual</p>
            <Select
              value={lead ? toPhase(lead.status as LeadStatus) : undefined}
              onValueChange={(value) => onChangeStatus(value as CompanyLeadPhase)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_LEAD_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {LEAD_PHASE_LABELS[phase]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium">
              <Clock className="size-4" /> Linha do tempo
            </p>
            <ol className="space-y-3 border-l border-border pl-4">
              {history.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm">
                    {item.from_status
                      ? `${LEAD_PHASE_LABELS[item.from_status as LeadStatus]} → ${LEAD_PHASE_LABELS[item.to_status as LeadStatus]}`
                      : `Lead recebido em ${LEAD_PHASE_LABELS[item.to_status as LeadStatus]}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                </li>
              ))}
              {history.length === 0 ? (
                <li className="text-xs text-muted-foreground">Sem registros ainda.</li>
              ) : null}
            </ol>
          </div>

          <Button variant="outline" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
