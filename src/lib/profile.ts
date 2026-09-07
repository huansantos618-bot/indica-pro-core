import { supabase } from "@/integrations/supabase/client";
import { dataUrlToBlob, uploadMedia } from "@/lib/media";

const PENDING_AVATAR_KEY = "indicapro:pending-avatar";

export const profileQueryKey = ["my-profile"] as const;

export async function fetchMyProfile() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ?? null;
}

export function storePendingAvatar(dataUrl: string) {
  try {
    localStorage.setItem(PENDING_AVATAR_KEY, dataUrl);
  } catch {
    /* armazenamento indisponível */
  }
}

/** Envia a foto guardada durante o cadastro assim que houver sessão. */
export async function flushPendingAvatar() {
  let dataUrl: string | null = null;
  try {
    dataUrl = localStorage.getItem(PENDING_AVATAR_KEY);
  } catch {
    return;
  }
  if (!dataUrl) return;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  try {
    const url = await saveAvatar(userId, dataUrl);
    if (url) localStorage.removeItem(PENDING_AVATAR_KEY);
  } catch {
    /* tenta novamente na próxima sessão */
  }
}

/** Salva o avatar no storage e atualiza perfil + indicador. */
export async function saveAvatar(userId: string, dataUrl: string) {
  const url = await uploadMedia(dataUrlToBlob(dataUrl), `avatars/${userId}`, "avatar.jpg");
  await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  return url;
}
