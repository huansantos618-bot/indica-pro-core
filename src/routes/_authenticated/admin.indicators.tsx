import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle2, Camera, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/company";
import { whatsappLink } from "@/lib/locations";

export const Route = createFileRoute("/_authenticated/admin/indicators")({
  head: () => ({
    meta: [
      { title: "Aprovação de indicadores — IndicaPro Admin" },
      {
        name: "description",
        content:
          "Aprove, peça nova foto ou desative indicadores da plataforma IndicaPro com registro do motivo.",
      },
      { property: "og:title", content: "Aprovação de indicadores — IndicaPro Admin" },
      {
        property: "og:description",
        content: "Modere os cadastros de indicadores: aprovar, pedir outra foto ou banir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminIndicators,
});

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Aguardando análise",
  active: "Ativo",
  paused: "Pausado",
  banned: "Banido",
};

type IndicatorRow = {
  id: string;
  code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  created_at: string;
  status: string;
  avatar_url: string | null;
};

function AdminIndicators() {
  const queryClient = useQueryClient();
  const [banTarget, setBanTarget] = useState<IndicatorRow | null>(null);
  const [banReason, setBanReason] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-indicators"],
    queryFn: async (): Promise<IndicatorRow[]> => {
      const { data: indicators, error } = await supabase
        .from("indicators")
        .select("id, code, full_name, email, phone, user_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = (indicators ?? []).map((i) => i.user_id).filter(Boolean) as string[];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, status, avatar_url").in("id", userIds)
        : { data: [] as { id: string; status: string; avatar_url: string | null }[] };

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (indicators ?? []).map((i) => ({
        ...i,
        status: (i.user_id && byId.get(i.user_id)?.status) || "active",
        avatar_url: (i.user_id && byId.get(i.user_id)?.avatar_url) || null,
      }));
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: "active" | "paused" | "banned";
      reason?: string | null;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status, rejection_reason: reason ?? null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const requestPhoto = useMutation({
    mutationFn: async (indicator: IndicatorRow) => {
      const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("indicator_photo_requests").insert({
        indicator_id: indicator.id,
        deadline_at: deadline,
      });
      if (error) throw error;
      if (indicator.user_id) {
        await supabase.from("profiles").update({ status: "pending_approval" }).eq("id", indicator.user_id);
      }
    },
    onSuccess: (_data, indicator) => {
      toast.success("Pedido registrado. O indicador tem 72 horas para atualizar a foto.");
      queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
      if (indicator.phone) {
        window.open(
          whatsappLink(
            indicator.phone,
            `Olá, ${indicator.full_name}! Precisamos de uma nova foto do seu rosto para liberar o seu acesso ao IndicaPro. Você tem 3 dias (72 horas) para atualizar no seu perfil.`,
          ),
          "_blank",
          "noopener",
        );
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = (rows ?? []).filter((r) => r.status === "pending_approval");

  function approve(indicator: IndicatorRow) {
    if (!indicator.user_id) return;
    setStatus.mutate(
      { userId: indicator.user_id, status: "active", reason: null },
      {
        onSuccess: () => {
          toast.success("Indicador aprovado!");
          if (indicator.phone) {
            window.open(
              whatsappLink(
                indicator.phone,
                `Boas-vindas ao IndicaPro, ${indicator.full_name}! Seu cadastro foi aprovado. Seu código é ${indicator.code}. Já pode começar a indicar e ganhar comissões.`,
              ),
              "_blank",
              "noopener",
            );
          }
        },
      },
    );
  }

  function confirmBan() {
    if (!banTarget?.user_id) return;
    if (banReason.trim().length < 5) {
      toast.error("Descreva o motivo do cancelamento.");
      return;
    }
    const target = banTarget;
    setStatus.mutate(
      { userId: target.user_id, status: "banned", reason: banReason.trim() },
      {
        onSuccess: () => {
          toast.success("Indicador desativado.");
          if (target.phone) {
            window.open(
              whatsappLink(
                target.phone,
                `Olá, ${target.full_name}. Sua conta no IndicaPro foi desativada. Motivo: ${banReason.trim()}`,
              ),
              "_blank",
              "noopener",
            );
          }
          setBanTarget(null);
          setBanReason("");
        },
      },
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Aprovação e moderação de indicadores</h1>
        <p className="text-sm text-muted-foreground">
          Confira a foto do rosto, aprove o acesso ou peça uma nova imagem.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Cadastros pendentes ({pending.length})</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : pending.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum cadastro aguardando análise.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pending.map((indicator) => (
              <Card key={indicator.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-4">
                    <div className="size-16 overflow-hidden rounded-full border border-border bg-secondary">
                      {indicator.avatar_url ? (
                        <img
                          src={indicator.avatar_url}
                          alt={`Foto de ${indicator.full_name}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          Sem foto
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{indicator.full_name}</p>
                      <p className="text-xs text-muted-foreground">{indicator.phone ?? "—"}</p>
                      <p className="font-mono text-xs text-muted-foreground">{indicator.code}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => approve(indicator)}>
                      <CheckCircle2 className="size-4" /> Aprovar perfil
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => requestPhoto.mutate(indicator)}
                    >
                      <Camera className="size-4" /> Pedir outra foto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Todos os indicadores</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Indicador</th>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((indicator) => (
                  <tr key={indicator.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{indicator.full_name}</p>
                      <p className="text-xs text-muted-foreground">{indicator.phone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{indicator.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(indicator.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={indicator.status === "active" ? "secondary" : "destructive"}>
                        {STATUS_LABEL[indicator.status] ?? indicator.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {indicator.phone ? (
                          <Button size="sm" variant="ghost" asChild>
                            <a
                              href={whatsappLink(
                                indicator.phone,
                                `Olá, ${indicator.full_name}! Aqui é do IndicaPro.`,
                              )}
                              target="_blank"
                              rel="noopener"
                            >
                              <MessageCircle className="size-4" /> WhatsApp
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setBanTarget(indicator);
                            setBanReason("");
                          }}
                        >
                          <Ban className="size-4" /> Desativar / Banir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {banTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Desativar {banTarget.full_name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Digite o motivo do cancelamento. Ele será enviado ao indicador pelo WhatsApp.
            </p>
            <Textarea
              className="mt-4"
              rows={4}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Ex.: foto de perfil inválida e denúncias de clientes."
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBanTarget(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmBan}>
                Confirmar desativação
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
