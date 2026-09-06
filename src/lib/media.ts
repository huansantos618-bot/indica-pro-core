import { supabase } from "@/integrations/supabase/client";

const BUCKET = "public-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envia um arquivo e devolve uma URL de longa duração pronta para uso em <img>. */
export async function uploadMedia(file: File | Blob, folder: string, fileName?: string) {
  const ext = fileName?.split(".").pop() ?? (file instanceof File ? file.name.split(".").pop() : "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext || "jpg"}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Falha ao gerar o link da imagem");

  return data.signedUrl;
}

export function dataUrlToBlob(dataUrl: string) {
  const [head, body] = dataUrl.split(",");
  const mime = head?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(body ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
