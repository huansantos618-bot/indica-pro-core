import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { companyQueryKey, fetchMyCompany } from "@/lib/company";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/company/curriculum")({
  head: () => ({
    meta: [
      { title: "Currículo e treinamento — IndicaPro" },
      {
        name: "description",
        content:
          "Conte a história da sua empresa e treine seus indicadores com vídeo, script de vendas e materiais.",
      },
      { property: "og:title", content: "Currículo e treinamento — IndicaPro" },
      {
        property: "og:description",
        content:
          "Conte a história da sua empresa e treine seus indicadores com vídeo, script de vendas e materiais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyCurriculum,
});

function CompanyCurriculum() {
  const queryClient = useQueryClient();
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

  const [about, setAbout] = useState("");
  const [mission, setMission] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [script, setScript] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: curriculum } = useQuery({
    queryKey: ["company-curriculum", company?.id],
    enabled: Boolean(company?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("company_curriculum")
        .select("*")
        .eq("company_id", company!.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  useEffect(() => {
    if (!curriculum) return;
    setAbout(curriculum.about_us_text ?? "");
    setMission(curriculum.mission_vision_values ?? "");
    setFoundedYear(curriculum.founded_year ? String(curriculum.founded_year) : "");
    setVideoUrl(curriculum.training_video_url ?? "");
    setScript(curriculum.sales_script ?? "");
    setPhotos(curriculum.photo_urls ?? []);
    setLinks(curriculum.support_material_links ?? []);
  }, [curriculum]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, `curriculum/${company?.id ?? "geral"}`);
      setPhotos((current) => [...current, url]);
      toast.success("Foto adicionada. Não esqueça de salvar.");
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("Empresa não encontrada.");
      const payload = {
        company_id: company.id,
        about_us_text: about.trim() || null,
        mission_vision_values: mission.trim() || null,
        founded_year: foundedYear ? Number(foundedYear) : null,
        training_video_url: videoUrl.trim() || null,
        sales_script: script.trim() || null,
        photo_urls: photos,
        support_material_links: links,
      };

      if (curriculum?.id) {
        const { error } = await supabase
          .from("company_curriculum")
          .update(payload)
          .eq("id", curriculum.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("company_curriculum").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Currículo atualizado!");
      queryClient.invalidateQueries({ queryKey: ["company-curriculum"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Currículo e treinamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Essas informações ajudam seus indicadores a vender com segurança.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sobre a empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about">Quem somos</Label>
            <Textarea id="about" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mission">Missão, visão e valores</Label>
            <Textarea
              id="mission"
              rows={4}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:max-w-40">
            <Label htmlFor="founded">Ano de fundação</Label>
            <Input
              id="founded"
              inputMode="numeric"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Treinamento dos indicadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video">Link do vídeo de treinamento</Label>
            <Input
              id="video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="script">Script de vendas / respostas a objeções</Label>
            <Textarea
              id="script"
              rows={6}
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Materiais de apoio (links)</Label>
            <div className="flex gap-2">
              <Input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!newLink.trim()) return;
                  setLinks((current) => [...current, newLink.trim()]);
                  setNewLink("");
                }}
              >
                Adicionar
              </Button>
            </div>
            <div className="space-y-1">
              {links.map((link) => (
                <div
                  key={link}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="truncate">{link}</span>
                  <button
                    type="button"
                    aria-label="Remover link"
                    onClick={() => setLinks((current) => current.filter((l) => l !== link))}
                  >
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fotos da empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((url) => (
              <div key={url} className="relative overflow-hidden rounded-lg border border-border">
                <img src={url} alt="Foto da empresa" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                  onClick={() => setPhotos((current) => current.filter((p) => p !== url))}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary">
              <ImagePlus className="size-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
            </label>
          </div>
          {uploading ? <p className="text-xs text-muted-foreground">Enviando foto…</p> : null}
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        <Save className="size-4" /> Salvar currículo
      </Button>
    </div>
  );
}
